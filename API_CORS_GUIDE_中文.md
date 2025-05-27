# API 集成故障排除指南

## 常见的 CORS 问题和解决方案

在 BongoCat 中使用 API 消息功能时，您可能会遇到 CORS（跨域资源共享）问题。以下是解决方法：

### 理解 CORS 错误

CORS 错误发生在您的应用程序尝试从与当前域不同的域请求资源时。这些错误可能如下所示：

```
Access to fetch at 'https://api.example.com/data' from origin 'tauri://localhost' has been blocked by CORS policy
```

### CORS 问题的解决方案

1. **使用支持 CORS 的 API**：一些公共 API 已启用 CORS。尝试使用这些 API：
   - `https://api.quotable.io/random`（随机名言）
   - `https://v2.jokeapi.dev/joke/Programming?type=single`（编程笑话）

2. **使用本地代理（用于开发）**：
   - 对于开发目的，您可以设置本地代理服务器来绕过 CORS 限制
   - 可以创建一个基于 Express 的简单代理来转发请求

3. **在 Tauri 中添加 CORS 头（高级）**：
   - 如果您运行自己的 API 服务器，请确保它包含适当的 CORS 头：
     ```
     Access-Control-Allow-Origin: tauri://localhost
     Access-Control-Allow-Methods: GET, POST, OPTIONS
     Access-Control-Allow-Headers: Content-Type
     ```

## 处理不同的 API 响应格式

BongoCat API 消息功能尝试处理各种 API 响应格式，但您可能需要适配某些 API：

### 文本响应
- 纯文本响应直接在气泡中显示

### JSON 响应
应用程序按以下顺序尝试从 JSON 中提取消息：
1. `message` 字段
2. `content` 字段
3. `text` 字段
4. `joke` 字段
5. `quote` 字段
6. 嵌套数据字段如 `data.text`
7. 作为最后手段，使用找到的第一个字符串值或将整个对象字符串化

### 适配特定 API

#### 对于天气 API：
```javascript
// OpenWeatherMap API 响应适配示例
{
  "weather": [{"description": "晴朗"}],
  "main": {"temp": 20.5}
}
// 您可能想要将其转换为：
{
  "message": "天气：晴朗，温度：20.5°C"
}
```

要适配此 API，您需要创建一个简单的代理来重新格式化数据。

## 处理速率限制和 API 密钥

许多免费 API 都有速率限制或需要 API 密钥：

1. **管理速率限制**：
   - BongoCat 有可配置的间隔设置以防止达到速率限制
   - 为公共 API 设置合理的间隔（例如，5分钟或更长）

2. **API 密钥**：
   - 对于需要身份验证的 API，您需要在 URL 中包含您的 API 密钥：
     ```
     https://api.example.com/data?api_key=YOUR_API_KEY
     ```
   - **安全警告**：在应用中存储 API 密钥时要小心，因为它们可能暴露给用户

## 创建简单的代理服务器（可选）

如果您想创建一个简单的代理服务器来处理 CORS 并重新格式化 API 响应：

1. 为您的代理服务器创建一个新文件夹
2. 安装 Node.js 并使用 `npm init` 创建新项目
3. 安装 Express 和 Axios：
   ```bash
   npm install express axios cors
   ```
4. 创建 `index.js` 文件：
   ```javascript
   const express = require('express');
   const axios = require('axios');
   const cors = require('cors');
   
   const app = express();
   app.use(cors()); // 为所有路由启用 CORS
   
   app.get('/api/quote', async (req, res) => {
     try {
       const response = await axios.get('https://api.quotable.io/random');
       res.json({ message: `"${response.data.content}" - ${response.data.author}` });
     } catch (error) {
       res.status(500).json({ message: '获取名言失败' });
     }
   });
   
   app.get('/api/weather', async (req, res) => {
     try {
       const city = req.query.city || 'London';
       const apiKey = 'YOUR_API_KEY'; // 替换为您的 OpenWeatherMap API 密钥
       const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
       res.json({ 
         message: `${response.data.name}的天气：${response.data.weather[0].description}，${response.data.main.temp}°C` 
       });
     } catch (error) {
       res.status(500).json({ message: '获取天气信息失败' });
     }
   });
   
   const PORT = process.env.PORT || 3000;
   app.listen(PORT, () => console.log(`代理服务器运行在端口 ${PORT}`));
   ```
5. 使用 `node index.js` 启动服务器
6. 在 BongoCat 中，使用 `http://localhost:3000/api/quote` 或 `http://localhost:3000/api/weather?city=Tokyo` 作为 API URL
