# Password Lab data

Downloads from the Password Lab (`src/tests/password-lab/`, now hidden; open it at `#/test/password-lab`), one
player (the developer), 2026-11-20 – 2026-11-21. The files overlap (each download holds what was saved in the browser
at the time); the analysis counts every answer once: 228 answers, 224 used.

Password Memory's load weights (`LOAD` in `src/tests/password-memory/scoring.ts`) were fit on these. Add more players'
downloads here (one file per download, `<date>_<player or n>.json`) and rerun:

    python3 scripts/password-lab-analysis.py data/password-lab/*.json
