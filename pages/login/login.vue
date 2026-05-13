<template>
	<view class="login-container">
		<!-- 顶部装饰图形 -->
		<view class="decoration-top">
			<view class="circle circle-1"></view>
			<view class="circle circle-2"></view>
			<view class="circle circle-3"></view>
		</view>

		<scroll-view class="scroll-content" scroll-y="true">
			<!-- Logo 和标语区域 -->
			<view class="header-section animate-fade-in">
				<view class="logo-wrapper">
					<image class="logo" src="/static/logo.png" mode="aspectFit"></image>
				</view>
				<text class="app-name">AI 饮食助手</text>
				<text class="tagline">智能健康，科学饮食</text>
			</view>

			<!-- 标签切换器 -->
			<view class="tabs-section animate-slide-up">
				<view class="tabs-wrapper">
					<view class="tab-item" :class="{ active: activeTab === 'login' }" @tap="switchTab('login')">
						<text class="tab-text">登录</text>
					</view>
					<view class="tab-item" :class="{ active: activeTab === 'register' }" @tap="switchTab('register')">
						<text class="tab-text">注册</text>
					</view>
					<view class="tab-indicator" :class="activeTab"></view>
				</view>
			</view>

			<!-- 表单区域 -->
			<view class="form-section animate-slide-up">
				<view class="form-card">
					<!-- 错误消息显示 -->
					<view v-if="errorMsg" class="error-message">
						<text class="error-text">{{ errorMsg }}</text>
					</view>

					<!-- 登录表单 -->
					<view v-show="activeTab === 'login'" class="form-content">
						<view class="form-title">
							<text class="title-text">欢迎回来</text>
							<text class="subtitle-text">登录您的账户</text>
						</view>

						<!-- 邮箱输入 -->
						<view class="input-group">
							<view class="input-wrapper">
								<text class="input-icon">📧</text>
								<input class="input-field" type="text" placeholder="请输入邮箱" v-model="loginForm.email"
									:focus="focusState.email" @focus="focusState.email = true" @blur="focusState.email = false" />
							</view>
						</view>

						<!-- 密码输入 -->
						<view class="input-group">
							<view class="input-wrapper">
								<text class="input-icon">🔒</text>
								<input class="input-field" :type="showPassword.login ? 'text' : 'password'" placeholder="请输入密码"
									v-model="loginForm.password" :focus="focusState.password" @focus="focusState.password = true"
									@blur="focusState.password = false" />
								<text class="toggle-password" @tap="togglePassword('login')">
									{{ showPassword.login ? '🙈' : '👁️' }}
								</text>
							</view>
						</view>

						<!-- 记住我 & 忘记密码 -->
						<view class="form-options">
							<view class="remember-me" @tap="toggleRemember">
								<view class="checkbox" :class="{ checked: loginForm.rememberMe }">
									<text v-if="loginForm.rememberMe" class="check-mark">✓</text>
								</view>
								<text class="option-text">记住我</text>
							</view>
							<text class="forgot-password">忘记密码？</text>
						</view>

						<!-- 登录按钮 -->
						<view class="button-group">
							<button class="login-btn" :class="{ loading: isLoading }" @tap="handleLogin">
								<text v-if="!isLoading">登录</text>
								<text v-else class="loading-text">登录中...</text>
							</button>
						</view>

						<!-- 分隔线 -->
						<view class="divider">
							<view class="divider-line"></view>
							<text class="divider-text">或使用以下方式登录</text>
							<view class="divider-line"></view>
						</view>

						<!-- 社交登录 -->
						<view class="social-login">
							<view class="social-btn wechat">
								<text class="social-icon">💬</text>
							</view>
							<view class="social-btn apple">
								<text class="social-icon">🍎</text>
							</view>
							<view class="social-btn google">
								<text class="social-icon">🔍</text>
							</view>
						</view>
					</view>

					<!-- 注册表单 -->
					<view v-show="activeTab === 'register'" class="form-content">
						<view class="form-title">
							<text class="title-text">创建账户</text>
							<text class="subtitle-text">开启您的健康饮食之旅</text>
						</view>

						<view class="input-group">
							<view class="input-wrapper">
								<text class="input-icon">📧</text>
								<input class="input-field" type="text" placeholder="请输入邮箱" v-model="registerForm.email" />
							</view>
						</view>

						<view class="input-group">
							<view class="input-wrapper">
								<text class="input-icon">🔒</text>
								<input class="input-field" :type="showPassword.register ? 'text' : 'password'" placeholder="请设置密码"
									v-model="registerForm.password" />
								<text class="toggle-password" @tap="togglePassword('register')">
									{{ showPassword.register ? '🙈' : '👁️' }}
								</text>
							</view>
						</view>

						<view class="input-group">
							<view class="input-wrapper">
								<text class="input-icon">🔒</text>
								<input class="input-field" :type="showPassword.confirm ? 'text' : 'password'" placeholder="请确认密码"
									v-model="registerForm.confirmPassword" />
								<text class="toggle-password" @tap="togglePassword('confirm')">
									{{ showPassword.confirm ? '🙈' : '👁️' }}
								</text>
							</view>
						</view>

						<view class="form-options">
							<view class="remember-me" @tap="toggleAgree">
								<view class="checkbox" :class="{ checked: registerForm.agreeTerms }">
									<text v-if="registerForm.agreeTerms" class="check-mark">✓</text>
								</view>
								<text class="option-text">我已阅读并同意</text>
								<text class="link-text">用户协议</text>
								<text class="option-text">和</text>
								<text class="link-text">隐私政策</text>
							</view>
						</view>

						<view class="button-group">
							<button class="register-btn" :class="{ loading: isLoading }" @tap="handleRegister">
								<text v-if="!isLoading">注册</text>
								<text v-else>注册中...</text>
							</button>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
