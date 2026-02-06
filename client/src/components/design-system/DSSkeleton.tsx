interface DSSkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function DSSkeleton({
  variant = 'text',
  width,
  height,
  className = '',
}: DSSkeletonProps) {
  const baseStyles = 'animate-pulse bg-[var(--ds-neutral-300)]';
  
  const variantStyles = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-[var(--ds-radius-md)]',
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'circular' ? '40px' : '100%'),
    height: height || (variant === 'circular' ? '40px' : undefined),
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={style}
    />
  );
}

// Common Skeleton Patterns
export function DSSkeletonCard() {
  return (
    <div className="bg-[var(--ds-bg-primary)] border border-[var(--ds-border-default)] rounded-[var(--ds-radius-lg)] p-6 space-y-4">
      <DSSkeleton variant="rectangular" height={200} />
      <DSSkeleton variant="text" width="80%" />
      <DSSkeleton variant="text" width="60%" />
      <div className="flex items-center gap-3">
        <DSSkeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <DSSkeleton variant="text" width="40%" />
          <DSSkeleton variant="text" width="30%" />
        </div>
      </div>
    </div>
  );
}

export function DSSkeletonTable() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <DSSkeleton variant="circular" width={32} height={32} />
          <DSSkeleton variant="text" width="30%" />
          <DSSkeleton variant="text" width="20%" />
          <DSSkeleton variant="text" width="15%" />
          <DSSkeleton variant="text" width="10%" />
        </div>
      ))}
    </div>
  );
}
