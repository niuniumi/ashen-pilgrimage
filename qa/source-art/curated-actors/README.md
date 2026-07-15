# Curated actor source assets

These files are retained so the actor masters and runtime WebP files can be
rebuilt with:

```bash
python scripts/build-curated-actor-assets.py
pnpm assets:runtime
```

| File | Source | License |
| --- | --- | --- |
| `generated-actor-contact.png` | Project character concept contact sheet generated for Ashen Pilgrimage | Project asset |
| `generated-playable-lineup-v3-alpha.png` | Unified screen-right playable-character source sheet generated for Ashen Pilgrimage | Project asset |
| `generated-playable-lineup-v3-chroma.png` | Chroma-key master for the v3 playable-character sheet | Project asset |
| `generated-plague-rats-v2-alpha.png` | Explicit screen-left plague-rat swarm source generated for Ashen Pilgrimage | Project asset |
| `generated-plague-rats-v2-chroma.png` | Chroma-key master for the plague-rat swarm | Project asset |
| `smithy-crow-cc0.png` | [Crow Sprite by Smithy Games](https://smithygames.itch.io/crow-sprite) | CC0 1.0 Universal |
| `forest-animals-cc0.png` | Retired v2.1 rat source, retained only for provenance | CC0 |

The build script crops existing raster artwork, removes keyed backgrounds and
transparent fragments, and writes current PNG masters outside `public` while
preserving intentionally legacy sprites in their existing public paths. The v3 playable
characters all face screen-right. The generated rat swarm faces screen-left.
Runtime geometry is only an unavailable-asset fallback and is not used by the
production roster.
