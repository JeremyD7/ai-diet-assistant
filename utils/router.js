import { supabase } from '@/lib/supabase.js'

// 公开页面白名单（不需要登录即可访问）
const whiteList = ['/pages/login/login']

/**
 * 检查用户登录状态
 * @returns {Promise<boolean>} 是否已登录
 */
export async function checkAuth() {
	try {
		const { data: { user }, error } = await supabase.auth.getUser()
		if (error) {
			console.error('检查登录状态失败:', error)
			return false
		}
		return !!user
	} catch (e) {
		console.error('检查登录状态异常:', e)
		return false
	}
}

/**
 * 路由守卫 - 检查登录状态
 * 如果未登录，自动跳转到登录页面
 * @param {string} path - 当前页面路径
 */
export async function requireAuth(path) {
	// 如果在白名单中，直接放行
	if (whiteList.includes(path)) {
		return
	}
	
	// 检查登录状态
	const isLoggedIn = await checkAuth()
	if (!isLoggedIn) {
		console.log(`未登录，重定向到登录页: ${path}`)
		uni.redirectTo({ url: '/pages/login/login' })
	}
}

/**
 * 获取当前登录用户信息
 * @returns {Promise<Object|null>} 用户信息
 */
export async function getCurrentUser() {
	try {
		const { data: { user }, error } = await supabase.auth.getUser()
		if (error) {
			console.error('获取用户信息失败:', error)
			return null
		}
		return user
	} catch (e) {
		console.error('获取用户信息异常:', e)
		return null
	}
}

/**
 * 登出
 * @returns {Promise<void>}
 */
export async function logout() {
	try {
		const { error } = await supabase.auth.signOut()
		if (error) {
			console.error('登出失败:', error)
			throw error
		}
		uni.redirectTo({ url: '/pages/login/login' })
	} catch (e) {
		console.error('登出异常:', e)
		throw e
	}
}
