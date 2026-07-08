# Pinhaoshe — Cosplay Photography Site

A self-hosted, bilingual (简体中文 / English) photography portfolio and photoshoot
booking site, designed to run on a Synology NAS via Container Manager.

## Features

- **Photo gallery** grouped by event/album: bulk upload, reordering, per-language
  captions, cover selection, publish/unpublish. Thumbnails are pre-generated at
  upload time with `sharp`; **all EXIF (including GPS) is stripped** from every
  displayed image. Optionally scrub the stored originals too.
- **Booking system**: create bookable events with configurable time slots
  (length, count, capacity). Each event gets an unguessable shareable link — no
  visitor account needed. Double-booking is prevented with transactional
  capacity checks. Visitors get a private link to view/cancel their booking.
- **Bilingual everywhere**: locale-prefixed URLs (`/zh/...`, `/en/...`),
  language switcher, and per-language content fields for events, descriptions
  and captions (with fallback to the other language when one is empty).
- **Single admin account**, seeded from environment variables on first login.
  Session cookie auth, bcrypt-hashed password, rate-limited login.
- Modest resource use: one container, SQLite, no runtime image optimizer.

## Stack

Next.js 15 (App Router, TypeScript) · SQLite + Prisma · sharp · Tailwind CSS 4
· next-intl · iron-session

---

## Deploying on a Synology NAS (DSM 7.2+, Container Manager)

Tested target: DS920+ (x86-64). Everything below happens in DSM.

### 1. Copy the project to the NAS

1. In **File Station**, create a folder for the app, e.g.
   `docker/pinhaoshe` (i.e. `/volume1/docker/pinhaoshe`).
2. Upload the entire project folder there (everything in this repo —
   `node_modules`, `.next` and `data` are **not** needed; they are ignored by
   the Docker build).

### 2. Create your `.env`

1. Copy `.env.example` to `.env` in the same folder.
2. Edit it (File Station → right-click → *Open with Text Editor*):

| Variable | What to set |
|---|---|
| `DATABASE_URL` | Leave as-is (`file:/data/db/app.db?connection_limit=1`) |
| `PHOTOS_DIR` | Leave as-is (`/data/photos`) |
| `ADMIN_USERNAME` | Your admin login name |
| `ADMIN_PASSWORD` | A long, unique password (stored only as a hash) |
| `SESSION_SECRET` | 32+ random characters — see below |
| `APP_BASE_URL` | Your public HTTPS address, e.g. `https://photos.example.com` (used to build shareable booking links) |
| `STRIP_ORIGINAL_EXIF` | `false` keeps originals untouched on disk; `true` re-encodes uploads so even the stored original has no EXIF/GPS |
| `UPLOAD_MAX_MB` | Max size per uploaded photo (default 100) |

To generate a good `SESSION_SECRET`, SSH into the NAS (or use any terminal)
and run: `openssl rand -base64 32`

> The admin credentials are written into the database on the **first login
> attempt**. After that, changing `ADMIN_PASSWORD` in `.env` has no effect —
> the DB copy wins. (To reset: stop the container, delete `data/db/app.db`,
> update `.env`, start again — this wipes events/bookings, so only do it on a
> fresh install.)

### 3. Build and start with Container Manager

1. Open **Container Manager** → **Project** → **Create**.
2. Project name: `pinhaoshe`. Path: the folder from step 1
   (`/volume1/docker/pinhaoshe`). It will detect `docker-compose.yml`.
3. Click through and **Build**. The first build downloads images and compiles
   the app — expect **5–15 minutes** on a DS920+. Later rebuilds are faster.
4. When the project is running, the app listens on **port 3000**. The
   `data/photos` and `data/db` folders (already present next to the compose
   file from the repo) are your persistent volumes; the container itself is
   disposable.

**If the build fails or the NAS struggles** (low RAM): build the image on a PC
with Docker instead:

```
docker build --platform linux/amd64 -t pinhaoshe:latest .
docker save pinhaoshe:latest -o pinhaoshe.tar
```

Upload `pinhaoshe.tar` via Container Manager → **Image** → **Add → From file**,
then in `docker-compose.yml` replace `build: .` with `image: pinhaoshe:latest`
and create the project as above.

### 4. First run

1. Visit `http://<NAS-IP>:3000/zh/admin/login` (or `/en/admin/login`).
2. Log in with `ADMIN_USERNAME` / `ADMIN_PASSWORD` — this first login creates
   the admin account.
3. Create a gallery event, upload photos, publish. Create a booking event, add
   time slots, and share its public link.

### 5. HTTPS via DSM reverse proxy

DSM handles the domain, certificate and HTTPS; the app just needs to know its
public URL (`APP_BASE_URL`).

1. **Control Panel → Login Portal → Advanced → Reverse Proxy → Create**:
   - Source: HTTPS, your hostname (e.g. `photos.example.com`), port 443
   - Destination: HTTP, `localhost`, port 3000
2. Make sure the hostname has a valid certificate
   (**Control Panel → Security → Certificate**).
3. Set `APP_BASE_URL` in `.env` to `https://photos.example.com`, then in
   Container Manager select the project → **Action → Build/Recreate** so the
   new value is picked up.

### 6. Backups (do this!)

Everything that matters lives in two folders next to the compose file:

- `data/photos` — originals + generated web sizes
- `data/db` — the SQLite database (events, captions, bookings)

Use **Hyper Backup** to back both up on a schedule (nightly is plenty). The
database is a single file; a backup taken while someone is actively uploading
or booking could in theory catch it mid-write, so prefer a backup time when
the site is quiet (e.g. 4 am), or stop the project first for a guaranteed
consistent copy. Restoring = putting both folders back and starting the
project.

### 7. Updating the app

Replace the project files (keep `.env` and `data/`!), then Container Manager →
project → **Action → Build/Recreate**. Database migrations run automatically
at container startup.

---

## Local development

Requirements: Node.js 22+.

```
npm install
npx prisma migrate dev   # creates ./data/db/app.db
npm run dev              # http://localhost:3000
```

Dev credentials live in `.env` (already set to `admin` / `dev-password-123`).

## Adding email confirmations later

The booking flow already calls `notifyBookingCreated()` /
`notifyBookingCancelled()` in [src/lib/notify.ts](src/lib/notify.ts) with
everything an email needs (visitor contact, event, slot times, and the
visitor's manage/cancel link). To enable email: `npm install nodemailer`,
implement those two functions with SMTP credentials from new `SMTP_*` env
vars, and rebuild. Nothing else has to change.

## Notes & limits

- Uploads: JPEG, PNG, WebP (HEIC is not supported — export/convert first).
- Unpublished gallery events are fully hidden (404) for non-admins, and their
  images are blocked too. Original files are only ever served to the admin.
- Slot times are stored and shown exactly as typed (no timezone conversion),
  which is the sane behaviour when photographer and clients are in the same
  city.
- Rate limits: 10 login attempts / 15 min, 8 bookings / hour per IP
  (in-memory; resets when the container restarts).
