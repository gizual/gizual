## Gizual 1.0.0-alpha.XX (XX.XX.2024)

### Features

- **app:general:** Implement ability to detect and display images on canvas

---

## Gizual 1.0.0-alpha.23 (29.08.2024)

### Changes

- **app:frontend:** Rework UI layout, modify toolbar position
- **app:frontend:** Expose "out of range" color as a setting for both light and dark mode

---

## Gizual 1.0.0-alpha.22 (11.07.2024)

### Features

- **app:frontend:** Add colored gutter to code editor view

---

## Gizual 1.0.0-alpha.21 (24.05.2024)

### Changes

- **app:frontend:** Minor UI fixes
- **app:frontend:** Add additional confirmation modal when clicking a repo link in the welcome screen
- **app:frontend:** Change default color for age band
- **app:frontend:** Patch `react-zoom-pan-pinch` with an implementation for more natural zooming
- **app:frontend:** Introduce shortcut to vis-type dialog

---

## Gizual 1.0.0-alpha.20 (03.04.2024)

### Changes

- **app:frontend:** Minor UI fixes
- **app:frontend:** Automatically re-center the canvas when `numSelectedFiles` changes

---

## Gizual 1.0.0-alpha.19 (02.04.2024)

### Features

- **app:frontend:** Add touch event handlers to timeline, improve general snapping behavior
- **app:frontend:** Replace minimap mouse-events with pointer-events to support touch

### Changes

- **app:frontend:** Change coloring of “out of range” lines and file content based on `prefersColorScheme`
- **app:frontend:** Expose warning triangle when `numSelectedFiles` are `>= 500`
- **app:frontend:** Immediately apply settings when the query editor is closed
- **app:frontend:** Move editor into separate portal entity
- **app:frontend:** Improve footer metrics layout
- **app:frontend:** Improve query error overlay
- **app:frontend:** Disable canvas SVG export in context menu, add "Reset to default" option to settings
- **app:frontend:** Force hide the timeline when the `rangeByRevision` module is mounted
- **app:frontend:** Add empty selection overlay to canvas
- **app:frontend:** Update welcome screen, fix canvas loading state, disable Gitlab & Bitbucket clone
- **app:frontend:** Minor UI fixes
- **app:backend:** Cache blames, cancel blames which may not have finished yet
- **app:backend:** Debounce block:update event using `requestAnimationFrame`
- **app:backend:** Adapt pool-size distribution
- **app:backend:** Hide featured repo stars for now
- **app:backend:** Expose general loading indicator
- **app:backend:** Track `numCommits` of each author during indexing
- **app:backend:** Replace zip-snapshots with simple multi-file-based snapshots

### Bug Fixes

- **app:backend:** Fix `rangeByRev` default if initial time-range spans the total repo history
- **app:backend:** Fix bug which lead to re-blame of empty files on every rerender

---

## Gizual 1.0.0-alpha.18 (23.03.2024)

### Features

- **app:frontend:** Implement query editor modal
- **app:frontend:** Add simplified welcome page
- **app:general:** Add check for OPFS availability on entry
- **app:backend:** Add error state when selecting a time-range without commits

### Changes

- **app:frontend:** UI refactor, apply consistent styling across all UI elements
- **app:backend:** Remove tanstack query and TRPC in favor of MobX and event emitters
- **app:general:** Merge Docker containers `api` and `web` into a single deliverable

### Bug Fixes

- **app:backend:** Fix error that caused unexpected coloring of ignored lines (off by one commit)

---

## Gizual 1.0.0-alpha.17 (15.03.2024)

### Features

- **app:general:** Implement custom loggers with pretty prefixes, namespaces and custom filtering
- **app:general:** Allow direct remote cloning via query parameter `source`
- **app:backend:** Implement initial support for safari by executing remote-clone in a web-worker
- **app:general:** Collect minimal repository metrics on public production builds (`app.gizual.com`)
- **app:general:** Enable remote cloning of featured repositories
- **app:backend:** Ignore most common binary files

### Changes

- **app:frontend:** Unify date format across all UI components
- **app:frontend:** Disable pagination on author tables with less than `PAGE_SIZE` authors
- **app:frontend:** Implement consistent blur behavior for all input fields
- **app:frontend:** Implement automatic centering of the timeline on changes to query dates
- **app:frontend:** Add color pickers to canvas legend component
- **app:frontend:** Add warning dialog if a repository is open and the user tries to exit the page
- **app:frontend:** Simplify vis-type modal, remove stepper
- **app:frontend:** Implement better visual indication for busy workers in footer
- **app:frontend:** Limit maximum number of lines rendered on the canvas (user-configurable)

### Bug Fixes

- **app:general:** Re-attach renderer worker metrics to footer
- **app:backend:** Fix unstable directory listing of FSA API in chromium 122 & 123 through caching
- **app:frontend:** Fix an issue that caused color updates triggered through the author panel to not be applied properly
- **app:backend:** Ensure `maestro.updateQuery` only triggers necessary updates

---

## Gizual 1.0.0-alpha.16 (22.02.2024)

### Features

