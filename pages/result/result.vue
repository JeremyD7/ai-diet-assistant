<template>
	<view class="result-container">
		<view class="status-bar"></view>

		<view class="header-nav">
			<view class="back-btn" @tap="goBack">
				<text class="back-icon">←</text>
			</view>
			<text class="nav-title">饮食记录详情</text>
			<view class="placeholder"></view>
		</view>

		<scroll-view class="main-scroll" scroll-y="true">
			<view v-if="loading" class="loading-state">
				<text class="loading-text">加载中...</text>
			</view>

			<view v-else-if="errorMsg" class="error-state">
				<text class="error-text">{{ errorMsg }}</text>
			</view>

			<template v-else>
				<view v-if="mealData.image_url" class="food-image-section">
					<image class="food-image" :src="mealData.image_url" mode="aspectFill"></image>
				</view>

				<view class="content-wrapper">
					<view class="description-card">
						<text class="description-text">{{ mealData.description || '食物记录' }}</text>
					</view>

					<view class="nutrition-section">
						<view class="section-header">
							<text class="section-title">营养成分</text>
						</view>
						<view class="nutrition-grid">
							<view class="nutrition-card calories">
								<text class="nutrition-icon">🔥</text>
								<text class="nutrition-value">{{ mealData.total_calories || 0 }}</text>
								<text class="nutrition-unit">kcal</text>
								<text class="nutrition-label">热量</text>
							</view>

							<view class="nutrition-card protein">
								<text class="nutrition-icon">🥩</text>
								<text class="nutrition-value">{{ mealData.protein_g || 0 }}</text>
								<text class="nutrition-unit">g</text>
								<text class="nutrition-label">蛋白质</text>
							</view>

							<view class="nutrition-card fat">
								<text class="nutrition-icon">🥑</text>
								<text class="nutrition-value">{{ mealData.fat_g || 0 }}</text>
								<text class="nutrition-unit">g</text>
								<text class="nutrition-label">脂肪</text>
							</view>

							<view class="nutrition-card carbs">
								<text class="nutrition-icon">🍞</text>
								<text class="nutrition-value">{{ mealData.carbs_g || 0 }}</text>
								<text class="nutrition-unit">g</text>
								<text class="nutrition-label">碳水</text>
							</view>
						</view>
					</view>

					<view class="score-section">
						<view class="score-card">
							<view class="score-circle" :class="getScoreClass(mealData.health_score)">
								<text class="score-number">{{ mealData.health_score || 0 }}</text>
								<text class="score-unit">分</text>
							</view>
							<text class="score-label" :class="getScoreClass(mealData.health_score)">
								{{ getScoreLabel(mealData.health_score) }}
							</text>
							<text class="score-desc">{{ getScoreDesc(mealData.health_score) }}</text>
						</view>
					</view>

					<view v-if="mealData.advice" class="advice-section">
						<view class="section-header">
							<text class="section-title">AI 饮食建议</text>
							<text class="ai-badge">AI</text>
						</view>
						<view class="advice-card">
							<text class="advice-text">{{ mealData.advice }}</text>
						</view>
					</view>

					<view class="time-section">
						<text class="time-label">创建时间</text>
						<text class="time-value">{{ formatTime(mealData.created_at) }}</text>
					</view>
				</view>

				<view class="bottom-action" :class="{ 'action-row': currentMealId }">
					<view v-if="currentMealId" class="delete-record-btn" @tap="confirmDeleteMeal">
						<text class="delete-record-text">{{ deleting ? '删除中...' : '删除记录' }}</text>
					</view>
					<view class="home-btn" @tap="goHome">
						<text class="home-icon">🏠</text>
						<text class="home-text">返回首页</text>
					</view>
				</view>
			</template>

			<view class="bottom-spacer"></view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { supabase } from '@/lib/supabase.js'
import { requireAuth } from '@/utils/router.js'
import { deleteMealRecord } from '@/utils/mealDeletion.js'

const loading = ref(true)
const errorMsg = ref('')
const currentMealId = ref('')
const deleting = ref(false)
const mealData = ref({
	id: '',
	total_calories: 0,
	protein_g: 0,
	fat_g: 0,
	carbs_g: 0,
	health_score: 0,
	advice: '',
	image_url: '',
	description: '',
	created_at: ''
})

