import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
  console.log("===== Edge Function 开始执行 =====");

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  try {
    console.log("开始解析请求体...");
    const { imageUrl, description } = await req.json();
    console.log("收到请求参数:", { imageUrl, description });

    if (!imageUrl && !description) {
      return new Response(
        JSON.stringify({ error: "请提供图片链接或食物描述" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const systemPrompt = `你是一个专业营养师。请严格分析以下食物，并只返回纯JSON格式，不要包含任何其他文字或代码块标记。

注意事项：
1. 只返回一个JSON对象，不要有多个
2. 数值不要包含任何单位，纯数字即可
3. 格式必须严格符合JSON规范
4. 必须返回真实的估计值，不要全部返回0
5. pairing_suggestions 是推荐搭配的食物列表，每项包含 name（食物名）和 reason（搭配理由）
6. cooking_tips 是烹饪建议的字符串数组，给出2-4条实用的烹饪技巧
7. advice 是针对这份食物的综合饮食建议

返回格式示例：
{
  "food_name": "番茄炒鸡蛋",
  "total_calories": 200,
  "protein_g": 10,
  "fat_g": 5,
  "carbs_g": 30,
  "health_score": 7,
  "advice": "番茄炒鸡蛋营养均衡，番茄富含番茄红素和维C，鸡蛋提供优质蛋白。建议少油少盐烹饪",
  "pairing_suggestions": [
    {"name": "糙米饭", "reason": "提供复合碳水，增加饱腹感"},
    {"name": "清炒西兰花", "reason": "补充膳食纤维和维生素"}
  ],
  "cooking_tips": [
    "鸡蛋先炒至八分熟盛出，再炒番茄，最后混合，避免过老",
    "使用不粘锅可减少用油量",
    "加少许白糖可中和番茄酸味"
  ]
}
如果无法识别食物，请返回{"error": "无法识别食物"}。`;

    const apiKey = Deno.env.get("SILICONFLOW_API_KEY");
    if (!apiKey) {
      throw new Error("SILICONFLOW_API_KEY 环境变量未配置");
    }
    console.log("API Key 存在，长度:", apiKey.length);

    let messages: any[] = [];
    let userContent: any;

    if (imageUrl) {
      console.log("检测到图片，使用VLM模型处理");
      userContent = [
        { type: "text", text: `${systemPrompt}\n请仔细分析这张食物图片，识别食物的种类、分量，然后估算营养成分，并给出搭配建议和烹饪建议。必须返回真实的估计值，不要全部返回0！` }
      ];
      userContent.push({ type: "image_url", image_url: { url: imageUrl } });
      console.log("发送给VLM模型的图片URL:", imageUrl);
    } else {
      userContent = `请分析以下食物：${description}\n${systemPrompt}`;
      console.log("发送文本请求，描述:", description);
    }

    messages.push({ role: "user", content: userContent });

    console.log("===== 调用硅基流动VLM模型 (流式) =====");

    const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "Qwen/Qwen3.6-35B-A3B",
        messages: messages,
        temperature: 0.1,
        max_tokens: 2048,
        stream: true,
      }),
    });

    console.log("硅基流动 API 响应状态:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("硅基流动 API 错误:", errorText);
      throw new Error("硅基流动 API 调用失败: " + response.status);
    }

    // 创建 SSE 流式响应
    const encoder = new TextEncoder();
    let accumulatedContent = "";

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data: ")) continue;

              const dataStr = trimmed.slice(6);
              if (dataStr === "[DONE]") continue;

              try {
                const parsed = JSON.parse(dataStr);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  accumulatedContent += delta;
                  // 将 token 转发给前端
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ token: delta })}\n\n`)
                  );
                }
              } catch {
                // 跳过无法解析的行
              }
            }
          }

          // 流结束，解析完整内容
          console.log("流式响应完成，累积内容:", accumulatedContent);
          let result: any;
          try {
            result = extractAndParseJson(accumulatedContent);
            result = normalizeNutritionData(result);
          } catch (parseError) {
            console.warn("JSON解析失败，尝试备选方案:", parseError);
            try {
              result = extractFallbackData(accumulatedContent);
            } catch (fallbackError) {
              console.error("所有方案都失败:", fallbackError);
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ error: "AI 返回格式异常", raw_content: accumulatedContent, fallback: true })}\n\n`)
              );
              controller.close();
              return;
            }
          }

          console.log("最终结果:", result);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, result })}\n\n`)
          );
          controller.close();
        } catch (e) {
          console.error("流处理错误:", e);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: e.message || "流处理错误" })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

function extractAndParseJson(content: string): any {
  let cleanedContent = content;
  let jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
  if (!jsonMatch) {
    jsonMatch = content.match(/```\n?([\s\S]*?)\n?```/);
  }
  if (jsonMatch) {
    cleanedContent = jsonMatch[1];
  } else {
    const braceStart = content.indexOf('{');
    let braceEnd = -1;
    let balance = 0;
    for (let i = braceStart; i < content.length; i++) {
      if (content[i] === '{') balance++;
      if (content[i] === '}') balance--;
      if (balance === 0) {
        braceEnd = i;
        break;
      }
    }
    if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
      cleanedContent = content.substring(braceStart, braceEnd + 1);
    }
  }

  cleanedContent = cleanedContent.trim();
  console.log("清理后的内容:", cleanedContent);

  let fixedJson = cleanedContent;
  try {
    fixedJson = fixJson(cleanedContent);
    console.log("修复后的JSON:", fixedJson);
  } catch (e) {
    console.log("JSON修复跳过:", e);
  }

  return JSON.parse(fixedJson);
}

function fixJson(str: string): string {
  let result = str;

  result = result.replace(/:([ \t\n]*)([^\s{},\[\]":]+)([ \t\n]*)([,}])/g, (match, before, value, after, tail) => {
    if (!isNaN(Number(value)) && !value.includes('"') && !value.includes("'")) {
      return `:${before}${value}${after}${tail}`;
    }
    return `:${before}"${value.replace(/"/g, '\\"')}"${after}${tail}`;
  });

  result = result.replace(/([{,])([ \t\n]*)([a-zA-Z0-9_]+)([ \t\n]*):/g, '$1"$3":');

  result = result.replace(/,([ \t\n]*[}\]])/g, '$1');

  return result;
}

