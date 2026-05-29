<template>
	<view class="register-container">
		<view class="decoration-top">
			<view class="circle circle-1"></view>
			<view class="circle circle-2"></view>
		</view>

		<scroll-view class="scroll-content" scroll-y="true">
			<view class="header-section">
				<view class="logo-wrapper">
					<image class="logo" src="/static/logo.png" mode="aspectFit"></image>
				</view>
				<text class="app-name">毛毛的饮食助手</text>
				<text class="tagline">智能健康，科学饮食</text>
			</view>

			<view class="form-section">
				<view class="form-card">
					<view class="form-title">
						<text class="title-text">创建账户</text>
						<text class="subtitle-text">开启您的健康饮食之旅</text>
					</view>

					<view class="input-group">
						<view class="input-wrapper">
							<text class="input-icon">📧</text>
							<input 
								class="input-field" 
								type="text" 
								placeholder="请输入邮箱" 
								v-model="email"
							/>
						</view>
					</view>

					<view class="input-group">
						<view class="input-wrapper">
							<text class="input-icon">📱</text>
							<input 
								class="input-field" 
								type="number" 
								placeholder="请输入手机号" 
								v-model="phone"
							/>
						</view>
					</view>

					<view class="input-group">
						<view class="input-wrapper">
							<text class="input-icon">🔒</text>
							<input 
								class="input-field" 
								:type="showPassword ? 'text' : 'password'" 
								placeholder="请设置密码" 
								v-model="password"
							/>
							<text class="toggle-password" @tap="togglePassword">
								{{ showPassword ? '🙈' : '👁️' }}
							</text>
						</view>
					</view>

					<view class="input-group">
						<view class="input-wrapper">
							<text class="input-icon">🔒</text>
							<input 
								class="input-field" 
								:type="showConfirmPassword ? 'text' : 'password'" 
								placeholder="请确认密码" 
								v-model="confirmPassword"
							/>
							<text class="toggle-password" @tap="toggleConfirmPassword">
								{{ showConfirmPassword ? '🙈' : '👁️' }}
							</text>
						</view>
					</view>

					<view class="form-options">
						<view class="remember-me" @tap="toggleAgree">
							<view class="checkbox" :class="{ checked: agreeTerms }">
								<text v-if="agreeTerms" class="check-mark">✓</text>
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

			<view class="footer-section">
				<text class="footer-text">已有账户？</text>
				<text class="login-link" @tap="goToLogin">立即登录</text>
			</view>
		</scroll-view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			email: '',
			phone: '',
			password: '',
			confirmPassword: '',
			showPassword: false,
			showConfirmPassword: false,
			agreeTerms: false,
			isLoading: false
		}
	},
	methods: {
		togglePassword() {
			this.showPassword = !this.showPassword;
		},
		toggleConfirmPassword() {
			this.showConfirmPassword = !this.showConfirmPassword;
		},
		toggleAgree() {
			this.agreeTerms = !this.agreeTerms;
		},
		handleRegister() {
			if (!this.email) {
				uni.showToast({ title: '请输入邮箱', icon: 'none' });
				return;
			}
			if (!this.phone) {
				uni.showToast({ title: '请输入手机号', icon: 'none' });
				return;
			}
			if (!this.password) {
				uni.showToast({ title: '请设置密码', icon: 'none' });
				return;
			}
			if (this.password !== this.confirmPassword) {
				uni.showToast({ title: '两次密码不一致', icon: 'none' });
				return;
			}
			if (!this.agreeTerms) {
				uni.showToast({ title: '请同意用户协议和隐私政策', icon: 'none' });
				return;
			}

			this.isLoading = true;

			setTimeout(() => {
				this.isLoading = false;
				uni.showToast({
					title: '注册成功',
					icon: 'success'
				});
				setTimeout(() => {
					uni.navigateBack();
				}, 1500);
			}, 1500);
		},
		goToLogin() {
			uni.navigateBack();
		}
	}
}
</script>

<style scoped>
.register-container {
	min-height: 100vh;
	background: var(--bg-gradient);
	position: relative;
	overflow: hidden;
}

.decoration-top {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 350rpx;
	pointer-events: none;
	z-index: 0;
}

.circle {
	position: absolute;
	border-radius: 50%;
	opacity: 0.25;
}

.circle-1 {
	width: 350rpx;
	height: 350rpx;
	background: var(--primary-light);
	top: -150rpx;
	left: -80rpx;
}

.circle-2 {
	width: 280rpx;
	height: 280rpx;
	background: var(--accent-light);
	top: -100rpx;
	right: -60rpx;
}

.scroll-content {
	height: 100vh;
	position: relative;
	z-index: 1;
}

.header-section {
	padding-top: 100rpx;
	padding-bottom: 60rpx;
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
}

.tagline {
	font-size: 26rpx;
	color: var(--text-secondary);
}

.form-section {
	padding: 0 48rpx;
}

.form-card {
	background: white;
	border-radius: var(--radius-xl);
	padding: 56rpx 48rpx;
	box-shadow: var(--shadow-lg);
}

.form-title {
	margin-bottom: 40rpx;
}

.title-text {
	display: block;
	font-size: 36rpx;
	font-weight: 700;
	color: var(--text-primary);
	margin-bottom: 6rpx;
}

.subtitle-text {
	display: block;
	font-size: 26rpx;
	color: var(--text-secondary);
}

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

.button-group {
	margin-bottom: 24rpx;
}

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
	display: flex;
	align-items: center;
	justify-content: center;
}

.register-btn:active {
	transform: scale(0.98);
}

.register-btn.loading {
	opacity: 0.8;
}

.footer-section {
	padding: 56rpx 0;
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 8rpx;
}

.footer-text {
	font-size: 26rpx;
	color: var(--text-secondary);
}

.login-link {
	font-size: 26rpx;
	color: var(--primary-color);
	font-weight: 600;
}
</style>
