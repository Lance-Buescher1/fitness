# fitness

Private gym stats dashboard (Next.js on Vercel). CSV and photos stay on your device in the browser; nothing is uploaded to the server.

See [PLAN.md](./PLAN.md) for product goals and architecture.

## Develop

```bash
npm install
npm run dev
```

```bash
npm run test
npm run build
```

## Environment (optional)

Shortcut names default to `SyncCalories` and `TakePhoto`. Override with:

- `NEXT_PUBLIC_SHORTCUT_SYNC_CALORIES`
- `NEXT_PUBLIC_SHORTCUT_TAKE_PHOTO`

## iOS Shortcuts (you build in the Shortcuts app)

Paths match the project plan (iCloud or **On My iPhone** is fine—see [shortcuts.md](./shortcuts.md)):

- **Manual sheet:** `…/GymData/fitness.csv` — weight, workout flag, optional calories
- **HealthKit dump:** `…/GymData/health_stats.csv` — `date,calories_burned` (extra columns allowed for future stats)
- **Photos:** `…/GymData/Photos/` as `IMG_YYYYMMDD.jpg`

In the PWA, use **Import fitness.csv** and **Import health_stats.csv** separately (each merges into what is already in the browser), or **Replace all (1–2 CSVs)** for a full reload from disk. On desktop Chrome/Edge you can **Connect GymData folder** once so CSV/photo picks open inside that folder (`showOpenFilePicker` with `startIn`). iOS Safari cannot pre-select an iCloud folder; use the separate import buttons and pick each file from Files.

**`fitness.csv` header (required):** `date,calories_burned,weight,workout_completed`  
Example: `2025-10-01,,185.5,true` (empty calories is OK when you import with `health_stats.csv`).

**`health_stats.csv` header (minimum):** `date,calories_burned`  
Example: `2025-10-01,2450` — same-day duplicates use the **maximum** calories value.

### SyncCalories (example name)

1. Read active energy (or your chosen HealthKit metric) for “today” (or your chosen window).
2. Append one line to **`health_stats.csv`** (not `fitness.csv`) so Shortcuts never overwrite manual weight/workout.
3. Optional: **Open URLs** to your PWA, then **Import CSV** and select both CSVs (or only `health_stats.csv` if you have no manual rows yet).

### TakePhoto (example name)

1. Take photo with camera.
2. Save to `GymData/Photos/IMG_YYYYMMDD.jpg` (use current date in the filename).
3. Optional: **Open URLs** to the PWA, then use **Add photos** and pick the new file.

### Running shortcuts from the PWA

The dashboard buttons use `shortcuts://run-shortcut?name=…`. iOS will switch to the Shortcuts app; that is expected.

## Deploy (Vercel)

Connect the GitHub repo to Vercel and deploy the Next.js app. No database or API keys are required for the local-only data path.
