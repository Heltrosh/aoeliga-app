import { useEffect, useState } from "react";

export function useColumnVisibility<T extends string>(
  storageKey: string,
  defaultColumns: T[],
) {
  const [visible, setVisible] = useState<T[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : defaultColumns;
    } catch {
      return defaultColumns;
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(visible));
  }, [storageKey, visible]);

  function toggle(column: T) {
    setVisible((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column],
    );
  }

  return { visible, toggle };
}