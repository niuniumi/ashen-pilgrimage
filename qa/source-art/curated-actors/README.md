# Curated actor source assets

These files are retained so the production actor PNGs can be rebuilt with
`scripts/build-curated-actor-assets.py`.

| File | Source | License |
| --- | --- | --- |
| `generated-actor-contact.png` | Project character concept contact sheet generated for Ashen Pilgrimage | Project asset |
| `smithy-crow-cc0.png` | [Crow Sprite by Smithy Games](https://smithygames.itch.io/crow-sprite) | CC0 1.0 Universal |
| `forest-animals-cc0.png` | [Forest Animals Sprite Sheet](https://opengameart.org/content/forest-animals-sprite-sheet) | CC0 |

The build script crops existing raster artwork, removes keyed backgrounds and
transparent fragments, and writes semantic standalone PNGs. It does not draw
replacement characters with runtime geometry.
