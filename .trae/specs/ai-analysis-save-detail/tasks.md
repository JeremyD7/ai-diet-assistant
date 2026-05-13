
# Tasks

## 任务 1：检查数据库表结构
- [x] 1.1 检查 Supabase 数据库是否存在 `meals` 表
- [x] 1.2 通过 SQL 创建 `meals` 表及 RLS 策略

## 任务 2：改造 startAnalyze 方法
- [x] 2.1 引入 `supabase` 客户端（已有）
- [x] 2.2 修改 `startAnalyze`，在 AI 返回有效结果后调用 `supabase.from('meals').insert()` 保存数据
- [x] 2.3 获取返回的记录 ID
- [x] 2.4 跳转至详情页 `uni.navigateTo({ url: '/pages/result/result?id=' + recordId })`

## 任务 3：检查 pages.json 配置
- [x] 3.1 确认 `pages/result/result.vue` 已在 `pages.json` 中注册
- [x] 3.2 路由配置正确

## 任务 4：实现结果详情页
- [x] 4.1 创建 `pages/result/result.vue` 基础结构（template + script + style）
- [x] 4.2 在 `onLoad` 中解析路由参数（`id` 或 `desc`）
- [x] 4.3 如有 `id`，从 `meals` 表查询完整记录
- [x] 4.4 展示食物图片、描述、营养数据、健康评分、AI 建议
- [x] 4.5 展示创建时间
- [x] 4.6 添加"返回首页"按钮

## 任务 5：测试完整流程
- [ ] 5.1 拍照/选择图片 → 上传 → 点击预览图分析
- [ ] 5.2 验证 AI 分析结果保存成功
- [ ] 5.3 验证跳转至详情页并正确展示数据
- [ ] 5.4 验证历史记录列表已更新

# Task Dependencies
- 任务 3 依赖 任务 4（需先创建页面才能注册路由）
- 任务 5 依赖 任务 1、2、3、4 全部完成
