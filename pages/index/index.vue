<template>
  <view class="container">
    <!-- 今日统计卡片 -->
    <view class="summary-card">
      <text class="summary-title">今日摄入</text>
      <text class="summary-value">-- 千卡</text>
    </view>

    <!-- 操作卡片区域 -->
    <view class="action-section">
      <view class="action-card photo-card" @tap="chooseImage">
        <view class="action-icon">📷</view>
        <text class="action-title">拍照分析</text>
        <text class="action-desc">上传食物图片进行AI分析</text>
      </view>

      <view class="action-card input-card" @tap="showInputModal = true">
        <view class="action-icon">✏️</view>
        <text class="action-title">手动输入</text>
        <text class="action-desc">输入食物描述进行分析</text>
      </view>
    </view>

    <!-- 图片预览区域 -->
    <view v-if="uploadedImageUrl || previewImageUrl" class="preview-section">
      <text class="preview-title">上传的图片</text>
      <view class="preview-wrapper" @tap="handlePreviewClick">
        <image :src="uploadedImageUrl || previewImageUrl" class="preview-image" mode="aspectFill" />
        <view class="preview-overlay" @tap.stop="clearPreview">
          <text class="clear-icon">✕</text>
        </view>
      </view>
      <text v-if="uploadedImageUrl" class="preview-hint">点击开始分析</text>
      <text v-else class="preview-hint uploading-hint">正在上传中...</text>
    </view>

    <!-- 上传进度条 -->
    <view v-if="uploading" class="progress-wrapper">
      <progress :percent="uploadProgress" show-info stroke-width="6" />
    </view>

    <!-- 错误提示 -->
    <text v-if="errorMsg" class="error">{{ errorMsg }}</text>

    <!-- 历史记录标题 -->
    <view class="section-header">
      <text class="section-title">历史记录</text>
      <text class="section-count">共 {{ historyList.length }} 条</text>
    </view>

    <!-- 历史记录列表 -->
    <view class="history-list">
      <view v-for="item in historyList" :key="item.id" class="history-item" @tap="viewDetail(item.id)">
        <image :src="item.image" class="history-image" mode="aspectFill" />
        <view class="history-info">
          <text class="history-name">{{ item.name }}</text>
          <text class="history-time">{{ item.time }}</text>
          <view class="history-meta">
            <view class="score-badge" :class="getScoreClass(item.score)">
              {{ item.score }}分
            </view>
            <text class="history-calories">{{ item.nutrition.calories }}千卡</text>
          </view>
        </view>
        <view class="history-arrow">›</view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-if="historyList.length === 0" class="empty-state">
      <text class="empty-icon">📝</text>
      <text class="empty-text">暂无记录</text>
      <text class="empty-hint">拍照或输入食物开始记录吧</text>
    </view>

    <!-- 手动输入弹窗 -->
    <view v-if="showInputModal" class="modal-mask" @tap="showInputModal = false">
      <view class="modal-content" @tap.stop>
        <text class="modal-title">输入食物描述</text>
        <textarea v-model="foodDescription" placeholder="请输入食物名称或描述..." class="modal-input" :disabled="uploading" />
        <view class="modal-actions">
          <button class="modal-btn cancel-btn" @tap="showInputModal = false">取消</button>
          <button class="modal-btn confirm-btn" :disabled="!foodDescription.trim() || uploading"
            @tap="submitDescription">
            {{ uploading ? '上传中...' : '开始分析' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '@/lib/supabase.js'

const showInputModal = ref(false)
const foodDescription = ref('')
const uploading = ref(false)
const uploadProgress = ref(0)
const errorMsg = ref('')
const uploadedImageUrl = ref('')
const previewImageUrl = ref('')

// 模拟历史记录数据
const historyList = ref([
  {
    id: 1,
    name: '鸡胸肉沙拉',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chicken%20salad%20with%20lettuce%20tomato%20healthy&image_size=square',
    time: '今天 12:30',
    score: 85,
    nutrition: { calories: 320, protein: 28, carbs: 15, fat: 18 }
  },
  {
    id: 2,
    name: '牛油果吐司',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=avocado%20toast%20on%20whole%20grain%20bread&image_size=square',
    time: '今天 08:15',
    score: 92,
    nutrition: { calories: 285, protein: 12, carbs: 32, fat: 15 }
  },
  {
    id: 3,
    name: '红烧排骨',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=braised%20pork%20ribs%20chinese%20style&image_size=square',
    time: '昨天 18:45',
    score: 65,
    nutrition: { calories: 450, protein: 35, carbs: 10, fat: 32 }
  },
  {
    id: 4,
    name: '蔬菜豆腐汤',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vegetable%20tofu%20soup%20chinese%20style&image_size=square',
    time: '昨天 12:00',
    score: 95,
    nutrition: { calories: 120, protein: 15, carbs: 8, fat: 4 }
  }
])

// 获取评分样式
const getScoreClass = (score) => {
  if (score >= 80) return 'score-high'
  if (score >= 60) return 'score-medium'
  return 'score-low'
}

// 拍照或选择图片
const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['camera', 'album'],
    success: (res) => {
      const tempPath = res.tempFilePaths[0]
      previewImageUrl.value = tempPath // 立即显示本地预览
      uploadImage(tempPath)
    },
    fail: (err) => {
      if (err.errMsg.indexOf('cancel') === -1) {
        errorMsg.value = '获取图片失败'
        setTimeout(() => errorMsg.value = '', 3000)
      }
    }
  })
}

