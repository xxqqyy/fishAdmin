import { Card, Space, Statistic, Tag, Typography } from 'antd';

const { Text } = Typography;

function KpiCard({ title, value, suffix, extra, trend, color }) {
  return (
    <Card className="glass-card kpi-card">
      <Space direction="vertical" size={14} style={{ width: '100%' }}>
        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
          <Text type="secondary">{title}</Text>
          {trend ? <Tag color={color || 'blue'}>{trend}</Tag> : null}
        </Space>
        <Statistic value={value || 0} suffix={suffix} />
        {extra ? <Text type="secondary">{extra}</Text> : null}
      </Space>
    </Card>
  );
}

export default KpiCard;
