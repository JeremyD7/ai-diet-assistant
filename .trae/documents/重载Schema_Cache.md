
# ✅ 已修复

## 执行的操作
```sql
NOTIFY pgrst, 'reload schema';
```

## 结果
Schema cache 已重载，`advice` 列现在应该可以被正常访问。

## 下一步
请重新测试完整流程：拍照 → 分析 → 保存 → 查看详情
