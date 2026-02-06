/**
 * Tag Analytics System
 * 
 * Tracks user interactions with tags:
 * - Tag clicks (filter selection)
 * - Tag searches
 * - Tag combinations used
 * - Tag views on book cards
 */

export interface TagClickEvent {
  tagId: string;
  tagName: string;
  tagType: string;
  timestamp: string;
  context: 'filter' | 'search' | 'badge' | 'similar-books';
}

export interface TagSearchEvent {
  searchQuery: string;
  matchedTags: string[];
  resultCount: number;
  timestamp: string;
}

export interface TagCombinationEvent {
  tagIds: string[];
  tagNames: string[];
  bookCount: number;
  timestamp: string;
  source: 'manual' | 'saved-combo';
}

export interface TagAnalytics {
  clicks: TagClickEvent[];
  searches: TagSearchEvent[];
  combinations: TagCombinationEvent[];
}

const STORAGE_KEY = 'coratiert_tag_analytics';
const MAX_EVENTS = 10000; // Limit storage size

/**
 * Get all analytics data
 */
export function getAnalytics(): TagAnalytics {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return { clicks: [], searches: [], combinations: [] };
    }
    return JSON.parse(data) as TagAnalytics;
  } catch (error) {
    console.error('Error loading analytics:', error);
    return { clicks: [], searches: [], combinations: [] };
  }
}

/**
 * Save analytics data
 */
function saveAnalytics(analytics: TagAnalytics): void {
  try {
    // Trim old events if too many
    if (analytics.clicks.length > MAX_EVENTS) {
      analytics.clicks = analytics.clicks.slice(-MAX_EVENTS);
    }
    if (analytics.searches.length > MAX_EVENTS) {
      analytics.searches = analytics.searches.slice(-MAX_EVENTS);
    }
    if (analytics.combinations.length > MAX_EVENTS) {
      analytics.combinations = analytics.combinations.slice(-MAX_EVENTS);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(analytics));
  } catch (error) {
    console.error('Error saving analytics:', error);
  }
}

/**
 * Track tag click
 */
export function trackTagClick(
  tagId: string,
  tagName: string,
  tagType: string,
  context: TagClickEvent['context'] = 'filter'
): void {
  const analytics = getAnalytics();
  
  analytics.clicks.push({
    tagId,
    tagName,
    tagType,
    timestamp: new Date().toISOString(),
    context
  });
  
  saveAnalytics(analytics);
}

/**
 * Track tag search
 */
export function trackTagSearch(
  searchQuery: string,
  matchedTags: string[],
  resultCount: number
): void {
  if (!searchQuery.trim()) return;
  
  const analytics = getAnalytics();
  
  analytics.searches.push({
    searchQuery: searchQuery.toLowerCase().trim(),
    matchedTags,
    resultCount,
    timestamp: new Date().toISOString()
  });
  
  saveAnalytics(analytics);
}

/**
 * Track tag combination usage
 */
export function trackTagCombination(
  tagIds: string[],
  tagNames: string[],
  bookCount: number,
  source: TagCombinationEvent['source'] = 'manual'
): void {
  if (tagIds.length === 0) return;
  
  const analytics = getAnalytics();
  
  analytics.combinations.push({
    tagIds: [...tagIds].sort(), // Sort for consistency
    tagNames,
    bookCount,
    timestamp: new Date().toISOString(),
    source
  });
  
  saveAnalytics(analytics);
}

/**
 * Get analytics summary for a time period
 */
