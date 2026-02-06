/**
 * ==================================================================
 * TAB ERROR BOUNDARY
 * ==================================================================
 * 
 * Catches errors in admin tabs without crashing the entire Admin UI.
 * User can still navigate to other tabs.
 * ==================================================================
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  tabName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class TabErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔴 TabErrorBoundary caught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-start gap-4 p-6 rounded-lg" style={{ 
              backgroundColor: '#FEE',
              border: '2px solid #f25f5c'
            }}>
              <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: '#f25f5c' }} />
              <div className="flex-1">
                <h3 className="text-xl mb-2" style={{ fontFamily: 'Fjalla One', color: '#3A3A3A' }}>
                  {this.props.tabName || 'This tab'} encountered an error
                </h3>
                <p className="mb-4 text-sm" style={{ color: '#666' }}>
                  Don't worry - other tabs still work. You can try reloading this tab.
                </p>
                
                {this.state.error && (
                  <div className="mb-4 p-4 rounded font-mono text-xs" style={{ 
                    backgroundColor: '#FFF',
                    border: '1px solid #DDD',
                    overflow: 'auto'
                  }}>
                    <strong>Error:</strong> {this.state.error.toString()}
                  </div>
                )}
                
                <button
                  onClick={this.handleReset}
                  className="px-6 py-3 rounded-lg text-white"
                  style={{ backgroundColor: '#247ba0' }}
                >
                  🔄 Try Again
                </button>
              </div>
            </div>
            
            {this.state.errorInfo && (
              <details className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#F5F5F0' }}>
                <summary className="cursor-pointer text-sm font-bold mb-2" style={{ color: '#666' }}>
                  Technical Details (for debugging)
                </summary>
                <pre className="text-xs overflow-auto p-4 rounded" style={{ 
                  backgroundColor: '#FFF',
                  border: '1px solid #DDD'
                }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
