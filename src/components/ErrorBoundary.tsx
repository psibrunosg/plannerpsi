import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  handleReset = () => {
    // Clear all localStorage data and reload
    localStorage.removeItem('planner-tasks-storage')
    localStorage.removeItem('planner-procedures-storage')
    localStorage.removeItem('planner-planning-storage')
    localStorage.removeItem('planner-focus-storage')
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0f',
          color: '#fff',
          fontFamily: 'Inter, sans-serif',
          padding: '2rem',
        }}>
          <div style={{ maxWidth: '480px', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Algo deu errado</h1>
            <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Ocorreu um erro inesperado. Você pode tentar limpar os dados salvos para resolver.
            </p>
            <pre style={{
              background: '#1a1a2e',
              padding: '1rem',
              borderRadius: '0.5rem',
              fontSize: '0.75rem',
              color: '#f87171',
              textAlign: 'left',
              overflow: 'auto',
              marginBottom: '1.5rem',
              maxHeight: '120px',
            }}>
              {this.state.error?.message}
            </pre>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #333',
                  background: 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Recarregar
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: '#6366f1',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                Limpar dados e recarregar
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
