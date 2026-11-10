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
`.github/workflows/deploy.yml`.

Branches: work happens on feature branches off `develop` and is merged back into `develop`.
`develop` is merged into `main` from time to time to publish.

See [docs/SPEC.md](docs/SPEC.md) for the product spec.
