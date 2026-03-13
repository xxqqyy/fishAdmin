import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography
} from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import KpiCard from '../components/KpiCard';
import {
  createAdminResource,
  deleteAdminResource,
  getAdminOverview,
  getAdminResource,
  getApiConfig,
  getAuthOptions,
  getHomeRecommendations,
  updateAdminResource
} from '../lib/api';
import { formatDateTime, formatTargetTypeLabel } from '../lib/formatters';

const { Text, Title } = Typography;
const { TextArea, Search } = Input;

const targetTypeOptions = [
  { label: '钓点', value: 'spot' },
  { label: '分享', value: 'share' },
  { label: '评测', value: 'review' },
  { label: '视频', value: 'video' }
];

const filterTypeOptions = [
  { label: '全部类型', value: 'all' },
  { label: '野钓', value: 'natural' },
  { label: '黑坑', value: 'blackpit' },
  { label: '海钓', value: 'sea' },
  { label: '综合塘', value: 'mixed' }
];

const priceTypeOptions = [
  { label: '价格不限', value: 'all' },
  { label: '只看免费', value: 'free' },
  { label: '只看收费', value: 'paid' }
];

const ratingLimitOptions = [
  { label: '评分不限', value: '' },
  { label: '4.0+', value: '4' },
  { label: '4.5+', value: '4.5' },
  { label: '4.8+', value: '4.8' }
];

const distanceLimitOptions = [
  { label: '距离不限', value: '' },
  { label: '3km 内', value: '3' },
  { label: '5km 内', value: '5' },
  { label: '10km 内', value: '10' },
  { label: '20km 内', value: '20' }
];

