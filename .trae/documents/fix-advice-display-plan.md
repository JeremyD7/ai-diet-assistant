# 修复 AI 建议显示功能

## 问题分析
详情页已经有了 AI 建议的显示功能（第 80-88 行），但在保存数据时，`advice` 字段被注释掉了，导致无法存储到数据库。

## 需要修改的文件
1. `pages/index/index.vue` - 恢复保存 advice 字段

## 修改步骤
### 1. 在 `pages/index/index.vue` 中
- 取消第 426 行的注释，让 `advice` 字段被保存到数据库

## 修复内容
```javascript
// 原代码（第426行）
// advice: data.advice

// 修改为
advice: data.advice
```

## 验证步骤
1. 修改后重新编译运行
2. 创建新的食物记录
3. 检查详情页是否显示 AI 建议

## 风险评估
- 低风险：只修改一行代码，取消注释即可
