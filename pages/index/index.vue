<template>
  <view class="container">
    <!-- 今日统计卡片 -->
    <view class="summary-card">
      <text class="summary-title">今日摄入</text>
      <view class="summary-stats">
        <view class="stat-item">
          <text class="stat-value">{{ todayStats.calories }}</text>
          <text class="stat-label">千卡</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-label">蛋白质</text>
          <text class="stat-value">{{ todayStats.protein }}g</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-label">碳水</text>
          <text class="stat-value">{{ todayStats.carbs }}g</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-label">脂肪</text>
          <text class="stat-value">{{ todayStats.fat }}g</text>
        </view>
      </view>
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
      <text v-if="uploadSuccess && uploadedImageUrl" class="preview-hint">点击开始分析</text>
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
        <view class="delete-btn" @tap.stop="confirmDeleteMeal(item.id)">
          <text class="delete-text">{{ deletingMealId === item.id ? '删除中' : '删除' }}</text>
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
        <textarea v-model="foodDescription" placeholder="请输入食物名称或描述..." class="modal-input" :disabled="analyzing" />
        <view class="modal-actions">
          <button class="modal-btn cancel-btn" @tap="showInputModal = false">取消</button>
          <button class="modal-btn confirm-btn" :disabled="!foodDescription.trim() || analyzing"
            @tap="submitDescription">
            {{ analyzing ? '分析中...' : '开始分析' }}
          </button>
        </view>
      </view>
    </view>

    <!-- AI 分析流式进度弹窗 -->
    <view v-if="analyzing" class="analyze-stream-mask">
      <view class="analyze-stream-modal">
        <text class="stream-title">AI 正在分析...</text>

        <!-- 步骤指示器 -->
        <view class="stream-steps">
          <view class="stream-step" :class="{ active: currentStep >= 1, done: currentStep > 1 }">
            <view class="step-dot">
              <text v-if="currentStep > 1" class="step-check">✓</text>
              <text v-else class="step-icon">🔍</text>
            </view>
            <text class="step-label">识别食物</text>
          </view>
          <view class="step-line" :class="{ done: currentStep > 1 }"></view>
          <view class="stream-step" :class="{ active: currentStep >= 2, done: currentStep > 2 }">
            <view class="step-dot">
              <text v-if="currentStep > 2" class="step-check">✓</text>
              <text v-else class="step-icon">📊</text>
            </view>
            <text class="step-label">分析营养</text>
          </view>
          <view class="step-line" :class="{ done: currentStep > 2 }"></view>
          <view class="stream-step" :class="{ active: currentStep >= 3, done: currentStep > 3 }">
            <view class="step-dot">
              <text v-if="currentStep > 3" class="step-check">✓</text>
              <text v-else class="step-icon">💡</text>
            </view>
            <text class="step-label">生成建议</text>
          </view>
        </view>

        <!-- 打字机显示区域 -->
        <view class="typewriter-area">
          <scroll-view class="typewriter-scroll" scroll-y="true" :scroll-top="scrollTop">
            <text class="typewriter-text">{{ streamDisplay || '▌' }}</text>
          </scroll-view>
        </view>

        <view class="stream-cancel" @tap="cancelAnalyze">
          <text class="cancel-text">取消</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { supabase } from '@/lib/supabase.js'
import { deleteMealRecord } from '@/utils/mealDeletion.js'

const showInputModal = ref(false)
const foodDescription = ref('')
const uploading = ref(false)
const uploadProgress = ref(0)
const errorMsg = ref('')
const uploadedImageUrl = ref('')
const previewImageUrl = ref('')
const uploadSuccess = ref(false)
const deletingMealId = ref('')

// 流式分析状态
const analyzing = ref(false)
const streamDisplay = ref('')
const currentStep = ref(1)
const scrollTop = ref(0)
let abortController = null
let stepTimer = null

// 今日统计数据
const todayStats = ref({
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0
})

// 模拟历史记录数据
const historyList = ref([])
const loadingHistory = ref(false)

const getScoreClass = (score) => {
  if (score >= 80) return 'score-high'
  if (score >= 60) return 'score-medium'
  return 'score-low'
}

// 根据流式内容更新步骤状态
const updateStepFromContent = (content) => {
  if (content.includes('total_calories') || content.includes('protein_g') || content.includes('热量') || content.includes('food_name')) {
    if (currentStep.value < 2) currentStep.value = 2
  }
  if (content.includes('advice') || content.includes('pairing_suggestions') || content.includes('cooking_tips')) {
    if (currentStep.value < 3) currentStep.value = 3
  }
}