export function getAnalyticsSummary(daysBack: number = 30) {
  const analytics = getAnalytics();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  const cutoffTime = cutoffDate.getTime();
  
  // Filter events within time period
  const recentClicks = analytics.clicks.filter(
    e => new Date(e.timestamp).getTime() >= cutoffTime
  );
  const recentSearches = analytics.searches.filter(
    e => new Date(e.timestamp).getTime() >= cutoffTime
  );
  const recentCombinations = analytics.combinations.filter(
    e => new Date(e.timestamp).getTime() >= cutoffTime
  );
  
  // Top clicked tags
  const tagClickCounts = new Map<string, { count: number; name: string; type: string }>();
  recentClicks.forEach(click => {
    const existing = tagClickCounts.get(click.tagId);
    if (existing) {
      existing.count++;
    } else {
      tagClickCounts.set(click.tagId, {
        count: 1,
        name: click.tagName,
        type: click.tagType
      });
    }
  });
  
  const topTags = Array.from(tagClickCounts.entries())
    .map(([tagId, data]) => ({
      tagId,
      tagName: data.name,
      tagType: data.type,
      clicks: data.count
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 20);
  
  // Top search queries
  const searchCounts = new Map<string, number>();
  recentSearches.forEach(search => {
    const count = searchCounts.get(search.searchQuery) || 0;
    searchCounts.set(search.searchQuery, count + 1);
  });
  
  const topSearches = Array.from(searchCounts.entries())
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
  
  // Top tag combinations
  const comboKey = (tagIds: string[]) => tagIds.sort().join(',');
  const comboCounts = new Map<string, { count: number; tagIds: string[]; tagNames: string[] }>();
  
  recentCombinations.forEach(combo => {
    const key = comboKey(combo.tagIds);
    const existing = comboCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      comboCounts.set(key, {
        count: 1,
        tagIds: combo.tagIds,
        tagNames: combo.tagNames
      });
    }
  });
  
  const topCombinations = Array.from(comboCounts.entries())
    .map(([_, data]) => ({
      tagIds: data.tagIds,
      tagNames: data.tagNames,
      uses: data.count
    }))
    .filter(c => c.tagIds.length > 1) // Only multi-tag combos
    .sort((a, b) => b.uses - a.uses)
    .slice(0, 15);
  
  // Click context distribution
  const contextCounts = new Map<TagClickEvent['context'], number>();
  recentClicks.forEach(click => {
    const count = contextCounts.get(click.context) || 0;
    contextCounts.set(click.context, count + 1);
  });
  
  // Tag type distribution
  const typeCounts = new Map<string, number>();
  recentClicks.forEach(click => {
    const count = typeCounts.get(click.tagType) || 0;
    typeCounts.set(click.tagType, count + 1);
  });
  
  return {
    period: {
      daysBack,
      startDate: cutoffDate.toISOString(),
      endDate: new Date().toISOString()
    },
    totalClicks: recentClicks.length,
    totalSearches: recentSearches.length,
    totalCombinations: recentCombinations.length,
    uniqueTags: tagClickCounts.size,
    topTags,
    topSearches,
    topCombinations,
    contextDistribution: Array.from(contextCounts.entries()).map(([context, count]) => ({
      context,
      count,
      percentage: (count / recentClicks.length) * 100
    })),
    typeDistribution: Array.from(typeCounts.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: (count / recentClicks.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
  };
}

/**
 * Get trending tags (tags with increasing usage)
 */
export function getTrendingTags(recentDays: number = 7, compareDays: number = 14): Array<{
  tagId: string;
  tagName: string;
  tagType: string;
  recentClicks: number;
  previousClicks: number;
  growthRate: number;
}> {
  const analytics = getAnalytics();
  
  const now = new Date();
  const recentCutoff = new Date(now.getTime() - recentDays * 24 * 60 * 60 * 1000);
  const previousCutoff = new Date(now.getTime() - (recentDays + compareDays) * 24 * 60 * 60 * 1000);
  
  // Count recent clicks
  const recentCounts = new Map<string, { name: string; type: string; count: number }>();
  analytics.clicks
    .filter(c => new Date(c.timestamp) >= recentCutoff)
    .forEach(click => {
      const existing = recentCounts.get(click.tagId);
      if (existing) {
        existing.count++;
      } else {
        recentCounts.set(click.tagId, {
          name: click.tagName,
          type: click.tagType,
          count: 1
        });
      }
    });
  
  // Count previous clicks
  const previousCounts = new Map<string, number>();
  analytics.clicks
    .filter(c => {
      const date = new Date(c.timestamp);
      return date >= previousCutoff && date < recentCutoff;
    })
    .forEach(click => {
      const count = previousCounts.get(click.tagId) || 0;
      previousCounts.set(click.tagId, count + 1);
    });
  
  // Calculate growth
  const trending = Array.from(recentCounts.entries())
    .map(([tagId, data]) => {
      const recentClicks = data.count;
      const previousClicks = previousCounts.get(tagId) || 0;
      const growthRate = previousClicks === 0 
        ? (recentClicks > 0 ? 100 : 0)
        : ((recentClicks - previousClicks) / previousClicks) * 100;
      
      return {
        tagId,
        tagName: data.name,
        tagType: data.type,
        recentClicks,
        previousClicks,
        growthRate
      };
    })
    .filter(t => t.recentClicks >= 3) // Minimum threshold
    .sort((a, b) => b.growthRate - a.growthRate)
    .slice(0, 10);
  
  return trending;
}

/**
 * Clear all analytics data
 */
export function clearAnalytics(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing analytics:', error);
  }
}

/**
 * Export analytics as JSON
 */
export function exportAnalytics(): string {
  const analytics = getAnalytics();
  return JSON.stringify(analytics, null, 2);
}

/**
 * Get daily activity (for charts)
 */
export function getDailyActivity(daysBack: number = 30): Array<{
  date: string;
  clicks: number;
  searches: number;
  combinations: number;
}> {
  const analytics = getAnalytics();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  
  const dailyData = new Map<string, { clicks: number; searches: number; combinations: number }>();
  
  // Initialize all dates
  for (let i = 0; i < daysBack; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    dailyData.set(dateKey, { clicks: 0, searches: 0, combinations: 0 });
  }
  
  // Count clicks by day
  analytics.clicks
    .filter(e => new Date(e.timestamp) >= cutoffDate)
    .forEach(click => {
      const dateKey = click.timestamp.split('T')[0];
      const data = dailyData.get(dateKey);
      if (data) data.clicks++;
    });
  
  // Count searches by day
  analytics.searches
    .filter(e => new Date(e.timestamp) >= cutoffDate)
    .forEach(search => {
      const dateKey = search.timestamp.split('T')[0];
      const data = dailyData.get(dateKey);
      if (data) data.searches++;
    });
  
  // Count combinations by day
  analytics.combinations
    .filter(e => new Date(e.timestamp) >= cutoffDate)
    .forEach(combo => {
      const dateKey = combo.timestamp.split('T')[0];
      const data = dailyData.get(dateKey);
      if (data) data.combinations++;
    });
  
  return Array.from(dailyData.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
