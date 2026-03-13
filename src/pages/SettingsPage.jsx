import { App, Button, Card, Form, Input, Space, Typography } from 'antd';
import { LinkOutlined, SafetyOutlined, SaveOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { checkHealth, getApiConfig, setApiConfig } from '../lib/api';

const { Title, Text, Paragraph } = Typography;

function SettingsPage({ onHealthCheck }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave(values) {
    setSaving(true);
    try {
      setApiConfig(values);
      await onHealthCheck?.();
      message.success('接口配置已保存');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    const values = form.getFieldsValue();
    setTesting(true);
    try {
      const result = await checkHealth(values);
      message.success(`${values.baseUrl} 连接成功，状态：${result.status}`);
    } catch (error) {
      message.error(error.message || '连接失败');
    } finally {
      setTesting(false);
    }
  }

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div className="page-section-header">
        <div>
          <Title level={3} className="section-title">
            系统设置
          </Title>
          <Text type="secondary">管理后端连接地址与操作身份，用于对接本地或测试环境。</Text>
        </div>
      </div>

      <Card className="glass-card section-card">
        <Form
          layout="vertical"
          form={form}
          initialValues={getApiConfig()}
          onFinish={handleSave}
        >
          <Form.Item
            label="API Base URL"
            name="baseUrl"
            rules={[{ required: true, message: '请输入接口地址' }]}
          >
            <Input prefix={<LinkOutlined />} placeholder="http://127.0.0.1:3100/api/v1" />
          </Form.Item>

          <Form.Item
            label="操作账号 ID"
            name="operatorId"
            rules={[{ required: true, message: '请输入操作账号 ID' }]}
          >
            <Input prefix={<SafetyOutlined />} placeholder="u-001" />
          </Form.Item>

          <Space>
            <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={saving}>
              保存配置
            </Button>
            <Button onClick={handleTest} loading={testing}>
              测试连接
            </Button>
          </Space>
        </Form>
      </Card>

      <Card className="glass-card section-card" title="接入说明">
        <Paragraph>
          当前 admin 默认请求 <Text code>http://127.0.0.1:3100/api/v1</Text>，会同时携带
          <Text code>Authorization: Bearer u-001</Text> 和 <Text code>x-user-id: u-001</Text>。
        </Paragraph>
        <Paragraph>
          治理动作会直接触发现有后端的 <Text code>/moderation/hide</Text>、
          <Text code>/moderation/resolve</Text>、<Text code>/moderation/restore</Text>。
        </Paragraph>
      </Card>
    </Space>
  );
}

export default SettingsPage;
