import { Eye, EyeOff } from 'lucide-react';

interface PreviewModeToggleProps {
  isPreviewMode: boolean;
  onToggle: (enabled: boolean) => void;
}

export function PreviewModeToggle({ isPreviewMode, onToggle }: PreviewModeToggleProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Label */}
      <span className="text-sm font-medium" style={{ color: '#666666' }}>
        Ansichtsmodus:
      </span>

      {/* Toggle Switch */}
      <button
        onClick={() => onToggle(!isPreviewMode)}
        className="relative inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all"
        style={{
          borderColor: isPreviewMode ? '#f0ad4e' : '#70c1b3',
          backgroundColor: isPreviewMode ? '#fff3cd' : '#70c1b320',
        }}
      >
        {isPreviewMode ? (
          <>
            <Eye className="w-4 h-4" style={{ color: '#f0ad4e' }} />
            <span className="font-medium text-sm" style={{ color: '#856404' }}>
              Preview Mode
            </span>
          </>
        ) : (
          <>
            <EyeOff className="w-4 h-4" style={{ color: '#70c1b3' }} />
            <span className="font-medium text-sm" style={{ color: '#3A3A3A' }}>
              Public View
            </span>
          </>
        )}
      </button>

      {/* Info Badge */}
      <div className="text-xs px-3 py-1 rounded" style={{
        backgroundColor: isPreviewMode ? '#fff3cd' : '#E5E7EB',
        color: isPreviewMode ? '#856404' : '#666666'
      }}>
        {isPreviewMode ? 'Zeigt Draft-Content' : 'Nur Published'}
      </div>
    </div>
  );
}
