# Imagery

Two kinds of picture appear on Haloft, and they are not interchangeable.

**Catalogue photography** is real. It comes from `property_media`, shot by
whoever from the team verified the property, and it is the only imagery
allowed to stand for a specific building. Wherever a property has photos,
they are the photos you see.

**Façades** are the stock photographs in `public/imagery/`, rendered by
`src/components/haloft/facade.tsx`. They fill the surfaces that have no
particular property behind them — the hero, the trust section, the owner
band — and the surfaces whose property has not been photographed yet.

## The rule on façades

A façade is decorative. It is marked `aria-hidden` with an empty `alt`, it
is never captioned, and it must never be described as the property it sits
above. The card and detail surfaces that fall back to one keep their own
visible label — "Photo added after the visit", "Photos are added when the
team visits", "Sample listing" — and that label is what makes the picture
honest. Do not remove it while a façade is showing, and do not add a façade
to a surface that cannot carry one.

## The six

All six are Nigerian residential buildings, chosen to cover the crops the
layouts ask for: portraits down to 5:6, letterboxes out to 3.4:1.

| Variant   | Subject                                        | Master        |
| --------- | ---------------------------------------------- | ------------- |
| `tower`   | Residential tower, Lagos                       | 1600 × 2134   |
| `block`   | Balconied flats in terracotta and cream, Lagos | 1600 × 1877   |
| `terrace` | Estate terraces, Ajah/Sangotedo, Lagos         | 1600 × 1200   |
| `court`   | Compound walkway seen from the courtyard       | 1600 × 2134   |
| `estate`  | Mid-rise blocks around a car park              | 1600 × 900    |
| `hostel`  | Student hostel block behind its lawn           | 1600 × 1600   |

Each carries an `objectPosition` in the component: the frames vary too much
for a centre crop to hold every subject, so the focal point travels with
the photograph rather than with the call site.

## Credits

All six are from Unsplash, free to use under the
[Unsplash License](https://unsplash.com/license), which asks for no
attribution. We record it anyway.

| Variant   | Photographer                                | Source                                                                                  |
| --------- | ------------------------------------------- | --------------------------------------------------------------------------------------- |
| `tower`   | Structures of Lagos (@structuresoflagos)    | https://unsplash.com/photos/white-painted-high-rise-building-Ci8ii21QSlk                  |
| `block`   | Joshua Oluwagbemiga                          | https://unsplash.com/photos/beige-and-brown-concrete-house-under-blue-sky--W9baa2VIBU     |
| `terrace` | Mac Nzombola (@mac_nzombola)                 | https://unsplash.com/photos/a-street-lined-with-houses-and-a-cloudy-sky-BE9-swZtUa8       |
| `court`   | Clinton Kayode (@ckay_56)                    | https://unsplash.com/photos/interior-courtyard-with-balconies-and-sunlight-casting-shadows-dlOeyar4ScE |
| `estate`  | Ima Enoch                                    | https://unsplash.com/photos/rfB2_8PujeE                                                   |
| `hostel`  | Ifeolu Kayode (@ifeolu_photo)                | https://unsplash.com/photos/building-with-outdoor-walkway-and-grassy-area-gfPNCjcXpek     |

## Replacing one

The files in `public/imagery/` are masters, not what the browser downloads:
`next/image` re-encodes them to AVIF or WebP at the widths the layouts ask
for. So keep them generous — roughly 1600px on the long side at JPEG q84 —
and let the pipeline do the shrinking.

A new façade needs three things in `facade.tsx`: the path, an
`objectPosition` that survives both a 5:6 portrait and a 3.4:1 strip, and a
`blurDataURL`. The last is a 12px-wide JPEG of the same photograph, inlined
as base64, which holds the frame while the real file loads:

```python
from PIL import Image
import io, base64

im = Image.open("public/imagery/<name>.jpg")
tiny = im.resize((12, round(im.height * 12 / im.width)), Image.LANCZOS)
buf = io.BytesIO()
tiny.save(buf, "JPEG", quality=42, optimize=True)
print("data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode())
```
