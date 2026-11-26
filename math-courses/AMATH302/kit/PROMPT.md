I'm attaching my AMATH302 lecture slides, a LaTeX template kit (`amath302-kit.zip`) and `AMATH301_reference.pdf`, the companion booklet you made for my previous course. Make me the same booklet for AMATH302. Keep every design and content decision of AMATH301; change only the colour palette.

## Step 1: ask me before writing anything

Ask me, with clickable options, about:

1. **The palette.** Offer 4 complete palettes, none of them plum and coral. For each one, give the colour of every role in the kit's PALETTE block:
   - primary (headings, banners, thumb tabs, definition frames)
   - accent (theorem frames, rules, bullets, page numbers)
   - ink (axes and example frames)
   - second (intuition frames, second curves)
   - the tints
   - the cover background
   - the two surface colormaps used in the 3D graphs

   Each palette must work with the dark cover and with the tinted margin.
2. **The colours of graphs and diagrams**, if the palette I pick leaves them open.
3. **The cover**: what the hero figure should show for AMATH302. Offer 3 ideas taken from the course.
4. **The cover text**: course title, term and lecture range.

Do not assume any colour. Wait for my answers.

## Step 2: the design (fixed, already in the kit)

Use `style.tex`, `cover.tex`, `front.tex` and the templates from the kit as they are. Change only the COURSE DETAILS and PALETTE blocks at the top of `style.tex`.

The kit already gives you:

- **Engineering-notebook layout.** A4, one text column 12.9 cm wide, and a 4.3 cm outer margin tinted with a faint grid. A thumb tab for each chapter.
- **Fonts.** Palatino (`mathpazo`), with section titles in small caps.
- **Chapter banners.** A full-width primary band with a grid and faint concentric circles. A large two-digit number in the accent colour, then the lecture label and the title in small caps.
- **Section headings.** A filled tab with the number and an accent rule.
- **Corner-bracket boxes** on a faint grid:
  - Definition (primary)
  - Theorem and Proposition (accent)
  - Worked Example (ink)
  - Intuition first (second)
  - Key idea
  - Real life
  - Common trap (dark accent, with a warning triangle)
  - Recipe
  - Beyond the slides
- **Proofs.** The proof ends with a small filled accent square.
- **Graphs.** Blueprint styles `bp`, `bpbox` and `bp3d`, and the faceted `surfstyle` 3D surfaces.
- **Page furniture.** The course code and chapter in the header, the page number in a filled accent box.
- **Front matter.** A table of contents in banner style, then a "How to read this book" page with the box legend and the exercise difficulty dots.

## Step 3: the content (same recipe as AMATH301)

- **Read every lecture PDF in full first**, slides and worked examples included. One chapter per lecture, in order.
- **Inside each section**, follow this order:
  1. a motivating opening
  2. "Intuition first"
  3. definitions and theorems worded exactly as in the slides
  4. an intuition paragraph for each proof
  5. a full proof in numbered steps, filling in every step the slides skip
- **Examples.** Several worked examples per section, in steps, each with a check when possible.
- **Pictures.** Many TikZ and pgfplots figures: 2D blueprint plots and 3D surfaces. Draw a figure wherever it helps.
- **In every chapter:**
  - Common trap boxes for real exam mistakes
  - Real life boxes (physics, engineering, economics, machine learning)
  - Recipe boxes for methods
  - Beyond the slides boxes for useful extra results
  - short margin notes with `\mnote`
- **End of each chapter.** A Summary key-idea box, then 8 exam-style questions rated 1, 2 or 3 dots. Use `\begin{exercise}[n]`.
- **Appendix A.** Full worked solutions to every question, written like full-marks exam answers.
- **Appendix B.** A two-column formula sheet (`fsheet` boxes in a `tcbraster`), plus a "ten most expensive mistakes" trap box.
- **Concept map.** Rebuild the map on page iv for AMATH302, using the same layout as the template: lecture boxes, accent arrows with labels, one dashed arrow, and a closing Key idea box.
- **Slide errors.** If a slide contains a mathematical error, add a Common trap box that gives the correct result. Then list every error you found in your final message.
- **Writing style.** Plain, clear English. No em dashes anywhere. No AI-sounding phrasing.

## Step 4: build and check

1. Compile with pdflatex, twice.
2. Render every page to images and look at them.
3. Fix any overfull line, any figure running into the margin or off the page, any orphaned box title and any label collision.
4. Fix every warning except harmless font-shape ones.
5. Check the computed numbers in examples and solutions by running them.
6. Deliver the PDF and a zip of the LaTeX sources.
