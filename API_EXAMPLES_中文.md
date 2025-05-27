# BongoCat API 示例

本文件提供了与 BongoCat API 消息功能兼容的公共 API 集合。这些 API 免费使用且无需身份验证。

## 名言 API

这些 API 返回随机名言：

```
https://api.quotable.io/random
```
以 JSON 格式返回随机名言。示例响应：
```json
{
  "content": "天才是百分之一的灵感加上百分之九十九的汗水。",
  "author": "Thomas Edison"
}
```

```
https://zenquotes.io/api/random
```
返回随机励志名言。示例响应：
```json
[{"q":"我们无法帮助每个人，但每个人都可以帮助别人。","a":"Ronald Reagan","h":"<blockquote>&ldquo;我们无法帮助每个人，但每个人都可以帮助别人。&rdquo; &mdash; <footer>Ronald Reagan</footer></blockquote>"}]
```

## 笑话 API

这些 API 返回笑话：

```
https://v2.jokeapi.dev/joke/Programming?type=single
```
返回编程笑话。示例响应：
```json
{
  "category": "Programming",
  "joke": "一个 SQL 语句走进酒吧，看到两张表。它走过去问：\"我可以加入你们吗？\"",
  "type": "single"
}
```

```
https://official-joke-api.appspot.com/random_joke
```
返回随机笑话。示例响应：
```json
{
  "id": 1,
  "type": "general",
  "setup": "鱼撞到墙上时说什么？",
  "punchline": "该死！"
}
```

## 日期/时间 API

```
http://worldtimeapi.org/api/ip
```
根据您的 IP 地址返回当前时间。示例响应：
```json
{
  "timezone": "Europe/London",
  "datetime": "2023-07-08T15:14:25.447373+01:00"
}
```

## 猫咪趣事 API

```
https://catfact.ninja/fact
```
返回随机猫咪趣事。示例响应：
```json
{
  "fact": "猫咪每只耳朵有 32 块肌肉。",
  "length": 33
}
```

## 高级 API（需要 API 密钥）

以下 API 需要 API 密钥，您需要注册获取：

### 天气 API
```
https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_API_KEY&units=metric
```
将 `YOUR_API_KEY` 替换为您的 OpenWeatherMap API 密钥

### 新闻 API
```
https://newsapi.org/v2/top-headlines?country=us&apiKey=YOUR_API_KEY
```
将 `YOUR_API_KEY` 替换为您的 NewsAPI 密钥

## 测试自定义 API 格式

如果您想使用自定义 JSON 格式测试 API 消息功能，可以使用 JSONPlaceholder 等服务：

```
https://jsonplaceholder.typicode.com/posts/1
```

示例响应：
```json
{
  "userId": 1,
  "id": 1,
  "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
  "body": "quia et suscipit suscipit recusandae consequuntur expedita et cum reprehenderit molestiae ut ut quas totam nostrum rerum est autem sunt rem eveniet architecto"
}
```

## API 消息功能使用技巧

1. 从不需要身份验证的简单 API 开始
2. 如果遇到 CORS 问题，请参考 API_CORS_GUIDE_中文.md 文件
3. 应用程序会自动从各种 JSON 字段中提取消息
4. 对于更复杂的 API，您可能需要创建一个简单的代理服务器
