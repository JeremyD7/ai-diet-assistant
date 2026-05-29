<script>
import { supabase } from '@/lib/supabase.js'

export default {
	onLaunch: async function () {
		console.log('App Launch')
		try {
			const { data: { user } } = await supabase.auth.getUser()
			if (user) {
				console.log('已有登录状态，跳转到首页')
				uni.reLaunch({ url: '/pages/index/index' })
			}
		} catch (e) {
			console.error('启动时检查登录状态失败:', e)
		}
	},
	onShow: function () {
		console.log('App Show')
	},
	onHide: function () {
		console.log('App Hide')
	}
}
</script>

<style>
/* 全局样式变量 */
:root {
	--primary-color: #4CAF50;
	--primary-light: #81C784;
	--primary-dark: #388E3C;
	--accent-color: #FF9800;
	--accent-light: #FFB74D;
	--text-primary: #212121;
	--text-secondary: #757575;
	--text-light: #BDBDBD;
	--bg-primary: #ffffff;
	--bg-secondary: #f8f9fa;
	--bg-gradient: linear-gradient(135deg, #e8f5e9 0%, #fff8e1 100%);
	--border-color: #e0e0e0;
	--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
	--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.12);
	--shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.16);
	--radius-sm: 8rpx;
	--radius-md: 16rpx;
	--radius-lg: 24rpx;
	--radius-xl: 32rpx;
}

/* 全局重置和基础样式 */
page {
	background-color: var(--bg-secondary);
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
	color: var(--text-primary);
	line-height: 1.6;
}

view, text, image {
	box-sizing: border-box;
}

/* 通用工具类 */
.flex {
	display: flex;
}

.flex-col {
	flex-direction: column;
}

.items-center {
	align-items: center;
}

.justify-center {
	justify-content: center;
}

.justify-between {
	justify-content: space-between;
}

.w-full {
	width: 100%;
}

.h-full {
	height: 100%;
}

.text-center {
	text-align: center;
}
</style>
