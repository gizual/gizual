#include "./asyncify_exports.h"

#include <dirent.h>
#include <unistd.h>
#include <string.h>
#include <stdio.h>

int main(int argc, char **argv)
{
    printf("argc = %d\n", argc);
    // print out the arguments
    for (int i = 0; i < argc; i++)
    {
        printf("argv[%d] = \"%s\"\n", i, argv[i]);
    }

    return 0;
}