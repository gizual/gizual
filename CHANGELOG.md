## Gizual 3.0.0-alpha.6 (23.10.2023)

### Features

- **app:canvas:** implement file renderer worker pool

---

## Gizual 3.0.0-alpha.5 (22.10.2023)

### Features

- **app:canvas:** implement SVG export
- **app:canvas:** implement full width visualization style
- **app:canvas:** render files in image tags instead of canvas

### Changes

- **app:canvas:** implement deterministic masonry layout based on file size and name
- **app:markdown-viewer:** modify markdown styling

### Bug Fixes

- **app:canvas:** fix file names not truncating early enough

---

## Gizual 3.0.0-alpha.4 (20.10.2023)

### Features

- **backend:worker-pool:** refactor pooling logic into separate WebWorker to avoid blocking the main thread

---

## Gizual 3.0.0-alpha.3 (10.10.2023)

### Features

- **app:canvas:** implement masonry grid layout for rendering
- **app:canvas:** separate worker's off-screen canvas from main canvas through object URLs

### Changes

- **app:file-tree:** improve partial select state behavior

---

## Gizual 3.0.0-alpha.2 (10.10.2023)

### Features

- **backend:fsa-fs:** pre-cache all file-system-access handles to improve performance and reduce deadlock potential

### Bug Fixes

- **backend:worker-pool:** ignore backend jobs with priority == 0
- **backend:worker-pool:** fix sorting of jobQueue

---

## Gizual 3.0.0-alpha.1 (07.10.2023)

### Features

- **app:timeline:** add option to collapse timeline into search-bar
- **app:canvas:** append color selection and author panel to canvas stage

### Changes

- **app:general:** remove repo-panel and settings-panel
- **app:search-bar:** modularize search-bar assistants
- **app:search-bar:** improve tag update and synchronization behavior

### Bug Fixes

- **app:canvas:** fix unstable number of rows in canvas while zooming
