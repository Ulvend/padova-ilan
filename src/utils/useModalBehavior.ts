import { useEffect } from 'react';

// Birden fazla modal üst üste açılabildiği için kilit sayaçla tutulur.
let scrollLockCount = 0;
let previousBodyOverflow = '';

/**
 * Modal/çekmece açıkken arka plan kaydırmasını kilitler ve (istenirse) Escape ile kapatır.
 */
export const useModalBehavior = (active: boolean, onClose: () => void, closeOnEscape = true): void => {
  useEffect(() => {
    if (!active) return;
    if (scrollLockCount === 0) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    scrollLockCount += 1;
    return () => {
      scrollLockCount -= 1;
      if (scrollLockCount === 0) document.body.style.overflow = previousBodyOverflow;
    };
  }, [active]);

  useEffect(() => {
    if (!active || !closeOnEscape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, closeOnEscape, onClose]);
};