const resourceConfigs = {
  users: {
    label: '用户',
    searchPlaceholder: '按 ID、昵称、城市、手机号搜索',
    columns: [
      { title: 'ID', dataIndex: '_id', width: 220 },
      { title: '昵称', dataIndex: 'nickname', width: 160 },
      { title: '城市', dataIndex: 'city', width: 120 },
      { title: '等级', dataIndex: 'level', width: 140, render: (value) => value || '-' },
      { title: '积分', dataIndex: 'integral', width: 100, render: (value) => value ?? 0 },
      { title: '更新时间', dataIndex: 'updatedAt', width: 180, render: formatDateTime }
    ],
    fields: [
      { name: '_id', label: '用户 ID', placeholder: '留空自动生成' },
      { name: 'nickname', label: '昵称', required: true },
      { name: 'city', label: '城市', required: true },
      { name: 'phone', label: '手机号' },
      { name: 'gender', label: '性别', placeholder: '例如 0 / 1 / 2' },
      { name: 'integral', label: '积分', placeholder: '数字' },
      { name: 'level', label: '等级' },
      { name: 'bio', label: '简介', type: 'textarea' }
    ]
  },
  spots: {
    label: '钓点',
    searchPlaceholder: '按名称、城市、区域、地址搜索',
    columns: [
      { title: 'ID', dataIndex: '_id', width: 220 },
      { title: '名称', dataIndex: 'name', width: 220 },
      { title: '城市', dataIndex: 'city', width: 120 },
      { title: '类型', dataIndex: 'type', width: 110 },
      { title: '价格', dataIndex: 'price', width: 140 },
      {
        title: '状态',
        dataIndex: 'status',
        width: 110,
        render: (value) => <Tag color={value === 'active' ? 'success' : 'default'}>{value || 'active'}</Tag>
      },
      { title: '评分', dataIndex: 'rating', width: 100, render: (value) => value ?? 0 },
      { title: '更新时间', dataIndex: 'updatedAt', width: 180, render: formatDateTime }
    ],
    fields: [
      { name: '_id', label: '钓点 ID', placeholder: '留空自动生成' },
      { name: 'name', label: '名称', required: true },
      { name: 'city', label: '城市', required: true },
      { name: 'district', label: '区域' },
      { name: 'address', label: '地址', required: true },
      {
        name: 'type',
        label: '类型',
        required: true,
        type: 'select',
        options: filterTypeOptions.filter((item) => item.value !== 'all')
      },
      { name: 'price', label: '价格', required: true },
      { name: 'rating', label: '评分', placeholder: '数字' },
      {
        name: 'status',
        label: '状态',
        type: 'select',
        options: [
          { label: 'active', value: 'active' },
          { label: 'hidden', value: 'hidden' }
        ]
      },
      { name: 'species', label: '鱼种', type: 'textarea', placeholder: '逗号或换行分隔' },
      { name: 'features', label: '特色', type: 'textarea', placeholder: '逗号或换行分隔' },
      { name: 'facilities', label: '配套设施', type: 'textarea', placeholder: '逗号或换行分隔' },
      { name: 'images', label: '图片 URL', type: 'textarea', placeholder: '逗号或换行分隔' },
      { name: 'latitude', label: '纬度' },
      { name: 'longitude', label: '经度' },
      { name: 'description', label: '描述', type: 'textarea' }
    ]
  },
  contents: {
    label: '内容',
    searchPlaceholder: '按标题、作者、城市、正文搜索',
    columns: [
      { title: 'ID', dataIndex: '_id', width: 220 },
      { title: '标题', dataIndex: 'title', width: 220 },
      { title: '类型', dataIndex: 'contentType', width: 110 },
      { title: '作者', dataIndex: 'authorNameSnapshot', width: 140, render: (value) => value || '-' },
      { title: '城市', dataIndex: 'city', width: 120 },
      {
        title: '状态',
        dataIndex: 'status',
        width: 110,
        render: (value) => <Tag color={value === 'normal' ? 'success' : 'default'}>{value || 'normal'}</Tag>
      },
      { title: '发布时间', dataIndex: 'publishAt', width: 180, render: formatDateTime }
    ],
    fields: [
      { name: '_id', label: '内容 ID', placeholder: '留空自动生成' },
      {
        name: 'contentType',
        label: '类型',
        required: true,
        type: 'select',
        options: [
          { label: 'share', value: 'share' },
          { label: 'review', value: 'review' },
          { label: 'video', value: 'video' }
        ]
      },
      { name: 'title', label: '标题', required: true },
      { name: 'authorUserId', label: '作者用户 ID', required: true },
      { name: 'authorNameSnapshot', label: '作者快照名', placeholder: '留空按用户 ID 自动补齐' },
      { name: 'city', label: '城市', required: true },
      { name: 'spotId', label: '关联钓点 ID' },
      { name: 'spotNameSnapshot', label: '钓点名称快照' },
      { name: 'pitName', label: '坑塘名称' },
      {
        name: 'status',
        label: '状态',
        type: 'select',
        options: [
          { label: 'normal', value: 'normal' },
          { label: 'hidden', value: 'hidden' }
        ]
      },
      { name: 'tags', label: '标签', type: 'textarea', placeholder: '逗号或换行分隔' },
      { name: 'images', label: '图片 URL', type: 'textarea', placeholder: '逗号或换行分隔' },
      { name: 'weather', label: '天气' },
      { name: 'tackle', label: '装备' },
      { name: 'fee', label: '费用' },
      { name: 'score', label: '评分' },
      { name: 'duration', label: '视频时长' },
      { name: 'coverUrl', label: '封面 URL' },
      { name: 'videoUrl', label: '视频 URL' },
      { name: 'content', label: '正文', required: true, type: 'textarea' }
    ]
  },
  comments: {
    label: '评论',
    searchPlaceholder: '按目标 ID、作者、评论内容搜索',
    columns: [
      { title: 'ID', dataIndex: '_id', width: 220 },
      {
        title: '目标',
        key: 'target',
        width: 180,
        render: (_, record) => (
          <Space direction="vertical" size={2}>
            <Text>{formatTargetTypeLabel(record.targetType)}</Text>
            <Text type="secondary">{record.targetId}</Text>
          </Space>
        )
      },
      { title: '作者', dataIndex: 'authorNameSnapshot', width: 140 },
      { title: '作者 ID', dataIndex: 'authorUserId', width: 180 },
      { title: '内容', dataIndex: 'content', ellipsis: true },
      { title: '创建时间', dataIndex: 'createdAt', width: 180, render: formatDateTime }
    ],
    fields: [
      { name: '_id', label: '评论 ID', placeholder: '留空自动生成' },
      { name: 'targetId', label: '目标 ID', required: true },
      { name: 'targetType', label: '目标类型', required: true, type: 'select', options: targetTypeOptions },
      { name: 'authorUserId', label: '作者用户 ID', required: true },
      { name: 'authorNameSnapshot', label: '作者快照名', placeholder: '留空按用户 ID 自动补齐' },
      { name: 'content', label: '评论内容', required: true, type: 'textarea' }
    ]
  },
  reports: {
    label: '举报',
    searchPlaceholder: '按目标 ID、举报原因、状态搜索',
    columns: [
      { title: 'ID', dataIndex: '_id', width: 220 },
      {
        title: '目标',
        key: 'target',
        width: 180,
        render: (_, record) => (
          <Space direction="vertical" size={2}>
            <Text>{formatTargetTypeLabel(record.targetType)}</Text>
            <Text type="secondary">{record.targetId}</Text>
          </Space>
        )
      },
      { title: '举报人', dataIndex: 'reporterNameSnapshot', width: 140 },
      { title: '举报人 ID', dataIndex: 'reporterUserId', width: 180 },
      { title: '原因', dataIndex: 'reason', ellipsis: true },
      { title: '状态', dataIndex: 'status', width: 120, render: (value) => <Tag>{value || 'pending'}</Tag> },
      { title: '创建时间', dataIndex: 'createdAt', width: 180, render: formatDateTime }
    ],
    fields: [
      { name: '_id', label: '举报 ID', placeholder: '留空自动生成' },
      { name: 'targetId', label: '目标 ID', required: true },
      { name: 'targetType', label: '目标类型', required: true, type: 'select', options: targetTypeOptions },
      { name: 'reporterUserId', label: '举报人用户 ID', required: true },
      { name: 'reporterNameSnapshot', label: '举报人快照名', placeholder: '留空按用户 ID 自动补齐' },
      {
        name: 'status',
        label: '状态',
        type: 'select',
        options: [
          { label: 'pending', value: 'pending' },
          { label: 'resolved', value: 'resolved' }
        ]
      },
      { name: 'reason', label: '举报原因', required: true, type: 'textarea' }
    ]
  }
};

