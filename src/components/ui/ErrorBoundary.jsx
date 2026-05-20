import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-surface">
        <div className="card p-8 max-w-lg w-full text-center flex flex-col items-center gap-5">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#FEE2E2' }}>
            <span className="material-symbols-rounded text-[44px]" style={{ color: '#DC2626', fontVariationSettings: "'FILL' 1" }}>
              error
            </span>
          </div>
          <div>
            <h2 className="text-headline-lg font-bold text-on-surface mb-2">
              Algo salió mal
            </h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Ocurrió un error inesperado. Por favor, recarga la página o contacta soporte si el problema persiste.
            </p>
          </div>
          {this.state.error && (
            <pre className="w-full text-left text-[11px] text-on-surface-variant bg-surface-container rounded-xl p-3 overflow-x-auto max-h-32">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            <span className="material-symbols-rounded text-[20px]">refresh</span>
            Recargar página
          </button>
        </div>
      </div>
    )
  }
}
