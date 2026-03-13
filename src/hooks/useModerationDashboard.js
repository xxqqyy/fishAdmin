import { useEffect, useState } from 'react';
import { getDashboard } from '../lib/api';

const defaultQuery = { scope: 'admin', recentLimit: 20 };

export default function useModerationDashboard(query = defaultQuery) {
  const queryKey = JSON.stringify(query);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  function refresh() {
    setRefreshVersion((value) => value + 1);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const data = await getDashboard(undefined, JSON.parse(queryKey));
        if (!cancelled) {
          setDashboard(data);
        }
      } catch (requestError) {
        if (!cancelled && requestError.name !== 'AbortError') {
          setError(requestError.message || '加载治理数据失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    function handleConfigChange() {
      refresh();
    }

    function handleExternalRefresh() {
      refresh();
    }

    window.addEventListener('fish-admin-config-change', handleConfigChange);
    window.addEventListener('fish-admin-refresh', handleExternalRefresh);
    return () => {
      cancelled = true;
      window.removeEventListener('fish-admin-config-change', handleConfigChange);
      window.removeEventListener('fish-admin-refresh', handleExternalRefresh);
    };
  }, [queryKey, refreshVersion]);

  return {
    loading,
    dashboard,
    error,
    refresh
  };
}
