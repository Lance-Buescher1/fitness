"use client";

import { useMemo, useState } from "react";
import { formatIsoDate } from "@/lib/dates/formatIsoDate";

type Props = {
  folderConnected: boolean;
  fsPickSupported: boolean;
  onExportFitnessCsv?: () => Promise<{ ok: boolean }>;
  onLogWorkout: (date: string, caloriesBurned?: number | null) => Promise<void>;
  onLogRestDay: (date: string) => Promise<void>;
  onLogWeight: (date: string, weight: number) => Promise<void>;
};

function todayIsoLocal(): string {
  return formatIsoDate(new Date());
}

export function DailyLogPanel({
  folderConnected,
  fsPickSupported,
  onExportFitnessCsv,
  onLogWorkout,
  onLogRestDay,
  onLogWeight,
}: Props) {
  const [date, setDate] = useState(todayIsoLocal);
  const [weightInput, setWeightInput] = useState("");
  const [caloriesInput, setCaloriesInput] = useState("");
  const [pending, setPending] = useState(false);
  const [localMsg, setLocalMsg] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const caloriesOptional = useMemo(() => {
    const t = caloriesInput.trim();
    if (t === "") return undefined;
    const n = Number(t);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  }, [caloriesInput]);

  const run = async (fn: () => Promise<void>) => {
    setPending(true);
    setLocalMsg(null);
    try {
      await fn();
      if (folderConnected) {
        setLocalMsg("Saved.");
      } else if (!fsPickSupported && onExportFitnessCsv) {
        setLocalMsg("Saved in this browser. Export fitness.csv in Data sync to update your Files copy.");
      } else {
        setLocalMsg("Saved.");
      }
    } catch (e) {
      setLocalMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setPending(false);
    }
  };

  const runExport = async () => {
    if (!onExportFitnessCsv) return;
    setExporting(true);
    try {
      const result = await onExportFitnessCsv();
      if (result.ok) {
        setLocalMsg(`Exported fitness.csv at ${new Date().toLocaleTimeString()}.`);
      }
    } catch (e) {
      setLocalMsg(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
      <h2 className="text-sm font-semibold text-zinc-100">Log today</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Updates this browser immediately
        {folderConnected ? (
          <>
            {" "}
            and writes <code className="text-zinc-400">fitness.csv</code> to your connected GymData
            folder.
          </>
        ) : (
          "."
        )}
        {!fsPickSupported ? (
          <span className="block pt-1 text-amber-200/90">
            On iPhone (Safari or Chrome), use <strong>Data sync → Import</strong> for CSVs and photos.
            After logging, <strong>Export fitness.csv</strong> to refresh the file in Files.
          </span>
        ) : !folderConnected ? (
          <span className="block pt-1 text-amber-200/90">
            Connect a GymData folder in Data sync (desktop Chrome/Edge) to auto-write{" "}
            <code className="text-zinc-400">fitness.csv</code>, or export manually after logging.
          </span>
        ) : null}
      </p>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex min-w-[10rem] flex-col gap-1 text-xs text-zinc-400">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-zinc-100"
          />
        </label>

        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex min-w-[6rem] flex-col gap-1 text-xs text-zinc-400">
            Weight
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              placeholder="lbs"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-zinc-100 sm:w-28"
            />
          </label>
          <button
            type="button"
            disabled={pending || weightInput.trim() === ""}
            className="min-h-11 rounded-lg bg-zinc-100 px-3 py-2.5 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-40"
            onClick={() =>
              void run(async () => {
                const w = Number(weightInput);
                if (!Number.isFinite(w) || w <= 0) {
                  setLocalMsg("Enter a positive weight.");
                  return;
                }
                await onLogWeight(date, w);
              })
            }
          >
            Save weight
          </button>
        </div>
      </div>

      <div className="mt-4 border-t border-zinc-800 pt-4">
        <p className="mb-2 text-xs font-medium text-zinc-400">Workout</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex min-w-[8rem] flex-col gap-1 text-xs text-zinc-400">
            Calories burned (optional)
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="kcal"
              value={caloriesInput}
              onChange={(e) => setCaloriesInput(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-zinc-100 sm:w-32"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              className="min-h-11 rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
              onClick={() =>
                void run(async () => {
                  await onLogWorkout(date, caloriesOptional);
                })
              }
            >
              Log workout
            </button>
            <button
              type="button"
              disabled={pending}
              className="min-h-11 rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"
              onClick={() => void run(async () => onLogRestDay(date))}
            >
              Log rest day
            </button>
          </div>
        </div>
      </div>

      {!fsPickSupported && onExportFitnessCsv ? (
        <div className="mt-3 border-t border-zinc-800 pt-3">
          <button
            type="button"
            disabled={exporting || pending}
            className="min-h-11 w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2.5 text-sm font-medium text-zinc-100 hover:bg-zinc-800 disabled:opacity-40 sm:w-auto"
            onClick={() => void runExport()}
          >
            {exporting ? "Exporting…" : "Export fitness.csv"}
          </button>
        </div>
      ) : null}

      {localMsg ? <p className="mt-2 text-xs text-zinc-400">{localMsg}</p> : null}
    </section>
  );
}
