import { BrowserRouter } from "react-router-dom";
import { useEffect } from "react";
import { AppRoutes } from "./routes";
import { Navbar } from "../components/layout/Navbar";
import { useAppStore } from "../state/store";
import { ErrorBoundary } from "./ErrorBoundary";

export default function App() {
  const theme = useAppStore((state) => state.theme);

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Navbar />
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