function toFormValues(record) {
  if (!record) {
    return {};
  }

  const value = { ...record };
  ['species', 'features', 'facilities', 'images', 'tags'].forEach((field) => {
    if (Array.isArray(value[field])) {
      value[field] = value[field].join('\n');
    }
  });

  if (value.scoreBreakdown && typeof value.scoreBreakdown === 'object') {
    value.scoreBreakdown = JSON.stringify(value.scoreBreakdown, null, 2);
  }

  return value;
}

function renderField(field) {
  if (field.type === 'textarea') {
    return <TextArea rows={field.rows || 4} placeholder={field.placeholder} />;
  }

  if (field.type === 'select') {
    return <Select options={field.options || []} placeholder={field.placeholder || `请选择${field.label}`} />;
  }

  return <Input placeholder={field.placeholder} />;
}

function RecommendationCard({ title, spot }) {
  return (
    <Card className="glass-card section-card" title={title}>
      {spot ? (
        <Descriptions column={1} size="small">
          <Descriptions.Item label="钓点">{spot.name}</Descriptions.Item>
          <Descriptions.Item label="城市">{spot.city || '-'}</Descriptions.Item>
          <Descriptions.Item label="类型">{spot.type || '-'}</Descriptions.Item>
          <Descriptions.Item label="价格">{spot.price || '-'}</Descriptions.Item>
          <Descriptions.Item label="评分">{spot.rating ?? 0}</Descriptions.Item>
          <Descriptions.Item label="距离">{spot.distanceText || '-'}</Descriptions.Item>
          <Descriptions.Item label="推荐角标">{spot.recommendationBadge || '-'}</Descriptions.Item>
          <Descriptions.Item label="推荐原因">{spot.recommendationReason || '-'}</Descriptions.Item>
          <Descriptions.Item label="推荐分">{spot.recommendationScore ?? '-'}</Descriptions.Item>
        </Descriptions>
      ) : (
        <Text type="secondary">当前条件下没有可推荐钓点。</Text>
      )}
    </Card>
  );
}

