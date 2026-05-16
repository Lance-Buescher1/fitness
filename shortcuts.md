# iOS Shortcuts for this project

The fitness dashboard cannot read HealthKit or write to arbitrary folders in iCloud by itself. You bridge that gap with two **personal automations** in Apple’s **Shortcuts** app. The in-app buttons open URLs like `shortcuts://run-shortcut?name=SyncCalories`, which hand off to Shortcuts; that jump out of Safari (or your PWA) is normal.

This doc matches what the Next.js app expects: see `src/lib/shortcuts/constants.ts` and `src/lib/fitness/` (especially `resolveFitnessCsvImport.ts`).

---

## 1. One-time file setup (Files)

Use **iCloud Drive** or **On My iPhone**—the app only cares what you pick in the import dialog; Shortcuts must read/write the **same folder** you use when importing.

Create this layout (example under **Shortcuts → GymData**):

| Path | Purpose |
|------|---------|
| `…/GymData/fitness.csv` | **You** edit: weight, workout, optional calories (Shortcuts do not append here) |
| `…/GymData/health_stats.csv` | **SyncCalories** appends: HealthKit calories (and future numeric columns) |
| `…/GymData/Photos/` | **TakePhoto** saves progress images (originals) |
| `…/GymData/PhotosFramed/` | Cropped JPEGs from **Frame** in the dashboard; **Export framed photos** (Share → Save to Files on iPhone) or automatic write when GymData is connected on desktop; **Load framed photos** after clearing cache |

**Create `fitness.csv` once** with only this header (lowercase names):

```csv
date,calories_burned,weight,workout_completed
```

**Create `health_stats.csv` once** with only this header:

```csv
date,calories_burned
```

After that, **SyncCalories** only appends lines to **`health_stats.csv`**. Do not remove or rewrite either header row.

---

## 2. Shortcut names must match the app

Default names the UI uses:

| Role | Default shortcut name |
|------|------------------------|
| Log calories (CSV row) | `SyncCalories` |
| Save a progress photo | `TakePhoto` |

If you rename a shortcut in Shortcuts, **use the same string** in your deploy env (or the button will run the wrong shortcut):

- `NEXT_PUBLIC_SHORTCUT_SYNC_CALORIES`
- `NEXT_PUBLIC_SHORTCUT_TAKE_PHOTO`

The URL scheme is: `shortcuts://run-shortcut?name=<URL-encoded name>`.

---

## 3. CSV formats (what goes in each file)

### 3a. `health_stats.csv` (what **SyncCalories** appends)

Minimum columns: `date`, `calories_burned`. You may add more columns later (e.g. `steps`); the app ignores unknown columns until support is added in code.

| Column | Rule |
|--------|------|
| `date` | `YYYY-MM-DD` only |
| `calories_burned` | Non-negative number |

Example line to append (no header in the appended line—only data):

```csv
2026-05-11,2450
```

If you append **multiple lines for the same date** (e.g. morning and evening sync), the app uses the **maximum** `calories_burned` for that date on import.

### 3b. `fitness.csv` (manual / human edits)

Same four-column header. You normally add or edit rows here for **weight** and **workout_completed**. **`calories_burned` may be empty** between commas when you import together with `health_stats.csv`; calories for that date then come from HealthKit.

Example row:

```csv
2026-05-11,,185.5,true
```

| Column | Rule |
|--------|------|
| `date` | `YYYY-MM-DD` |
| `calories_burned` | Optional if `health_stats.csv` has that date; otherwise required (non-negative number) |
| `weight` | Positive number, or empty |
| `workout_completed` | true for `true`, `1`, `yes`, `y` (any case); else false |

**Import in the PWA:** use **Import CSV (1–2 files)** and select `fitness.csv` and `health_stats.csv` together (order does not matter). For a given date, **HealthKit calories override** manual calories when both are present.

---

## 4. Shortcut A — `SyncCalories`

**Goal:** Build today’s `YYYY-MM-DD`, read **Active Energy** (or your preferred burn metric) for “today,” then **append** one line to **`health_stats.csv`** only.

Apple changes action labels between iOS versions; use **Search actions** in the shortcut editor if a name below does not match yours.

### 4a. Create the shortcut

1. Open **Shortcuts** → **+** → **Add Action**.
2. Tap the shortcut title at the top and set the name to **`SyncCalories`** (exactly, unless you changed the env var).

### 4b. Build the date string

1. Add **Current Date**.
2. Add **Format Date** (or “Adjust Date” + format, depending on your iOS).
   - Set the format to **ISO 8601** *or* a **custom** format that yields `yyyy-MM-dd` (e.g. `2026-05-11`).
3. Optionally **Set Variable** → name it `csvDate` so the rest of the shortcut stays readable.

### 4c. Get today’s calorie burn from Health

1. Add an action that **finds or queries Health samples** (search the library for **Health**).
   - Sample type: **Active Energy** (or the metric you want to treat as “calories burned”).
   - Restrict the time range to **today** (start of day through now, or full calendar day—pick what matches how you log).
2. Turn the list of samples into **one number** (total kcal for the range). Typical patterns:
   - If you see **Statistics of Health Samples** / similar: use **Sum** (or energy total) for that filtered set; **or**
   - **Repeat with Each** sample → **Get Details of Health Sample** (calories / value) → maintain a **number variable** (start at `0`, add each value in a **Calculate** action).
