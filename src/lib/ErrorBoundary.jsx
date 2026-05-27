import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: '#0c0c0e',
            color: '#e0e0e0',
            fontFamily: 'monospace',
            padding: 24,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '2px solid #ef4444', color: '#ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, marginBottom: 16,
            }}
          >
            !
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#ef4444', margin: '0 0 8px' }}>
            Erro Inesperado
          </h1>
          <p style={{ fontSize: 13, color: '#888', maxWidth: 400, lineHeight: 1.6, margin: '0 0 24px' }}>
            Ocorreu um erro ao renderizar esta página. Tente recarregar ou fazer login novamente.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#00ff9d', color: '#000', border: 'none',
                padding: '10px 24px', borderRadius: 4, fontSize: 13,
                fontWeight: 700, cursor: 'pointer',
              }}
            >
              Recarregar
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              style={{
                background: 'transparent', color: '#ef4444', border: '1px solid #ef4444',
                padding: '10px 24px', borderRadius: 4, fontSize: 13,
                fontWeight: 700, cursor: 'pointer',
              }}
            >
              Limpar Dados & Recarregar
            </button>
          </div>
          <details style={{ marginTop: 24, maxWidth: 500, textAlign: 'left' }}>
            <summary style={{ fontSize: 11, color: '#555', cursor: 'pointer' }}>
              Detalhes técnicos
            </summary>
            <pre style={{ fontSize: 10, color: '#444', marginTop: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {this.state.error?.message}
              {'\n'}
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