- **api:** implement gizual-api server to support on-demand url cloning
- **app:maestro:** implement query error management
- **app:frontend:** display query errors in modules and canvas
- **app:frontend:** implement dynamic preview for vis-types

### Changes

- **app:frontend:** add setting to control the amount of masonry columns to render within the canvas, disable reflow automation
- **app:frontend:** move minimap and legend containers into sidebar component
- **app:frontend:** implement drag and click functionality for canvas minimap
- **app:frontend:** rewrite file blocks into SVG elements

---

## Gizual 1.0.0-alpha.15 (01.02.2024)

### Features

- **app:canvas:** implement minimap and legend overlay, constrain canvas viewport
- **app:frontend:** add welcome screen preview videos for all loaders
- **app:maestro:** cache blames to improve performance
- **app:maestro:** auto re-render with higher dpr based on current scale to increase sharpness
- **app:maestro:** fallback to image/png mime-type for images which are too large for image/webp

### Changes

- **app:frontend:** improve behavior and layout of the color-picker
- **app:frontend:** improve layout of welcome screen and vis-type dialog
- **app:frontend:** add file-tree root node

---

## Gizual 1.0.0-alpha.14 (16.01.2024)

### Features

- **app:general:** restructure modular maestro architecture to support full range of query-features
- **app:frontend:** add full-screen mode for charts on the Analyze page
- **app:frontend:** implement file-module `file-tree`

### Changes

- **app:frontend:** migrate code-view editor to monaco

### Bug Fixes

- **app:frontend:** fix an error in height calculation that caused files with a single line to appear empty

---

## Gizual 1.0.0-alpha.13 (05.01.2024)

### Changes

- **app:frontend:** migrate app frontend to Mantine, remove references to Antd
- **app:frontend:** adapt new simple-query module behavior
- **app:frontend:** extend dialog-provider to allow full-screen on small devices

### Bug Fixes

- **app:canvas:** fix an error that caused lines in `file-lines` mode to be warped

---

## Gizual 1.0.0-alpha.12 (12.12.2023)

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

## Gizual 1.0.0-alpha.11 (21.11.2023)

### Changes

- **app:canvas:** implement css logic to exchange pointer style according to current user motion
- **app:frontend:** link logo back to home page
- **app:general:** adjust base path for static deployment

### Bug Fixes

- **app:frontend:** fix author table hover state in light mode
- **app:canvas:** fix behavior of "Zoom To" button

---

## Gizual 1.0.0-alpha.10 (17.11.2023)

### Features

- **app:general:** implement trpc subscriptions for web worker links and maestro hooks
- **app:frontend:** implement new welcome screen

### Changes

- **app:general:** reduce amount of intermediate build steps for typescript packages @giz/database and @giz/maestro

---

## Gizual 1.0.0-alpha.9 (07.11.2023)

### Features

- **app:search-bar:** implement advanced query builder
- **app:search-bar:** add new simple-search implementation

### Changes

- **app:general:** enable transparent color selections
- **app:canvas:** implement new rendering modes
- **app:canvas:** change SVG default font family to `Courier New`
- **app:canvas:** adjust file title truncation based on minimum browser font size

---

## Gizual 1.0.0-alpha.8 (07.11.2023)

### Features

- **app:explorer:** reimplement explorer to support multiple environments (web-workers, native node module)
- **app:maestro:** implement foundation of @giz/maestro and trpc-based api to the frontend
- **app:general:** update to vite@5.0.0-beta.16 to support interdependent web-worker builds in production mode
- **app:frontend:** modify author-panel to use tanstack-query as data source

---

## Gizual 1.0.0-alpha.7 (28.10.2023)

### Features

- **app:backend:** implement multiple alternatives for loading local repositories by importing the files to OPFS
- **app:general:** enable Firefox support

---

## Gizual 1.0.0-alpha.6 (23.10.2023)

### Features

- **app:canvas:** implement file renderer worker pool

---

## Gizual 1.0.0-alpha.5 (22.10.2023)

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

## Gizual 1.0.0-alpha.4 (20.10.2023)

### Features

- **backend:worker-pool:** refactor pooling logic into separate WebWorker to avoid blocking the main thread

---

## Gizual 1.0.0-alpha.3 (10.10.2023)

### Features

- **app:canvas:** implement masonry grid layout for rendering
- **app:canvas:** separate worker's off-screen canvas from main canvas through object URLs

### Changes

- **app:file-tree:** improve partial select state behavior

---

## Gizual 1.0.0-alpha.2 (10.10.2023)

### Features

- **backend:fsa-fs:** pre-cache all file-system-access handles to improve performance and reduce deadlock potential

### Bug Fixes

- **backend:worker-pool:** ignore backend jobs with priority == 0
- **backend:worker-pool:** fix sorting of jobQueue

---

## Gizual 1.0.0-alpha.1 (07.10.2023)

### Features

- **app:timeline:** add option to collapse timeline into search-bar
- **app:canvas:** append color selection and author panel to canvas stage

### Changes

- **app:general:** remove repo-panel and settings-panel
- **app:search-bar:** modularize search-bar assistants
- **app:search-bar:** improve tag update and synchronization behavior

### Bug Fixes

- **app:canvas:** fix unstable number of rows in canvas while zooming
