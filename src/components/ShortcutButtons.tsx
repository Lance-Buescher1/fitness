"use client";

import { SHORTCUT_SYNC_CALORIES, SHORTCUT_TAKE_PHOTO, shortcutRunUrl } from "@/lib/shortcuts/constants";

function runShortcut(name: string) {
  window.location.assign(shortcutRunUrl(name));
}

export function ShortcutButtons() {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
        onClick={() => runShortcut(SHORTCUT_SYNC_CALORIES)}
      >
        Run “{SHORTCUT_SYNC_CALORIES}”
      </button>
      <button
        type="button"
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
        onClick={() => runShortcut(SHORTCUT_TAKE_PHOTO)}
      >
        Run “{SHORTCUT_TAKE_PHOTO}”
      </button>
    </div>
  );
}
