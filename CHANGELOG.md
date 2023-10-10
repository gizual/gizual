## Gizual 3.0.0-alpha.2 (10.10.2023)

### Features

- **backend:fsa-fs:** Pre-cache all file-system-access handles to improve performance and reduce deadlock potential

### Bug Fixes

- **backend:worker-pool:** Ignore backend jobs with priority == 0
- **backend:worker-pool:** Fix sorting of jobQueue

---

## Gizual 3.0.0-alpha.1 (07.10.2023)

### Features

- **app:timeline:** add option to collapse timeline into search-bar
- **app:canvas:** append colour selection and author panel to canvas stage

### Changes

- **app:general:** remove repo-panel and settings-panel
- **app:search-bar:** modularize search-bar assistants
- **app:search-bar:** improve tag update and synchronization behaviour

### Bug Fixes

- **app:canvas:** fix unstable number of rows in canvas while zooming
