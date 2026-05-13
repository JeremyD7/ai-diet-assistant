
# 修复 Edge Function 500 错误 - 实施计划

## 问题分析

从日志看：
- 请求成功发送到 Edge Function
- 但返回 500 Internal Server Error
- 错误信息："AI 返回格式不正确，无法提取 JSON"
- 问题出在 Edge Function 端

## 可能原因排查

### 1. 可能的问题点
- 硅基流动 API 调用失败
- 环境变量 `SILICONFLOW_API_KEY` 未配置或不正确
- 模型名称 `Qwen/Qwen3.5-122B-A10B` 可能有问题
- 图像输入格式不兼容
- AI 返回的内容无法正确解析

## 修复方案

### 1. 添加详细的日志
在 Edge Function 中添加更详细的调试日志

### 2. 改进错误处理
- 捕获并记录硅基流动 API 的完整响应
- 更好的错误信息返回
- 添加超时处理

### 3. 调整模型或简化处理逻辑
- 尝试使用不同的模型名称
- 添加备用方案（如仅用图像分析）

## 修改内容

修改文件：`supabase/functions/analyze-food/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageUrl, description } = await req.json();
    console.log("收到请求参数:", { imageUrl, description });

    if (!imageUrl && !description) {
      return new Response(
        JSON.stringify({ error: "请提供图片链接或食物描述" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // 构建系统提示词
    const systemPrompt = `你是一个专业营养师。请严格分析以下食物，并以纯JSON格式返回，不要包含任何其他文字或代码块标记。
JSON格式必须包含以下字段（单位使用标准公制）：
{
  "total_calories": 数字（千卡）,
  "protein_g": 数字（克）,
  "fat_g": 数字（克）,
  "carbs_g": 数字（克）,
  "health_score": 1-10的整数,
  "advice": "简短饮食建议字符串"
}
如果无法识别食物，请返回{"error": "无法识别食物"}。`;

    // 构建用户消息
    let userMessage: any;
    if (imageUrl) {
      userMessage = [
        { type: "text", text: systemPrompt },
        { type: "image_url", image_url: { url: imageUrl }
      ];
    } else {
      // 纯文本描述
      userMessage = `请分析以下食物：${description}\n${systemPrompt}`;
    }

    // 打印调用信息
    console.log("调用硅基流动 API，模型: Qwen/Qwen3.5-122B-A10B");
    
    // 调用硅基流动 API
    const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("SILICONFLOW_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "Qwen/Qwen3.5-122B-A10B",
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
        temperature: 0.1,
        max_tokens: 512,
      }),
    });

    console.log("硅基流动 API 响应状态:", response.status);
    const aiData = await response.json();
    console.log("硅基流动 API 完整响应:", JSON.stringify(aiData, null, 2));

    if (aiData.error) {
      throw new Error(aiData.error.message || "硅基流动 API 调用失败");
    }

    if (!aiData.choices || !aiData.choices.length === 0) {
      throw new Error("AI 返回格式异常，无 choices");
    }

    const aiContent = aiData.choices[0].message.content;
    console.log("AI 返回内容:", aiContent);

    // 提取 JSON（可能被包裹在代码块中）
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI 返回格式不正确，无法提取 JSON");
    }

    const result = JSON.parse(jsonMatch[0]);
    console.log("解析后的结果:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
```

## 修复要点：
1. 添加详细的调试日志
2. 验证 AI 更好的错误信息
3. 检查更详细的错误处理
4. 打印各个步骤的状态
