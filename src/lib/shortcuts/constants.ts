export const SHORTCUT_SYNC_CALORIES =
  process.env.NEXT_PUBLIC_SHORTCUT_SYNC_CALORIES ?? "SyncCalories";

export const SHORTCUT_TAKE_PHOTO =
  process.env.NEXT_PUBLIC_SHORTCUT_TAKE_PHOTO ?? "TakePhoto";

export function shortcutRunUrl(name: string): string {
  return `shortcuts://run-shortcut?name=${encodeURIComponent(name)}`;
}
