export async function runAllTests() {
  console.log('Running performance tests...\n');

  const start = performance.now();

  const domNodes = document.querySelectorAll('*').length;
  console.log(`DOM Nodes: ${domNodes}`);

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const totalTransferred = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
  console.log(`Resources loaded: ${resources.length}`);
  console.log(`Total transferred: ${(totalTransferred / 1024).toFixed(1)} KB`);

  const slowResources = resources
    .filter((r) => r.duration > 500)
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 5);

  if (slowResources.length > 0) {
    console.log('\nSlowest resources:');
    console.table(
      slowResources.map((r) => ({
        name: r.name.split('/').pop(),
        duration: `${r.duration.toFixed(1)}ms`,
        size: `${((r.transferSize || 0) / 1024).toFixed(1)} KB`,
      }))
    );
  }

  const elapsed = performance.now() - start;
  console.log(`\nTests completed in ${elapsed.toFixed(1)}ms`);
}
