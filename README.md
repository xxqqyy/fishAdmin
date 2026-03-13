# Fish Admin

`fishAdmin` 是 Fish 项目的运营后台，基于 `React + Vite + Ant Design` 构建。

当前主要用于：
- 内容治理与风控处理
- 举报中心查看与人工补录
- 核心业务数据管理
- 首页推荐与同城推荐预览
- 后端连接配置与联调

## 页面能力

当前后台包含以下页面：
- `治理总览`：查看风险对象、举报原因分布、治理状态和最近操作
- `数据管理`：管理用户、钓点、内容、评论、举报，支持新增、编辑、删除
- `推荐预览`：在钓点管理中直接查看“当前推荐”和“同城推荐”结果
- `内容治理`：查看高风险内容并执行隐藏、处置、恢复
- `举报中心`：查看举报记录并手工提交举报
- `系统设置`：配置 API Base URL 和操作账号

## 本地启动

```bash
npm install
npm run dev
```

默认开发地址：

```text
http://localhost:5173
```

## 构建

```bash
npm run build
```

## 环境变量

可通过 `.env.example` 配置默认连接参数：

```env
VITE_API_BASE_URL=http://127.0.0.1:3100/api/v1
VITE_OPERATOR_ID=u-001
```

说明：
- `VITE_API_BASE_URL`：后台默认请求地址
- `VITE_OPERATOR_ID`：默认操作账号 ID

运行时也可以在“系统设置”页面里直接修改接口地址和操作账号。

## 后端依赖

后台默认对接 `fishBackEnd`，主要会调用这些接口：
- `/health`
- `/moderation/*`
- `/reports`
- `/community/index`
- `/spots/:spotId`
- `/admin/*`
- `/home/recommendations`
- `/users/auth/options`

## 当前注意事项

- 当前鉴权仍沿用项目里的 mock 方案，不是正式权限系统
- `fishAdmin` 依赖后端管理接口，启动前请确保 `fishBackEnd` 已运行
- “数据管理”里的推荐预览，本质上是对后端推荐接口的可视化联调入口

