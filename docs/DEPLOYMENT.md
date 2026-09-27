# Free Cloudflare Pages deployment

The app is a static website. It requires no secrets, server functions, database, or paid PDF provider.

## Option A — Upload the production build

1. Run `npm.cmd run build` from the project folder.
2. Sign in to your Cloudflare account and open **Workers & Pages**.
3. Create a **Pages** project using **Direct Upload / Drag and drop**.
4. Choose an available project name, such as `my-bioresume-maker`.
5. Upload the contents of the generated `dist` directory. `index.html`, `_headers`, `assets/`, `artwork/`, and `licenses/` must be at the deployment root. The artwork folder contains the bundled background and devotional images.
6. Deploy. Cloudflare supplies an HTTPS address such as `my-bioresume-maker.pages.dev`. Availability determines the actual name.

Official guide: [Cloudflare Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/).

Direct Upload projects cannot later be converted to Git integration; create a new project if switching. Choose Git integration initially if you want updates deployed automatically.

## Option B — Git integration

After creating a Git repository under the owner's account and pushing the project, connect it to a Cloudflare Pages project.

| Setting | Value |
| --- | --- |
| Framework preset | React (Vite) |
| Root directory | Repository root if this folder is its own repository; otherwise `bioresume-maker` |
| Build command | `npm run build` |
| Build output | `dist` |
| Node.js | 24 |
| Environment variable | `NODE_VERSION=24` if the build image needs an explicit version |

Commit `package-lock.json` for repeatable dependency versions. Do not commit `node_modules`, generated `dist`, drafts, or personal photos.

Official guide: [Deploy React to Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/).

## Release checks

- Open the public HTTPS URL on desktop and a phone.
- Fill in a test biodata, upload a test image, change a template, and download a PDF.
- Verify English, Hindi, Marathi, Gujarati, and Nepali names, a custom field, and a multipage document in the downloaded PDF.
- Add, rename, reorder, and remove a field; verify the same result in preview and PDF.
- Change the background, devotional image, title, and blessing; confirm the images load from this site and appear in the PDF.
- Check automatic pagination, fit to one page, a two-page target, and content sizing with a long biodata.
- Verify print layout and disable browser print headers/footers if enabled.
- Save a browser draft, reload, and reset it.
- Confirm the `_headers` response headers are present and fonts/PDF export load under the content security policy.
- Use synthetic sample data for public testing.

## Cost

Use the Pages Free plan and its included `pages.dev` subdomain. The current free plan includes 500 builds per month; static hosting limits and terms still apply. Review [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/) before launch. Future free-tier policies can change.

An independent `.com`/`.in` domain generally has an annual fee and is unnecessary for this release. Do not enable paid products, Workers, storage, or paid plan upgrades for this static app.

## Deployment status

Local implementation only. This repository does not contain Cloudflare credentials and has not been published to a public address.