function DataManagementPage() {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();
  const [overview, setOverview] = useState(null);
  const [activeResource, setActiveResource] = useState('users');
  const [keyword, setKeyword] = useState('');
  const deferredKeyword = useDeferredValue(keyword);
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [loading, setLoading] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);
  const [userOptions, setUserOptions] = useState([]);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationData, setRecommendationData] = useState(null);
  const [recommendationQuery, setRecommendationQuery] = useState({
    userId: '',
    city: '',
    filterType: 'all',
    distanceLimit: '',
    ratingLimit: '',
    priceType: 'all',
    species: '',
    selectedSpotId: ''
  });

  const resourceConfig = resourceConfigs[activeResource];

  const tableColumns = useMemo(() => {
    return [
      ...resourceConfig.columns,
      {
        title: '操作',
        key: 'actions',
        width: 180,
        fixed: 'right',
        render: (_, record) => (
          <Space size="small">
            <Button type="link" icon={<EyeOutlined />} onClick={() => setDetailRecord(record)}>
              详情
            </Button>
            <Button type="link" icon={<EditOutlined />} onClick={() => openEditor(record)}>
              编辑
            </Button>
            <Button danger type="link" icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
              删除
            </Button>
          </Space>
        )
      }
    ];
  }, [resourceConfig]);

  async function loadOverview() {
    setOverviewLoading(true);
    try {
      const data = await getAdminOverview();
      setOverview(data);
    } catch (error) {
      message.error(error.message || '加载概览失败');
    } finally {
      setOverviewLoading(false);
    }
  }

  async function loadUserOptions() {
    try {
      const data = await getAuthOptions();
      const options = (data?.users || []).map((item) => ({
        label: `${item.nickname} (${item.id})`,
        value: item.id,
        city: item.city || ''
      }));
      setUserOptions(options);
      setRecommendationQuery((current) => {
        if (current.userId || !options.length) {
          return current;
        }

        return {
          ...current,
          userId: options[0].value,
          city: options[0].city || current.city
        };
      });
    } catch (error) {
      message.error(error.message || '加载用户列表失败');
    }
  }

  async function loadRecords() {
    setLoading(true);
    try {
      const data = await getAdminResource(activeResource, {
        keyword: deferredKeyword,
        page,
        pageSize: 10
      });
      setRecords(data.items || []);
      setPagination(data.pagination || { page: 1, pageSize: 10, total: 0 });
    } catch (error) {
      message.error(error.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  }

  async function loadRecommendations(queryOverride) {
    const query = queryOverride || recommendationQuery;
    const previewUserId = query.userId || getApiConfig().operatorId;

    setRecommendationLoading(true);
    try {
      const data = await getHomeRecommendations(
        {
          city: query.city || undefined,
          filterType: query.filterType || 'all',
          distanceLimit: query.distanceLimit || undefined,
          ratingLimit: query.ratingLimit || undefined,
          priceType: query.priceType || 'all',
          species: query.species || undefined,
          selectedSpotId: query.selectedSpotId || undefined
        },
        {
          ...getApiConfig(),
          operatorId: previewUserId
        }
      );
      setRecommendationData(data);
    } catch (error) {
      message.error(error.message || '加载推荐预览失败');
    } finally {
      setRecommendationLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
    loadUserOptions();
  }, []);

  useEffect(() => {
    loadRecords();
  }, [activeResource, deferredKeyword, page]);

  useEffect(() => {
    if (activeResource === 'spots' && recommendationQuery.userId) {
      loadRecommendations();
    }
  }, [activeResource, recommendationQuery.userId]);

  function openEditor(record = null) {
    setCurrentRecord(record);
    form.setFieldsValue(toFormValues(record));
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setCurrentRecord(null);
    form.resetFields();
  }

  async function handleSubmit(values) {
    setSubmitting(true);
    try {
      if (currentRecord?._id) {
        await updateAdminResource(activeResource, currentRecord._id, values);
        message.success(`${resourceConfig.label}已更新`);
      } else {
        await createAdminResource(activeResource, values);
        message.success(`${resourceConfig.label}已创建`);
      }

      closeEditor();
      await Promise.all([loadOverview(), loadRecords()]);
    } catch (error) {
      message.error(error.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(record) {
    modal.confirm({
      title: `删除${resourceConfig.label}`,
      content: `确认删除 ${record._id} 吗？此操作不可恢复。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        await deleteAdminResource(activeResource, record._id);
        message.success(`${resourceConfig.label}已删除`);
        if (records.length === 1 && page > 1) {
          setPage((value) => value - 1);
        } else {
          await loadRecords();
        }
        await loadOverview();
      }
    });
  }

  function handleTabChange(key) {
    setActiveResource(key);
    setKeyword('');
    setPage(1);
    setCurrentRecord(null);
    setDetailRecord(null);
    form.resetFields();
  }

  function sameCityColumns() {
    return [
      { title: '钓点', dataIndex: 'name', width: 180 },
      { title: '城市', dataIndex: 'city', width: 100 },
      { title: '距离', dataIndex: 'distanceText', width: 110, render: (value) => value || '-' },
      { title: '评分', dataIndex: 'rating', width: 90, render: (value) => value ?? 0 },
      { title: '推荐角标', dataIndex: 'recommendationBadge', width: 110, render: (value) => <Tag>{value || '-'}</Tag> },
      { title: '推荐原因', dataIndex: 'recommendationReason', ellipsis: true },
      { title: '推荐分', dataIndex: 'recommendationScore', width: 100, render: (value) => value ?? '-' }
    ];
  }

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div className="page-section-header">
        <div>
          <Title level={3} className="section-title">
            数据管理
          </Title>
          <Text type="secondary">查看核心业务数据，并在后台执行新增、编辑、删除操作。</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} loading={overviewLoading || loading} onClick={() => Promise.all([loadOverview(), loadRecords()])}>
            刷新数据
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>
            新增{resourceConfig.label}
          </Button>
        </Space>
      </div>

      <Row gutter={[18, 18]}>
        <Col xs={24} md={12} xl={6}>
          <KpiCard title="用户" value={overview?.counts?.users} trend="全量数据" color="blue" />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <KpiCard title="钓点" value={overview?.counts?.spots} trend="核心资源" color="green" />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <KpiCard title="内容" value={overview?.counts?.contents} trend="发帖数据" color="purple" />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <KpiCard title="评论" value={overview?.counts?.comments} trend="互动数据" color="orange" />
        </Col>
        <Col xs={24} md={12} xl={6}>
          <KpiCard title="举报" value={overview?.counts?.reports} trend="治理线索" color="red" />
        </Col>
      </Row>

      <Card className="glass-card section-card">
        <Tabs
          activeKey={activeResource}
          onChange={handleTabChange}
          items={Object.entries(resourceConfigs).map(([key, config]) => ({
            key,
            label: config.label
          }))}
        />

        <Space wrap size="middle" style={{ justifyContent: 'space-between', width: '100%', marginBottom: 16 }}>
          <Search
            allowClear
            placeholder={resourceConfig.searchPlaceholder}
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
              setPage(1);
            }}
            style={{ maxWidth: 360 }}
          />
          <Text type="secondary">当前共 {pagination.total || 0} 条 {resourceConfig.label} 数据</Text>
        </Space>

        <Table
          rowKey="_id"
          loading={loading}
          columns={tableColumns}
          dataSource={records}
          scroll={{ x: 1200 }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: false,
            onChange: (nextPage) => setPage(nextPage)
          }}
        />
      </Card>

      {activeResource === 'spots' ? (
        <Card
          className="glass-card section-card"
          title="推荐预览"
          extra={
            <Button icon={<ReloadOutlined />} loading={recommendationLoading} onClick={() => loadRecommendations()}>
              刷新推荐
            </Button>
          }
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} xl={6}>
              <div className="detail-block">
                <Text type="secondary">预览用户</Text>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  value={recommendationQuery.userId}
                  options={userOptions}
                  onChange={(value) => {
                    const selected = userOptions.find((item) => item.value === value);
                    setRecommendationQuery((current) => ({
                      ...current,
                      userId: value,
                      city: current.city || selected?.city || ''
                    }));
                  }}
                />
              </div>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <div className="detail-block">
                <Text type="secondary">城市</Text>
                <Input
                  style={{ marginTop: 8 }}
                  value={recommendationQuery.city}
                  onChange={(event) => setRecommendationQuery((current) => ({ ...current, city: event.target.value }))}
                  placeholder="留空按用户城市"
                />
              </div>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <div className="detail-block">
                <Text type="secondary">类型筛选</Text>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  value={recommendationQuery.filterType}
                  options={filterTypeOptions}
                  onChange={(value) => setRecommendationQuery((current) => ({ ...current, filterType: value }))}
                />
              </div>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <div className="detail-block">
                <Text type="secondary">价格筛选</Text>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  value={recommendationQuery.priceType}
                  options={priceTypeOptions}
                  onChange={(value) => setRecommendationQuery((current) => ({ ...current, priceType: value }))}
                />
              </div>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <div className="detail-block">
                <Text type="secondary">距离筛选</Text>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  value={recommendationQuery.distanceLimit}
                  options={distanceLimitOptions}
                  onChange={(value) => setRecommendationQuery((current) => ({ ...current, distanceLimit: value }))}
                />
              </div>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <div className="detail-block">
                <Text type="secondary">评分筛选</Text>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  value={recommendationQuery.ratingLimit}
                  options={ratingLimitOptions}
                  onChange={(value) => setRecommendationQuery((current) => ({ ...current, ratingLimit: value }))}
                />
              </div>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <div className="detail-block">
                <Text type="secondary">鱼种</Text>
                <Input
                  style={{ marginTop: 8 }}
                  value={recommendationQuery.species}
                  onChange={(event) => setRecommendationQuery((current) => ({ ...current, species: event.target.value }))}
                  placeholder="例如 鲫鱼"
                />
              </div>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <div className="detail-block">
                <Text type="secondary">指定当前推荐 ID</Text>
                <Input
                  style={{ marginTop: 8 }}
                  value={recommendationQuery.selectedSpotId}
                  onChange={(event) => setRecommendationQuery((current) => ({ ...current, selectedSpotId: event.target.value }))}
                  placeholder="留空按排序取第一条"
                />
              </div>
            </Col>
          </Row>

          <Space style={{ marginTop: 16 }}>
            <Button type="primary" loading={recommendationLoading} onClick={() => loadRecommendations()}>
              生成推荐预览
            </Button>
            <Text type="secondary">{recommendationData?.filterSummaryText || '可在这里直接查看当前推荐与同城推荐结果。'}</Text>
          </Space>

          <Row gutter={[18, 18]} style={{ marginTop: 4 }}>
            <Col xs={24} xl={8}>
              <RecommendationCard title="当前推荐" spot={recommendationData?.featuredSpot} />
            </Col>
            <Col xs={24} xl={16}>
              <Card className="glass-card section-card" title="同城推荐">
                <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="生效城市">{recommendationData?.activeCity || '-'}</Descriptions.Item>
                  <Descriptions.Item label="当前推荐说明">{recommendationData?.featuredSectionNote || '-'}</Descriptions.Item>
                  <Descriptions.Item label="同城推荐说明">{recommendationData?.recommendationSectionNote || '-'}</Descriptions.Item>
                </Descriptions>
                <Table
                  rowKey="id"
                  loading={recommendationLoading}
                  columns={sameCityColumns()}
                  dataSource={recommendationData?.recommendedSpots || []}
                  pagination={{ pageSize: 5, showSizeChanger: false }}
                  scroll={{ x: 900 }}
                />
              </Card>
            </Col>
          </Row>
        </Card>
      ) : null}

      <Modal
        title={`${currentRecord ? '编辑' : '新增'}${resourceConfig.label}`}
        open={editorOpen}
        onCancel={closeEditor}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        destroyOnHidden
        width={760}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            {resourceConfig.fields.map((field) => (
              <Col span={field.type === 'textarea' ? 24 : 12} key={field.name}>
                <Form.Item
                  label={field.label}
                  name={field.name}
                  rules={field.required ? [{ required: true, message: `请输入${field.label}` }] : undefined}
                >
                  {renderField(field)}
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Form>
      </Modal>

      <Drawer
        title={`${resourceConfig.label}详情`}
        open={Boolean(detailRecord)}
        onClose={() => setDetailRecord(null)}
        width={720}
      >
        {detailRecord ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="记录 ID">{detailRecord._id}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{formatDateTime(detailRecord.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{formatDateTime(detailRecord.updatedAt)}</Descriptions.Item>
            </Descriptions>
            <div className="json-panel">
              <pre className="json-pre">{JSON.stringify(detailRecord, null, 2)}</pre>
            </div>
          </Space>
        ) : null}
      </Drawer>
    </Space>
  );
}

export default DataManagementPage;
