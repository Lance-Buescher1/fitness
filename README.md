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

Paths match the project plan:

- **CSV:** `iCloud Drive/Shortcuts/GymData/fitness.csv`
- **Photos:** `iCloud Drive/Shortcuts/GymData/Photos/` as `IMG_YYYYMMDD.jpg`

**CSV columns (header row required):**

`date,calories_burned,weight,workout_completed`

Example row: `2025-10-01,2450,185.5,true`

### SyncCalories (example name)

1. Read active energy / relevant HealthKit metrics for “today” (or your chosen window).
2. Append one line to `fitness.csv` with the columns above (`weight` can be blank if you only log it elsewhere).
3. Optional: add **Open URLs** at the end pointing at your deployed site so you return to the PWA to tap **Import CSV**.

### TakePhoto (example name)

1. Take photo with camera.
2. Save to `GymData/Photos/IMG_YYYYMMDD.jpg` (use current date in the filename).
3. Optional: **Open URLs** to the PWA, then use **Add photos** and pick the new file.

### Running shortcuts from the PWA

The dashboard buttons use `shortcuts://run-shortcut?name=…`. iOS will switch to the Shortcuts app; that is expected.

## Deploy (Vercel)

Connect the GitHub repo to Vercel and deploy the Next.js app. No database or API keys are required for the local-only data path.