onLoad(async (options) => {
	await checkLogin()

	if (options.id) {
		currentMealId.value = options.id
		loadMealById(options.id)
	} else if (options.desc) {
		currentMealId.value = ''
		loadMealByDesc(decodeURIComponent(options.desc))
	} else {
		errorMsg.value = '未找到相关记录'
		loading.value = false
	}
})

const checkLogin = async () => {
	try {
		await requireAuth('/pages/result/result')
	} catch (e) {
		errorMsg.value = '请先登录'
		loading.value = false
	}
}

const loadMealById = async (id) => {
	loading.value = true
	errorMsg.value = ''

	try {
		const { data: { user }, error: userError } = await supabase.auth.getUser()
		if (userError || !user) {
			throw new Error('请先登录')
		}

		const { data, error } = await supabase
			.from('meals')
			.select('*')
			.eq('id', id)
			.eq('user_id', user.id)
			.single()

		if (error) {
			throw new Error('查询失败')
		}

		if (!data) {
			throw new Error('记录不存在')
		}

		mealData.value = data
	} catch (e) {
		console.error('加载失败:', e)
		errorMsg.value = e.message || '加载失败'
	} finally {
		loading.value = false
	}
}

const loadMealByDesc = (desc) => {
	loading.value = false
	mealData.value = {
		id: '',
		total_calories: 0,
		protein_g: 0,
		fat_g: 0,
		carbs_g: 0,
		health_score: 0,
		advice: '根据您描述的食物，请等待AI分析完成。',
		image_url: '',
		description: desc,
		created_at: new Date().toISOString()
	}
}

const getScoreClass = (score) => {
	const s = score || 0
	if (s >= 80) return 'score-high'
	if (s >= 60) return 'score-medium'
	return 'score-low'
}

const getScoreLabel = (score) => {
	const s = score || 0
	if (s >= 80) return '健康'
	if (s >= 60) return '一般'
	return '需注意'
}

const getScoreDesc = (score) => {
	const s = score || 0
	if (s >= 80) return '营养均衡，继续保持'
	if (s >= 60) return '还不错，可以优化'
	return '注意饮食健康'
}

