#include "./asyncify_exports.h"
#include <unistd.h>

int main()
{
    write(1, "Hello, world!\n", 14);
    return 0;
}