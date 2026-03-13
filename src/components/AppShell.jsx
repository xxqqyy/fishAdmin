import {
  Alert,
  Avatar,
  Button,
  Layout,
  Menu,
  Space,
  Tag,
  Typography
} from 'antd';
import {
  DashboardOutlined,
  DatabaseOutlined,
  FlagOutlined,
  NotificationOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getApiConfig } from '../lib/api';
import { formatDateTime } from '../lib/formatters';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '治理总览' },
  { key: '/data', icon: <DatabaseOutlined />, label: '数据管理' },
  { key: '/moderation', icon: <SafetyCertificateOutlined />, label: '内容治理' },
  { key: '/reports', icon: <FlagOutlined />, label: '举报中心' },
  { key: '/settings', icon: <SettingOutlined />, label: '系统设置' }
];

function getHealthTagColor(status) {
  const map = {
    checking: 'processing',
    healthy: 'success',
    warning: 'warning',
    error: 'error'
  };
  return map[status] || 'default';
}

function AppShell({ healthState, onHealthCheck }) {
  const location = useLocation();
  const navigate = useNavigate();
  const config = getApiConfig();

  const selectedKey = menuItems.find((item) => location.pathname.startsWith(item.key))?.key || '/dashboard';

  return (
    <Layout className="app-layout">
      <Sider width={260} className="app-sider">
        <div className="brand-block">
          <Avatar size={46} shape="square" icon={<NotificationOutlined />} className="brand-avatar" />
          <div>
            <Title level={4} className="brand-title">
              Fish Admin
            </Title>
            <Text className="brand-subtitle">内容治理、风控与数据管理后台</Text>
          </div>
        </div>

        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="app-menu"
        />
      </Sider>

      <Layout>
        <Header className="app-header">
          <div>
            <Title level={3} className="page-headline">
              Fish 运营后台
            </Title>
            <Text type="secondary">覆盖治理、举报、数据查看与增删改查操作</Text>
          </div>

          <Space size="middle">
            <div className="connection-chip">
              <Text className="connection-label">当前接口</Text>
              <Text className="connection-value">{config.baseUrl}</Text>
            </div>
            <Tag color={getHealthTagColor(healthState.status)}>{healthState.message}</Tag>
            <Button icon={<ReloadOutlined />} onClick={onHealthCheck}>
              重新检测
            </Button>
          </Space>
        </Header>

        <Content className="app-content">
          <Alert
            type="info"
            showIcon
            className="app-banner"
            message="当前操作将直接调用后端管理接口"
            description={`操作账号：${config.operatorId}；最近检测：${formatDateTime(healthState.checkedAt)}`}
          />
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default AppShell;
