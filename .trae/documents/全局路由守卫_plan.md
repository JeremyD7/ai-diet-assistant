# 添加全局路由守卫 - 实施计划

## 📋 需求分析
添加全局路由守卫，在用户未登录时自动重定向到登录页面，确保需要登录的页面只能被已认证用户访问。

## 📁 项目现状
- **App.vue**：只有基础的生命周期钩子，无路由守卫
- **Supabase**：已配置完成，可通过 `supabase.auth.getUser()` 检查登录状态
- **页面结构**：
  - `/pages/login/login` - 登录页面（公开）
  - `/pages/index/index` - 首页（需要登录）
  - `/pages/result/result` - 结果页（需要登录）

## 🎯 目标状态
- ✅ 应用启动时检查登录状态
- ✅ 页面切换时检查登录状态
- ✅ 未登录时自动跳转登录页
- ✅ 登录页面不受路由守卫影响（避免无限循环）

## 🔧 实施步骤

### 步骤 1：修改 App.vue
在 App.vue 的 script 中添加：
1. 导入 Supabase 客户端
2. 在 `onLaunch` 中检查初始登录状态
3. 在 `onShow` 中再次验证登录状态
4. 添加路由拦截逻辑

### 步骤 2：创建路由守卫工具函数（可选）
创建 `utils/router.js` 工具文件，封装登录检查逻辑：
- `checkAuth()` - 检查用户登录状态
- `requireAuth()` - 需要登录的路由守卫

### 步骤 3：配置公开页面白名单
定义不需要登录的页面列表：
- `/pages/login/login`

### 步骤 4：添加全局路由监听
使用 `uni.onAppRoute` 监听所有页面跳转，在跳转前检查登录状态

## 📝 技术细节

### 修改文件
1. **App.vue** - 添加路由守卫逻辑
2. **可选：utils/router.js** - 路由工具函数

### 核心逻辑
```javascript
// 检查登录状态
async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser()
  return !!user
}

// 路由拦截
uni.onAppRoute((options) => {
  const whiteList = ['/pages/login/login']
  const currentPath = options.path
  
  // 如果不在白名单中，检查登录状态
  if (!whiteList.includes(currentPath)) {
    checkAuth().then(isLoggedIn => {
      if (!isLoggedIn) {
        uni.redirectTo({ url: '/pages/login/login' })
      }
    })
  }
})
```

### 关键注意事项
1. **避免无限循环**：登录页面必须在白名单中
2. **异步处理**：`supabase.auth.getUser()` 是异步操作
3. **使用 redirectTo**：避免页面栈累积，使用 `redirectTo` 而不是 `navigateTo`
4. **应用启动检查**：在 `onLaunch` 中也要检查

## ✅ 验证清单
- [ ] 未登录时访问首页自动跳转到登录页
- [ ] 未登录时访问结果页自动跳转到登录页
- [ ] 登录页面可以正常访问
- [ ] 登录成功后可以正常访问所有页面
- [ ] 没有无限循环问题

## ⚠️ 注意事项
- 使用 `redirectTo` 而不是 `navigateTo`，避免页面栈问题
- 登录页面必须在白名单中
- 异步检查需要正确处理 Promise
- 在 onLaunch 和 onShow 中都需要检查状态
