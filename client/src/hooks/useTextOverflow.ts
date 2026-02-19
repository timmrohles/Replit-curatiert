import { useRef, useState, useEffect, useCallback } from 'react';

export function useTextOverflow<T extends HTMLElement = HTMLElement>() {
  const textRef = useRef<T>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const checkOverflow = useCallback(() => {
    const el = textRef.current;
    if (!el) return;
    setIsOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, []);

  useEffect(() => {
    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    if (textRef.current) observer.observe(textRef.current);
    return () => observer.disconnect();
  }, [checkOverflow]);

  return { textRef, isOverflowing };
}
