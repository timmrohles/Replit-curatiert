import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div 
          className="min-h-screen flex items-center justify-center"
          style={{ background: 'linear-gradient(to right, #e4afcb 0%, #b8cbb8 0%, #b8cbb8 0%, #e2c58b 30%, #c2ce9c 64%, #7edbdc 100%)' }}
        >
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 md:p-12 max-w-2xl mx-4 border border-white/40">
            <div className="text-center">
              <div className="mb-6">
                <svg 
                  className="w-20 h-20 mx-auto" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="#f25f5c"
                  strokeWidth={1.5}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" 
                  />
                </svg>
              </div>
              
              <h1 
                className="text-3xl md:text-4xl mb-4" 
                style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}
              >
                Ups, etwas ist schiefgelaufen
              </h1>
              
              <p 
                className="text-lg mb-8"
                style={{ color: '#666666' }}
              >
                Wir haben einen unerwarteten Fehler festgestellt. 
                Bitte laden Sie die Seite neu oder kehren Sie zur Startseite zurück.
              </p>

              {/* Show error details in development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-8 text-left">
                  <summary 
                    className="cursor-pointer text-sm mb-2 hover:opacity-70"
                    style={{ color: '#f25f5c', fontFamily: 'Fjalla One' }}
                  >
                    Fehlerdetails (nur in Development sichtbar)
                  </summary>
                  <pre 
                    className="bg-gray-100 p-4 rounded-lg overflow-auto text-xs"
                    style={{ color: '#3A3A3A' }}
                  >
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={this.handleReload}
                  className="px-6 py-3 rounded-lg transition-all hover:bg-teal font-['Fjalla_One'] bg-blue text-white"
                >
                  Seite neu laden
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="px-6 py-3 rounded-lg border-2 transition-all hover:bg-blue hover:text-white font-['Fjalla_One'] border-blue text-blue"
                >
                  Zur Startseite
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}