# KAU Cover Page Generator

Cover page generator (assignment, lab report, report, presentation, term paper)
for **Khulna Agricultural University**. Fill in the form, see the A4 preview
update live, and download a PDF.

Plain HTML, CSS and JavaScript. No build step, no framework, no backend.

## Files

| File | What it does |
| --- | --- |
| `index.html` | Page layout, form fields, preview area |
| `style.css` | App styling and the A4 cover design |
| `data.js` | KAU faculties, departments, programs, document types, and the embedded cover artwork (header background and logo from `Assignment_Cover_Page_v2.docx`) |
| `script.js` | Form logic, live preview, PDF download |
| `assets/kau-logo.png` | University logo used on the cover |

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

(Opening `index.html` directly also works, but a local server is closer to Vercel.)

## Put it on GitHub

```bash
git init
git add .
git commit -m "KAU cover page generator"
git branch -M main
git remote add origin https://github.com/<your-username>/kau-cover-page-generator.git
git push -u origin main
```

Create the empty repository on github.com first, then run the commands above.

## Deploy on Vercel

1. Go to https://vercel.com/new and import the GitHub repository.
2. Framework Preset: **Other**. Leave Build Command and Output Directory empty.
3. Click **Deploy**.

Every `git push` to `main` redeploys automatically.

## Things to edit

- **Contact details**: in `index.html`, edit the name, department, email and phone in the `<footer class="contact">` block.
- **Faculties / departments**: edit `data.js`. Faculties 1 to 5 come from the official KAU "About" page (kau.ac.bd/about/about-kau). The last two (Food Sciences and Safety; Environment, Disaster Risk and Agroclimatic Studies) are marked `official: false` because KAU lists them as "in process"; their departments come from Wikipedia. Update them when KAU publishes the official list.
- **Cover artwork**: the header background and the logo are embedded in `data.js` as `KAU_COVER_BG` and `KAU_COVER_LOGO`. Replace those two values to change them.
- **App theme**: the colour variables at the top of `style.css` (teal and slate). **Cover colours and sizes**: the `.sheet` rules lower in the same file (navy and gold, matching the Word cover).

## Notes

- The PDF is made in the browser with html2pdf.js (loaded from cdnjs), so it needs an internet connection the first time.
- Form values are remembered in the browser (localStorage). The Reset button clears them.

## Visitor counts

`index.html` already includes the Vercel Web Analytics script. In the Vercel dashboard open your project, go to **Analytics** and click **Enable**, then redeploy. Counts appear there after people visit. The script does nothing when the site runs locally.
