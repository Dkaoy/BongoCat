# API消息功能

BongoCat现在支持显示来自外部API的消息！此功能允许桌面宠物从各种网络资源获取动态内容并在语音气泡中显示。

## 设置说明

1. 打开BongoCat偏好设置
2. 导航到"API消息设置"部分
3. 使用开关启用API消息
4. 输入您选择的API URL
5. 设置更新间隔（以毫秒为单位）
6. 选择消息类型（信息、成功、警告、错误）
7. 可选择启用并配置用于认证的自定义请求头
8. 点击"获取消息"测试您的设置

## 可用资源

我们包含了几个文件来帮助您开始使用API消息功能：

- **API_EXAMPLES.md**: 包含与BongoCat兼容的免费公共API集合
- **API_CORS_GUIDE.md**: 处理CORS问题和创建简单代理服务器的解决方案
- **API_FEATURE_TESTING_GUIDE.md**: 测试API消息功能的分步指南
- **scripts/api-tester.js**: 在BongoCat中配置API之前测试API的Node.js脚本

## Example APIs

Here are a few APIs you can try:

- **Random Quotes**: `https://api.quotable.io/random`
- **Programming Jokes**: `https://v2.jokeapi.dev/joke/Programming?type=single`
- **Cat Facts**: `https://catfact.ninja/fact`

For more examples and detailed information, please refer to the API_EXAMPLES.md file.

## Troubleshooting

If you encounter issues with the API message feature:

1. Check that the API URL is correct and accessible
2. Some APIs may have CORS restrictions (see API_CORS_GUIDE.md)
3. Try different APIs to determine if it's a specific API issue
4. Check the message format in the API response

## Advanced Usage

### Custom Headers for Authentication

Many APIs require authentication via headers, such as API keys. To use these APIs:

1. Enable "Custom Headers" in the API settings
2. Add the required headers (e.g., `Authorization`, `X-API-Key`, etc.)
3. Enter the appropriate values for each header
4. Test your API connection

For example, to authenticate with a service requiring an API key in headers:
- Header Key: `X-API-Key` or `Authorization`  
- Header Value: `your-api-key-here` or `Bearer your-token-here`

### Custom Proxy Server

For advanced users, you can create your own proxy server to transform complex API responses into a format that BongoCat can display more effectively. See API_CORS_GUIDE.md for instructions.
