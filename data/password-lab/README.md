# Password Lab data

Downloads from the Password Lab (`src/tests/password-lab/`, now hidden; open it at `#/test/password-lab`), one
player (the developer), 2026-11-20 – 2026-11-21. Each file holds answers found in no other (a download that was fully contained in a later one
was removed; the numbering keeps the download order); together 228 answers, 224 used.

Password Memory's load weights (`LOAD` in `src/tests/password-memory/scoring.ts`) were fit on these. Add more players'
downloads here (one file per download, `<date>_<player or n>.json`) and rerun:

    python3 scripts/password-lab-analysis.py data/password-lab/*.json
