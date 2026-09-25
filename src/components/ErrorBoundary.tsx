import React, { Component, ErrorInfo, ReactNode } from 'react';
import { exportDatabase } from '../lib/db';
import { AlertCircle, RefreshCw, Download } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Niewychwycony błąd aplikacji:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleDownloadBackup = async () => {
    try {
      const json = await exportDatabase();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dziennik-pupila-awaryjna-kopia-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Nie udało się wyeksportować kopii: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-natural-sand flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl border border-natural-border p-6 shadow-xl space-y-4 text-center">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <div>
              <h1 className="text-lg font-serif font-bold text-natural-dark">
                Wystąpił nieoczekiwany problem
              </h1>
              <p className="text-xs text-natural-primary/75 mt-1 leading-relaxed">
                Przepraszamy, aplikacja napotkała błąd podczas wyświetlania widoku. Twoje dane w bazie są bezpieczne.
              </p>
            </div>
            {this.state.error && (
              <pre className="text-[11px] bg-natural-highlight/60 p-3 rounded-xl text-left overflow-x-auto text-red-900 border border-natural-border/70 font-mono">
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 bg-natural-secondary hover:bg-natural-olive text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <RefreshCw size={15} />
                <span>Odśwież aplikację</span>
              </button>
              <button
                type="button"
                onClick={this.handleDownloadBackup}
                className="w-full py-2.5 px-4 bg-natural-highlight hover:bg-natural-border text-natural-dark rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border border-natural-border"
              >
                <Download size={15} />
                <span>Pobierz kopię zapasową danych</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
