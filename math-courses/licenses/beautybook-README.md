# beautybook

A decorative book class with coloured `tcolorbox`-based theorem
environments (definition/theorem/lemma/proposition/example) and a
two-tone chapter-heading treatment, from the BeautyLaTeX project.

## What was changed from upstream

Upstream (CTAN `beautybook`, and github.com/BeautyLaTeX/latex-template)
ships four cover styles (`cn`/`en`/`enfig`/`birkar`) and ~36MB of
photographic chapter-corner decorations (`inner_pics/titleimages/`) with
no licence statement of their own beyond the class's overall grant. To
avoid shipping unverified third-party photography, this starter:

- uses only the **text-only `en` cover** (`cover-choose=en`) — no
  background photograph;
- replaces every upstream photo (`\presslogo`, `\chapimage`) with one
  small, self-drawn abstract mark (`inner_pics/beautybook-mark.png`),
  original artwork made for this starter.

Bundles `beautybook.cls` and `stys/beautybook-cover-en.sty` (not on
CTAN as separate installable packages outside the class bundle).

## Licence

LPPL-1.3c or later, per the upstream README ("This work is released
under the LaTeX Project Public License, v1.3c or later."). The class
file itself carries no header licence statement — this is recorded as
found in the primary README, the only place a grant appears.

Upstream: <https://github.com/BeautyLaTeX/latex-template>,
<https://ctan.org/pkg/beautybook>. Author: Ethan Lu.

## Build

```
pdflatex main && bibtex main && pdflatex main && pdflatex main
```
