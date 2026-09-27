# BioResume Maker

A free marriage biodata maker built with React, TypeScript, and Vite. Create a biodata, choose a template, add a photo, preview A4 pages, and download a PDF. All document processing happens in the browser.

This is the first milestone of the broader biodata/resume platform described in the two reference documents in the parent directory. See [the phased roadmap](docs/ROADMAP.md) for the implementation sequence.

## Run locally

Use Node.js 24 (the version used and verified in this workspace).

```powershell
cd "F:\My Projects\bioresume-maker"
npm.cmd install
npm.cmd run dev
```

Open **http://127.0.0.1:5173**. On macOS/Linux use `npm` in place of `npm.cmd`.

## Implemented in the first milestone

- 32 free themes: the original five layouts plus abstract, floral, nature, traditional, and classic designs. The full gallery supports search and category filtering. Every theme uses the same free PDF flow.
- Personal, family, contact, and additional information forms.
- Add up to 40 custom short/long-text fields, rename labels, move fields up/down or between sections, remove fields, undo removal, and restore removed standard fields. The required name stays at the top.
- English, Hindi, Marathi, Gujarati, and Nepali document languages. Standard field labels, section headings, editor actions, and PDF titles change with the language; user-entered text and custom labels are preserved.
- Optional photo upload with file type/size checks and local resizing.
- Live A4 preview, template switching, accent color, heading font, and section visibility.
- 12 free background choices, including original, silk, marble, parchment, dark framed paper, and original floral artwork; custom background upload and intensity control work independently of the selected theme.
- Editable biodata title and blessing, three original devotional images, a no-image option, transparent custom God photo upload, image sizing, and selected-artwork download. See [artwork files and final generation prompts](docs/ARTWORK.md).
- Page layout controls: automatic pagination, fit to one page, or a target limit of 2–10 pages. A 70–110% content-size slider sets the preferred size; fitting reduces it further only when needed and shows a readability notice below 70%.
- Blank optional fields are omitted; a clearly labelled example appears before you enter any details.
- Browser-generated PDF downloads with measured pagination, locally bundled Latin/Devanagari/Gujarati fonts, and photos.
- Print / Save as PDF with a dedicated print layout.
- Opt-in browser draft saving, downloadable JSON drafts, import, and reset.
- Responsive layout, keyboard section navigation, associated form labels, and validation.
- No login, API keys, paid APIs, watermarks, remote fonts, or document uploads.

## Build and verify

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run preview
```

Build output is `dist/`. The end-to-end tests start the production preview on port 4173. Windows tests use installed Google Chrome by default; use `$env:PLAYWRIGHT_BROWSER_CHANNEL = 'msedge'` to select Edge. On Linux/macOS install Chromium once using `npx playwright install chromium`.

The tests cover validation, all 32 theme choices, section visibility, custom field editing and ordering, legacy draft migration, draft persistence and import rejection, invalid photos, long Hindi content, PDFs in all five languages, mobile overflow, print styles, and external network requests. Presentation checks cover all backgrounds, separate custom images, transparency, multilingual controls, single-page fitting, target page counts, content sizing, and PDF artwork under the production content security policy. Browser screenshots and rendered PDFs are written under `test-results/` when tests run.

## PDF details

Direct PDF downloads use `html-to-image` to capture each measured A4 page at twice its CSS resolution, then place those images in a PDF using jsPDF. This preserves complex-script rendering and the template design without a PDF server. Fonts are bundled locally.

The direct download contains image-based pages: text is not selectable or searchable. Browser **Print / Save as PDF** provides native browser text output; turn off browser headers and footers if shown. In the tested Chrome version, some Hindi and Nepali conjuncts render correctly but do not copy back as the original Unicode text from printed PDFs. Use the direct download for faithful visual sharing. Resume/ATS export will need its own selectable-text verification in the resume phase.

English, Hindi, Marathi, Gujarati, and Nepali are supported with bundled fonts. Dates are localized using the Gregorian calendar, including in Nepali; there is no Bikram Sambat conversion or automatic translation/transliteration of entered text. Very long entries are split into word chunks and paginated with repeated section headings. The preview shows every page. Mobile PDF export can take longer on slower devices.

## Privacy and draft storage

Form values and photos remain in memory unless the user turns on **Save on this device** or downloads a file. The save switch uses the `bioresume.draft.v1` localStorage key. This is browser storage, not an account or cloud backup. Turning the switch off removes the saved browser draft; Reset removes the current details and browser draft. Downloaded files remain under the user's control.

Draft format v3 includes language, field layout, custom labels, order, heading, devotional image, background, and page layout. Existing v1/v2 drafts migrate automatically under the same storage key. Removing a field clears its value from the draft; Undo restores the most recently removed field while the current section remains open. Restore removed fields adds standard fields back with empty values. JSON imports reject unknown fields, duplicate keys, unsupported languages, and oversized content. Draft import is limited to 5 MB; large embedded images may exceed a browser's localStorage quota, in which case download the draft file.

Uploaded profile photos and backgrounds are decoded and re-encoded locally as resized JPEG images; custom devotional images use PNG to preserve transparency. Draft imports accept the known schema and embedded JPEG/PNG data only. User text is rendered through React, without interpreting it as HTML. The static hosting provider receives ordinary website requests, but the app does not transmit document fields or photographs.

## Architecture

```text
Form and photo → Shared biodata model → Template renderer → Measured A4 pages
                        ↕                                      ↓
              Optional local draft                     Browser PDF / Print
```

| File | Responsibility |
| --- | --- |
| `src/model.ts` | Field schema, template registry, validation, draft format, document items, pagination |
| `src/themes.ts` | Free theme registry and original design metadata |
| `src/presentation.ts` | Background/artwork catalog, heading and page-layout settings, validation |
| `src/components/PresentationEditor.tsx` | Heading, artwork picker, background picker, and page controls |
| `src/presentation.css` | Presentation controls, paper layers, invocation layout, and print rules |
| `src/i18n.ts` | Five-language label and editor-action translations |
| `src/components/FieldEditor.tsx` | Custom fields, label editing, removal, and field movement |
| `src/components/ThemeGallery.tsx` | Searchable theme picker |
| `src/components/ThemeArtwork.tsx` | Original SVG ornaments used in preview and PDF |
| `src/App.tsx` | Editor workflow, settings, and local draft lifecycle |
| `src/components/DocumentPreview.tsx` | Shared document rendering, measurement, and scaled preview |
| `src/lib/photo.ts` | Local image validation and resizing |
| `src/lib/pdf.ts` | On-demand PDF generation and file downloads |
| `src/styles.css` | Responsive application, five document styles, and print rules |
| `public/_headers` | Security headers applied by Cloudflare Pages |

## Free deployment

Use the Cloudflare Pages Free plan with an available `project-name.pages.dev` subdomain. See [deployment instructions](docs/DEPLOYMENT.md). No server functions or database are needed. A public deployment requires the owner's Cloudflare account; no public site is created merely by building this project.

## Later phases

Resume forms/templates, cross-device accounts, a document dashboard, and the optional Java/Quarkus backend from the original plan are future work. Payments and AI are outside the all-free first release.

## Open-source dependencies and fonts

React, Vite, TypeScript, jsPDF, html-to-image, and Lucide are used under their respective open-source licenses. DM Sans, Cormorant Garamond, Noto Sans Devanagari, and Noto Sans Gujarati fonts are distributed under the SIL Open Font License. Their font license notices are included in `public/licenses/` and ship with the built site. Dependency licenses remain in their installed packages. See [reference-site review](docs/REFERENCE-REVIEW.md) for the design scope of the expanded gallery.
