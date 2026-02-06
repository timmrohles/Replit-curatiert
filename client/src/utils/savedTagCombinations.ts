/**
 * Saved Tag Combinations Manager
 * 
 * Allows users to save and load their favorite tag filter combinations
 * Uses localStorage for persistence
 */

export interface SavedTagCombination {
  id: string;
  name: string;
  tagIds: string[];
  createdAt: string;
  lastUsed?: string;
}

const STORAGE_KEY = 'coratiert_saved_tag_combinations';

/**
 * Get all saved tag combinations
 */
export function getSavedCombinations(): SavedTagCombination[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const combinations = JSON.parse(data) as SavedTagCombination[];
    return combinations.sort((a, b) => 
      new Date(b.lastUsed || b.createdAt).getTime() - new Date(a.lastUsed || a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error loading saved tag combinations:', error);
    return [];
  }
}

/**
 * Save a new tag combination
 */
export function saveTagCombination(name: string, tagIds: string[]): SavedTagCombination {
  const combinations = getSavedCombinations();
  
  // Check if combination already exists (same tags)
  const existing = combinations.find(combo => 
    combo.tagIds.length === tagIds.length &&
    combo.tagIds.every(id => tagIds.includes(id))
  );
  
  if (existing) {
    // Update existing
    existing.name = name;
    existing.lastUsed = new Date().toISOString();
    updateCombinations(combinations);
    return existing;
  }
  
  // Create new
  const newCombination: SavedTagCombination = {
    id: `combo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name,
    tagIds,
    createdAt: new Date().toISOString(),
    lastUsed: new Date().toISOString()
  };
  
  combinations.push(newCombination);
  updateCombinations(combinations);
  
  return newCombination;
}

/**
 * Delete a saved combination
 */
export function deleteSavedCombination(id: string): void {
  const combinations = getSavedCombinations();
  const filtered = combinations.filter(combo => combo.id !== id);
  updateCombinations(filtered);
}

/**
 * Mark combination as used (updates lastUsed timestamp)
 */
export function markCombinationAsUsed(id: string): void {
  const combinations = getSavedCombinations();
  const combo = combinations.find(c => c.id === id);
  
  if (combo) {
    combo.lastUsed = new Date().toISOString();
    updateCombinations(combinations);
  }
}

/**
 * Update combinations in localStorage
 */
function updateCombinations(combinations: SavedTagCombination[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(combinations));
  } catch (error) {
    console.error('Error saving tag combinations:', error);
  }
}

/**
 * Clear all saved combinations
 */
export function clearAllCombinations(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing tag combinations:', error);
  }
}

/**
 * Export combinations as JSON (for backup)
 */
export function exportCombinations(): string {
  const combinations = getSavedCombinations();
  return JSON.stringify(combinations, null, 2);
}

/**
 * Import combinations from JSON
 */
export function importCombinations(jsonData: string): boolean {
  try {
    const combinations = JSON.parse(jsonData) as SavedTagCombination[];
    
    // Validate structure
    if (!Array.isArray(combinations)) {
      throw new Error('Invalid data format');
    }
    
    // Merge with existing
    const existing = getSavedCombinations();
    const merged = [...existing];
    
    combinations.forEach(imported => {
      const exists = existing.find(e => e.id === imported.id);
      if (!exists) {
        merged.push(imported);
      }
    });
    
    updateCombinations(merged);
    return true;
  } catch (error) {
    console.error('Error importing tag combinations:', error);
    return false;
  }
}
