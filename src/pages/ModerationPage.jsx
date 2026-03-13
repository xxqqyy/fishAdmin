import { useDeferredValue, useEffect, useState } from 'react';
import {
  App,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Row,
  Segmented,
  Space,
  Table,
  Tag,
  Typography
} from 'antd';
import {
  EyeInvisibleOutlined,
  RedoOutlined,
  ReloadOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import AuditTimeline from '../components/AuditTimeline';
import KpiCard from '../components/KpiCard';
import RiskDrawer from '../components/RiskDrawer';
import useModerationDashboard from '../hooks/useModerationDashboard';
import { appendAuditLog, getAuditLog } from '../lib/audit-log';
import { getApiConfig, hideTarget, resolveTarget, restoreTarget } from '../lib/api';
import {
  formatStatusLabel,
  formatTargetTypeLabel,
  getStatusColor,
  normalizeModerationStatus
} from '../lib/formatters';

const { Title, Text } = Typography;

function ModerationPage() {
  const { message } = App.useApp();
  const { dashboard, loading, error, refresh } = useModerationDashboard({
    scope: 'admin',
    highRiskLimit: 100,
    recentLimit: 20
  });
  const [keyword, setKeyword] = useState('');
  const deferredKeyword = useDeferredValue(keyword);
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeItem, setActiveItem] = useState(null);
  const [submitting, setSubmitting] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [auditEntries, setAuditEntries] = useState(() => getAuditLog());

  useEffect(() => {
    function syncAuditLog() {
      setAuditEntries(getAuditLog());
    }

    window.addEventListener('fish-admin-audit-log-change', syncAuditLog);
    return () => {
      window.removeEventListener('fish-admin-audit-log-change', syncAuditLog);
    };
  }, []);

  const source = dashboard?.highRiskContent || [];
  const filteredData = source.filter((item) => {
    const normalizedStatus = normalizeModerationStatus(item.status);
    const statusMatched = statusFilter === 'all' ? true : normalizedStatus === statusFilter;
    const keywordMatched =
      !deferredKeyword ||
      item.title?.includes(deferredKeyword) ||
      item.targetId?.includes(deferredKeyword) ||
      item.latestReason?.includes(deferredKeyword) ||
      item.city?.includes(deferredKeyword);

    return statusMatched && keywordMatched;
  });
  const selectedItems = filteredData.filter((item) => selectedRowKeys.includes(item.key));

  async function applyAction(action, items) {
    const actionMap = {
      hide: hideTarget,
      resolve: resolveTarget,
      restore: restoreTarget
    };

    setSubmitting(action);
    try {
      await Promise.all(
        items.map(async (item) => {
          await actionMap[action]({
            targetType: item.targetType,
            targetId: item.targetId
          });

          appendAuditLog({
            action,
            operatorId: getApiConfig().operatorId,
            targetType: item.targetType,
            targetId: item.targetId,
            title: item.title
          });
        })
      );

      message.success(items.length > 1 ? `已完成 ${items.length} 条治理动作` : '治理动作已提交');
      setActiveItem(null);
      setSelectedRowKeys([]);
      refresh();
    } catch (requestError) {
      message.error(requestError.message || '治理动作失败');
    } finally {
      setSubmitting('');
    }
  }

  async function handleAction(action, item) {
    await applyAction(action, [item]);
  }

  async function handleBatchAction(action) {
    if (!selectedItems.length) {
      message.warning('请先选择需要处理的内容');
      return;
    }

    await applyAction(action, selectedItems);
  }

  const columns = [
    {
      title: '对象',
      dataIndex: 'title',
      render: (value, record) => (
        <Space direction="vertical" size={2}>
          <Text strong>{value}</Text>
          <Text type="secondary">
            {formatTargetTypeLabel(record.targetType)} · {record.targetId}
          </Text>
        </Space>
      )
    },
    {
      title: '城市',
      dataIndex: 'city',
      width: 120,
      render: (value) => value || '-'
    },
    {
      title: '举报量',
      dataIndex: 'reportCount',
      width: 100
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (value) => <Tag color={getStatusColor(value)}>{formatStatusLabel(value)}</Tag>
    },
    {
      title: '最近举报原因',
      dataIndex: 'latestReason',
      ellipsis: true
    },
    {
      title: '快速操作',
      key: 'actions',
      width: 220,
      render: (_, record) => {
        const status = normalizeModerationStatus(record.status);
        return (
          <Space size="small">
            <Button
              icon={<EyeInvisibleOutlined />}
              danger
              disabled={status === 'hidden'}
              onClick={() => handleAction('hide', record)}
            />
            <Button
              icon={<SafetyOutlined />}
              type="primary"
              disabled={status === 'resolved'}
              onClick={() => handleAction('resolve', record)}
            />
            <Button
              icon={<RedoOutlined />}
              disabled={status === 'pending'}
              onClick={() => handleAction('restore', record)}
            />
            <Button type="link" onClick={() => setActiveItem(record)}>
              详情
            </Button>
          </Space>
        );
      }
    }
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div className="page-section-header">
        <div>
          <Title level={3} className="section-title">
            内容治理
          </Title>
          <Text type="secondary">支持搜索、批量处置和详情预览，适合治理专员连续作业。</Text>
        </div>
        <Button icon={<ReloadOutlined />} loading={loading} onClick={refresh}>
          刷新列表
        </Button>
      </div>

      <Row gutter={[18, 18]}>
        <Col xs={24} md={12} xl={6}>
          <KpiCard title="风险对象总数" value={dashboard?.totalHighRiskContent || source.length} />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <KpiCard
            title="待处理"
            value={filteredData.filter((item) => normalizeModerationStatus(item.status) === 'pending').length}
            trend="当前筛选范围"
            color="orange"
          />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <KpiCard
            title="已隐藏"
            value={filteredData.filter((item) => normalizeModerationStatus(item.status) === 'hidden').length}
            trend="当前筛选范围"
            color="red"
          />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <KpiCard title="已选中" value={selectedItems.length} trend="可批量执行" color="blue" />
        </Col>
      </Row>

      <Card className="glass-card section-card">
        <Space wrap size="middle" style={{ justifyContent: 'space-between', width: '100%' }}>
          <Space wrap size="middle">
            <Input.Search
              allowClear
              placeholder="按标题、ID、举报原因、城市搜索"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              style={{ maxWidth: 360 }}
            />
            <Segmented
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: '全部', value: 'all' },
                { label: '待处理', value: 'pending' },
                { label: '已隐藏', value: 'hidden' },
                { label: '已处置', value: 'resolved' }
              ]}
            />
          </Space>

          <Space wrap>
            <Button
              danger
              disabled={!selectedItems.length}
              loading={submitting === 'hide'}
              onClick={() => handleBatchAction('hide')}
            >
              批量隐藏
            </Button>
            <Button
              type="primary"
              disabled={!selectedItems.length}
              loading={submitting === 'resolve'}
              onClick={() => handleBatchAction('resolve')}
            >
              批量处置
            </Button>
            <Button
              disabled={!selectedItems.length}
              loading={submitting === 'restore'}
              onClick={() => handleBatchAction('restore')}
            >
              批量恢复
            </Button>
          </Space>
        </Space>
      </Card>

      <Row gutter={[18, 18]}>
        <Col xs={24} xl={16}>
          <Card className="glass-card section-card" title="治理工作台">
            <Table
              rowKey="key"
              loading={loading}
              rowSelection={{
                selectedRowKeys,
                onChange: setSelectedRowKeys
              }}
              columns={columns}
              dataSource={filteredData}
              pagination={{ pageSize: 10, showSizeChanger: false }}
              locale={{ emptyText: error ? error : <Empty description="暂无可治理内容" /> }}
            />
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card className="glass-card section-card" title="最近操作记录">
            <AuditTimeline entries={auditEntries} />
          </Card>
        </Col>
      </Row>

      <RiskDrawer
        open={Boolean(activeItem)}
        item={activeItem}
        onClose={() => setActiveItem(null)}
        onAction={handleAction}
        submitting={submitting}
      />
    </Space>
  );
}

export default ModerationPage;
