# Skill Lab

Quick, no-learning-needed skill tests (reaction, memory, focus, …). Each gives one
score you can share and compare with friends. Fully static — hosted on GitHub Pages.

```bash
npm install
npm run dev     # local dev server
npm test        # unit tests
npm run build   # static build into dist/
```

Live at https://side-adventures.github.io/skill-lab/. Every push to `main` deploys via
`.github/workflows/deploy.yml`, so changes are made on feature branches and merged into `main`
only when they should go live.

See [docs/SPEC.md](docs/SPEC.md) for the product spec.
