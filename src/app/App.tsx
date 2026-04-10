import { BrowserRouter } from "react-router-dom";
import { useEffect } from "react";
import { AppRoutes } from "./routes";
import { Navbar } from "../components/layout/Navbar";
import { useAppStore } from "../state/store";
import { ErrorBoundary } from "./ErrorBoundary";
import { loadRemoteState } from "../storage/remoteState";
import { setRemoteSyncEnabled } from "../storage/localStorage";

export default function App() {
  const theme = useAppStore((state) => state.theme);
  const hydrateData = useAppStore((state) => state.hydrateData);

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    let active = true;

    const sync = async () => {
      const remote = await loadRemoteState();
      if (!active) return;
      if (remote) {
        hydrateData(remote);
      }
      setRemoteSyncEnabled(true);
    };

    void sync();
    return () => {
      active = false;
    };
  }, [hydrateData]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Navbar />
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
