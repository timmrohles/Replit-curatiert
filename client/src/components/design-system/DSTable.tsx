import { ReactNode, useState } from 'react';
import { ChevronUp, ChevronDown, MoreVertical } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

interface DSTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  onRowClick?: (row: Record<string, unknown>) => void;
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  emptyState?: ReactNode;
  loading?: boolean;
}

export function DSTable({
  columns,
  data,
  onRowClick,
  selectable = false,
  onSelectionChange,
  emptyState,
  loading = false,
}: DSTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
      onSelectionChange?.([]);
    } else {
      const allIds = data.map((row) => row.id);
      setSelectedIds(allIds);
      onSelectionChange?.(allIds);
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelection = selectedIds.includes(id)
      ? selectedIds.filter((selectedId) => selectedId !== id)
      : [...selectedIds, id];
    setSelectedIds(newSelection);
    onSelectionChange?.(newSelection);
  };

  if (loading) {
    return (
      <div className="w-full border border-[var(--ds-border-default)] rounded-[var(--ds-radius-lg)] overflow-hidden">
        <div className="p-12 text-center text-[var(--ds-text-secondary)]">
          <div className="animate-spin w-8 h-8 border-4 border-[var(--ds-accent-slate-blue)] border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-sm">Lädt...</p>
        </div>
      </div>
    );
  }

  if (!loading && data.length === 0) {
    return (
      <div className="w-full border border-[var(--ds-border-default)] rounded-[var(--ds-radius-lg)] overflow-hidden">
        <div className="p-12 text-center text-[var(--ds-text-secondary)]">
          {emptyState || <p className="text-sm">Keine Daten verfügbar</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border border-[var(--ds-border-default)] rounded-[var(--ds-radius-lg)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--ds-neutral-200)] border-b border-[var(--ds-border-default)]">
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === data.length && data.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-[var(--ds-border-strong)]"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-sm font-semibold text-[var(--ds-text-primary)] ${
                    column.sortable ? 'cursor-pointer select-none hover:bg-[var(--ds-hover-overlay)]' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && sortColumn === column.key && (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    )}
                  </div>
                </th>
              ))}
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={row.id || index}
                className={`border-b border-[var(--ds-border-subtle)] last:border-b-0 ${
                  index % 2 === 1 ? 'bg-[var(--ds-neutral-200)]/50' : 'bg-white'
                } ${onRowClick ? 'cursor-pointer hover:bg-[var(--ds-hover-overlay)]' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {selectable && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => handleSelectRow(row.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-[var(--ds-border-strong)]"
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-sm text-[var(--ds-text-primary)]">
                    {row[column.key]}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <button
                    className="p-1 hover:bg-[var(--ds-hover-overlay)] rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <MoreVertical className="w-4 h-4 text-[var(--ds-text-tertiary)]" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}