# Highlighter brand kit

The mark pairs a reading page with one highlighted line. Its forest-green frame is recognizable in a browser toolbar, while the warm yellow line signals the product's main action.

## Assets

- `icon.svg` — square full-color mark for browser/app icons.
- `icon-16.png`, `icon-32.png`, `icon-48.png`, `icon-128.png` — raster sizes for Chromium extension manifests.
- `icon-monochrome.svg` — single-color mark for stamps and constrained layouts.
- `icon-monochrome-128.png` — monochrome raster export.
- `logo-horizontal.svg` — full-color wordmark for light backgrounds.
- `logo-horizontal-reverse.svg` — light wordmark for dark backgrounds.
- `logo-horizontal.png` and `logo-horizontal-reverse.png` — PNG exports of the wordmarks.

SVGs are editable and scale without loss. The wordmark uses the local font stack `Aptos`, `Segoe UI`, then `Arial`; text remains editable. Rasterize the square icon to PNG when wiring it into a browser extension manifest.

## Visual system

| Token | Hex | Use |
| --- | --- | --- |
| Forest | `#19442F` | Primary mark and wordmark |
| Leaf | `#2B684C` | Supporting UI accent |
| Marker | `#F3D84A` | Highlight accent |
| Paper | `#FBFAF6` | Page shape and reversed wordmark |
| Fold | `#E8E5DA` | Page fold detail |

Use the full-color logo on a light, quiet background and the reverse wordmark on dark backgrounds. Keep clear space around the logo equal to the icon's page-line height. Keep the icon at least 24 px tall and the full wordmark at least 120 px wide. Do not stretch, recolor, rotate, add effects, or place the logo over busy imagery.
