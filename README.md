# Olivia Ye Portfolio

A static portfolio site: plain HTML, CSS and JavaScript, with no build step and no dependencies to install.

## Files

| File | What it holds |
| --- | --- |
| `index.html` | All five pages (Home, Work, Experience, About, Contact), switched by the URL hash |
| `styles.css` | Layout, colors (light and dark) and motion |
| `main.js` | Page switching and the portrait's data-point effect |
| `olivia.jpg` | The portrait |

## Preview locally

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Opening `index.html` directly also works, but the portrait effect needs a server.

## Deploy free on GitHub Pages

From the GitHub account that will host the site:

1. Fork this repository, or use **+ → Import repository** and paste this repository's URL.
2. In the new repository, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**, pick **main** and **/ (root)**, and save.
4. After about a minute the site is live at `https://<username>.github.io/<repository-name>/`.

To serve it at `https://<username>.github.io/` with no path, name the repository `<username>.github.io`.

Every push to `main` redeploys the site.

## Still to fill in

On the Contact page, the email address is a placeholder (shown with a dashed underline). The résumé is `Olivia-Ye-Resume.pdf`; replace that file to update it, and the QR code (drawn by `qrcode.js`) follows automatically. The footer also carries a draft note to remove once the content is confirmed.
