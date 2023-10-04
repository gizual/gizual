#include "./asyncify_exports.h";
#include <unistd.h>
#include <string.h>

int main()
{
    char buf[20];
    int numred = read(0, buf, 14);

    // write(2, buf, numred + 2);

    return strcmp(buf, "Hello, world!\n");
}