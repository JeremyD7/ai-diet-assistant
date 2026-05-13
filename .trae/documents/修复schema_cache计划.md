
# 修复 Supabase Schema Cache 问题 - 实施计划

## 问题分析

错误信息：
```
"Could not find the 'advice' column of 'meals' in the schema cache"
```

数据库表结构检查显示 `advice` 列确实存在于 `meals` 表中，但 Supabase 的 PostgREST schema cache 未更新，导致查询时找不到该列。

## 修复方案

### 方案 1：在 Supabase Dashboard 中Reload Schema（推荐）

1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 执行以下 SQL 重启 PostgREST：

```sql
NOTIFY pgrst, 'reload schema';
```

### 方案 2：重启 Supabase 项目

1. 进入 Supabase 项目设置
2. 点击 "Restart project" 或 "Reset database"

## 修改文件

暂不需要修改代码，问题在 Supabase 端。

## 执行步骤

请用户在 Supabase Dashboard 中执行 NOTIFY 命令来重载 schema cache。
