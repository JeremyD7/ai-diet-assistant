# AI饮食分析返回格式错误修复计划

## 问题分析

AI模型返回的JSON包含大量垃圾文本和重复字符：
```
"protein_g":  "30,
"fat_g":  "1 ",
"carbsg":  "0 ",
"health_score":  "3 " pérdida
```

问题根源：
1. AI模型返回格式不稳定，JSON被错误字符污染
2. 当前正则提取逻辑在AI返回格式混乱时会失败
3. 解析后缺少数据验证

## 修复方案

### 1. 增强Edge Function的JSON提取和验证

**文件**: `c:\Users\14187\Desktop\ai-diet-assistant\supabase\functions\analyze-food\index.ts`

修改内容：
- 添加更健壮的JSON提取逻辑
- 添加数据验证，确保数值字段是有效数字
- 添加错误时返回更友好的提示

### 2. 数据类型标准化

在解析JSON后，添加后处理：
```typescript
// 确保所有数值字段是正确的数字类型
result.total_calories = Number(result.total_calories) || 0
result.protein_g = Number(result.protein_g?.toString().replace(/[^\d.]/g, '')) || 0
result.fat_g = Number(result.fat_g?.toString().replace(/[^\d.]/g, '')) || 0
result.carbs_g = Number(result.carbs_g?.toString().replace(/[^\d.]/g, '').replace('g', '')) || 0
result.health_score = Math.min(10, Math.max(1, Number(result.health_score?.toString().replace(/[^\d]/g, '')) || 5))
```

### 3. 添加健康评分默认值

当health_score无法解析时，默认设为5分。

## 验证步骤

1. 保存修改后重新部署Edge Function
2. 测试输入"一碗米饭"验证返回
3. 验证数据是否正确保存到meals表
4. 检查详情页显示是否正常
