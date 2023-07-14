/// Arbitrary stack size of 50kib.
const ASYNCIFY_STACK_SIZE: usize = 10 * 1024;
/// Scratch space used by Asyncify to save/restore stacks.
static ASYNCIFY_STACK: [u8; ASYNCIFY_STACK_SIZE] = [0; ASYNCIFY_STACK_SIZE];

#[no_mangle]
extern "C" fn get_asyncify_stack_space_ptr() -> i32 {
    let ptr = ASYNCIFY_STACK.as_ptr() as i32;
    // return ptr aligned to 4 bytes
    ptr + (4 - (ptr % 4))
}

#[no_mangle]
extern "C" fn get_asyncify_stack_space_size() -> i32 {
    let original_ptr = ASYNCIFY_STACK.as_ptr() as i32;
    let ptr = get_asyncify_stack_space_ptr();

    // get absolute difference between ptr and original_ptr
    let diff = if ptr > original_ptr {
        ptr - original_ptr
    } else {
        original_ptr - ptr
    };

    let actual_size = ASYNCIFY_STACK_SIZE as i32 - diff;

    // return size aligned to 4 bytes
    actual_size - (actual_size % 4)
}
