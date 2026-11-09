# Skill Lab

Quick, no-learning-needed skill tests (reaction, memory, focus, …). Each gives one
score you can share and compare with friends. Fully static — hosted on GitHub Pages.

```bash
npm install
npm run dev     # local dev server
npm test        # unit tests
npm run build   # static build into dist/
```

Deploys via `.github/workflows/deploy.yml`, currently started by hand (Actions → Deploy to GitHub Pages →
Run workflow). Enable Pages once in the repo first: Settings → Pages → Source: **GitHub Actions**.

See [docs/SPEC.md](docs/SPEC.md) for the product spec.
