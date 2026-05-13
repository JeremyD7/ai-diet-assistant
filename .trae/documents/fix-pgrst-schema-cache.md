# meals表advice列Schema Cache问题修复计划

## 问题分析

**错误**：`PGRST204 - Could not find the 'advice' column of 'meals' in the schema cache`

**原因**：表和列确实存在，但 Supabase 的 PostgREST 组件的 schema cache 没有同步。

**证据**：查询显示 `public.meals` 表包含 `advice` 列：
- columns 中有 `{"name":"advice","data_type":"text"}`
- RLS 已启用
- 表有0行数据

## 修复方案

### 1. 刷新 PostgREST Schema Cache（核心修复）

执行 SQL 命令通知 PostgREST 重新加载 schema：

```sql
NOTIFY pgrst, 'reload schema';
```

### 2. 验证修复

刷新后，尝试插入一条测试数据确认：

```sql
-- 检查RLS策略是否存在
SELECT * FROM pg_policies WHERE tablename = 'meals';

-- 测试插入（需要有效的user_id）
INSERT INTO meals (user_id, total_calories, protein_g, fat_g, carbs_g, health_score, advice)
VALUES ('test-user-id', 200, 10, 5, 30, 7, '测试建议');
```

## 预期结果

- NOTIFY 命令执行成功（无输出）
- 再次调用分析接口时不再出现 PGRST204 错误
- 数据成功保存到 meals 表

## 风险评估

- **低风险**：NOTIFY 是只读操作，不会修改数据
- **必需操作**：这是 Supabase 的已知问题，schema 变更后需要手动刷新
