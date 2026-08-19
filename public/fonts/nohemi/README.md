# Nohemi

The display face for headings (`h1`–`h6`), wired up in `app/globals.css`.
Self-hosted because Nohemi has no web CDN.

## What is here

```
Nohemi-Regular.woff2     400
Nohemi-Medium.woff2      500  — declared as `font-weight: 500 800`
Befonts-License.txt           — "Commercial Use Allowed"
```

Converted from the `.ttf` originals with
`fontTools` (`f.flavor = "woff2"`), 57 KB → 23 KB each.

## Why Medium covers the bold range

The distributed family only ships Regular and Medium — there is no Bold cut.
Every heading in the app asks for 600, 700 or 800, so `Nohemi-Medium.woff2` is
declared across `500 800`. Without that range the browser would match nothing
in the family and synthesise a fake bold, which smears the outlines.

Headings therefore render at Medium weight, lighter than the markup's
`font-bold` suggests. That is the accepted trade-off, not a bug.

## Adding a real Bold later

1. Drop `Nohemi-Bold.woff2` in here.
2. In `app/globals.css`, add a block for it at `font-weight: 700` and narrow the
   Medium block from `500 800` to `500 600`.

Nothing in any component changes — the markup already asks for the right
weights.

## Satoshi

The body face needs nothing here. It loads from Fontshare's CDN as a variable
font (300–900), set up in `app/layout.tsx`.
