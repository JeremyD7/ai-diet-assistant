# 对接 Supabase 登录注册 - 实施计划

## 📋 需求分析
将当前模拟的登录/注册功能替换为真实的 Supabase Auth API 调用，保持现有 UI 设计不变。

## 📁 项目现状
- **Supabase 配置**：[lib/supabase.js](file:///c:/Users/14187/Desktop/ai-diet-assistant/lib/supabase.js) 已存在且配置完成
- **当前架构**：使用 Options API（而非 Composition API）
- **当前页面**：[pages/login/login.vue](file:///c:/Users/14187/Desktop/ai-diet-assistant/pages/login/login.vue) 已使用邮箱+密码表单

## 🎯 目标状态
- ✅ 登录调用 `supabase.auth.signInWithPassword`
- ✅ 注册调用 `supabase.auth.signUp`
- ✅ 显示错误消息提示
- ✅ 成功后跳转至首页
- ✅ 保留所有现有 UI 和交互效果

## 🔧 实施步骤

### 步骤 1：导入 Supabase
在 script 顶部添加 import 语句，引入 Supabase 客户端

### 步骤 2：添加错误状态变量
在 data() 中新增 `errorMsg` 字段用于显示错误信息

### 步骤 3：重构 handleLogin 方法
替换模拟登录逻辑为真实的 Supabase API 调用：
- 验证邮箱和密码必填
- 调用 `supabase.auth.signInWithPassword`
- 错误处理与提示
- 成功后跳转到首页

### 步骤 4：重构 handleRegister 方法
替换模拟注册逻辑为真实的 Supabase API 调用：
- 验证所有必填字段（邮箱、密码、确认密码、协议同意）
- 调用 `supabase.auth.signUp`
- 错误处理与提示
- 注册成功后自动登录或切换到登录页

### 步骤 5：添加错误消息显示 UI
在表单区域添加错误提示文本（可复用现有的样式）

## 📝 技术细节

### 修改文件
- **唯一文件**：[pages/login/login.vue](file:///c:/Users/14187/Desktop/ai-diet-assistant/pages/login/login.vue)

### 主要变更点
1. **script 开头**：添加 `import { supabase } from '@/lib/supabase.js'`
2. **data()**：新增 `errorMsg: ''`
3. **handleLogin**：替换为真实 API 调用
4. **handleRegister**：替换为真实 API 调用
5. **template**：添加错误消息显示区域

### 保留的功能
- ✅ 标签切换器
- ✅ 表单输入验证
- ✅ 密码显示/隐藏
- ✅ 记住我和协议勾选
- ✅ 所有动画和样式
- ✅ 社交登录占位（暂时保留）

### 错误处理
- 使用 `uni.showToast` 显示简短错误
- 可选：添加详细错误消息显示在表单上方
- 正确的 loading 状态管理

## ✅ 验证清单
- [ ] 登录功能正常工作
- [ ] 注册功能正常工作
- [ ] 错误提示正确显示
- [ ] 成功跳转正常
- [ ] loading 状态正确显示
- [ ] 所有现有 UI 不受影响

## ⚠️ 注意事项
- 保持 Options API 架构（避免重构为 setup，因为这是 uni-app 项目）
- 保留所有现有的视觉和交互效果
- 确保错误提示友好且用户友好
- 不破坏已有的表单验证逻辑
