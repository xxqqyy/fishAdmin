import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Image,
  List,
  Skeleton,
  Space,
  Tag,
  Tooltip,
  Typography
} from 'antd';
import { FileImageOutlined } from '@ant-design/icons';
import { getRiskTargetPreview } from '../lib/api';
import {
  formatStatusLabel,
  formatTargetTypeLabel,
  getStatusColor,
  normalizeModerationStatus
} from '../lib/formatters';

const { Paragraph, Text, Title } = Typography;

function ImageWithFallback({ src, alt, className }) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div className="preview-image-fallback">
        <Space direction="vertical" align="center" size={4}>
          <FileImageOutlined style={{ fontSize: 24 }} />
          <span>图片加载失败</span>
        </Space>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5NGEzYjgiIGZvbnQtc2l6ZT0iMTIiPuWKoOi9veWksei0pTwvdGV4dD48L3N2Zz4="
    />
  );
}

function ContentPreview({ item, preview }) {
  if (!preview?.detail) {
    return (
      <Alert
        type="warning"
        showIcon
        message="暂无内容预览"
        description="现有后端没有独立内容详情接口，已隐藏内容可能无法从社区聚合接口回查。"
      />
    );
  }

  const detail = preview.detail;
  const imageList = detail.images?.length ? detail.images : detail.coverUrl ? [detail.coverUrl] : [];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="作者">{detail.author || '-'}</Descriptions.Item>
        <Descriptions.Item label="发布时间">{detail.publishTime || '-'}</Descriptions.Item>
        <Descriptions.Item label="关联钓点">{detail.spotName || detail.pitName || detail.spotId || '-'}</Descriptions.Item>
        <Descriptions.Item label="互动数据">
          点赞 {detail.likes || 0} · 收藏 {detail.favorites || 0} · 评论 {detail.comments || 0}
        </Descriptions.Item>
      </Descriptions>

      <div className="detail-block">
        <Text strong>内容正文</Text>
        <Paragraph className="detail-reason">{detail.content || '暂无正文摘要'}</Paragraph>
      </div>

      {detail.tags?.length ? (
        <Space wrap>
          {detail.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </Space>
      ) : null}

      {imageList.length ? (
        <Image.PreviewGroup>
          <div className="preview-grid">
            {imageList.slice(0, 4).map((imageUrl, index) => (
              <ImageWithFallback
                key={`${imageUrl}-${index}`}
                src={imageUrl}
                alt={detail.title || item.title}
                className="preview-image"
              />
            ))}
          </div>
        </Image.PreviewGroup>
      ) : null}
    </Space>
  );
}

function SpotPreview({ preview }) {
  const detail = preview?.detail;
  const spot = detail?.spot;
  if (!spot) {
    return <Empty description="暂无钓点详情" />;
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="地址">{spot.address || '-'}</Descriptions.Item>
        <Descriptions.Item label="营业时间">{spot.openHours || '-'}</Descriptions.Item>
        <Descriptions.Item label="评分">{spot.rating || 0}</Descriptions.Item>
        <Descriptions.Item label="价格">{spot.price || '-'}</Descriptions.Item>
        <Descriptions.Item label="鱼种">{spot.speciesText || '-'}</Descriptions.Item>
      </Descriptions>

      <div className="detail-block">
        <Text strong>钓点描述</Text>
        <Paragraph className="detail-reason">{spot.description || '暂无钓点描述'}</Paragraph>
      </div>

      {spot.images?.length ? (
        <Image.PreviewGroup>
          <div className="preview-grid">
            {spot.images.slice(0, 4).map((imageUrl, index) => (
              <ImageWithFallback key={`${imageUrl}-${index}`} src={imageUrl} alt={spot.name} className="preview-image" />
            ))}
          </div>
        </Image.PreviewGroup>
      ) : null}

      <div>
        <Title level={5}>相关内容</Title>
        <Text type="secondary">
          分享 {detail.relatedContent?.shares?.length || 0} · 点评 {detail.relatedContent?.reviews?.length || 0} · 视频{' '}
          {detail.relatedContent?.videos?.length || 0}
        </Text>
      </div>

      <div>
        <Title level={5}>最新评论</Title>
        <List
          size="small"
          locale={{ emptyText: '暂无评论' }}
          dataSource={detail.comments?.slice(0, 3) || []}
          renderItem={(comment) => (
            <List.Item>
              <Space direction="vertical" size={2}>
                <Text strong>{comment.author || '-'}</Text>
                <Text>{comment.content || '-'}</Text>
                <Text type="secondary">{comment.publishTime || '-'}</Text>
              </Space>
            </List.Item>
          )}
        />
      </div>
    </Space>
  );
}

function RiskDrawer({ open, item, onClose, onAction, submitting }) {
  const status = normalizeModerationStatus(item?.status);
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      if (!open || !item) {
        setPreview(null);
        return;
      }

      setLoadingPreview(true);
      try {
        const data = await getRiskTargetPreview(item);
        if (!cancelled) {
          setPreview(data);
        }
      } catch {
        if (!cancelled) {
          setPreview(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingPreview(false);
        }
      }
    }

    loadPreview();
    return () => {
      cancelled = true;
    };
  }, [item, open]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={520}
      title={item?.title || '风险内容详情'}
      extra={
        <Space className="action-btn-group">
          <Tooltip title="隐藏内容，用户将无法查看">
            <Button
              danger
              disabled={!item || status === 'hidden'}
              loading={submitting === 'hide'}
              onClick={() => onAction?.('hide', item)}
            >
              隐藏内容
            </Button>
          </Tooltip>
          <Tooltip title="标记为已处置，保持可见">
            <Button
              type="primary"
              disabled={!item || status === 'resolved'}
              loading={submitting === 'resolve'}
              onClick={() => onAction?.('resolve', item)}
            >
              标记处置
            </Button>
          </Tooltip>
          <Tooltip title="恢复展示，取消治理操作">
            <Button
              disabled={!item || status === 'pending'}
              loading={submitting === 'restore'}
              onClick={() => onAction?.('restore', item)}
            >
              恢复展示
            </Button>
          </Tooltip>
        </Space>
      }
    >
      {item ? (
        <Space direction="vertical" size={18} style={{ width: '100%' }}>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="风险状态">
              <Tag color={getStatusColor(item.status)}>{formatStatusLabel(item.status)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="内容类型">{formatTargetTypeLabel(item.targetType)}</Descriptions.Item>
            <Descriptions.Item label="目标 ID">{item.targetId}</Descriptions.Item>
            <Descriptions.Item label="所属城市">{item.city || '-'}</Descriptions.Item>
            <Descriptions.Item label="关联钓点">{item.spotId || '-'}</Descriptions.Item>
            <Descriptions.Item label="累计举报">{item.reportCount || 0}</Descriptions.Item>
          </Descriptions>

          <div className="detail-block">
            <Text strong>最近举报原因</Text>
            <Paragraph className="detail-reason">{item.latestReason || '暂无举报原因'}</Paragraph>
          </div>

          <Divider style={{ margin: 0 }}>风险对象预览</Divider>

          {loadingPreview ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : item.targetType === 'spot' ? (
            <SpotPreview preview={preview} />
          ) : (
            <ContentPreview item={item} preview={preview} />
          )}
        </Space>
      ) : null}
    </Drawer>
  );
}

export default RiskDrawer;
