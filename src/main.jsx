import React from 'react';
import ReactDOM from 'react-dom/client';
import { App as AntApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const theme = {
  token: {
    colorPrimary: '#1677ff',
    colorSuccess: '#23a26d',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorBgLayout: '#f3f7fb',
    colorBgContainer: 'rgba(255, 255, 255, 0.92)',
    colorText: '#152033',
    colorTextSecondary: '#5c6b82',
    borderRadius: 18,
    fontFamily: '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif'
  },
  components: {
    Layout: {
      bodyBg: '#f3f7fb',
      headerBg: 'transparent',
      siderBg: '#0f172a',
      triggerBg: '#0f172a'
    },
    Card: {
      boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)'
    },
    Table: {
      headerBg: '#f8fafc',
      headerColor: '#334155'
    },
    Menu: {
      darkItemBg: '#0f172a',
      darkSubMenuItemBg: '#0f172a',
      darkItemSelectedBg: 'linear-gradient(135deg, #1677ff, #3b82f6)',
      darkItemColor: 'rgba(255, 255, 255, 0.72)'
    }
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN} theme={theme}>
      <AntApp>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>
);