// 启动步骤自动推进定时器
const startStepTimer = () => {
  clearStepTimer()
  // 3秒后自动跳到步骤2，6秒后跳到步骤3
  stepTimer = setTimeout(() => {
    if (currentStep.value < 2) currentStep.value = 2
    stepTimer = setTimeout(() => {
      if (currentStep.value < 3) currentStep.value = 3
    }, 3000)
  }, 3000)
}

// 清除步骤定时器
const clearStepTimer = () => {
  if (stepTimer) {
    clearTimeout(stepTimer)
    stepTimer = null
  }
}

// 取消分析
const cancelAnalyze = () => {
  clearStepTimer()
  if (abortController) {
    abortController.abort()
    abortController = null
  }
  analyzing.value = false
  streamDisplay.value = ''
  currentStep.value = 1
  uni.showToast({ title: '已取消分析', icon: 'none' })
}

// 格式化时间显示
const formatTime = (timestamp) => {
  if (!timestamp) return '--'
  const date = new Date(timestamp)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const recordDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const diffDays = Math.floor((today - recordDay) / (1000 * 60 * 60 * 24))

  let dayStr = ''
  if (diffDays === 0) {
    dayStr = '今天'
  } else if (diffDays === 1) {
    dayStr = '昨天'
  } else if (diffDays === 2) {
    dayStr = '前天'
  } else if (diffDays < 7) {
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    dayStr = weekDays[recordDay.getDay()]
  } else {
    dayStr = `${date.getMonth() + 1}月${date.getDate()}日`
  }

  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${dayStr} ${hours}:${minutes}`
}

// 计算今天的营养统计
const loadTodayStats = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.warn('用户未登录，跳过今日统计')
      return
    }

    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    const { data, error } = await supabase
      .from('meals')
      .select('total_calories, protein_g, carbs_g, fat_g')
      .eq('user_id', user.id)
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString())

    if (error) {
      console.error('查询今日统计失败:', error)
      return
    }

    let calories = 0, protein = 0, carbs = 0, fat = 0

    if (data && data.length > 0) {
      data.forEach(item => {
        calories += item.total_calories || 0
        protein += item.protein_g || 0
        carbs += item.carbs_g || 0
        fat += item.fat_g || 0
      })
    }

    todayStats.value = {
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10
    }
  } catch (e) {
    console.error('加载今日统计异常:', e)
  }
}

// 获取历史记录
const loadHistory = async () => {
  loadingHistory.value = true
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.warn('用户未登录，跳过历史记录查询')
      return
    }

    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('查询历史记录失败:', error)
      return
    }

    historyList.value = data.map(item => ({
      id: item.id,
      name: item.food_name || item.description || '未命名食物',
      image: item.image_url || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=food%20meal%20dish&image_size=square',
      time: formatTime(item.created_at),
      score: item.health_score || 0,
      nutrition: {
        calories: item.total_calories || 0,
        protein: item.protein_g || 0,
        carbs: item.carbs_g || 0,
        fat: item.fat_g || 0
      }
    }))
  } catch (e) {
    console.error('加载历史记录异常:', e)
  } finally {
    loadingHistory.value = false
  }
}

// 页面每次显示时刷新记录，避免从详情页删除后看到旧数据
onShow(() => {
  loadTodayStats()
  loadHistory()
})

// 拍照或选择图片
const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['camera', 'album'],
    success: (res) => {
      const tempPath = res.tempFilePaths[0]
      previewImageUrl.value = tempPath
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
  uploadSuccess.value = false

  try {
    console.log('开始上传图片')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('未登录，请重新登录')

    const fileName = `${user.id}/${Date.now()}.jpg`
    console.log('文件名:', fileName)

    console.log('开始获取图片数据...')
    const response = await fetch(tempPath)
    console.log('fetch 响应状态:', response.status)

    if (!response.ok) throw new Error('无法读取图片文件，请重试')

    const blob = await response.blob()
    console.log('Blob 大小:', blob.size, '类型:', blob.type)

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
    uploadSuccess.value = true
    previewImageUrl.value = '' // 清除本地预览，显示远程图
    console.log('公开 URL:', uploadedImageUrl.value)

    uni.showToast({ title: '图片上传成功', icon: 'success' })
  } catch (e) {
    console.error('上传失败:', e)
    errorMsg.value = e.message || '图片上传失败'
    setTimeout(() => errorMsg.value = '', 3000)
    previewImageUrl.value = '' // 上传失败清除预览
    uploadedImageUrl.value = ''
    uploadSuccess.value = false
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

// 清除预览
const clearPreview = () => {
  previewImageUrl.value = ''
  uploadedImageUrl.value = ''
  uploadSuccess.value = false
}

// 开始分析（SSE 流式）
const startAnalyze = async () => {
  if (!uploadedImageUrl.value && !foodDescription.value.trim()) {
    console.warn('没有图片或文字，无法分析')
    return
  }

  const currentImageUrl = uploadedImageUrl.value
  const currentDescription = foodDescription.value.trim()

  console.log('开始流式分析', {
    imageUrl: currentImageUrl,
    description: currentDescription,
    hasImage: !!currentImageUrl,
    hasDescription: !!currentDescription
  })

  uploadedImageUrl.value = ''
  previewImageUrl.value = ''
  foodDescription.value = ''
  uploadSuccess.value = false

  // 打开流式分析弹窗
  analyzing.value = true
  streamDisplay.value = ''
  currentStep.value = 1
  startStepTimer()

  // 创建 AbortController 用于取消
  abortController = new AbortController()

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('未登录，请重新登录')
    }

    const functionUrl = 'https://keobzofuuvvyixnhajdg.supabase.co/functions/v1/analyze-food'
    const anonKey = 'sb_publishable_rMmpQz3PABloXGv6Iy6w6A_lj3U0ZXC'

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': anonKey,
      },
      body: JSON.stringify({
        imageUrl: currentImageUrl || null,
        description: currentDescription || null,
      }),
      signal: abortController.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error('分析请求失败: ' + response.status)
    }

    // 读取 SSE 流
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let finalResult = null

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue

        const dataStr = trimmed.slice(6)
        try {
          const data = JSON.parse(dataStr)

          if (data.error) {
            throw new Error(data.error)
          }

          if (data.done) {
            finalResult = data.result
            console.log('流式分析完成:', finalResult)
          } else if (data.token) {
            streamDisplay.value += data.token
            updateStepFromContent(streamDisplay.value)
            scrollTop.value = scrollTop.value + 9999
          }
        } catch (e) {
          if (e.message && !e.message.includes('JSON')) {
            throw e
          }
        }
      }
    }

    // 流结束，关闭弹窗
    clearStepTimer()
    analyzing.value = false
    streamDisplay.value = ''
    currentStep.value = 1
    abortController = null

    if (!finalResult) {
      uni.showToast({ title: '分析未返回结果', icon: 'none', duration: 3000 })
      return
    }

    if (finalResult.error) {
      uni.showToast({ title: 'AI错误: ' + finalResult.error, icon: 'none', duration: 3000 })
      return
    }

    if (!finalResult.total_calories) {
      uni.showToast({ title: '返回数据格式异常', icon: 'none', duration: 3000 })
      return
    }

    console.log('AI 分析结果:', finalResult)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未登录，请重新登录')

      const { data: insertData, error: insertError } = await supabase.from('meals').insert({
        user_id: user.id,
        image_url: currentImageUrl || null,
        description: currentDescription || null,
        food_name: finalResult.food_name || null,
        total_calories: finalResult.total_calories,
        protein_g: finalResult.protein_g,
        fat_g: finalResult.fat_g,
        carbs_g: finalResult.carbs_g,
        health_score: finalResult.health_score,
        advice: finalResult.advice,
        pairing_suggestions: finalResult.pairing_suggestions || [],
        cooking_tips: finalResult.cooking_tips || []
      }).select()

      if (insertError) throw insertError

      const recordId = insertData[0].id
      await loadTodayStats()
      await loadHistory()
      uni.navigateTo({ url: '/pages/result/result?id=' + recordId })
    } catch (e) {
      console.error('保存失败:', e)
      uni.showToast({ title: '保存失败: ' + e.message, icon: 'none', duration: 3000 })
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      console.log('分析已被用户取消')
    } else {
      console.error('分析异常:', e)
      clearStepTimer()
      analyzing.value = false
      streamDisplay.value = ''
      currentStep.value = 1
      abortController = null
      uni.showToast({ title: e.message || '请求失败', icon: 'none', duration: 3000 })
    }
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
  console.log('预览区域点击', {
    uploadedImageUrl: uploadedImageUrl.value,
    uploadSuccess: uploadSuccess.value,
    uploading: uploading.value
  })

  if (!uploadedImageUrl.value || !uploadSuccess.value) {
    uni.showToast({
      title: uploading.value ? '图片上传中，请稍候' : '图片上传失败，请重新上传',
      icon: 'none',
      duration: 2000
    })
    return
  }

  // 调用分析
  startAnalyze()
}

// 查看详情
const viewDetail = (id) => {
  uni.navigateTo({ url: `/pages/result/result?id=${id}` })
}

// 删除分析记录及对应 Storage 图片
const confirmDeleteMeal = (id) => {
  if (deletingMealId.value) return

  uni.showModal({
    title: '删除记录',
    content: '确定删除这条分析记录吗？对应的食物图片也会一并删除。',
    confirmText: '删除',
    confirmColor: '#F44336',
    success: async (res) => {
      if (!res.confirm) return
      await deleteMeal(id)
    }
  })
}

const deleteMeal = async (id) => {
  deletingMealId.value = id
  uni.showLoading({ title: '删除中...' })

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('请先登录')

    await deleteMealRecord({
      supabase,
      mealId: id,
      userId: user.id
    })

    historyList.value = historyList.value.filter(item => item.id !== id)
    await loadTodayStats()
    await loadHistory()
    uni.hideLoading()
    uni.showToast({ title: '已删除', icon: 'success' })
  } catch (e) {
    console.error('删除失败:', e)
    uni.hideLoading()
    uni.showToast({ title: e.message || '删除失败', icon: 'none', duration: 3000 })
  } finally {
    deletingMealId.value = ''
  }
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
  margin-bottom: 16rpx;
}

.summary-stats {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
  display: block;
}

.stat-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.8);
  display: block;
  margin-top: 4rpx;
}

.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background: rgba(255, 255, 255, 0.3);
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
  min-width: 0;
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

.delete-btn {
  padding: 12rpx 16rpx;
  margin-left: 12rpx;
  border-radius: 10rpx;
  background: #FFEBEE;
}

.delete-btn:active {
  background: #FFCDD2;
}

.delete-text {
  font-size: 24rpx;
  color: #F44336;
  font-weight: 600;
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

/* 流式分析弹窗 */
.analyze-stream-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
}

.analyze-stream-modal {
  width: 90%;
  max-width: 650rpx;
  background: #1a1a2e;
  border-radius: 20rpx;
  padding: 40rpx 32rpx 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stream-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #e0e0e0;
  margin-bottom: 32rpx;
}

/* 步骤指示器 */
.stream-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
  width: 100%;
}

.stream-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.step-dot {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #2a2a4a;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.step-dot .step-icon {
  font-size: 28rpx;
}

.step-dot .step-check {
  font-size: 28rpx;
  color: #fff;
  font-weight: bold;
}

.stream-step.active .step-dot {
  background: #4CAF50;
  box-shadow: 0 0 16rpx rgba(76, 175, 80, 0.5);
  animation: step-pulse 1.5s ease-in-out infinite;
}

@keyframes step-pulse {
  0%, 100% { box-shadow: 0 0 8rpx rgba(76, 175, 80, 0.4); }
  50% { box-shadow: 0 0 24rpx rgba(76, 175, 80, 0.8); }
}

.stream-step.done .step-dot {
  background: #4CAF50;
}

.step-label {
  font-size: 22rpx;
  color: #888;
  transition: color 0.3s ease;
}

.stream-step.active .step-label {
  color: #4CAF50;
  font-weight: bold;
}

.stream-step.done .step-label {
  color: #4CAF50;
}

.step-line {
  width: 80rpx;
  height: 2rpx;
  background: #2a2a4a;
  margin: 0 12rpx;
  margin-top: -24rpx;
  transition: background 0.3s ease;
}

.step-line.done {
  background: #4CAF50;
}

/* 打字机区域 */
.typewriter-area {
  width: 100%;
  height: 300rpx;
  background: #0d0d1a;
  border-radius: 12rpx;
  padding: 20rpx;
  border: 1rpx solid #2a2a4a;
  margin-bottom: 24rpx;
}

.typewriter-scroll {
  width: 100%;
  height: 100%;
}

.typewriter-text {
  font-family: 'Courier New', Courier, monospace;
  font-size: 24rpx;
  color: #4CAF50;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-all;
}

.stream-cancel {
  padding: 20rpx 60rpx;
  border-radius: 40rpx;
  background: rgba(255, 255, 255, 0.1);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.stream-cancel:active {
  background: rgba(255, 255, 255, 0.2);
}

.cancel-text {
  font-size: 28rpx;
  color: #999;
}
</style>
