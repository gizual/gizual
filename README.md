# Gizual v3

A live demo can be found at [gizual.com](https://www.gizual.com).

---

### How to run locally?

⚠️ Ensure the required dependencies are installed. (Git, Rust, Node.js v18, yarn). For Windows, check the [docs](./docs/dep-install-windows.md).

```bash
git clone https://github.com/gizual/gizual.git
cd gizual

yarn            # install dependencies

yarn build      # run build for production
yarn preview    # preview production build at http://localhost:4173
```

---

### How to develop locally?

⚠️ Ensure the required dependencies are installed. (Git, Rust, Node.js v18, yarn). For Windows, check the [docs](./docs/dep-install-windows.md).

```bash
git clone https://github.com/gizual/gizual.git
cd gizual

yarn            # install dependencies

yarn dev        # runs server at http://localhost:5173
```

### How to build for release?

⚠️ Ensure the required dependencies are installed. (Git, Rust, Node.js v18, yarn). For Windows, check the [docs](./docs/dep-install-windows.md).

```bash
git clone https://github.com/gizual/gizual.git
cd gizual

yarn            # install dependencies

yarn build      # run build, afterwards artifacts can then be found at `apps/gizual-app/dist/`
```
