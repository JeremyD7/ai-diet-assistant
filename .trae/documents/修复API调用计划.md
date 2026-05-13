
# 修复硅基流动 API 调用问题 - 实施计划

## 问题分析

从错误日志看，AI 返回了连 `choices` 都没有的数据，说明 API 调用本身可能失败了。可能原因：
1. **API Key 问题** - 环境变量 `SILICONFLOW_API_KEY` 可能未配置或无效
2. **模型名称问题** - `Qwen/Qwen2.5-VL-72B-Instruct` 可能不存在或名称错误
3. **请求格式问题** - 消息格式可能不兼容
4. **账户额度问题** - API 额度可能耗尽

## 修复方案

### 1. 使用更简单、更标准的模型
根据硅基流动文档，尝试使用更常见的模型：
- `Qwen/Qwen2.5-7B-Instruct`（纯文本，更简单）
- 或 `deepseek-ai/DeepSeek-V3`

### 2. 简化请求格式
确保请求格式完全符合硅基流动 API 要求

### 3. 添加更详细的错误日志
打印 API 返回的完整数据，特别是 `error` 字段

### 4. 添加健康检查
先测试 API 是否可用

## 具体修改

修改文件：`supabase/functions/analyze-food/index.ts`

### 修改点1：更换模型
```typescript
model: "Qwen/Qwen2.5-7B-Instruct" // 使用纯文本模型，更简单可靠
```

### 修改点2：简化消息格式
```typescript
content: [
  {
    role: "user",
    content: userMessage
  }
]
```

### 修改点3：添加 API Key 检查
```typescript
const apiKey = Deno.env.get("SILICONFLOW_API_KEY");
if (!apiKey) {
  throw new Error("SILICONFLOW_API_KEY 环境变量未配置");
}
console.log("API Key 存在，长度:", apiKey.length);
```

### 修改点4：更好的错误处理
```typescript
// 如果没有 choices，打印完整的 aiData
if (!aiData.choices || aiData.choices.length === 0) {
  console.error("AI 响应无 choices，完整响应:", JSON.stringify(aiData, null, 2));
  throw new Error("AI 返回格式异常，无 choices");
}
```

## 验证步骤

1. 部署后测试纯文本："一碗白米饭"
2. 查看完整的 Edge Function 日志
3. 确认：
   - API Key 是否存在
   - 响应状态码
   - 完整的 aiData 对象
   - 具体的错误信息

## 备选方案

如果 API 仍然失败，可以考虑：
1. 检查 Supabase 中的环境变量配置
2. 在硅基流动平台测试 API
3. 确认账户余额和额度
