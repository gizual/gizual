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

    // open a dir via opendir and list files within it
    DIR *dir = opendir(path);
    if (dir == NULL)
    {
        return 2;
    }

    struct dirent *entry;
    while ((entry = readdir(dir)) != NULL)
    {
        printf("entry->d_name = \"%s\", entry->d_type = %d\n", entry->d_name, entry->d_type);
    }

    return 0;
}