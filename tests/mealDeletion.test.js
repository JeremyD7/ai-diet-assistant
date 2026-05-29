import test from 'node:test'
import assert from 'node:assert/strict'

import { deleteMealRecord, getMealImageStoragePath } from '../utils/mealDeletion.js'

test('getMealImageStoragePath extracts the object path from a Supabase public URL', () => {
  const url = 'https://keobzofuuvvyixnhajdg.supabase.co/storage/v1/object/public/meal-images/user-1/1710000000000.jpg'

  assert.equal(getMealImageStoragePath(url), 'user-1/1710000000000.jpg')
})

test('getMealImageStoragePath returns an empty path when there is no image URL', () => {
  assert.equal(getMealImageStoragePath(''), '')
  assert.equal(getMealImageStoragePath(null), '')
})

test('deleteMealRecord removes the storage image before deleting the meal row', async () => {
  const calls = []
  const supabase = createSupabaseStub({
    meal: {
      id: 'meal-1',
      user_id: 'user-1',
      image_url: 'https://keobzofuuvvyixnhajdg.supabase.co/storage/v1/object/public/meal-images/user-1/1710000000000.jpg'
    },
    calls
  })

  const result = await deleteMealRecord({ supabase, mealId: 'meal-1', userId: 'user-1' })

  assert.deepEqual(result, { removedImagePath: 'user-1/1710000000000.jpg' })
  assert.deepEqual(calls, [
    ['selectMeal', 'meal-1', 'user-1'],
    ['removeImage', 'meal-images', ['user-1/1710000000000.jpg']],
    ['deleteMeal', 'meal-1', 'user-1']
  ])
})

test('deleteMealRecord keeps the meal row when storage deletion fails', async () => {
  const calls = []
  const supabase = createSupabaseStub({
    meal: {
      id: 'meal-1',
      user_id: 'user-1',
      image_url: 'https://keobzofuuvvyixnhajdg.supabase.co/storage/v1/object/public/meal-images/user-1/1710000000000.jpg'
    },
    storageError: new Error('storage unavailable'),
    calls
  })

  await assert.rejects(
    () => deleteMealRecord({ supabase, mealId: 'meal-1', userId: 'user-1' }),
    /删除图片失败/
  )

  assert.deepEqual(calls, [
    ['selectMeal', 'meal-1', 'user-1'],
    ['removeImage', 'meal-images', ['user-1/1710000000000.jpg']]
  ])
})

test('deleteMealRecord refuses to remove an image outside the current user folder', async () => {
  const calls = []
  const supabase = createSupabaseStub({
    meal: {
      id: 'meal-1',
      user_id: 'user-1',
      image_url: 'https://keobzofuuvvyixnhajdg.supabase.co/storage/v1/object/public/meal-images/user-2/1710000000000.jpg'
    },
    calls
  })

  await assert.rejects(
    () => deleteMealRecord({ supabase, mealId: 'meal-1', userId: 'user-1' }),
    /图片路径与当前用户不匹配/
  )

  assert.deepEqual(calls, [
    ['selectMeal', 'meal-1', 'user-1']
  ])
})

function createSupabaseStub({ meal, storageError = null, calls }) {
  return {
    from(table) {
      assert.equal(table, 'meals')
      return createMealsQuery({ meal, calls })
    },
    storage: {
      from(bucket) {
        return {
          async remove(paths) {
            calls.push(['removeImage', bucket, paths])
            return { error: storageError }
          }
        }
      }
    }
  }
}

function createMealsQuery({ meal, calls }) {
  const state = {
    operation: '',
    id: '',
    userId: ''
  }

  const query = {
    select() {
      state.operation = 'select'
      return query
    },
    delete() {
      state.operation = 'delete'
      return query
    },
    eq(column, value) {
      if (column === 'id') state.id = value
      if (column === 'user_id') state.userId = value
      return query
    },
    async single() {
      calls.push(['selectMeal', state.id, state.userId])
      return { data: meal, error: null }
    },
    then(resolve) {
      calls.push(['deleteMeal', state.id, state.userId])
      resolve({ error: null })
    }
  }

  return query
}
