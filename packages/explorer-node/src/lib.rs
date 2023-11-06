#![allow(non_snake_case)]
#![allow(dead_code)]

use std::sync::mpsc;

use explorer::Explorer;
use napi::bindgen_prelude::*;
use napi::{
    threadsafe_function::{ThreadsafeFunction, ThreadsafeFunctionCallMode},
    JsFunction, JsUndefined,
};
use napi_derive::napi;

enum ModuleMessage {
    Job(String, ThreadsafeFunction<String>),
    Close(),
}

#[napi(custom_finalize)]
struct Module {
    tx: mpsc::Sender<ModuleMessage>,
}

#[napi]
impl ObjectFinalize for Module {
    fn finalize(self, _: Env) -> Result<()> {
        let _ = self.tx.send(ModuleMessage::Close());
        Ok(())
    }
}

#[napi]
impl Module {
    #[napi(constructor)]
    pub fn new() -> Result<Self> {
        let (tx, rx) = mpsc::channel::<ModuleMessage>();

        std::thread::spawn(move || {
            let mut explorer: Explorer = Explorer::new();

            while let Ok(message) = rx.recv() {
                match message {
                    ModuleMessage::Job(payload, callback) => {

                        let request = Explorer::deserialize_request(payload);

                        if request.is_err() {
                            callback.call(
                                Err(napi::Error::from_reason("Invalid request")),
                                ThreadsafeFunctionCallMode::NonBlocking,
                            );
                            continue;
                        }

                        let request = request.unwrap();

                        explorer.handle(request, move |response| {
                            let response = Explorer::serialize_response(response).unwrap();

                            callback.call(
                                Ok(response),
                                ThreadsafeFunctionCallMode::NonBlocking,
                            );
                        });
                    }
                    ModuleMessage::Close() => break,
                }
            }
        });

        Ok(Self { tx })
    }

    #[napi]
    pub fn handle(&self, env: Env, payload: String, js_cb: JsFunction) -> Result<JsUndefined> {
        let tsf = env.create_threadsafe_function(&js_cb, 0, |ctx| Ok(vec![ctx.value]));

        if tsf.is_err() {
            panic!("Failed to create threadsafe function");
        }

        self.tx
            .send(ModuleMessage::Job(payload, tsf.unwrap()))
            .unwrap();

        env.get_undefined()
    }
}