function extractFallbackData(content: string): any {
  console.log("开始 extractFallbackData 提取数据");

  const extractNumber = (pattern: RegExp): number | null => {
    const match = content.match(pattern);
    if (match) {
      const numStr = match[1].replace(/[^\d.]/g, '');
      const num = parseFloat(numStr);
      if (!isNaN(num)) return num;
    }
    return null;
  };

  const totalCalories = extractNumber(/total_calories["\s:]+[^\d]*([\d.]+)/i) ||
                       extractNumber(/热量["\s:]+[^\d]*([\d.]+)/i) ||
                       extractNumber(/([\d.]+)\s*千卡/i) ||
                       200;

  const protein = extractNumber(/protein_g["\s:]+[^\d]*([\d.]+)/i) ||
                  extractNumber(/蛋白质["\s:]+[^\d]*([\d.]+)/i) ||
                  extractNumber(/([\d.]+)\s*克.*蛋白质/i) ||
                  10;

  const fat = extractNumber(/fat_g["\s:]+[^\d]*([\d.]+)/i) ||
              extractNumber(/脂肪["\s:]+[^\d]*([\d.]+)/i) ||
              extractNumber(/([\d.]+)\s*克.*脂肪/i) ||
              5;

  const carbs = extractNumber(/carbs_g["\s:]+[^\d]*([\d.]+)/i) ||
                extractNumber(/碳水["\s:]+[^\d]*([\d.]+)/i) ||
                extractNumber(/([\d.]+)\s*克.*碳水/i) ||
                30;

  let healthScore = extractNumber(/health_score["\s:]+[^\d]*([\d]+)/i) ||
                    extractNumber(/评分["\s:]+[^\d]*([\d]+)/i) ||
                    extractNumber(/([\d]+)\s*分/i) ||
                    5;

  healthScore = Math.min(10, Math.max(1, Math.round(healthScore)));

  const extractString = (pattern: RegExp): string | null => {
    const match = content.match(pattern);
    if (match) return match[1].trim();
    return null;
  };

  const foodName = extractString(/food_name["\s:]+"([^"]+)"/i) || null;
  const advice = extractString(/advice["\s:]+"([^"]+)"/i) ||
                 extractString(/建议["\s:]+"([^"]+)"/i) ||
                 "保持均衡饮食";

  return {
    food_name: foodName,
    total_calories: totalCalories,
    protein_g: protein,
    fat_g: fat,
    carbs_g: carbs,
    health_score: healthScore,
    advice: advice,
    pairing_suggestions: [],
    cooking_tips: []
  };
}

function normalizeNutritionData(data: any): any {
  const extractNumber = (value: any, defaultValue: number): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const numStr = value.replace(/[^\d.]/g, '');
      const num = parseFloat(numStr);
      return isNaN(num) ? defaultValue : num;
    }
    return defaultValue;
  };

  return {
    food_name: typeof data.food_name === 'string' ? data.food_name : null,
    total_calories: extractNumber(data.total_calories, 200),
    protein_g: extractNumber(data.protein_g, 10),
    fat_g: extractNumber(data.fat_g, 5),
    carbs_g: extractNumber(data.carbs || data.carbs_g, 30),
    health_score: Math.min(10, Math.max(1, Math.round(extractNumber(data.health_score, 5)))),
    advice: typeof data.advice === 'string' ? data.advice.substring(0, 500) : "保持均衡饮食",
    pairing_suggestions: Array.isArray(data.pairing_suggestions) ? data.pairing_suggestions.slice(0, 5) : [],
    cooking_tips: Array.isArray(data.cooking_tips) ? data.cooking_tips.slice(0, 4) : []
  };
}