import { supabase } from '@/lib/supabase.js'

export default {
	data() {
		return {
			activeTab: 'login',
			isLoading: false,
			errorMsg: '',
			loginForm: {
				email: '',
				password: '',
				rememberMe: false
			},
			registerForm: {
				email: '',
				password: '',
				confirmPassword: '',
				agreeTerms: false
			},
			showPassword: {
				login: false,
				register: false,
				confirm: false
			},
			focusState: {
				email: false,
				password: false
			}
		}
	},
	methods: {
		switchTab(tab) {
			this.activeTab = tab
			this.errorMsg = ''
		},
		togglePassword(type) {
			this.showPassword[type] = !this.showPassword[type]
		},
		toggleRemember() {
			this.loginForm.rememberMe = !this.loginForm.rememberMe
		},
		toggleAgree() {
			this.registerForm.agreeTerms = !this.registerForm.agreeTerms
		},
		async handleLogin() {
			this.errorMsg = ''
			if (!this.loginForm.email || !this.loginForm.password) {
				this.errorMsg = '请填写邮箱和密码'
				uni.showToast({
					title: '请填写邮箱和密码',
					icon: 'none'
				})
				return
			}

			this.isLoading = true
			try {
				const { error } = await supabase.auth.signInWithPassword({
					email: this.loginForm.email,
					password: this.loginForm.password
				})
				if (error) throw error

				uni.showToast({ title: '登录成功', icon: 'success' })
				setTimeout(() => {
					uni.navigateTo({ url: '/pages/index/index' })
				}, 1000)
			} catch (e) {
				this.errorMsg = e.message || '登录失败'
				uni.showToast({
					title: e.message || '登录失败',
					icon: 'none'
				})
			} finally {
				this.isLoading = false
			}
		},
		async handleRegister() {
			this.errorMsg = ''
			if (!this.registerForm.email) {
				this.errorMsg = '请输入邮箱'
				uni.showToast({ title: '请输入邮箱', icon: 'none' })
				return
			}
			if (!this.registerForm.password) {
				this.errorMsg = '请设置密码'
				uni.showToast({ title: '请设置密码', icon: 'none' })
				return
			}
			if (this.registerForm.password !== this.registerForm.confirmPassword) {
				this.errorMsg = '两次密码不一致'
				uni.showToast({ title: '两次密码不一致', icon: 'none' })
				return
			}
			if (!this.registerForm.agreeTerms) {
				this.errorMsg = '请同意用户协议和隐私政策'
				uni.showToast({ title: '请同意用户协议和隐私政策', icon: 'none' })
				return
			}

			this.isLoading = true
			try {
				const { error } = await supabase.auth.signUp({
					email: this.registerForm.email,
					password: this.registerForm.password
				})
				if (error) throw error

				uni.showToast({
					title: '注册成功，已自动登录',
					icon: 'success'
				})
				setTimeout(() => {
					uni.navigateTo({ url: '/pages/index/index' })
				}, 1000)
			} catch (e) {
				this.errorMsg = e.message || '注册失败'
				uni.showToast({
					title: e.message || '注册失败',
					icon: 'none'
				})
			} finally {
				this.isLoading = false
			}
		}
	}
}
</script>

