import { Button, Card, Form, Input, Select, Space, Typography } from 'antd';

const { Text } = Typography;

const targetOptions = [
  { label: '钓点', value: 'spot' },
  { label: '内容', value: 'content' }
];

function ReportComposer({ loading, onSubmit }) {
  const [form] = Form.useForm();

  async function handleFinish(values) {
    const success = await onSubmit?.(values);
    if (success) {
      form.resetFields();
    }
  }

  return (
    <Card className="glass-card section-card">
      <Space direction="vertical" size={18} style={{ width: '100%' }}>
        <div>
          <Typography.Title level={4} className="section-title">
            手工提交举报
          </Typography.Title>
          <Text type="secondary">便于运营或客服补录用户线下反馈，直接进入现有举报流程。</Text>
        </div>

        <Form layout="vertical" form={form} onFinish={handleFinish}>
          <Form.Item
            label="目标类型"
            name="targetType"
            rules={[{ required: true, message: '请选择目标类型' }]}
          >
            <Select options={targetOptions} placeholder="选择被举报对象类型" />
          </Form.Item>

          <Form.Item
            label="目标 ID"
            name="targetId"
            rules={[{ required: true, message: '请输入目标 ID' }]}
          >
            <Input placeholder="例如 spot_001 或 content_001" />
          </Form.Item>

          <Form.Item
            label="举报原因"
            name="reason"
            rules={[
              { required: true, message: '请输入举报原因' },
              { max: 50, message: '举报原因最多 50 个字符' }
            ]}
          >
            <Input.TextArea rows={4} placeholder="例如：广告引流、辱骂、内容失实" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={loading}>
            提交举报
          </Button>
        </Form>
      </Space>
    </Card>
  );
}

export default ReportComposer;
