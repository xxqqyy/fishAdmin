import { useState } from 'react';
import {
  App,
  Button,
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Space,
  Table,
  Tag,
  Typography
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
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
  toPercent
} from '../lib/formatters';

const { Title, Text } = Typography;

function DashboardPage() {
  const { message } = App.useApp();
  const { dashboard, loading, error, refresh } = useModerationDashboard({
    scope: 'admin',
    highRiskLimit: 50,
    recentLimit: 12
  });
  const [activeItem, setActiveItem] = useState(null);

  const reasonEntries = Object.entries(dashboard?.reasonSummary || {});
  const totalReports = dashboard?.totalReports || 0;
  const topRiskContent = (dashboard?.highRiskContent || []).slice(0, 5);
  const targetRanking = Object.entries(dashboard?.reportCountByTarget || {})
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 5);

  async function handleAction(action, item) {
    const actionMap = {
      hide: hideTarget,
      resolve: resolveTarget,
      restore: restoreTarget
    };

    try {
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
      message.success('治理动作已提交');
      setActiveItem(null);
      refresh();
    } catch (requestError) {
      message.error(requestError.message || '治理动作失败');
    }
  }

  const columns = [
    {
      title: '内容标题',
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
      title: '最近原因',
      dataIndex: 'latestReason',
      ellipsis: true
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button type="link" onClick={() => setActiveItem(record)}>
          查看详情
        </Button>
      )
    }
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div className="page-section-header">
        <div>
          <Title level={3} className="section-title">
            治理总览
          </Title>
          <Text type="secondary">综合展示风险存量、举报原因结构和重点治理对象。</Text>
        </div>
        <Button icon={<ReloadOutlined />} loading={loading} onClick={refresh}>
          刷新总览
        </Button>
      </div>

      <Row gutter={[18, 18]}>
        <Col xs={24} md={12} xl={6}>
          <KpiCard title="累计举报" value={dashboard?.totalReports} trend="全量统计" color="blue" />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <KpiCard title="风险对象" value={dashboard?.totalHighRiskContent} trend="进入治理池" color="orange" />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <KpiCard title="已隐藏内容" value={dashboard?.hiddenCount} trend="风险隔离" color="red" />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <KpiCard title="已完成处置" value={dashboard?.resolvedCount} trend="闭环结果" color="green" />
        </Col>
      </Row>

      <Row gutter={[18, 18]}>
        <Col xs={24} xl={14}>
          <Card
            className="glass-card section-card"
            title="重点风险对象"
            extra={<Text type="secondary">按举报量排序</Text>}
          >
            <Table
              rowKey="key"
              loading={loading}
              columns={columns}
              dataSource={topRiskContent}
              pagination={false}
              locale={{ emptyText: error ? error : <Empty description="暂无风险内容" /> }}
            />
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <Card className="glass-card section-card" title="举报原因分布">
            <Space direction="vertical" size={18} style={{ width: '100%' }}>
              {reasonEntries.length ? (
                reasonEntries.map(([reason, count]) => (
                  <div key={reason}>
                    <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                      <Text>{reason}</Text>
                      <Text type="secondary">{count} 次</Text>
                    </Space>
                    <Progress percent={toPercent(count, totalReports)} showInfo={false} strokeColor="#1677ff" />
                  </div>
                ))
              ) : (
                <Empty description="暂无举报原因统计" />
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[18, 18]}>
        <Col xs={24} xl={10}>
          <Card className="glass-card section-card" title="按对象举报热度">
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              {targetRanking.length ? (
                targetRanking.map(([key, count]) => {
                  const [targetType, targetId] = key.split(':');
                  return (
                    <div key={key} className="recent-item">
                      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                        <Text strong>{targetId}</Text>
                        <Tag color="orange">{count} 次</Tag>
                      </Space>
                      <Text type="secondary">{formatTargetTypeLabel(targetType)}</Text>
                    </div>
                  );
                })
              ) : (
                <Empty description="暂无对象热度排行" />
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card className="glass-card section-card" title="状态分布">
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              {[
                ['待处理', 'pending', dashboard?.pendingReports || 0],
                ['已隐藏', 'hidden', dashboard?.hiddenCount || 0],
                ['已处置', 'resolved', dashboard?.resolvedCount || 0]
              ].map(([label, status, count]) => (
                <div key={status}>
                  <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Text>{label}</Text>
                    <Tag color={getStatusColor(status)}>{count}</Tag>
                  </Space>
                  <Progress percent={toPercent(count, dashboard?.totalHighRiskContent || 0)} showInfo={false} />
                </div>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={6}>
          <Card className="glass-card section-card" title="最近治理动作">
            <AuditTimeline entries={getAuditLog().slice(0, 5)} />
          </Card>
        </Col>
      </Row>

      <RiskDrawer
        open={Boolean(activeItem)}
        item={activeItem}
        onClose={() => setActiveItem(null)}
        onAction={handleAction}
        submitting=""
      />
    </Space>
  );
}

export default DashboardPage;