<style scoped>
.login-container {
	min-height: 100vh;
	background: var(--bg-gradient);
	position: relative;
	overflow: hidden;
}

/* 顶部装饰 */
.decoration-top {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 400rpx;
	pointer-events: none;
	z-index: 0;
}

.circle {
	position: absolute;
	border-radius: 50%;
	opacity: 0.3;
}

.circle-1 {
	width: 400rpx;
	height: 400rpx;
	background: var(--primary-light);
	top: -200rpx;
	right: -100rpx;
}

.circle-2 {
	width: 300rpx;
	height: 300rpx;
	background: var(--accent-light);
	top: -100rpx;
	left: -100rpx;
}

.circle-3 {
	width: 200rpx;
	height: 200rpx;
	background: var(--primary-color);
	top: 100rpx;
	left: 50%;
	transform: translateX(-50%);
	opacity: 0.1;
}

.scroll-content {
	height: 100vh;
	position: relative;
	z-index: 1;
}

/* Header 区域 */
.header-section {
	padding-top: 100rpx;
	padding-bottom: 40rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.logo-wrapper {
	width: 140rpx;
	height: 140rpx;
	background: white;
	border-radius: 35rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: var(--shadow-md);
	margin-bottom: 28rpx;
}

.logo {
	width: 90rpx;
	height: 90rpx;
}

.app-name {
	font-size: 44rpx;
	font-weight: 700;
	color: var(--text-primary);
	margin-bottom: 10rpx;
	letter-spacing: 2rpx;
}

.tagline {
	font-size: 26rpx;
	color: var(--text-secondary);
}

/* 标签切换器 */
.tabs-section {
	padding: 0 48rpx;
	margin-bottom: 32rpx;
}

.tabs-wrapper {
	background: white;
	border-radius: var(--radius-lg);
	padding: 8rpx;
	display: flex;
	position: relative;
	box-shadow: var(--shadow-sm);
}

.tab-item {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24rpx 0;
	position: relative;
	z-index: 1;
	transition: all 0.3s ease;
}

.tab-text {
	font-size: 30rpx;
	font-weight: 600;
	color: var(--text-secondary);
	transition: all 0.3s ease;
}

.tab-item.active .tab-text {
	color: white;
	font-weight: 700;
}

.tab-indicator {
	position: absolute;
	top: 8rpx;
	bottom: 8rpx;
	width: 50%;
	background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
	border-radius: calc(var(--radius-lg) - 8rpx);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	box-shadow: var(--shadow-md);
}

.tab-indicator.login {
	left: 8rpx;
}

.tab-indicator.register {
	left: calc(50% - 8rpx);
}

/* 错误消息 */
.error-message {
	background: #fee2e2;
	border-radius: var(--radius-md);
	padding: 20rpx 24rpx;
	margin-bottom: 24rpx;
	border-left: 6rpx solid #ef4444;
}

.error-text {
	font-size: 26rpx;
	color: #dc2626;
}

/* 表单区域 */
.form-section {
	padding: 0 48rpx;
}

.form-card {
	background: white;
	border-radius: var(--radius-xl);
	padding: 56rpx 48rpx;
	box-shadow: var(--shadow-lg);
	min-height: 600rpx;
}

.form-title {
	margin-bottom: 40rpx;
}

.title-text {
	display: block;
	font-size: 38rpx;
	font-weight: 700;
	color: var(--text-primary);
	margin-bottom: 8rpx;
}

.subtitle-text {
	display: block;
	font-size: 26rpx;
	color: var(--text-secondary);
}

/* 输入框 */
.input-group {
	margin-bottom: 28rpx;
}

.input-wrapper {
	display: flex;
	align-items: center;
	background: var(--bg-secondary);
	border-radius: var(--radius-md);
	padding: 22rpx 28rpx;
	border: 2rpx solid transparent;
	transition: all 0.3s ease;
}

.input-wrapper:focus-within {
	border-color: var(--primary-color);
	background: white;
	box-shadow: 0 0 0 6rpx rgba(76, 175, 80, 0.1);
}

.input-icon {
	font-size: 32rpx;
	margin-right: 18rpx;
}

.input-field {
	flex: 1;
	font-size: 28rpx;
	color: var(--text-primary);
}

.toggle-password {
	font-size: 32rpx;
	padding: 6rpx;
	margin-left: 12rpx;
}

/* 表单选项 */
.form-options {
	margin-bottom: 40rpx;
}

.remember-me {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 6rpx;
}

.checkbox {
	width: 36rpx;
	height: 36rpx;
	border: 2rpx solid var(--border-color);
	border-radius: 6rpx;
	margin-right: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;
}

.checkbox.checked {
	background: var(--primary-color);
	border-color: var(--primary-color);
}

.check-mark {
	color: white;
	font-size: 22rpx;
	font-weight: bold;
}

.option-text {
	font-size: 24rpx;
	color: var(--text-secondary);
}

.link-text {
	font-size: 24rpx;
	color: var(--primary-color);
}

.forgot-password {
	font-size: 26rpx;
	color: var(--primary-color);
}

/* 按钮 */
.button-group {
	margin-bottom: 24rpx;
}

.login-btn,
.register-btn {
	width: 100%;
	height: 92rpx;
	background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
	color: white;
	border: none;
	border-radius: var(--radius-lg);
	font-size: 30rpx;
	font-weight: 600;
	box-shadow: var(--shadow-md);
	transition: all 0.3s ease;
	display: flex;
	align-items: center;
	justify-content: center;
}

.login-btn:active,
.register-btn:active {
	transform: scale(0.98);
	box-shadow: var(--shadow-sm);
}

.login-btn.loading,
.register-btn.loading {
	opacity: 0.8;
}

/* 分隔线 */
.divider {
	display: flex;
	align-items: center;
	margin-bottom: 40rpx;
}

.divider-line {
	flex: 1;
	height: 1rpx;
	background: var(--border-color);
}

.divider-text {
	padding: 0 24rpx;
	font-size: 24rpx;
	color: var(--text-light);
}

/* 社交登录 */
.social-login {
	display: flex;
	justify-content: center;
	gap: 32rpx;
}

.social-btn {
	width: 96rpx;
	height: 96rpx;
	border-radius: 50%;
	background: var(--bg-secondary);
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s ease;
}

.social-btn:active {
	transform: scale(0.95);
}

.social-icon {
	font-size: 40rpx;
}

/* 动画 */
.animate-fade-in {
	animation: fadeIn 0.6s ease-out;
}

.animate-slide-up {
	animation: slideUp 0.6s ease-out;
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}

	to {
		opacity: 1;
	}
}

@keyframes slideUp {
	from {
		opacity: 0;
		transform: translateY(40rpx);
	}

	to {
		opacity: 1;
		transform: translateY(0);
	}
}
</style>
