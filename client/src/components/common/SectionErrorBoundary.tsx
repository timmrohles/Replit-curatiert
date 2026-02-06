import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  sectionName: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Section-Level Error Boundary
 * 
 * Isoliert Fehler auf Section-Ebene, damit nicht die gesamte App abstürzt
 * Zeigt einen kompakten Fehler-UI anstelle der fehlerhaften Section
 */
export class SectionErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[SectionErrorBoundary] Error in section "${this.props.sectionName}":`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Kompakter Fehler-UI für Sections
      return (
        <div className="py-8 px-4 bg-surface-elevated">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white border-2 border-red-200 rounded-lg p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
                <svg 
                  className="w-6 h-6 text-red-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
              </div>
              
              <h3 
                className="text-lg mb-2"
                style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}
              >
                Fehler in {this.props.sectionName}
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                Diese Section konnte nicht geladen werden. Die restliche Seite funktioniert weiterhin.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left mt-4">
                  <summary className="cursor-pointer text-xs text-red-600 hover:text-red-700">
                    Fehlerdetails (Development)
                  </summary>
                  <pre className="mt-2 bg-gray-100 p-3 rounded text-xs overflow-auto">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
