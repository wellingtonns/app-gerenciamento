import { Component, ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: ""
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message
    };
  }

  componentDidCatch(error: Error): void {
    // Keep for diagnostics in browser console.
    console.error("App runtime error:", error);
  }

  resetApp = () => {
    try {
      window.localStorage.removeItem("app-gerenciamento:v1");
      window.localStorage.removeItem("app-gerenciamento:v2");
      window.localStorage.removeItem("app-gerenciamento-kanban-v1");
      window.localStorage.removeItem("app-gerenciamento-columns-v1");
      window.localStorage.removeItem("app-gerenciamento-assignees-v1");
      window.localStorage.removeItem("app-gerenciamento-theme-v1");
    } catch {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        <h1>Erro ao carregar a aplicacao</h1>
        <p>O app encontrou um erro de runtime e foi interrompido.</p>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            background: "#0f172a",
            color: "#e2e8f0",
            borderRadius: 8,
            padding: 12
          }}
        >
          {this.state.message || "Erro desconhecido"}
        </pre>
        <button
          type="button"
          onClick={this.resetApp}
          style={{
            marginTop: 12,
            border: "none",
            background: "#0284c7",
            color: "#fff",
            borderRadius: 8,
            padding: "10px 14px",
            cursor: "pointer"
          }}
        >
          Limpar dados locais e recarregar
        </button>
      </main>
    );
  }
}
