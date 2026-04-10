import { AppData, PersistedState } from "../types";
import { STORAGE_KEY, STORAGE_VERSION, migratePersistedState } from "./migrations";

let debounceTimer: number | null = null;

export function loadState(): AppData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return migratePersistedState(null).data;
    }

    const parsed = JSON.parse(raw) as PersistedState;
    return migratePersistedState(parsed).data;
  } catch {
    return migratePersistedState(null).data;
  }
}

export function saveState(data: AppData): void {
  if (debounceTimer) {
    window.clearTimeout(debounceTimer);
  }

  debounceTimer = window.setTimeout(() => {
    try {
      const payload: PersistedState = {
        version: STORAGE_VERSION,
        data
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore persistence failures (quota/private mode) and keep app functional.
    }
  }, 300);
}
