import { useEffect, useState } from 'react';

const MOBILE_MQ = '(max-width: 820px)';

/**
 * Возвращает true, если viewport узкий (< 820 px) ИЛИ устройство не имеет точного указателя
 * (телефон/планшет без мыши). Слушает изменения media query — обновляется при повороте.
 */
export function useIsMobile(): boolean {
  const get = () => {
    if (typeof window === 'undefined') return false;
    const narrow = window.matchMedia(MOBILE_MQ).matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    return narrow || coarse;
  };
  const [m, set] = useState<boolean>(get);
  useEffect(() => {
    const mqs = [window.matchMedia(MOBILE_MQ), window.matchMedia('(pointer: coarse)')];
    const handler = () => set(get());
    mqs.forEach((mq) => mq.addEventListener('change', handler));
    return () => mqs.forEach((mq) => mq.removeEventListener('change', handler));
  }, []);
  return m;
}
