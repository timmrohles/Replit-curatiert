import { useState, useEffect } from 'react';
import { TrendingUp, Search, Tag, Users, Activity, Download, Trash2, Calendar, BarChart3, Zap } from 'lucide-react';
import { 
  getAnalyticsSummary, 
  getTrendingTags, 
  getDailyActivity,
  clearAnalytics,
  exportAnalytics 
} from '../../utils/tagAnalytics';

/**
 * Tag Analytics Dashboard
 * 
 * Shows:
 * - Top clicked tags
 * - Top search queries
 * - Top tag combinations
 * - Trending tags
 * - Usage statistics
 */
export function TagAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);
  const [summary, setSummary] = useState<ReturnType<typeof getAnalyticsSummary> | null>(null);
  const [trending, setTrending] = useState<ReturnType<typeof getTrendingTags>>([]);
  const [dailyActivity, setDailyActivity] = useState<ReturnType<typeof getDailyActivity>>([]);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = () => {
    setSummary(getAnalyticsSummary(timeRange));
    setTrending(getTrendingTags(7, 14));
    setDailyActivity(getDailyActivity(timeRange));
  };

  const handleExport = () => {
    const data = exportAnalytics();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tag-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('Wirklich alle Analytics-Daten löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      clearAnalytics();
      loadAnalytics();
    }
  };

  if (!summary) {
    return (
      <div className="p-8 text-center">
        <p style={{ color: '#3A3A3A' }}>Lädt Analytics...</p>
      </div>
    );
  }

  const maxDailyClicks = Math.max(...dailyActivity.map(d => d.clicks), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 
            style={{ 
              fontFamily: 'Fjalla One', 
              fontSize: '2rem', 
              color: '#3A3A3A',
              marginBottom: '0.5rem'
            }}
          >
            📊 Tag Analytics Dashboard
          </h2>
          <p style={{ color: '#666666' }}>
            Einblicke in Tag-Nutzung und User-Verhalten
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:shadow-md"
            style={{ backgroundColor: '#70c1b3', color: '#FFFFFF', fontWeight: 600 }}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:shadow-md"
            style={{ backgroundColor: '#f25f5c', color: '#FFFFFF', fontWeight: 600 }}
          >
            <Trash2 className="w-4 h-4" />
            Löschen
          </button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {[7, 30, 90].map((days) => (
          <button
            key={days}
            onClick={() => setTimeRange(days as any)}
            className="px-4 py-2 rounded-lg transition-all"
            style={{
              backgroundColor: timeRange === days ? '#247ba0' : 'rgba(255, 255, 255, 0.95)',
              color: timeRange === days ? '#FFFFFF' : '#3A3A3A',
              border: `2px solid ${timeRange === days ? '#247ba0' : 'rgba(0, 0, 0, 0.1)'}`,
              fontWeight: timeRange === days ? 600 : 400
            }}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            {days === 7 ? 'Letzte 7 Tage' : days === 30 ? 'Letzte 30 Tage' : 'Letzte 90 Tage'}
          </button>
        ))}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div 
          className="p-6 rounded-lg"
          style={{ backgroundColor: 'rgba(112, 193, 179, 0.1)', border: '2px solid rgba(112, 193, 179, 0.3)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-5 h-5" style={{ color: '#70c1b3' }} />
            <span style={{ color: '#666666', fontSize: '0.875rem' }}>Tag Klicks</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontFamily: 'Fjalla One', color: '#70c1b3' }}>
            {summary.totalClicks.toLocaleString('de-DE')}
          </div>
        </div>

        <div 
          className="p-6 rounded-lg"
          style={{ backgroundColor: 'rgba(242, 95, 92, 0.1)', border: '2px solid rgba(242, 95, 92, 0.3)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-5 h-5" style={{ color: '#f25f5c' }} />
            <span style={{ color: '#666666', fontSize: '0.875rem' }}>Suchen</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontFamily: 'Fjalla One', color: '#f25f5c' }}>
            {summary.totalSearches.toLocaleString('de-DE')}
          </div>
        </div>

        <div 
          className="p-6 rounded-lg"
          style={{ backgroundColor: 'rgba(255, 224, 102, 0.1)', border: '2px solid rgba(255, 224, 102, 0.3)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5" style={{ color: '#ffe066' }} />
            <span style={{ color: '#666666', fontSize: '0.875rem' }}>Kombinationen</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontFamily: 'Fjalla One', color: '#ffe066' }}>
            {summary.totalCombinations.toLocaleString('de-DE')}
          </div>
        </div>

        <div 
          className="p-6 rounded-lg"
          style={{ backgroundColor: 'rgba(36, 123, 160, 0.1)', border: '2px solid rgba(36, 123, 160, 0.3)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5" style={{ color: '#247ba0' }} />
            <span style={{ color: '#666666', fontSize: '0.875rem' }}>Unique Tags</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontFamily: 'Fjalla One', color: '#247ba0' }}>
            {summary.uniqueTags.toLocaleString('de-DE')}
          </div>
        </div>
      </div>

      {/* Daily Activity Chart */}
      <div 
        className="p-6 rounded-lg"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '2px solid rgba(0, 0, 0, 0.1)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5" style={{ color: '#247ba0' }} />
          <h3 style={{ fontFamily: 'Fjalla One', fontSize: '1.25rem', color: '#3A3A3A' }}>
            Tägliche Aktivität
          </h3>
        </div>
        
        <div className="space-y-2">
          {dailyActivity.slice().reverse().slice(0, 14).map((day) => {
            const barWidth = (day.clicks / maxDailyClicks) * 100;
            const date = new Date(day.date);
            const dateLabel = date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
            
            return (
              <div key={day.date} className="flex items-center gap-3">
                <div style={{ width: '70px', fontSize: '0.875rem', color: '#666' }}>
                  {dateLabel}
                </div>
                <div className="flex-1 relative h-8 rounded overflow-hidden" style={{ backgroundColor: '#f5f5f5' }}>
                  <div 
                    className="absolute left-0 top-0 h-full transition-all rounded"
                    style={{ 
                      width: `${barWidth}%`, 
                      backgroundColor: '#70c1b3',
                      minWidth: day.clicks > 0 ? '2px' : '0'
                    }}
                  />
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-3 text-sm">
                    <span style={{ color: day.clicks > 0 ? '#FFFFFF' : '#666', fontWeight: 600 }}>
                      {day.clicks} Klicks
                    </span>
                    {day.searches > 0 && (
                      <span style={{ color: day.clicks > 0 ? '#FFFFFF' : '#666' }}>
                        • {day.searches} Suchen
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Tags */}
        <div 
          className="p-6 rounded-lg"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '2px solid rgba(0, 0, 0, 0.1)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-5 h-5" style={{ color: '#70c1b3' }} />
            <h3 style={{ fontFamily: 'Fjalla One', fontSize: '1.25rem', color: '#3A3A3A' }}>
              Top Tags ({summary.topTags.length})
            </h3>
          </div>
          
          <div className="space-y-2">
            {summary.topTags.slice(0, 10).map((tag, index) => (
              <div 
                key={tag.tagId}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ backgroundColor: index < 3 ? 'rgba(112, 193, 179, 0.1)' : '#f9f9f9' }}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ 
                    backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#E5E7EB',
                    color: index < 3 ? '#FFFFFF' : '#666',
                    fontWeight: 600,
                    fontSize: '0.875rem'
                  }}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontWeight: 600, color: '#3A3A3A', fontSize: '0.95rem' }}>
                    {tag.tagName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>
                    {tag.tagType}
                  </div>
                </div>
                <div 
                  className="px-3 py-1 rounded-full text-sm"
                  style={{ backgroundColor: '#70c1b3', color: '#FFFFFF', fontWeight: 600 }}
                >
                  {tag.clicks}
                </div>
              </div>
            ))}
          </div>
          
          {summary.topTags.length === 0 && (
            <div className="text-center py-8" style={{ color: '#999' }}>
              Noch keine Tag-Klicks erfasst
            </div>
          )}
        </div>

        {/* Trending Tags */}
        <div 
          className="p-6 rounded-lg"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '2px solid rgba(0, 0, 0, 0.1)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5" style={{ color: '#ffe066' }} />
            <h3 style={{ fontFamily: 'Fjalla One', fontSize: '1.25rem', color: '#3A3A3A' }}>
              🔥 Trending Tags
            </h3>
          </div>
          
          <div className="space-y-2">
            {trending.slice(0, 10).map((tag, index) => (
              <div 
                key={tag.tagId}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ backgroundColor: '#f9f9f9' }}
              >
                <TrendingUp 
                  className="w-5 h-5 flex-shrink-0" 
                  style={{ color: tag.growthRate > 0 ? '#4CAF50' : '#f25f5c' }} 
                />
                <div className="flex-1 min-w-0">
                  <div style={{ fontWeight: 600, color: '#3A3A3A', fontSize: '0.95rem' }}>
                    {tag.tagName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>
                    {tag.recentClicks} Klicks (vorher: {tag.previousClicks})
                  </div>
                </div>
                <div 
                  className="px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  style={{ 
                    backgroundColor: tag.growthRate > 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(242, 95, 92, 0.1)',
                    color: tag.growthRate > 0 ? '#4CAF50' : '#f25f5c',
                    fontWeight: 600
                  }}
                >
                  {tag.growthRate > 0 ? '+' : ''}{Math.round(tag.growthRate)}%
                </div>
              </div>
            ))}
          </div>
          
          {trending.length === 0 && (
            <div className="text-center py-8" style={{ color: '#999' }}>
              Nicht genügend Daten für Trends
            </div>
          )}
        </div>
      </div>

      {/* Top Search Queries */}
      <div 
        className="p-6 rounded-lg"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '2px solid rgba(0, 0, 0, 0.1)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5" style={{ color: '#f25f5c' }} />
          <h3 style={{ fontFamily: 'Fjalla One', fontSize: '1.25rem', color: '#3A3A3A' }}>
            Top Suchbegriffe ({summary.topSearches.length})
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {summary.topSearches.slice(0, 15).map((search, index) => (
            <div 
              key={search.query}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ backgroundColor: '#f9f9f9' }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span 
                  className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-xs"
                  style={{ backgroundColor: '#f25f5c', color: '#FFFFFF', fontWeight: 600 }}
                >
                  {index + 1}
                </span>
                <span 
                  style={{ 
                    color: '#3A3A3A', 
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  "{search.query}"
                </span>
              </div>
              <span 
                className="px-2 py-1 rounded-full text-xs flex-shrink-0 ml-2"
                style={{ backgroundColor: '#f25f5c', color: '#FFFFFF', fontWeight: 600 }}
              >
                {search.count}×
              </span>
            </div>
          ))}
        </div>
        
        {summary.topSearches.length === 0 && (
          <div className="text-center py-8" style={{ color: '#999' }}>
            Noch keine Suchen erfasst
          </div>
        )}
      </div>

      {/* Top Tag Combinations */}
      <div 
        className="p-6 rounded-lg"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '2px solid rgba(0, 0, 0, 0.1)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5" style={{ color: '#ffe066' }} />
          <h3 style={{ fontFamily: 'Fjalla One', fontSize: '1.25rem', color: '#3A3A3A' }}>
            Top Tag-Kombinationen ({summary.topCombinations.length})
          </h3>
        </div>
        
        <div className="space-y-3">
          {summary.topCombinations.slice(0, 10).map((combo, index) => (
            <div 
              key={combo.tagIds.join(',')}
              className="flex items-start gap-3 p-4 rounded-lg"
              style={{ backgroundColor: '#f9f9f9' }}
            >
              <div 
                className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#ffe066', color: '#3A3A3A', fontWeight: 600 }}
              >
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2 mb-2">
                  {combo.tagNames.map((name, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1 rounded-full text-sm"
                      style={{ backgroundColor: '#70c1b3', color: '#FFFFFF', fontWeight: 500 }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>
                  {combo.tagIds.length} Tags kombiniert
                </div>
              </div>
              <div 
                className="px-4 py-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: '#ffe066', color: '#3A3A3A', fontWeight: 600 }}
              >
                {combo.uses}× verwendet
              </div>
            </div>
          ))}
        </div>
        
        {summary.topCombinations.length === 0 && (
          <div className="text-center py-8" style={{ color: '#999' }}>
            Noch keine Kombinationen erfasst
          </div>
        )}
      </div>

      {/* Context & Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Click Context */}
        <div 
          className="p-6 rounded-lg"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '2px solid rgba(0, 0, 0, 0.1)' }}
        >
          <h3 style={{ fontFamily: 'Fjalla One', fontSize: '1.25rem', color: '#3A3A3A', marginBottom: '1rem' }}>
            Klick-Kontext
          </h3>
          
          <div className="space-y-2">
            {summary.contextDistribution.map((ctx) => {
              const contextLabels = {
                filter: '🔍 Filter-Auswahl',
                search: '🔎 Suche',
                badge: '🏷️ Tag-Badge',
                'similar-books': '📚 Ähnliche Bücher'
              };
              
              return (
                <div key={ctx.context}>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: '0.875rem', color: '#666' }}>
                      {contextLabels[ctx.context]}
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#3A3A3A', fontWeight: 600 }}>
                      {ctx.count} ({Math.round(ctx.percentage)}%)
                    </span>
                  </div>
                  <div className="h-2 rounded overflow-hidden" style={{ backgroundColor: '#f5f5f5' }}>
                    <div 
                      className="h-full rounded transition-all"
                      style={{ width: `${ctx.percentage}%`, backgroundColor: '#247ba0' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tag Type Distribution */}
        <div 
          className="p-6 rounded-lg"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '2px solid rgba(0, 0, 0, 0.1)' }}
        >
          <h3 style={{ fontFamily: 'Fjalla One', fontSize: '1.25rem', color: '#3A3A3A', marginBottom: '1rem' }}>
            Tag-Typen Verteilung
          </h3>
          
          <div className="space-y-2">
            {summary.typeDistribution.slice(0, 8).map((type) => (
              <div key={type.type}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: '0.875rem', color: '#666' }}>
                    {type.type}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: '#3A3A3A', fontWeight: 600 }}>
                    {type.count} ({Math.round(type.percentage)}%)
                  </span>
                </div>
                <div className="h-2 rounded overflow-hidden" style={{ backgroundColor: '#f5f5f5' }}>
                  <div 
                    className="h-full rounded transition-all"
                    style={{ width: `${type.percentage}%`, backgroundColor: '#70c1b3' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
