<p align="center">
    <a href="https://github.com/floormap-tools">
        <img src="https://github.com/floormap-tools.png" alt="Floor Map" height="80" />
    </a>
    <br />
    <br />
    <strong>Floor Map</strong>
    <br />
    Open-source toolkit for interactive 2D diagrams and floor plans.
</p>

## 📖 Introduction

Floor Map is an agnostic 2D scene engine to build interactive floor plans and diagram editors.
Core primitives for pan/zoom/selection/drag/snapping, pluggable item renderers, and framework adapters (starting with React).
Use it for restaurant seating maps, classrooms, office layouts, warehouses, or any spatial 2D editor.


## 📖 Documentation

🚧 The documentation is currently under construction. It will be available in the future as the project evolves.


## 📦 Packages

- `@floormap/core` — core engine (scene, viewport, items, events)  
- `@floormap/react` — React adapter and renderer  
- `@floormap/examples` — usage demos (not published)  

## 🤝 Contributing

If you find a bug or have a suggestion for improvement, please open an **issue**.  
If you want to submit a **pull request**, make sure that:  
- The PR is **focused and specific** to one change or feature.  
- All **tests** pass locally.  
- Linting has been run and there are no errors.  

### Development setup

1. Clone the repository:
```bash
git clone https://github.com/floormap-tools/floormap

cd floormap
```

2. Install dependencies:
```bash
pnpm install
```

3. Run lint:
```bash
pnpm lint
```

4. Run type check:
```bash
pnpm typecheck
```

5. Run tests:
```bash
pnpm test
```

6. Build packages (currently placeholder until packages are added):
```bash
pnpm build
```

## 📜 License

This project is licensed under the [MIT License](./LICENSE).
