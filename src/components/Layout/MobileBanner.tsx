import { useEffect, useState } from 'react';

const LS_KEY = 'flat-mobile-banner-dismissed';

/**
 * Плашка для мобильных: «режим просмотра, для редактирования — десктоп».
 * Запоминает, что пользователь её закрыл (localStorage).
 */
export function MobileBanner() {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem(LS_KEY) === '1'; } catch { return false; }
  });

  useEffect(() => {
    if (dismissed) {
      try { localStorage.setItem(LS_KEY, '1'); } catch {}
    }
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <div className="mobile-banner">
      <span className="mobile-banner__icon">📱</span>
      <span className="mobile-banner__text">
        <strong>Режим просмотра.</strong> Зум — щипком, пан — пальцем. Для редактирования открой на компьютере.
      </span>
      <button className="mobile-banner__close" onClick={() => setDismissed(true)} title="Скрыть">×</button>
    </div>
  );
}
