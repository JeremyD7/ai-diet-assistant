# 混乱AI返回格式修复计划

## 问题分析

**错误示例**：
```json
{
  "total_calories": 2250千卡",
  "protein_g":  "22",
  "fat_g":  "11克",
  "carbs_g":  " " "克",
  "health_score":  "7 "分",
  "advice": "高饮食建议"
}
{"error": "无法识别食物"}
```

**问题根源**：
1. 两个JSON对象拼接在一起
2. JSON内部值包含中文单位等非JSON字符
3. 缺少健壮的JSON修复和提取机制

## 修复方案

### 1. 改进系统提示词
更严格要求返回纯JSON，禁止包含单位说明等额外内容。

### 2. 增强JSON提取逻辑
- 提取**第一个** `{` 和匹配的 `}` 对，忽略后面的内容
- 添加JSON格式清理（修复引号、逗号等常见错误）

### 3. 添加正则直接提取备选方案
当JSON解析完全失败时，直接从文本中用正则提取数值。

### 4. 修复 `normalizeNutritionData`
即使JSON解析失败，也能提取有效数据返回。

## 修改文件

**c:\Users\14187\Desktop\ai-diet-assistant\supabase\functions\analyze-food\index.ts**
- 改进系统提示词
- 重写 `extractAndParseJson` 函数
- 添加 `extractFallbackData` 函数作为备选方案

## 预期结果

- 即使AI返回混乱格式，也能正确提取营养数据
- 不会触发 fallback，正常保存到 meals 表
- 详情页显示正确数据
