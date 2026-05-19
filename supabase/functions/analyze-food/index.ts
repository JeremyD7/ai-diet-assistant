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
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const systemPrompt = `你是一个专业营养师。请严格分析以下食物，并只返回纯JSON格式，不要包含任何其他文字或代码块标记。
注意事项：
1. 只返回一个JSON对象，不要有多个
2. 数值不要包含任何单位，纯数字即可
3. 格式必须严格符合JSON规范
4. 必须返回真实的估计值，不要全部返回0
5. 返回格式示例：
{
  "total_calories": 200,
  "protein_g": 10,
  "fat_g": 5,
  "carbs_g": 30,
  "health_score": 7,
  "advice": "保持均衡饮食"
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
      console.log("检测到图片URL，准备多模态请求");
      userContent = [
        { type: "text", text: `${systemPrompt}\n请仔细分析这张食物图片，识别食物的种类、分量，然后估算营养成分。必须返回真实的估计值，不要全部返回0！` }
      ];
      userContent.push({ type: "image_url", image_url: { url: imageUrl } });
    } else {
      userContent = `请分析以下食物：${description}\n${systemPrompt}`;
      console.log("发送文本请求，描述:", description);
    }

    messages.push({ role: "user", content: userContent });

    console.log("调用硅基流动 API");

    const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "Qwen3.6-35B-A3B",
        messages: messages,
        temperature: 0.1,
        max_tokens: 512,
      }),
    });

    console.log("硅基流动 API 响应状态:", response.status);
    const aiData = await response.json();
    console.log("硅基流动 API 完整响应:", JSON.stringify(aiData, null, 2));

    if (aiData.error) {
      console.error("硅基流动 API 错误:", aiData.error);
      throw new Error(aiData.error.message || "硅基流动 API 调用失败");
    }

    if (!aiData.choices || aiData.choices.length === 0) {
      console.error("AI 响应无 choices，完整响应:", JSON.stringify(aiData, null, 2));
      throw new Error("AI 返回格式异常，无 choices");
    }

    const aiContent = aiData.choices[0].message.content;
    console.log("AI 返回原始内容长度:", aiContent?.length);
    console.log("AI 返回原始内容:", aiContent);

    let result: any;
    try {
      result = extractAndParseJson(aiContent);
      result = normalizeNutritionData(result);
    } catch (parseError) {
      console.warn("JSON解析失败，尝试备选方案:", parseError);
      try {
        result = extractFallbackData(aiContent);
        console.log("备选方案成功:", result);
      } catch (fallbackError) {
        console.error("所有方案都失败:", fallbackError);
        return new Response(JSON.stringify({
          error: "AI 返回格式异常",
          raw_content: aiContent,
          fallback: true
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        });
      }
    }

    console.log("最终结果:", result);
    
    // 检查是否返回了全0，如果是则提示问题
    const isAllZero = result.total_calories === 0 && result.protein_g === 0 && result.fat_g === 0 && result.carbs_g === 0;
    if (isAllZero) {
      console.warn("⚠️ 警告：返回的营养数据全为0，这可能表示AI无法识别图片或图片不可访问");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Function error:", error);
    console.error("Error stack:", error.stack);
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
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

  const adviceMatch = content.match(/advice["\s:]+"([^"]+)"/i) || 
                     content.match(/建议["\s:]+"([^"]+)"/i) ||
                     content.match(/建议[:\s]*([^\n}]+)/i);
  
  const advice = adviceMatch ? adviceMatch[1].trim() : "保持均衡饮食";

  return {
    total_calories: totalCalories,
    protein_g: protein,
    fat_g: fat,
    carbs_g: carbs,
    health_score: healthScore,
    advice: advice
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
    total_calories: extractNumber(data.total_calories, 200),
    protein_g: extractNumber(data.protein_g, 10),
    fat_g: extractNumber(data.fat_g, 5),
    carbs_g: extractNumber(data.carbs || data.carbs_g, 30),
    health_score: Math.min(10, Math.max(1, Math.round(extractNumber(data.health_score, 5)))),
    advice: typeof data.advice === 'string' ? data.advice.substring(0, 200) : "保持均衡饮食"
  };
}
