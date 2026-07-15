# Generated left-facing enemy source sheets

These seven alpha PNG sheets are project-owned source assets generated for
Ashen Pilgrimage's v2.2 facing-direction rebuild. The production sprites are
rebuilt with:

```bash
python scripts/build-left-facing-enemy-v3.py
pnpm assets:runtime
```

The Python step writes PNG masters under `qa/source-art/runtime-masters/`.
The runtime step refreshes the committed lossless WebP files; it must be run
before building or publishing.

The source sheets use one shared art brief: dark medieval gothic pixel art,
consistent candlelight, explicit three-quarter screen-left battle poses, and
isolated full-body silhouettes. `batch-corrections-alpha.png` replaces the
rejected choir-exorcist and royal-pyre-knight concepts from their first batch.

All files are project assets. No third-party art is embedded in these sheets.
