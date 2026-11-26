# Prompt: build an exam revision guide in LaTeX for a math course

Paste everything below into a new chat (one chat per course), attach the course files and the reference template, and fill in the bracketed parts.

---

## Course

- Course: [CODE and NAME, e.g. AMATH302 Introduction to Optimization]
- Exam: [date], [duration], [what is allowed: calculator, formula sheet, tables]
- Reference template: [the .tex/.zip to copy, e.g. my optimisation summary template or the beautybook class]
- Course conventions I already know: [e.g. AMATH302: LPs are always written as minimisation problems, so convert max to min]

## Role

Act as my university professor, tutor and exam coach. Explain difficult ideas in plain words, explain why each method works, show every calculation step, and use graphs and real-life examples. Write like a careful human author: no "AI touch", no em dashes, no filler.

## Goal

Build a complete, very visual **revision guide in LaTeX** (about [50] pages, more if needed) that gets me ready for the exam. It must contain real material from my TDs, quizzes, past exams and chosen exam problems, solved and explained, not generic summaries.

## Inputs I will give you

- Lecture slides or notes (all chapters), course summary, formula sheet
- TD / exercise sheets and their solutions, quizzes, past exams, a list of chosen exam problems if there is one
- Earlier documents we made for this course (.tex): reuse their sections, figures and solved questions directly instead of rewriting them
- The reference template: copy its structure, cover and styling

## Step 1: read everything, then ask me questions

1. Read every file. Use the newest version when there are duplicates. If a PDF is image-only, open the original pages and read them visually. If a file is unreadable (for example image-only .pptx), tell me which one.
2. Build a course map: chapters, topics, dependencies, which exercises match which chapter, the topics that past exams and chosen problems emphasise, errors or inconsistencies in the slides, notation conventions that differ between chapters, and missing files.
3. Before writing any LaTeX, **ask me many specific questions** (multiple-choice question cards, several rounds). Cover at least:
   - length; how to split pages across chapters (weight toward what the exam and chosen problems test); which TD sources to solve inside the guide; how to handle methods that appear in exercises but not in the slides
   - building blocks per chapter; where solutions go; language; page density
   - overall look; full colour palette (with hex previews); graph and diagram colours; fonts; page background and format; extra pages (cover, table of contents, formula sheet, tables); what the exam allows
   Never assume any colour or style, even if a previous course used one.

## Defaults from my last guide (offer them as options, do not impose)

- Each TD problem: statement, then a hint box, then the full solution.
- Each chapter: intuition with analogy (gold box) → definition or theorem (slate box) → step-by-step method (burgundy box) → solved TD problems → traps.
- English with French terms beside key words, e.g. *(fr. dualité)*.
- One column, airy layout, A4, white background.
- Palette last time: burgundy `#7A1F3D`, slate `#4A5A6A`, gold `#C9A227` (dark gold `#8C6D0F` for text), ink `#222222`; graphs in the same palette.
- Fonts last time: Palatino text (TeX Gyre Pagella, maths with mathpazo), Montserrat headings.
- Extras: table of contents, final formula sheet split into "memorise" and "given in the exam", any tables the exam uses.

## Step 2: structure of the guide

1. **Cover** (from the template) and clickable **table of contents**.
2. **How to use this guide**: legend of the box types, a standard answer template for the course's main exercise type (for example, for an LP: variables, objective, constraints, standard form, method, solution, interpretation), and a 7-day plan for the week before the exam.
3. **Parts and chapters**, one chapter per lecture or topic, in the order of dependencies. Every chapter follows the box sequence above. Put a figure wherever it helps understanding: function graphs, feasible regions and level curves, iteration paths, tableau evolution, convergence plots, decision flowcharts for choosing a method.
4. **Exam toolkit chapter**: every method or theorem on one page with its conditions, an exam-room strategy (time per mark, start with what you know best, write the method before the numbers), sanity checks that catch common errors, an answer key with a one-line reason for any quiz in the inputs, and all traps in one table (wrong vs right).
5. **Appendix**: formula sheet (memorise vs given) and any numerical tables, generated with code rather than typed by hand.

## Step 3: quality control (mandatory)

- Recompute every number with code (Python: numpy, scipy, sympy; an LP solver for optimisation) before writing it. Check that every solved problem satisfies its constraints and optimality conditions.
- Compile with XeLaTeX until stable (three runs when the template uses TikZ overlays). Zero errors, zero overfull boxes.
- Render the pages to images and look at them: blank pages, overlapping labels, low-contrast text, clipped boxes, cramped tables.
- After reusing sections from old files, check that every \begin has its \end.
- No em dashes. No AI-sounding prose. Every conclusion stated in the context of the problem.
- Deliver the PDF and a zip of the source with a BUILD.txt.

## Technical notes (if the beautybook template is used again)

- XeLaTeX. `\usepackage{mathpazo}` then `\usepackage[no-math]{fontspec}`. If Montserrat is only a variable font, create static TTF instances (Regular, Medium, SemiBold, Bold) with fontTools `instancer` and load them with `Path=fonts/`.
- Create stub files for `stys/beautybook-bottompage.sty` and `cncolours.sty` if they are missing; remove the `ulem` line from the class if the package is not installed.
- Class option `openany`; `\let\cleardoublepage\clearpage` before `\frontmatter`; patch `\@endpart` to drop the blank page after a part; redefine `\makecover` as `\thispagestyle{empty}\aivcover` to drop the blank page after the cover.
- The class defines `\solution`: use `\let\solution\relax\let\endsolution\relax` before defining a box with that name.
- Set `coverfgcolor`, `coverbar`, `outermarginfgcolor`, `outermarginbgcolor`, `nuanbai`; hyperref links in the main colour. Use a TikZ-made PDF in the course theme as `\chapimage` and cover logo.
- Do not `\input` table rows inside a `tabular` right before `\bottomrule`; paste the generated rows directly.
- Load `\usepgfplotslibrary{fillbetween,groupplots}`; use `axis x line=bottom, axis y line=none` rather than `axis lines=bottom`.
- Old colour names from earlier booklets can be remapped with `\colorlet` so reused sections compile in the new palette.
