// Local, per-browser analytics preferences persisted in IndexedDB.
// Currently stores the user's revenue targets for the Target Tracker. These are
// local user preferences only — they are never sent to the backend.

const DB_NAME = "rebuzz-analytics";
const DB_VERSION = 1;
const STORE = "preferences";
const TARGETS_KEY = "revenueTargets";

export interface AnalyticsTargets {
  dailyTarget: number;
  weeklyTarget: number;
  monthlyTarget: number;
}

export const DEFAULT_TARGETS: AnalyticsTargets = {
  dailyTarget: 0,
  weeklyTarget: 0,
  monthlyTarget: 0,
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Read the saved targets, falling back to zeros when nothing is stored. */
export async function getStoredTargets(): Promise<AnalyticsTargets> {
  try {
    const db = await openDB();
    return await new Promise<AnalyticsTargets>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(TARGETS_KEY);
      req.onsuccess = () => {
        const value = req.result as Partial<AnalyticsTargets> | undefined;
        resolve({ ...DEFAULT_TARGETS, ...(value ?? {}) });
      };
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    // IndexedDB unavailable (e.g. SSR or private mode) — use defaults.
    return DEFAULT_TARGETS;
  }
}

/** Persist the full set of targets. */
export async function saveStoredTargets(
  targets: AnalyticsTargets,
): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(targets, TARGETS_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Swallow — persistence is best-effort; state still updates in memory.
  }
}
