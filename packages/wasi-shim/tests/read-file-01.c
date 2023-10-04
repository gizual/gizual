#include "./asyncify_exports.h"

#include <dirent.h>
#include <unistd.h>
#include <string.h>
#include <stdio.h>

int main(int argc, char **argv)

{
    if (argc != 2)
    {
        return 1;
    }

    char *path = argv[1];

    FILE *fd = fopen(path, "r");
    if (fd == NULL)
    {
        return 2;
    }

    char buf[1024];
    size_t nread;
    while ((nread = fread(buf, 1, sizeof(buf), fd)) > 0)
    {
        printf("file_content = \"%s\"\n", buf);
    }

    return 0;
}