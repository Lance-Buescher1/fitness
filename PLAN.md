# Private Gym Stats Dashboard: Project Plan

A secure, "serverless" web application to track fitness statistics and progress photos locally on an iPhone, avoiding subscription costs and privacy concerns.

---

## 1. Core Philosophy

### Privacy First
Data stays on the iPhone. No cloud databases, no external servers.

### Data Ownership
Uses standard formats (`.csv`, `.jpg`) so data is accessible even without the app.

### Zero Cost
Hosted on Vercel (Free), using Apple Shortcuts (Free) and HealthKit (Free).

### Stateless Frontend
The app is a "lens" that views local data but never stores it on the internet.

---

## 2. Technical Architecture

### Tech Stack

- **Framework:** Next.js (React)
- **Hosting:** Vercel
- **Local Storage:** IndexedDB (for persistent browser-side state)
- **File Storage:** iOS Files App (via CSV and folders)
- **Styling:** Tailwind CSS (for the "GitHub" dark mode aesthetic)
- **Charts:** Recharts.js

### Data Bridge (Apple Shortcuts)

Since web browsers cannot directly access Apple Health or the Files System silently, we use Apple Shortcuts as a "courier":

#### Calorie Courier
Fetches HealthKit data and appends it to the CSV in the Files App.

#### Photo Courier
Snaps a camera photo and saves it directly to a specific "Gym" folder in the Files App.

---

## 3. Data & Storage Structure

### CSV Format

**Manual (`fitness.csv`)** — `iCloud Drive/Shortcuts/GymData/fitness.csv`  
Same folder may include **`health_stats.csv`**: HealthKit append-only rows (`date,calories_burned` plus optional future columns). The app merges on import; calories from HealthKit override manual calories for that date when both exist.

```csv
date,calories_burned,weight,workout_completed
2025-10-01,,185.5,true
2025-10-02,2100,185.2,false
```

**`health_stats.csv` (example):**

```csv
date,calories_burned
2025-10-01,2450
```

### Photo Folders

**Originals (Shortcuts / camera):**  
`iCloud Drive/Shortcuts/GymData/Photos/`  
Files named `IMG_YYYYMMDD.jpg` when possible.

**Framed (app output, durable):**  
`iCloud Drive/Shortcuts/GymData/PhotosFramed/`  
Cropped JPEGs written when you frame in the dashboard. Clearing the in-browser photo cache does not delete these files. Use **Load framed photos** to repopulate the viewer without re-framing.

**Accessed via:**  
File System Access API when connected on desktop Chromium; file picker on iPhone.

---

## 4. Key Features

### A. The "GitHub" Consistency Heatmap

#### Visual
A 53-week grid of squares.

#### Logic
Color intensity based on `calories_burned` or a boolean `workout_completed`.

#### Implementation
Custom CSS Grid mapping over a 365-day array generated from the CSV data.

---

### B. Statistical Correlation

#### Weight Graph
Line chart showing weight fluctuations.

#### Calorie Overlay
Bar or Area chart behind the weight line showing activity levels.

#### Insights
Automated text analysis:

> "Your 7-day weight average is trending down as calorie burn stays above 2k."

---

### C. Photo Vault Viewer

#### Privacy
Images are not in the Photos App gallery (stored in Files).

#### Viewer
App reads the local folder and displays images in a "Scrollable Timeline" to see physical changes alongside the data points.

---

## 5. Security Protocols

### Sandboxed Execution
The browser runs the JS locally. No POST requests are ever made to external APIs.

### Manual Data Sync
To update the app, the user taps "Sync" which triggers a local file read from the Files app into the browser's IndexedDB.

### No Internet Access for Photos
Images are converted to ObjectURLs in the browser memory for display; they are never uploaded to Vercel.

---

## 6. Integration: The "Shortcut" Trigger

The app will trigger iPhone actions using URL Schemes:

```javascript
// Function to run a shortcut from the UI
const runGymShortcut = (name) => {
  // name = "SyncCalories" or "TakePhoto"
  window.location.href = `shortcuts://run-shortcut?name=${encodeURIComponent(name)}`;
};
```

---

## 7. Development Roadmap

### Phase 1: Local Foundation

- Initialize Next.js project
- Build CSV Parser and IndexedDB storage logic

### Phase 2: The Shortcuts

- Create the "Sync Calories" shortcut in iOS
- Create the "Save Progress Photo" shortcut in iOS

### Phase 3: Visuals

- Build the GitHub-style Heatmap component
- Setup Recharts for Weight vs. Time

### Phase 4: Gallery

- Implement the local file folder viewer
- Add Correlation Insights text generator

---

## 8. Maintenance

### Backups
The master data is the `fitness.csv` in your Files app. Simply copy that file to any computer to keep a permanent backup.

### Deployment
Push to GitHub, and Vercel will automatically update the "App" on your home screen.