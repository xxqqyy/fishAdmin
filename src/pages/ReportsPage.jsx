import { App, Button, Card, Col, Empty, Row, Space, Table, Tag, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import ReportComposer from '../components/ReportComposer';
import useModerationDashboard from '../hooks/useModerationDashboard';
import { createReport } from '../lib/api';
import { formatTargetTypeLabel, toPercent } from '../lib/formatters';

const { Title, Text } = Typography;

function ReportsPage() {
  const { message } = App.useApp();
  const { dashboard, loading, error, refresh } = useModerationDashboard({
    scope: 'admin',
    highRiskLimit: 50,
    recentLimit: 20
  });

  const reasonEntries = Object.entries(dashboard?.reasonSummary || {}).sort(([, a], [, b]) => b - a);
  const targetRanking = Object.entries(dashboard?.reportCountByTarget || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  async function handleCreateReport(values) {
    try {
      await createReport(values);
      message.success('举报已提交');
      refresh();
      return true;
    } catch (requestError) {
      message.error(requestError.message || '举报提交失败');
      return false;
    }
  }

  const columns = [
    {
      title: '举报原因',
      dataIndex: 'reason',
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
      title: '举报人',
      dataIndex: 'author',
      width: 140,
      render: (value) => value || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (value) => <Tag>{value || '-'}</Tag>
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (value) => value || '-'
    }
  ];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div className="page-section-header">
        <div>
          <Title level={3} className="section-title">
            举报中心
          </Title>
          <Text type="secondary">集中查看举报记录、原因结构，并支持运营人工补录。</Text>
        </div>
        <Button icon={<ReloadOutlined />} loading={loading} onClick={refresh}>
          刷新举报
        </Button>
      </div>

      <Row gutter={[18, 18]}>
        <Col xs={24} xl={16}>
          <Card className="glass-card section-card" title="最近举报记录">
            <Table
              rowKey="id"
              loading={loading}
              columns={columns}
              dataSource={dashboard?.recentReports || []}
              pagination={{ pageSize: 8, showSizeChanger: false }}
              locale={{ emptyText: error ? error : <Empty description="暂无举报记录" /> }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <ReportComposer loading={loading} onSubmit={handleCreateReport} />
        </Col>
      </Row>

      <Row gutter={[18, 18]}>
        <Col xs={24} xl={10}>
          <Card className="glass-card section-card" title="举报原因排行">
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {reasonEntries.length ? (
                reasonEntries.map(([reason, count]) => (
                  <div key={reason}>
                    <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                      <Text>{reason}</Text>
                      <Text type="secondary">{count} 次</Text>
                    </Space>
                    <div className="mini-progress-track">
                      <div
                        className="mini-progress-bar"
                        style={{ width: `${toPercent(count, dashboard?.totalReports || 0)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <Empty description="暂无举报原因排行" />
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={14}>
          <Card className="glass-card section-card" title="被举报对象热度">
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              {targetRanking.length ? (
                targetRanking.map(([key, count]) => {
                  const [targetType, targetId] = key.split(':');
                  return (
                    <div key={key} className="recent-item">
                      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                        <div>
                          <Text strong>{targetId}</Text>
                          <br />
                          <Text type="secondary">{formatTargetTypeLabel(targetType)}</Text>
                        </div>
                        <Tag color="orange">{count} 次举报</Tag>
                      </Space>
                    </div>
                  );
                })
              ) : (
                <Empty description="暂无对象排行" />
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

export default ReportsPage;
