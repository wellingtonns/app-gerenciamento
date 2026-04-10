import { AppData, PersistedState } from "../types";
import { STORAGE_KEY, STORAGE_VERSION, migratePersistedState } from "./migrations";
import { saveRemoteState } from "./remoteState";

let debounceTimer: number | null = null;
let remoteSyncEnabled = false;

export function setRemoteSyncEnabled(enabled: boolean): void {
  remoteSyncEnabled = enabled;
}

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
      if (remoteSyncEnabled) {
        void saveRemoteState(data);
      }
    } catch {
      // Ignore persistence failures (quota/private mode) and keep app functional.
    }
  }, 300);
}
