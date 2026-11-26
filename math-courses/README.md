# Math courses

Everything I made for my applied mathematics courses at SASE (UM6P): study booklets, a revision
guide, exam walkthroughs, an animated lecture, and the prompts and template kits used to make
them. All of it is LaTeX source you can rebuild and rework, with the compiled PDF next to it.

Only my own material is here. The course slides, TD sheets and exam papers belong to the
teaching team and are not included.

## AMATH301: Multivariate Calculus (Fall 2026)

| # | Folder | What it is | Pages | Build |
|---|---|---|---|---|
| 1 | [`01-companion-booklet`](AMATH301/01-companion-booklet) | Companion booklet for Lectures I to V: every lecture summarised, worked examples, exercises with solutions, formula sheet. Plum palette, `book` class. | 95 | pdfLaTeX |
| 2 | [`02-lecture-I-in-motion`](AMATH301/02-lecture-I-in-motion) | Animated explainer of Lecture I (domains, graphs, level curves, limits). A canvas animation in one HTML page, plus a recorded MP4. | 1:34 | Python |
| 3 | [`03-revision-guide`](AMATH301/03-revision-guide) | Full exam revision guide, Lectures I to VII: theory, every TD problem solved, extra exam-style problems, two mock exams with solutions, traps table, formula sheet. | 76 | XeLaTeX |
| 4 | [`04-mock-exam-explained`](AMATH301/04-mock-exam-explained) | The mock exam taught question by question: the lesson behind it, how to start, the model answer, the traps, a graph for each part. | 44 | XeLaTeX |
| 5 | [`05-midterm-sheet`](AMATH301/05-midterm-sheet) | Short midterm sheet: the 8 proof sentences to copy, then each mock question as idea, recipe, and what to write. | 14 | XeLaTeX |
| 6 | [`06-midterm-recipes`](AMATH301/06-midterm-recipes) | Four-page recipe card: one short recipe per question type, with the mock answer under each. | 4 | XeLaTeX |

Items 3 to 5 share one look: the `beautybook` class, palette `#64CADE #6DD2E7 #95E1F1 #F19381
#FFB1A1` with darker text shades `#1F7F92 #145F6E #C95A46`, TeX Gyre Pagella for text and
Montserrat for headings.

## AMATH302: Introduction to Optimization

[`AMATH302/kit`](AMATH302/kit) is the template kit for the AMATH302 booklet: the companion
booklet's design with a new palette, an empty chapter template, and `PROMPT.md`, the prompt
that builds the booklet from the lecture slides.

## Prompts

[`prompts/revision-guide-prompt.md`](prompts/revision-guide-prompt.md) is the reusable prompt
behind the AMATH301 revision guide: paste it into a new chat with a course's files to get the
same kind of guide for another course.

## Building

Each project has a `src/` folder that compiles on its own. From inside it:

```bash
# items 3, 4, 5, 6 (fontspec, Montserrat is bundled in src/fonts)
xelatex main.tex && xelatex main.tex && xelatex main.tex

# item 1 and the AMATH302 kit
pdflatex main.tex && pdflatex main.tex && pdflatex main.tex
```

You need a recent TeX Live with `tcolorbox`, `pgfplots`, `tikz`, `scrlayer-scrpage`, `mathpazo`
and TeX Gyre Pagella. On Overleaf, upload one `src/` folder as a project and set the compiler to
XeLaTeX (or pdfLaTeX for item 1).

The animation (item 2):

```bash
cd AMATH301/02-lecture-I-in-motion/src
python3 build.py                    # writes dist/lecture-1-in-motion.html and rec.html
python3 stills.py out 3 40 90       # optional: JPG stills at chosen seconds (needs Playwright)
```

## Checking the maths

The `verification/` folders hold the SymPy scripts used to recompute every answer in the
revision guide and the mock walkthrough. `04-mock-exam-explained/verification/boxcheck.py`
checks that no box lost text in the compiled PDF:

```bash
python3 boxcheck.py ../src ../AMATH301_Mock_Exam_Explained.pdf front.tex p1.tex p2.tex p3.tex wrap.tex
```

## Licences

- My notes and code: MIT, same as the rest of this repository.
- `beautybook.cls` and `stys/beautybook-cover-en.sty`: modified copies of
  [beautybook](https://ctan.org/pkg/beautybook) by Ethan Lu, LPPL 1.3c or later. The changes are
  listed at the top of each `beautybook.cls`. See [`licenses/beautybook-README.md`](licenses/beautybook-README.md).
- Montserrat: SIL Open Font License 1.1, see [`licenses/Montserrat-OFL.txt`](licenses/Montserrat-OFL.txt).
- The web fonts of the animation are converted from TeX Gyre Pagella (GUST Font License) and
  Latin Modern (GUST Font License).
