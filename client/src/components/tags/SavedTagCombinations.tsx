import { useState, useEffect } from 'react';
import { Save, Trash2, Star, Clock, ChevronDown } from 'lucide-react';
import { getSavedCombinations, saveTagCombination, deleteSavedCombination, markCombinationAsUsed, SavedTagCombination } from '../../utils/savedTagCombinations';
import { ONIXTag } from '../../utils/api';
import { motion, AnimatePresence } from 'motion/react';

interface SavedTagCombinationsProps {
  selectedTags: string[];
  allTags: ONIXTag[];
  onLoadCombination: (tagIds: string[]) => void;
}

/**
 * Saved Tag Combinations Component
 * 
 * Allows users to:
 * - Save current tag selection as a named combination
 * - Load previously saved combinations
 * - Delete saved combinations
 * - See recently used combinations
 */
export function SavedTagCombinations({ selectedTags, allTags, onLoadCombination }: SavedTagCombinationsProps) {
  const [combinations, setCombinations] = useState<SavedTagCombination[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [comboName, setComboName] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Load combinations on mount
  useEffect(() => {
    refreshCombinations();
  }, []);

  const refreshCombinations = () => {
    setCombinations(getSavedCombinations());
  };

  const handleSave = () => {
    if (!comboName.trim()) return;
    
    saveTagCombination(comboName.trim(), selectedTags);
    setComboName('');
    setShowSaveDialog(false);
    refreshCombinations();
  };

  const handleLoad = (combo: SavedTagCombination) => {
    markCombinationAsUsed(combo.id);
    onLoadCombination(combo.tagIds);
    refreshCombinations();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Diese gespeicherte Kombination wirklich löschen?')) {
      deleteSavedCombination(id);
      refreshCombinations();
    }
  };

  // Get tag names for a combination
  const getTagNames = (tagIds: string[]): string[] => {
    return tagIds
      .map(id => allTags.find(t => t.id === id))
      .filter(Boolean)
      .map(tag => tag!.displayName);
  };

  // Format date
  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Heute';
    if (diffDays === 1) return 'Gestern';
    if (diffDays < 7) return `Vor ${diffDays} Tagen`;
    
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="mb-6">
      {/* Header with Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 rounded-lg transition-all"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '2px solid rgba(255, 255, 255, 0.3)'
        }}
      >
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5" style={{ color: '#f25f5c' }} />
          <span style={{ fontFamily: 'Fjalla One', color: '#3A3A3A', fontSize: '1.125rem' }}>
            Gespeicherte Filter
          </span>
          {combinations.length > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-xs"
              style={{
                backgroundColor: '#f25f5c',
                color: '#FFFFFF',
                fontWeight: 600
              }}
            >
              {combinations.length}
            </span>
          )}
        </div>
        <ChevronDown 
          className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          style={{ color: '#3A3A3A' }}
        />
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3">
              {/* Save Current Combination */}
              {selectedTags.length > 0 && (
                <div
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: 'rgba(112, 193, 179, 0.1)',
                    border: '2px solid rgba(112, 193, 179, 0.3)'
                  }}
                >
                  {!showSaveDialog ? (
                    <button
                      onClick={() => setShowSaveDialog(true)}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-all hover:shadow-md"
                      style={{
                        backgroundColor: '#70c1b3',
                        color: '#FFFFFF',
                        fontWeight: 600
                      }}
                    >
                      <Save className="w-4 h-4" />
                      Aktuelle Filter speichern ({selectedTags.length} Tags)
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={comboName}
                        onChange={(e) => setComboName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        placeholder="Name für diese Kombination..."
                        className="w-full px-4 py-2 rounded-lg focus:outline-none"
                        style={{
                          backgroundColor: '#FFFFFF',
                          color: '#3A3A3A',
                          border: '2px solid rgba(112, 193, 179, 0.3)'
                        }}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          disabled={!comboName.trim()}
                          className="flex-1 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: '#70c1b3',
                            color: '#FFFFFF',
                            fontWeight: 600
                          }}
                        >
                          Speichern
                        </button>
                        <button
                          onClick={() => {
                            setShowSaveDialog(false);
                            setComboName('');
                          }}
                          className="px-4 py-2 rounded-lg transition-all"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            color: '#3A3A3A'
                          }}
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Saved Combinations List */}
              {combinations.length > 0 ? (
                <div className="space-y-2">
                  {combinations.map((combo) => {
                    const tagNames = getTagNames(combo.tagIds);
                    
                    return (
                      <motion.button
                        key={combo.id}
                        onClick={() => handleLoad(combo)}
                        className="w-full p-4 rounded-lg text-left transition-all hover:shadow-md group"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '2px solid rgba(255, 255, 255, 0.3)'
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4
                                style={{
                                  fontFamily: 'Fjalla One',
                                  color: '#3A3A3A',
                                  fontSize: '1rem'
                                }}
                              >
                                {combo.name}
                              </h4>
                              <span
                                className="px-2 py-0.5 rounded-full text-xs flex-shrink-0"
                                style={{
                                  backgroundColor: '#70c1b3',
                                  color: '#FFFFFF',
                                  fontWeight: 600
                                }}
                              >
                                {combo.tagIds.length}
                              </span>
                            </div>
                            
                            {/* Tag Pills */}
                            <div className="flex flex-wrap gap-1 mb-2">
                              {tagNames.slice(0, 3).map((name, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-0.5 rounded-full text-xs"
                                  style={{
                                    backgroundColor: 'rgba(112, 193, 179, 0.2)',
                                    color: '#3A3A3A'
                                  }}
                                >
                                  {name}
                                </span>
                              ))}
                              {tagNames.length > 3 && (
                                <span
                                  className="px-2 py-0.5 rounded-full text-xs"
                                  style={{
                                    backgroundColor: 'rgba(112, 193, 179, 0.2)',
                                    color: '#3A3A3A'
                                  }}
                                >
                                  +{tagNames.length - 3}
                                </span>
                              )}
                            </div>

                            {/* Last Used */}
                            <div className="flex items-center gap-1 text-xs" style={{ color: '#666666' }}>
                              <Clock className="w-3 h-3" />
                              <span>
                                {combo.lastUsed 
                                  ? `Zuletzt verwendet: ${formatDate(combo.lastUsed)}`
                                  : `Erstellt: ${formatDate(combo.createdAt)}`
                                }
                              </span>
                            </div>
                          </div>

                          {/* Delete Button */}
                          <button
                            onClick={(e) => handleDelete(combo.id, e)}
                            className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                            style={{ color: '#dc2626' }}
                            title="Löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p style={{ color: '#666666', fontSize: '0.875rem' }}>
                    Keine gespeicherten Filter vorhanden.
                    <br />
                    Wähle Tags aus und speichere sie für schnellen Zugriff.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
