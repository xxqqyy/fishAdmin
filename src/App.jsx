import { Suspense, lazy, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Skeleton, Spin } from 'antd';
import AppShell from './components/AppShell';
import { getHealth } from './lib/api';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DataManagementPage = lazy(() => import('./pages/DataManagementPage'));
const ModerationPage = lazy(() => import('./pages/ModerationPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function RouteFallback() {
  return (
    <div className="route-loading">
      <Spin size="large" tip="页面加载中...">
        <div className="route-loading-skeleton">
          <Skeleton active paragraph={{ rows: 4 }} />
          <Skeleton active paragraph={{ rows: 6 }} style={{ marginTop: 24 }} />
        </div>
      </Spin>
    </div>
  );
}

function App() {
  const [healthVersion, setHealthVersion] = useState(0);
  const [healthState, setHealthState] = useState({
    status: 'checking',
    message: '检查服务连接中',
    checkedAt: ''
  });

  function runHealthCheck() {
    setHealthVersion((value) => value + 1);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      setHealthState({
        status: 'checking',
        message: '检查服务连接中',
        checkedAt: new Date().toISOString()
      });

      try {
        const data = await getHealth();
        if (cancelled) {
          return;
        }

        setHealthState({
          status: data?.status === 'healthy' ? 'healthy' : 'warning',
          message: data?.status === 'healthy' ? '后端服务在线' : '后端返回异常状态',
          checkedAt: new Date().toISOString()
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setHealthState({
          status: 'error',
          message: error.message || '后端不可用',
          checkedAt: new Date().toISOString()
        });
      }
    }

    loadHealth();

    return () => {
      cancelled = true;
    };
  }, [healthVersion]);

  useEffect(() => {
    function handleConfigChange() {
      runHealthCheck();
    }

    window.addEventListener('fish-admin-config-change', handleConfigChange);
    return () => {
      window.removeEventListener('fish-admin-config-change', handleConfigChange);
    };
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={<AppShell healthState={healthState} onHealthCheck={runHealthCheck} />}
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <Suspense fallback={<RouteFallback />}>
              <DashboardPage />
            </Suspense>
          }
        />
        <Route
          path="data"
          element={
            <Suspense fallback={<RouteFallback />}>
              <DataManagementPage />
            </Suspense>
          }
        />
        <Route
          path="moderation"
          element={
            <Suspense fallback={<RouteFallback />}>
              <ModerationPage />
            </Suspense>
          }
        />
        <Route
          path="reports"
          element={
            <Suspense fallback={<RouteFallback />}>
              <ReportsPage />
            </Suspense>
          }
        />
        <Route
          path="settings"
          element={
            <Suspense fallback={<RouteFallback />}>
              <SettingsPage onHealthCheck={runHealthCheck} />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
