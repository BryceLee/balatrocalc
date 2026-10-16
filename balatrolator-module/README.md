# Vendored version 2 calculator

This directory contains the built calculator from https://github.com/kleinfreund/balatrolator.

Local scoring fixes applied on 2026-10-16:

- Bloodstone uses x1.5 on success, with the existing 1-in-2 probability.
- Triboulet uses x1 for scored cards other than Kings and Queens.

Preserve these fixes when replacing the upstream bundle. Run `npm run test:version2`
from the repository root to check actual hand scores through the shipped engine.
The tests follow the bundle import in `index.html`; if rebuilding changes the
minified engine symbols, update the test loader's extraction boundaries as well.

After editing a bundle, change its filename and update the HTML import to avoid
reusing cached JavaScript. The current suffix is the first eight hexadecimal
characters of the bundle's SHA-256 hash.
