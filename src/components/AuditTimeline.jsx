import { Empty, Space, Tag, Timeline, Typography } from 'antd';
import { formatDateTime, formatModerationActionLabel, formatTargetTypeLabel } from '../lib/formatters';

const { Text } = Typography;

function AuditTimeline({ entries }) {
  if (!entries.length) {
    return <Empty description="暂无操作记录" />;
  }

  return (
    <Timeline
      items={entries.map((item) => ({
        color: item.action === 'hide' ? 'red' : item.action === 'resolve' ? 'green' : 'blue',
        children: (
          <Space direction="vertical" size={2}>
            <Space wrap>
              <Tag color="default">{formatModerationActionLabel(item.action)}</Tag>
              <Text strong>{item.title || item.targetId}</Text>
            </Space>
            <Text type="secondary">
              {formatTargetTypeLabel(item.targetType)} · {item.targetId}
            </Text>
            <Text type="secondary">
              操作人：{item.operatorId} · 时间：{formatDateTime(item.createdAt)}
            </Text>
          </Space>
        )
      }))}
    />
  );
}

export default AuditTimeline;
