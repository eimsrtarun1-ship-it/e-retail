# Fieldstone Goods — storefront + admin panel

A static, no-build e-commerce demo: a storefront (`index.html`) and an
admin panel (`admin.html`) that share product/order data through the
browser's `localStorage`. No server, database, or npm install required —
open the files and it works.

## Structure
```
fieldstone-goods/
├── index.html          storefront (catalog, cart, checkout)
├── admin.html           admin panel (login-gated)
├── css/
│   ├── style.css         shared design system
│   └── admin.css         admin-only layout
├── js/
│   ├── data.js           localStorage data layer + seed products
│   ├── store.js          storefront behaviour
│   └── admin.js          admin behaviour (auth, CRUD)
└── README.md
```

## Try it locally
Just open `index.html` in a browser — or, better, run a tiny local
server so relative paths behave exactly like they will online:
```bash
cd fieldstone-goods
python3 -m http.server 8000
# visit http://localhost:8000
```
Admin panel: `http://localhost:8000/admin.html` — demo password is
`fieldstone2026` (set in `js/admin.js`, change it before sharing this
anywhere).

## Important limitation, read this
Products, orders, and the admin password all live in **your browser's
localStorage** — there's no real backend. That means:
- Changes an admin makes only apply to *that browser*. A visitor on
  their own laptop won't see products the admin added.
- The admin "login" is cosmetic (a password check in JavaScript
  anyone can read in the page source). It stops casual snooping, not
  a determined visitor.
- This is normal for a learning project or a prototype, and it's
  genuinely fine for showing the UI/UX end-to-end. For a real store
  taking real orders, you'd swap `js/data.js` for calls to a real
  backend (Firebase, Supabase, or your own API) — everything else
  (the HTML/CSS/the shape of the functions) carries over almost as-is.

---

# Publishing it with GitHub

## 1. Create the repository
1. Go to [github.com/new](https://github.com/new).
2. Name it (e.g. `fieldstone-goods`), leave it Public, don't
   initialize with a README (you already have one).
3. Click **Create repository**.

## 2. Push your code
From inside the `fieldstone-goods` folder on your computer:
```bash
git init
git add .
git commit -m "Initial commit: storefront + admin panel"
git branch -M main
git remote add origin https://github.com/<your-username>/fieldstone-goods.git
git push -u origin main
```
(If you don't have `git` installed, or aren't sure how to authenticate,
GitHub Desktop — desktop.github.com — does all of this with buttons
instead of commands.)

## 3. Go live with GitHub Pages (free, no server needed)
Because this site is plain HTML/CSS/JS, GitHub can host it directly:
1. In your repo, go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a
   branch**.
3. Under **Branch**, pick `main` and folder `/ (root)`, then **Save**.
4. Wait about a minute, refresh the page — GitHub will show your live
   URL, something like:
   `https://<your-username>.github.io/fieldstone-goods/`

That's it — the storefront and `/admin.html` are both now public URLs.
Every time you `git push` new changes to `main`, the live site updates
automatically within a minute or two.

## 4. Keep improving it
Your normal workflow going forward:
```bash
# make changes to files...
git add .
git commit -m "Describe what changed"
git push
```
GitHub Pages redeploys automatically on every push — no separate
"deploy" step.

## 5. If you outgrow static hosting
Once you want real shared data (one product list everyone sees, real
order storage, real auth), you'll need an actual backend. Common paths
that still deploy straight from this same GitHub repo:
- **Netlify** or **Vercel** — connect your GitHub repo, they auto-deploy
  on every push, and both support serverless functions if you want a
  lightweight API without managing a server.
- **Firebase** (Firestore + Auth) — swap `js/data.js`'s
  `localStorage` calls for Firestore reads/writes; the rest of the
  UI code barely changes.
- **Supabase** — Postgres + Auth + instant APIs, similar swap-in story.

Any of these still uses GitHub as the source of truth — you just
connect the hosting provider to your repo once, and it takes over
deploys from there.