// 上传图片到 Supabase Storage
const uploadImage = async (tempPath) => {
  uploading.value = true
  uploadProgress.value = 0
  errorMsg.value = ''

  try {
    console.log('开始上传图片')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('未登录，请重新登录')

    const fileName = `${user.id}/${Date.now()}.jpg`
    console.log('文件名:', fileName)

    const response = await fetch(tempPath)
    const blob = await response.blob()

    console.log('正在上传到 Supabase Storage...')
    const { error: uploadError } = await supabase.storage
      .from('meal-images')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError
    console.log('上传成功，获取公开 URL...')

    uploadProgress.value = 100

    const { data: urlData } = supabase.storage
      .from('meal-images')
      .getPublicUrl(fileName)

    uploadedImageUrl.value = urlData.publicUrl
    previewImageUrl.value = '' // 清除本地预览，显示远程图
    console.log('公开 URL:', uploadedImageUrl.value)

    uni.showToast({ title: '图片上传成功', icon: 'success' })
  } catch (e) {
    console.error('上传失败:', e)
    errorMsg.value = e.message || '图片上传失败'
    setTimeout(() => errorMsg.value = '', 3000)
    previewImageUrl.value = '' // 上传失败清除预览
    uploadedImageUrl.value = ''
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

// 清除预览
const clearPreview = () => {
  previewImageUrl.value = ''
  uploadedImageUrl.value = ''
}

// 开始分析
const startAnalyze = async () => {
  if (!uploadedImageUrl.value && !foodDescription.value.trim()) return

  uni.showLoading({ title: '分析中...' })
  try {
    const { data, error } = await supabase.functions.invoke('analyze-food', {
      body: {
        imageUrl: uploadedImageUrl.value || null,
        description: foodDescription.value.trim() || null,
      },
    })

    uni.hideLoading()

    if (error) {
      console.error('函数调用错误:', error)
      uni.showToast({ title: '分析失败: ' + error.message, icon: 'none', duration: 3000 })
      return
    }

    if (data?.error) {
      console.error('AI返回错误:', data.error)
      uni.showToast({ title: 'AI错误: ' + data.error, icon: 'none', duration: 3000 })
      return
    }

    if (!data?.total_calories) {
      console.warn('返回数据格式异常:', data)
      uni.showToast({ title: '返回数据格式异常', icon: 'none', duration: 3000 })
      return
    }

    console.log('AI 分析结果:', data)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未登录，请重新登录')

      const { data: insertData, error: insertError } = await supabase.from('meals').insert({
        user_id: user.id,
        image_url: uploadedImageUrl.value || null,
        description: foodDescription.value.trim() || null,
        total_calories: data.total_calories,
        protein_g: data.protein_g,
        fat_g: data.fat_g,
        carbs_g: data.carbs_g,
        health_score: data.health_score,
        // advice: data.advice
      }).select()

      if (insertError) throw insertError

      const recordId = insertData[0].id
      uni.navigateTo({ url: '/pages/result/result?id=' + recordId })
    } catch (e) {
      console.error('保存失败:', e)
      uni.showToast({ title: '保存失败: ' + e.message, icon: 'none', duration: 3000 })
    }
  } catch (e) {
    uni.hideLoading()
    console.error('调用异常 - 完整错误:', e)
    console.error('错误消息:', e.message)
    uni.showToast({ title: e.message || '请求失败', icon: 'none', duration: 3000 })
  }
}

// 提交文字描述
const submitDescription = () => {
  if (!foodDescription.value.trim()) return

  showInputModal.value = false
  // 调用分析
  startAnalyze()
}

// 处理预览区域点击
const handlePreviewClick = () => {
  if (!uploadedImageUrl.value) {
    return // 还在上传中，不处理点击
  }
  // 调用分析
  startAnalyze()
}

// 查看详情
const viewDetail = (id) => {
  uni.navigateTo({ url: `/pages/result/result?id=${id}` })
}
</script>

<style scoped>
.container {
  padding: 20px;
  min-height: 100vh;
  background: #f8f9fa;
}

.summary-card {
  background: linear-gradient(135deg, #4CAF50 0%, #81C784 100%);
  padding: 24px;
  border-radius: 16rpx;
  text-align: center;
  margin-bottom: 20px;
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);
}

.summary-title {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  display: block;
  margin-bottom: 8rpx;
}

.summary-value {
  font-size: 56rpx;
  font-weight: bold;
  color: #fff;
}

.action-section {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20px;
}

.action-card {
  flex: 1;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.action-card:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.photo-card {
  border: 2rpx dashed #4CAF50;
}

.input-card {
  border: 2rpx dashed #FF9800;
}

.action-icon {
  font-size: 48rpx;
  margin-bottom: 12rpx;
}

.action-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.action-desc {
  font-size: 24rpx;
  color: #999;
  display: block;
}

.progress-wrapper {
  margin-bottom: 16rpx;
}

/* 预览区域样式 */
.preview-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.preview-title {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  display: block;
  margin-bottom: 16rpx;
}

.preview-wrapper {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  overflow: hidden;
  border: 2rpx dashed #4CAF50;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.preview-overlay {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 40rpx;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.clear-icon {
  font-size: 24rpx;
  color: #fff;
}

.preview-hint {
  font-size: 24rpx;
  color: #4CAF50;
  display: block;
  margin-top: 12rpx;
  text-align: center;
}

.uploading-hint {
  color: #999;
}

.error {
  color: #e74c3c;
  display: block;
  text-align: center;
  margin-bottom: 16rpx;
  font-size: 26rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.section-count {
  font-size: 26rpx;
  color: #999;
}

.history-list {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.history-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
  transition: background 0.2s ease;
}

.history-item:last-child {
  border-bottom: none;
}

.history-item:active {
  background: #fafafa;
}

.history-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  margin-right: 20rpx;
}

.history-info {
  flex: 1;
}

.history-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.history-time {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-bottom: 12rpx;
}

.history-meta {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.score-badge {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
}

.score-high {
  background: #E8F5E9;
  color: #4CAF50;
}

.score-medium {
  background: #FFF3E0;
  color: #FF9800;
}

.score-low {
  background: #FFEBEE;
  color: #F44336;
}

.history-calories {
  font-size: 24rpx;
  color: #666;
}

.history-arrow {
  font-size: 40rpx;
  color: #ddd;
}

.empty-state {
  text-align: center;
  padding: 60rpx 0;
}

.empty-icon {
  font-size: 64rpx;
  display: block;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 30rpx;
  color: #666;
  display: block;
  margin-bottom: 8rpx;
}

.empty-hint {
  font-size: 26rpx;
  color: #999;
}

/* 弹窗样式 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  width: 90%;
  max-width: 600rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 32rpx;
}

.modal-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
  display: block;
  text-align: center;
  margin-bottom: 24rpx;
}

.modal-input {
  width: 100%;
  border: 1rpx solid #ddd;
  border-radius: 12rpx;
  padding: 20rpx;
  min-height: 160rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  margin-bottom: 24rpx;
}

.modal-actions {
  display: flex;
  gap: 20rpx;
}

.modal-btn {
  flex: 1;
  padding: 24rpx;
  border-radius: 12rpx;
  font-size: 30rpx;
  border: none;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.confirm-btn {
  background: #4CAF50;
  color: #fff;
}

.confirm-btn[disabled] {
  background: #ccc;
}
</style>