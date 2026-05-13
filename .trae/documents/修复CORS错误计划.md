
# 修复 CORS 错误 - 实施计划

## 问题分析

从错误日志看：
```
Access to fetch at 'https://keobzofuuvvyixnhajdg.supabase.co/functions/v1/analyze-food' 
from origin 'http://localhost:5173' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
It does not have HTTP ok status.
```

**问题根因**：
- CORS 预检请求（OPTIONS）返回的状态码不正确
- Edge Function 的 OPTIONS 处理器可能返回了非 200 状态码
- 流式响应时 CORS header 可能不完整

## 修复方案

### 1. 修复 OPTIONS 预检请求
确保 OPTIONS 请求返回正确的状态码和 headers：
```typescript
if (req.method === "OPTIONS") {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Max-Age": "86400",
    },
  });
}
```

### 2. 确保所有响应包含完整 CORS headers
- OPTIONS 预检响应
- 流式响应
- 错误响应

### 3. 添加额外的 CORS headers
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
};
```

## 修改文件

**supabase/functions/analyze-food/index.ts**

### 修改点1：增强 CORS 配置
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
```

### 修改点2：修复 OPTIONS 处理器
```typescript
if (req.method === "OPTIONS") {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      "Access-Control-Max-Age": "86400",
    },
  });
}
```

### 修改点3：确保流式响应包含完整 CORS
```typescript
return new Response(stream, {
  headers: {
    ...corsHeaders,
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  },
});
```

## 验证步骤

1. 重新部署 Edge Function
2. 测试 API 调用
3. 检查浏览器控制台
4. 确认 CORS 错误已解决

## 备选方案

如果仍然失败：
1. 使用 Supabase Dashboard 的 CORS 配置
2. 检查 Supabase 项目设置
3. 考虑使用代理服务器