3. **Set Variable** → e.g. `calories` (integer is fine).

If Health actions are confusing, you can temporarily use **Ask for Input** (Number) for `calories` until the Health steps behave the way you want.

Weight and workout belong in **`fitness.csv`** (edit in Files or a future separate shortcut)—**not** in this HealthKit append file.

### 4d. Compose the CSV line

1. Add **Text** with **two fields only**: date and calories, separated by a comma:

   `{csvDate},{calories}`

2. Optional: end with a newline.

### 4e. Append to the file

1. Add **Append to File** (search “append”; if missing, try **Save File** with append where offered).
2. **File:** pick **`health_stats.csv`** in your **GymData** folder (same place as `fitness.csv`).
3. **Input:** the **Text** from step 4d.
4. When iOS prompts, grant **Files** access for that location.

### 4f. Optional: return to the PWA

1. Add **Open URLs**.
2. URL: your deployed site (same URL you added to the Home Screen as the PWA), e.g. `https://your-app.vercel.app/`.

### 4g. Health permission

The first run should ask for **Health** access. Allow read for the sample types you use (Active Energy).

---

## 5. Shortcut B — `TakePhoto`

**Goal:** Capture one photo and save it under **`GymData/Photos/`** with filename **`IMG_YYYYMMDD.jpg`** (date only, no dashes—matches `PLAN.md` / `README.md`).

### 5a. Create the shortcut

1. **+** → **Add Action**.
2. Name the shortcut **`TakePhoto`** (or your overridden env name).

### 5b. Filename `IMG_YYYYMMDD.jpg`

1. Add **Current Date**.
2. Add **Format Date** with a **custom format** that produces **only** `yyyyMMdd` (example result: `20260511`).
3. Add **Text**: `IMG_` + formatted date + `.jpg` (e.g. `IMG_20260511.jpg`).
4. **Set Variable** → e.g. `photoName`.

### 5c. Camera

1. Add **Take Photo** (front/back as you prefer).
2. Allow **Camera** when prompted.

### 5d. Save into iCloud Files

1. Add **Save File** (or **Save Photo** that targets Files—wording varies).
2. Save the photo to **iCloud Drive → Shortcuts → GymData → Photos**.
3. Set the **filename** to the variable `photoName` so the file is exactly `IMG_YYYYMMDD.jpg`.

If the action only offers a folder, pick **Photos** under **GymData** and set the name explicitly so it does not become a random UUID name.

### 5e. Optional: Open URLs

Same as §4f—open your PWA so you can use **Add photos** / import in the dashboard.

---

## 6. Wire-up checklist

- [ ] `GymData/fitness.csv` exists with the manual header row (you can add rows by hand or another workflow).
- [ ] `GymData/health_stats.csv` exists with `date,calories_burned` header; **SyncCalories** appends here.
- [ ] `GymData/Photos/` exists.
- [ ] Shortcut names match defaults **`SyncCalories`** and **`TakePhoto`**, or you set `NEXT_PUBLIC_SHORTCUT_*` on Vercel and redeploy.
- [ ] Test each shortcut from the **Shortcuts** app (▶️) before testing from the PWA.
- [ ] From the PWA, tap **Run “SyncCalories”** / **Run “TakePhoto”**; iOS should switch to Shortcuts, run, then you can return via Safari / Open URLs.
- [ ] In the PWA, use **Import health_stats.csv** after each Shortcut sync (it merges into the app without needing an updated `fitness.csv` on disk). Use **Import fitness.csv** when you change weight or workout flags. On desktop browsers that support it, **Connect GymData folder** first so picks start in that folder.

---

## 7. Troubleshooting

| Issue | What to check |
|-------|----------------|
| PWA opens Shortcuts but “shortcut not found” | Name typo; spaces/special characters must match the URL-encoded name. |
| CSV import fails in the app | Manual file must use the four-column header; `health_stats` must include `date,calories_burned` and **must not** include `workout_completed`. Dates `YYYY-MM-DD`; each date needs calories from stats and/or manual. |
| Photos not showing after import | Filename pattern `IMG_YYYYMMDD.jpg`; files actually under the folder you grant in the file picker. |
| Append overwrites or breaks CSV | Use **Append to File**, not **Save File** that replaces the whole document, unless you intentionally rewrite the file. |

---

## 8. Related project files

- Shortcut names and URL: `src/lib/shortcuts/constants.ts`
- Import resolution (one vs two files): `src/lib/fitness/resolveFitnessCsvImport.ts`
- Manual CSV (optional calories): `src/lib/fitness/parseManualFitnessCsv.ts`, `src/lib/fitness/manualNormalizeRow.ts`
- Health stats CSV: `src/lib/fitness/parseHealthStatsCsv.ts`, `src/lib/fitness/detectCsvKind.ts`
- Merge rules: `src/lib/fitness/mergeFitnessSources.ts`
- Legacy strict single file: `src/lib/fitness/parseCsv.ts`, `src/lib/fitness/normalizeRow.ts`, `src/lib/fitness/parseBoolean.ts`
- UI buttons: `src/components/ShortcutButtons.tsx`
