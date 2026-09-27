# BioResume implementation phases

The user's requirement is a free biodata maker, including hosting and a free website address. The reference documents in the parent folder describe a larger biodata/resume platform. This roadmap narrows the first release to marriage biodata and keeps that larger vision as later work.

## Current status

| Phase | Status |
| --- | --- |
| 1. Foundation | Implemented; production build passes |
| 2. Biodata editor | Expanded to 32 free themes, custom fields, and five document languages |
| 3. PDF and local drafts | Implemented; v3 drafts preserve language, custom fields, heading, artwork, background, and page layout; v1/v2 drafts migrate |
| 4. Release and free hosting | Local checks and deployment instructions ready; public deployment pending the owner's Cloudflare account |
| 5. Resume maker | Planned |
| 6. Optional accounts and expansion | Planned; outside the free biodata milestone |

## Phase 1 — Foundation

React, TypeScript, Vite, responsive design, shared biodata model, and template metadata. Keep document data separate from rendering. No backend or credentials needed.

Acceptance: the development server runs and the production build creates a static `dist` folder.

## Requested expansion — free themes and a flexible multilingual editor

- [x] Review the reference site's public editor and gallery.
- [x] Offer every theme without payment, login, or watermark.
- [x] Expand the gallery to 32 original designs, including the styles shown in the reference gallery.
- [x] Add, rename, remove, restore, and reorder fields; move them between sections.
- [x] Support English, Hindi, Marathi, Gujarati, and Nepali labels and PDF text.
- [x] Bundle Gujarati and Devanagari fonts locally.
- [x] Preserve field layout and language in saved/exported drafts and migrate v1 drafts.
- [x] Verify PDF rendering in five languages, mobile layouts, and theme search and selection on the running app.

## Phase 2 — Biodata editor

### Heading, backgrounds, and page fitting

- [x] Editable biodata title and blessing in every template and language.
- [x] Three original devotional images, no-image option, custom upload, image size, and artwork download.
- [x] Twelve free background choices, including template original, with custom upload and intensity.
- [x] Automatic pages, fit to one page, target page count (2–10), and preferred content size.
- [x] Preserve these settings and embedded uploads in v3 drafts; migrate older drafts.
- [x] Original artwork is bundled locally; [prompts and provenance](ARTWORK.md) are recorded.
- [x] Production build and all 20 regression tests pass, including PDF page counts, image uploads, transparency, multilingual controls, and mobile layouts.

Personal, family, contact, and additional information; 32 free themes built on five layouts (Traditional, Modern, Elegant, Minimal, Portrait); live preview; local photo upload; accent and section controls.

Acceptance: template changes preserve form values; blank optional fields disappear; users can complete the workflow on mobile and desktop.

## Phase 3 — PDF and local drafts

A4 PDF download, measured pagination, English/Hindi font rendering, image validation, opt-in browser draft storage, draft export/import, and reset.

Acceptance: the downloaded PDF includes entered details and photos; long content spans pages without clipped text; saved drafts restore after reload. Document the difference between image-based PDF downloads and browser printing.

## Phase 4 — Release and free hosting

Production build, end-to-end checks, accessibility and phone checks, privacy copy, security headers, and Cloudflare Pages instructions. Deploy to an available `project-name.pages.dev` subdomain once the owner's Cloudflare account is available.

Acceptance: a public HTTPS URL works on desktop and mobile; no paid services or server functions are required. Local build readiness does not mean the site is publicly deployed.

## Phase 5 — Resume maker

Extend the document model with repeatable experience, education, projects, and skills. Add five resume templates and selectable-text PDF verification appropriate for resumes/ATS.

Acceptance: a user can create and download a resume independently of biodata; regression checks keep biodata working.

## Phase 6 — Optional accounts and expansion

Only if requested: private cross-device storage, authentication, document dashboard, and a Java/Quarkus API with PostgreSQL. Re-evaluate free hosting limits before adding any hosted service. Payments, premium templates, AI, admin tools, and a marketplace from the reference documents are optional future products, outside the current all-free release.

Acceptance: each added service has a reviewed cost model; saved documents are private and users can delete their data.

## Decisions for the first milestone

- All 32 biodata themes, 12 backgrounds, devotional artwork, and PDF downloads are free, without login or watermarks.
- Processing stays in the browser. No photo or document upload to a service.
- Save on this device is opt-in and does not provide cross-device sync.
- React renders the same A4 pages for preview and export.
- Browser rasterization preserves complex-script shaping in direct PDF downloads; it produces image-based pages. Browser Print / Save as PDF is also available for native text rendering.
- Cloudflare Pages hosts the static app; `pages.dev` supplies the free subdomain. A paid custom domain is unnecessary.
- The original business and implementation documents remain reference inputs.
