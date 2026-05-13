
# AI 饮食分析 - 保存与详情展示 Spec

## Why
用户需要将 AI 分析结果保存到数据库并查看历史记录的详细信息，完善从拍照/输入到分析再到保存查看的完整闭环流程。

## What Changes
- 在 `startAnalyze` 方法中调用 Edge Function 获取 AI 分析结果
- 将分析结果（图片 URL、描述、营养数据等）存入 Supabase `meals` 表，自动关联当前用户
- 新建结果详情页 `pages/result/result.vue`，通过路由参数展示饮食记录的完整信息
- 配置 `pages.json` 注册新页面，确保页面可跳转

## Impact
- Affected specs: 用户认证、历史记录列表
- Affected code: `pages/index/index.vue`、`pages/result/result.vue`、`pages.json`、Supabase 数据库

## ADDED Requirements

### Requirement: AI 分析结果保存
系统 SHALL 在获取 AI 分析结果后，自动将以下数据保存到 `meals` 表：
- `user_id`: 当前登录用户的 ID
- `image_url`: 上传的图片 URL（如有）
- `description`: 食物描述文本
- `total_calories`: 总热量（千卡）
- `protein_g`: 蛋白质含量（克）
- `fat_g`: 脂肪含量（克）
- `carbs_g`: 碳水化合物含量（克）
- `health_score`: 健康评分（1-10）
- `advice`: AI 饮食建议
- `created_at`: 创建时间（自动生成）

#### Scenario: 保存分析结果
- **WHEN** 用户点击分析，AI 返回有效结果
- **THEN** 系统自动将数据插入 `meals` 表，并跳转至结果详情页

### Requirement: 结果详情页展示
系统 SHALL 提供结果详情页 `pages/result/result.vue`，通过路由参数（记录 ID）展示：
- 食物图片（如有）
- 食物描述
- 营养成分卡片（热量、蛋白质、脂肪、碳水）
- 健康评分及建议
- 创建时间

#### Scenario: 查看历史记录详情
- **WHEN** 用户点击历史记录列表项
- **THEN** 跳转至详情页，展示完整饮食记录信息

## MODIFIED Requirements

### Requirement: startAnalyze 方法改造
现有 `startAnalyze` 方法 SHALL 改造为：
1. 调用 `supabase.functions.invoke('analyze-food')` 获取 AI 结果
2. AI 返回有效结果后，调用 `supabase.from('meals').insert()` 保存到数据库
3. 保存成功后，跳转至结果详情页 `pages/result/result?id=${recordId}`

## REMOVED Requirements
无

## Technical Notes

### 数据库表结构（meals）
```sql
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  image_url TEXT,
  description TEXT,
  total_calories DECIMAL,
  protein_g DECIMAL,
  fat_g DECIMAL,
  carbs_g DECIMAL,
  health_score INTEGER,
  advice TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 策略：用户只能查看自己的记录
CREATE POLICY "用户只能查看自己的记录" ON meals
  FOR SELECT USING (auth.uid() = user_id);
```

### 路由参数
- 详情页接收参数：`id`（meals 表主键）或 `desc`（纯文本描述，无 ID）
