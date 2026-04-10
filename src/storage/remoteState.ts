import { AppData } from "../types";
import { migratePersistedState } from "./migrations";

type RemotePayload = {
  data?: unknown;
};

export async function loadRemoteState(): Promise<AppData | null> {
  try {
    const response = await fetch("/api/state", { method: "GET" });
    if (!response.ok) return null;
    const payload = (await response.json()) as RemotePayload;
    if (!payload?.data) return null;
    const migrated = migratePersistedState({ version: Number.MAX_SAFE_INTEGER, data: payload.data as AppData });
    return migrated.data;
  } catch {
    console.error("[sync] Falha ao carregar estado remoto.");
    return null;
  }
}

export async function saveRemoteState(data: AppData): Promise<void> {
  try {
    const response = await fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data })
    });
    if (!response.ok) {
      const payload = await response.text();
      console.error("[sync] Falha ao salvar estado remoto:", response.status, payload);
    }
  } catch {
    console.error("[sync] Falha de rede ao salvar estado remoto.");
  }
}
