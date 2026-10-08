# 3-3-30 Log

Trainingslog voor 3-3-30, als eigen website (zonder Claude-account).

- **Site:** https://terzicindustriesfb-coder.github.io/3-3-30-log/
- **Opzet en gebruik:** [docs/SETUP.md](docs/SETUP.md)

De website staat in `docs/` (GitHub Pages, branch `main`). Hij wordt gebouwd uit
`3-3-30/index.html`, de Claude-versie:

    python3 3-3-30/build_web.py

In deze repo staat alleen de code van de app. Trainingen staan in Firebase
(project `log-3-3-30`); de groepscode staat alleen in de Firestore-regels daar.