const formatTime = (timestamp) => {
	if (!timestamp) return '--'
	const date = new Date(timestamp)
	return date.toLocaleString('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	})
}

const goBack = () => {
	uni.navigateBack()
}

const goHome = () => {
	uni.switchTab({ url: '/pages/index/index' })
}

const confirmDeleteMeal = () => {
	if (!currentMealId.value || deleting.value) return

	uni.showModal({
		title: '删除记录',
		content: '确定删除这条分析记录吗？对应的食物图片也会一并删除。',
		confirmText: '删除',
		confirmColor: '#F44336',
		success: async (res) => {
			if (!res.confirm) return
			await deleteCurrentMeal()
		}
	})
}

const deleteCurrentMeal = async () => {
	deleting.value = true
	uni.showLoading({ title: '删除中...' })

	try {
		const { data: { user }, error: userError } = await supabase.auth.getUser()
		if (userError || !user) throw new Error('请先登录')

		await deleteMealRecord({
			supabase,
			mealId: currentMealId.value,
			userId: user.id
		})

		uni.hideLoading()
		uni.showToast({ title: '已删除', icon: 'success' })
		setTimeout(() => {
			goHome()
		}, 500)
	} catch (e) {
		console.error('删除失败:', e)
		uni.hideLoading()
		uni.showToast({ title: e.message || '删除失败', icon: 'none', duration: 3000 })
	} finally {
		deleting.value = false
	}
}
</script>

<style scoped>
.result-container {
	min-height: 100vh;
	background: var(--bg-secondary);
}

.status-bar {
	height: var(--status-bar-height, 44rpx);
}

.header-nav {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20rpx 32rpx;
	background: white;
}

.back-btn, .placeholder {
	width: 64rpx;
	height: 64rpx;
	background: var(--bg-secondary);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.back-icon {
	font-size: 32rpx;
	color: var(--text-primary);
}

.nav-title {
	font-size: 32rpx;
	font-weight: 600;
	color: var(--text-primary);
}

.main-scroll {
	height: calc(100vh - 128rpx);
}

.loading-state, .error-state {
	padding: 100rpx 32rpx;
	text-align: center;
}

.loading-text {
	font-size: 28rpx;
	color: var(--text-secondary);
}

.error-text {
	font-size: 28rpx;
	color: #e74c3c;
}

.food-image-section {
	width: 100%;
	height: 400rpx;
}

.food-image {
	width: 100%;
	height: 100%;
}

.content-wrapper {
	padding: 0 32rpx;
}

.description-card {
	background: white;
	border-radius: var(--radius-lg);
	padding: 24rpx;
	margin-top: 24rpx;
	box-shadow: var(--shadow-sm);
}

.description-text {
	font-size: 30rpx;
	color: var(--text-primary);
	line-height: 1.6;
}

.nutrition-section {
	margin-top: 24rpx;
}

.section-header {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-bottom: 16rpx;
}

.section-title {
	font-size: 30rpx;
	font-weight: 700;
	color: var(--text-primary);
}

.ai-badge {
	font-size: 20rpx;
	padding: 4rpx 12rpx;
	background: var(--primary-color);
	color: white;
	border-radius: 20rpx;
	font-weight: 600;
}

.nutrition-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 16rpx;
}

.nutrition-card {
	background: white;
	border-radius: var(--radius-md);
	padding: 20rpx 8rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	border-top: 4rpx solid;
	box-shadow: var(--shadow-sm);
}

.nutrition-card.calories {
	border-color: #ff9800;
}

.nutrition-card.protein {
	border-color: var(--primary-color);
}

.nutrition-card.fat {
	border-color: #9c27b0;
}

.nutrition-card.carbs {
	border-color: #2196f3;
}

.nutrition-icon {
	font-size: 36rpx;
	margin-bottom: 8rpx;
}

.nutrition-value {
	font-size: 32rpx;
	font-weight: 700;
	color: var(--text-primary);
}

.nutrition-unit {
	font-size: 18rpx;
	color: var(--text-light);
}

.nutrition-label {
	font-size: 20rpx;
	color: var(--text-secondary);
	margin-top: 8rpx;
}

.score-section {
	margin-top: 24rpx;
}

.score-card {
	background: white;
	border-radius: var(--radius-lg);
	padding: 32rpx;
	box-shadow: var(--shadow-md);
	display: flex;
	flex-direction: column;
	align-items: center;
}

.score-circle {
	width: 140rpx;
	height: 140rpx;
	border-radius: 50%;
	display: flex;
	align-items: baseline;
	justify-content: center;
	margin-bottom: 16rpx;
}

.score-circle.score-high {
	background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
}

.score-circle.score-medium {
	background: linear-gradient(135deg, var(--accent-color) 0%, var(--accent-light) 100%);
}

.score-circle.score-low {
	background: linear-gradient(135deg, #ef5350 0%, #e57373 100%);
}

.score-number {
	font-size: 56rpx;
	font-weight: 700;
	color: white;
	line-height: 1;
}

.score-unit {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.8);
	margin-left: 4rpx;
}

.score-label {
	font-size: 32rpx;
	font-weight: 600;
	margin-bottom: 8rpx;
}

.score-label.score-high {
	color: var(--primary-color);
}

.score-label.score-medium {
	color: var(--accent-color);
}

.score-label.score-low {
	color: #ef5350;
}

.score-desc {
	font-size: 24rpx;
	color: var(--text-secondary);
}

.advice-section {
	margin-top: 24rpx;
}

.advice-card {
	background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
	border-radius: var(--radius-lg);
	padding: 24rpx;
}

.advice-text {
	font-size: 26rpx;
	color: var(--text-secondary);
	line-height: 1.6;
}

.time-section {
	margin-top: 24rpx;
	background: white;
	border-radius: var(--radius-lg);
	padding: 24rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	box-shadow: var(--shadow-sm);
}

.time-label {
	font-size: 26rpx;
	color: var(--text-secondary);
}

.time-value {
	font-size: 26rpx;
	color: var(--text-primary);
}

.bottom-action {
	padding: 32rpx;
}

.action-row {
	display: flex;
	gap: 20rpx;
}

.home-btn {
	background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
	border-radius: var(--radius-lg);
	padding: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	box-shadow: var(--shadow-md);
	flex: 1;
}

.home-btn:active {
	opacity: 0.9;
	transform: scale(0.98);
}

.home-icon {
	font-size: 32rpx;
}

.home-text {
	font-size: 30rpx;
	font-weight: 600;
	color: white;
}

.delete-record-btn {
	background: #FFEBEE;
	border-radius: var(--radius-lg);
	padding: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex: 1;
}

.delete-record-btn:active {
	background: #FFCDD2;
	transform: scale(0.98);
}

.delete-record-text {
	font-size: 30rpx;
	font-weight: 600;
	color: #F44336;
}

.bottom-spacer {
	height: 40rpx;
}
</style>
