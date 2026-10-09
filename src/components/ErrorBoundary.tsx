"use client";

import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="mx-auto max-w-2xl text-center py-12 px-4">
          <svg className="mx-auto h-12 w-12 text-[#ef4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="mt-4 text-lg font-semibold text-[#0f0f12] dark:text-white">Algo deu errado</h2>
          <p className="mt-2 text-[#4b5563] dark:text-[#d4d4d8]">
            Não foi possível carregar este componente. Tente recarregar a página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-[14px] bg-[#0f0f12] px-6 py-2.5 text-sm font-semibold text-white transition hover:scale-105 active:scale-95 dark:bg-white dark:text-[#0f0f12]"
          >
            Recarregar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Specialized error boundaries
export function MarkdownErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="mx-auto max-w-2xl py-8 px-4 text-center">
          <p className="text-[#ef4444]">Erro ao renderizar o conteúdo do post.</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-[#9333ea] underline">
            Tentar novamente
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export function TTSErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="rounded-xl border border-[#ef4444]/20 bg-[#fef2f2] p-4 dark:bg-[#7f1d1d]/20">
          <p className="text-[#ef4444] text-sm">Leitura narrada indisponível no momento.</p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export function CommentsErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="rounded-xl border border-[#e5e7eb] bg-[#f9f7fa] p-6 dark:border-[#2a2a30] dark:bg-[#17171c]">
          <p className="text-[#4b5563] dark:text-[#d4d4d8]">Comentários não puderam ser carregados.</p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export function PlayerErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#ef4444]/30 bg-[#fef2f2]/95 backdrop-blur-sm p-4 dark:bg-[#7f1d1d]/95">
          <div className="mx-auto max-w-6xl flex items-center justify-between">
            <p className="text-[#ef4444] text-sm">Player de podcast com erro. Recarregue a página.</p>
            <button onClick={() => window.location.reload()} className="text-xs text-[#ef4444] underline">Recarregar</button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}