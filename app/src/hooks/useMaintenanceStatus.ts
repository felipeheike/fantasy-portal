import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

/**
 * Checks the global maintenance flag once the caller is ready (hydrated +
 * authenticated). Fails open: if the fetch errors out, isActive stays false
 * instead of blocking everyone over a transient network/DB hiccup.
 */
export function useMaintenanceStatus(enabled: boolean) {
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    fetch('/api/maintenance-status')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data) {
          setIsActive(!!data.isActive);
          setMessage(data.message || null);
        }
      })
      .catch(err => logger.warn('MAINTENANCE_STATUS_FETCH_ERR:', err));
  }, [enabled]);

  return { isActive, message };
}
