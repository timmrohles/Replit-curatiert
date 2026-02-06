/**
 * Quick performance check - run this in console
 */
export async function quickPerf() {
  const { perfMonitor } = await import('./performanceMonitor');
  const { runAllTests } = await import('./performanceTest');
  
  console.log('🚀 Running quick performance check...\n');
  perfMonitor.logNavigationMetrics();
  perfMonitor.logWebVitals();
  
  console.log('\n💡 Run full tests with: import("./utils/performance").then(m => m.runAllTests())');
}

// Make quickPerf available globally in development
const isDev = typeof import.meta !== 'undefined' && 
              import.meta.env && 
              import.meta.env.DEV;

if (isDev && typeof window !== 'undefined') {
  (window as any).quickPerf = quickPerf;
  console.log('💡 Performance utilities loaded. Type quickPerf() in console to run tests.');
}
