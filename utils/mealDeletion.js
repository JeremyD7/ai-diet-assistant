const MEAL_IMAGES_BUCKET = 'meal-images'

export const getMealImageStoragePath = (imageUrl, bucket = MEAL_IMAGES_BUCKET) => {
  if (!imageUrl) return ''

  try {
    const url = new URL(imageUrl)
    const marker = `/storage/v1/object/public/${bucket}/`
    const markerIndex = url.pathname.indexOf(marker)

    if (markerIndex === -1) return ''

    const encodedPath = url.pathname.slice(markerIndex + marker.length)
    return decodeURIComponent(encodedPath)
  } catch (e) {
    return ''
  }
}

export const deleteMealRecord = async ({ supabase, mealId, userId }) => {
  if (!mealId) throw new Error('缺少记录ID')
  if (!userId) throw new Error('请先登录')

  const { data: meal, error: mealError } = await supabase
    .from('meals')
    .select('id, user_id, image_url')
    .eq('id', mealId)
    .eq('user_id', userId)
    .single()

  if (mealError) throw new Error('查询记录失败')
  if (!meal) throw new Error('记录不存在')

  const imagePath = getMealImageStoragePath(meal.image_url)

  if (imagePath) {
    if (!imagePath.startsWith(`${userId}/`)) {
      throw new Error('图片路径与当前用户不匹配')
    }

    const { error: storageError } = await supabase.storage
      .from(MEAL_IMAGES_BUCKET)
      .remove([imagePath])

    if (storageError) {
      throw new Error('删除图片失败: ' + storageError.message)
    }
  }

  const { error: deleteError } = await supabase
    .from('meals')
    .delete()
    .eq('id', mealId)
    .eq('user_id', userId)

  if (deleteError) throw new Error('删除记录失败: ' + deleteError.message)

  return {
    removedImagePath: imagePath
  }
}
