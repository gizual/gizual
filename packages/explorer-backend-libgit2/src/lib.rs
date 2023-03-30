use wasm_bindgen::prelude::*;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub fn create_msg(name: &str) -> String {
    let mut result: String = "Hello ".to_owned();
    result.push_str(name);

    result
}

#[wasm_bindgen(start)]
pub fn main_js() {
    // This provides better error messages in debug mode.
    // For more details see
    // https://github.com/rustwasm/console_error_panic_hook#readme
    #[cfg(debug_assertions)]
    console_error_panic_hook::set_once();
}
