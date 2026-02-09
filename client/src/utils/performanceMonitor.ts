export const perfMonitor = {
  logNavigationMetrics() {
    try {
      const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (entries.length > 0) {
        const nav = entries[0];
        console.table({
          'DNS Lookup': `${(nav.domainLookupEnd - nav.domainLookupStart).toFixed(1)}ms`,
          'TCP Connection': `${(nav.connectEnd - nav.connectStart).toFixed(1)}ms`,
          'Request → Response': `${(nav.responseEnd - nav.requestStart).toFixed(1)}ms`,
          'DOM Interactive': `${(nav.domInteractive - nav.startTime).toFixed(1)}ms`,
          'DOM Complete': `${(nav.domComplete - nav.startTime).toFixed(1)}ms`,
          'Load Event': `${(nav.loadEventEnd - nav.startTime).toFixed(1)}ms`,
        });
      }
    } catch (e) {
      console.warn('Navigation metrics not available:', e);
    }
  },

  logWebVitals() {
    try {
      const paintEntries = performance.getEntriesByType('paint');
      const result: Record<string, string> = {};

      paintEntries.forEach((entry) => {
        result[entry.name] = `${entry.startTime.toFixed(1)}ms`;
      });

      if (Object.keys(result).length > 0) {
        console.table(result);
      } else {
        console.log('No paint metrics available yet.');
      }
    } catch (e) {
      console.warn('Web Vitals not available:', e);
    }
  },
};
