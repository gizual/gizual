# Gizual v3

A live demo can be found at [gizual.com](https://www.gizual.com).

### Browser Compatibility

| Browser          | Version | Release Date | FSA¹ | Drag & Drop | File Input | Remote Clone² |
| ---------------- | :-----: | :----------: | :--: | :---------: | :--------: | :-----------: |
| Chrome           |  106+   |   Sep. 22    |  👍  |     👍      |     👍     |      👍       |
| Edge             |  106+   |   Oct. 22    |  👍  |     👍      |     👍     |      👍       |
| Firefox          |  110+   |   Feb. 23    |  🚫  |     👍      |     👍     |      👍       |
| Safari           |  16.4+  |   Mar. 23    |  🚫  |     👨‍💻      |     👨‍💻     |      👍       |
| Safari (iOS)     |  16.4+  |   Mar. 23    |  🚫  |     🚫      |     🚫     |      🚧³      |
| Chrome (Android) |  106+   |   Sep. 22    |  🚫  |     🚫      |     🚫     |      👍       |

[1]: FSA - [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)  
[2]: Remote Clone - Remote cloning via server proxy from public repos on GitHub, GitLab and Bitbucket.
[3]: Safari (iOS) - Gizual, being memory and CPU intensive, frequently crashes due to system limitations despite technical support.

👍 Works as intended  
🚧 Partial support / unstable
👨‍💻 Work in progress  
🚫 Not supported

---

### How to run locally?

Ensure the required dependencies are installed. (Git, Rust, Node.js v18, yarn). For Windows, check the [docs](./docs/dep-install-windows.md).

```bash
git clone https://github.com/gizual/gizual.git
cd gizual

yarn            # install dependencies

yarn build      # run build for production
yarn preview    # preview production build at http://localhost:4173
```

---

### How to develop locally?

Ensure the required dependencies are installed. (Git, Rust, Node.js v18, yarn). For Windows, check the [docs](./docs/dep-install-windows.md).

```bash
git clone https://github.com/gizual/gizual.git
cd gizual

yarn            # install dependencies

yarn dev        # runs server at http://localhost:5173
```

### How to build for release?

Ensure the required dependencies are installed. (Git, Rust, Node.js v18, yarn). For Windows, check the [docs](./docs/dep-install-windows.md).

```bash
git clone https://github.com/gizual/gizual.git
cd gizual

yarn            # install dependencies

yarn build      # run build, afterwards artifacts can then be found at `apps/gizual-app/dist/`
```

### Storybook (UI Testing)

Some components are attached to Storybook so they can be tested in isolation.

```bash
yarn            # install dependencies

yarn storybook  # builds the project and launches a dev server at http://localhost:6006
```
