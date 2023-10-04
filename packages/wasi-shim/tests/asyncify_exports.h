#ifndef ASYNCIFY_EXPORTS
#define ASYNCIFY_EXPORTS

#define A_SIZE 10240

const int ASYNCIFY_STACK_SIZE = A_SIZE;
const char ASYNCIFY_STACK[A_SIZE] = {0};

__attribute__((export_name("get_asyncify_stack_space_size"))) int get_asyncify_stack_space_size()
{
    return ASYNCIFY_STACK_SIZE;
};

__attribute__((export_name("get_asyncify_stack_space_ptr"))) int get_asyncify_stack_space_ptr()
{
    return (int)ASYNCIFY_STACK;
};

#endif