
# Checklist

## 数据库与配置
- [x] `meals` 表已创建，包含所有必要字段（id, user_id, image_url, description, total_calories, protein_g, fat_g, carbs_g, health_score, advice, created_at）
- [x] RLS 策略已配置（用户只能查看自己的记录）
- [x] `pages.json` 中已注册 `pages/result/result` 路由

## startAnalyze 方法改造
- [x] 调用 `supabase.functions.invoke('analyze-food')` 获取 AI 结果
- [x] AI 返回有效结果后调用 `supabase.from('meals').insert()` 保存数据
- [x] 获取插入记录的 ID
- [x] 保存成功后跳转至详情页 `uni.navigateTo({ url: '/pages/result/result?id=' + recordId })`
- [x] 错误处理完整（AI 调用失败、数据保存失败等情况）

## 结果详情页实现
- [x] `pages/result/result.vue` 文件已创建
- [x] 页面加载时正确解析路由参数（`id` 或 `desc`）
- [x] 如有 `id`，从 `meals` 表查询并展示记录
- [x] 展示食物图片（如有）
- [x] 展示食物描述
- [x] 展示营养成分卡片（热量、蛋白质、脂肪、碳水）
- [x] 展示健康评分
- [x] 展示 AI 饮食建议
- [x] 展示创建时间
- [x] "返回首页"按钮功能正常

## 完整流程测试（需手动测试）
- [ ] 拍照/选择图片功能正常
- [ ] 图片上传到 Supabase Storage 成功
- [ ] 点击预览图触发 `startAnalyze`
- [ ] AI 分析结果保存并跳转至详情页
- [ ] 详情页正确展示完整数据
- [ ] 历史记录列表显示新记录
