# Rithvik &amp; Shivani — Wedding Website

A single, self-contained wedding website (`index.html`) with an RSVP form that
saves responses to a [Supabase](https://supabase.com) database. No build step,
no framework — just one HTML file with the images and fonts embedded.

- **Invitation / Sangeet / Ceremonies / Wedding** — each invitation page shown as an image
- **RSVP** — name, number of guests, accommodation needed → saved to Supabase

---

## 1. Set up the database (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste in the contents of
   [`supabase_setup.sql`](./supabase_setup.sql), and run it. This creates the
   `rsvps` table and a security policy that lets the website *add* responses but
   never *read* them — so your guest list stays private.
3. Open **Project Settings → API** and copy:
   - **Project URL**
   - **anon / public** key

## 2. Connect the site

In `index.html`, find these two lines (near the bottom, inside `<script>`) and
replace the placeholders with the values from step 1:

```js
const SUPABASE_URL='https://YOUR-PROJECT.supabase.co';
const SUPABASE_ANON_KEY='YOUR-ANON-PUBLIC-KEY';
```

As soon as both are filled in, the site writes real RSVPs to Supabase. (The anon
key is meant to be public — the database policy is what protects you, so be sure
you ran the SQL.)

## 3. Deploy (Vercel)

**Option A — GitHub + Vercel (recommended):**
push this repo to GitHub (see below), then at [vercel.com](https://vercel.com)
choose **Add New → Project**, import the repo, and deploy. No settings needed —
a single `index.html` at the root is served as-is. You get a free
`your-site.vercel.app` URL, and can add a custom domain later.

**Option B — drag &amp; drop / CLI:**
`npm i -g vercel`, then run `vercel` inside this folder and follow the prompts.

## Push this repo to GitHub

This folder is already a git repository with an initial commit. Create an empty
repo on GitHub (no README), then:

```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git branch -M main
git push -u origin main
```

## Viewing responses

You and Shivani view RSVPs in the Supabase dashboard under
**Table editor → rsvps** (sortable, and exportable to CSV). The "view responses"
link on the site points you there, since the public page can't read the list.
