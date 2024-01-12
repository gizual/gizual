## Gizual 3.0.0-alpha.14 (12.01.2024)

### Changes

- **app:frontend:** migrate code-view editor to monaco

### Bug Fixes

- **app:frontend:** fix an error in height calculation that caused files with a single line to appear empty

---

## Gizual 3.0.0-alpha.13 (05.01.2024)

### Changes

- **app:frontend:** migrate app frontend to Mantine, remove references to Antd
- **app:frontend:** adapt new simple-query module behavior
- **app:frontend:** extend dialog-provider to allow full-screen on small devices

### Bug Fixes

- **app:canvas:** fix an error that caused lines in `file-lines` mode to be warped

---

## Gizual 3.0.0-alpha.12 (12.12.2023)

### Features

- **app:general:** migrate to new worker-based architecture for query and rendering management
- **app:frontend:** rework search-bar into modular query-based architecture, add first set of modules

### Changes

- **app:frontend:** add new color picker
- **app:frontend:** move canvas toolbar to the left of the canvas
- **app:frontend:** add static image placeholder to welcome gif

### Bug Fixes

- **app:frontend:** fix bug that caused the file-loader default selection to be set to an invalid value
- **app:frontend:** fix pointer style on canvas

---

## Gizual 3.0.0-alpha.11 (21.11.2023)

### Changes

- **app:canvas:** implement css logic to exchange pointer style according to current user motion
- **app:frontend:** link logo back to home page
- **app:general:** adjust base path for static deployment

### Bug Fixes

- **app:frontend:** fix author table hover state in light mode
- **app:canvas:** fix behavior of "Zoom To" button

---

## Gizual 3.0.0-alpha.10 (17.11.2023)

### Features

- **app:general:** implement trpc subscriptions for web worker links and maestro hooks
- **app:frontend:** implement new welcome screen

### Changes

- **app:general:** reduce amount of intermediate build steps for typescript packages @giz/database and @giz/maestro

---

## Gizual 3.0.0-alpha.9 (07.11.2023)

### Features

- **app:search-bar:** implement advanced query builder
- **app:search-bar:** add new simple-search implementation

### Changes

- **app:general:** enable transparent color selections
- **app:canvas:** implement new rendering modes
- **app:canvas:** change SVG default font family to `Courier New`
- **app:canvas:** adjust file title truncation based on minimum browser font size

---

## Gizual 3.0.0-alpha.8 (07.11.2023)

### Features

- **app:explorer:** reimplement explorer to support multiple environments (web-workers, native node module)
- **app:maestro:** implement foundation of @giz/maestro and trpc-based api to the frontend
- **app:general:** update to vite@5.0.0-beta.16 to support interdependent web-worker builds in production mode
- **app:frontend:** modify author-panel to use tanstack-query as data source

---

## Gizual 3.0.0-alpha.7 (28.10.2023)

### Features

- **app:backend:** implement multiple alternatives for loading local repositories by importing the files to OPFS
- **app:general:** enable Firefox support

---

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
