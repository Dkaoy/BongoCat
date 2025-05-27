# API消息功能测试指南

本指南提供了在BongoCat桌面宠物应用程序中测试新API消息功能的说明。

## 测试环境设置

1. 确保已更新到包含API功能的最新版本
2. 启动应用程序并打开偏好设置窗口
3. 导航到气泡设置部分

## 测试公共API

以下是一些可用于测试的公共API：

### 名言API
- **Quotable API**: `https://api.quotable.io/random`
  - 以JSON格式返回随机名言
  - 响应包含应被自动检测的`content`字段

### 笑话API
- **JokeAPI**: `https://v2.jokeapi.dev/joke/Programming?type=single`
  - 以JSON格式返回编程笑话
  - 响应包含我们应用应解析的`joke`字段

### 日期/时间API
- **WorldTime API**: `http://worldtimeapi.org/api/ip`
  - 根据您的IP地址返回当前时间
  - 适合测试复杂对象的JSON解析

### 天气API（需要API密钥）
- **OpenWeatherMap**: `https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_API_KEY`
  - 将`YOUR_API_KEY`替换为有效的API密钥
  - 测试API认证场景

## 预期行为

1. **API启用**：启用API消息时，应用程序应立即获取一条消息
2. **间隔工作**：应用程序应按您指定的间隔获取新消息
3. **消息显示**：消息应以正确的类型（信息、成功等）显示在气泡中
4. **错误处理**：如果您输入无效的URL或API无法访问，您应该看到错误消息

## 故障排除

### CORS跨域问题
如果遇到CORS问题，请尝试：
1. 使用支持CORS的API
2. 使用不带自定义请求头的简单GET请求
3. 使用返回简单文本或JSON响应的API

### 响应格式问题
如果消息显示不正确：
1. 使用浏览器或curl等工具手动检查API响应格式
2. 调整URL到返回兼容格式数据的端点
3. 记住我们的应用程序当前查找`message`、`content`、`text`字段，或回退到整个响应

## 问题报告
如果您遇到API消息功能问题，请报告以下信息：
1. 您使用的API URL
2. 预期的间隔时间
3. 显示的任何错误消息
4. 您运行的平台（Windows、macOS、Linux）
