// Utility functions for network error detection and handling

/**
 * Check if an error is a network error
 * @param error any error to check
 * @returns boolean indicating if it's a network error
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  const errorString = String(error).toLowerCase();
  
  return (
    errorString.includes('network') ||
    errorString.includes('internet') ||
    errorString.includes('timeout') ||
    errorString.includes('connection') ||
    errorString.includes('unreachable') ||
    errorString.includes('socket') ||
    errorString.includes('dns') ||
    errorString.includes('abort')
  );
}

/**
 * Format an error message for display
 * @param error any error to format
 * @returns a user-friendly error message
 */
export function formatNetworkError(error: any): string {
  if (!error) return '未知网络错误';
  
  const errorString = String(error).toLowerCase();
  
  // 连接和超时错误
  if (errorString.includes('timeout')) {
    return '请求超时，请检查网络连接或API服务器状态';
  }
  
  if (errorString.includes('econnrefused')) {
    return '连接被拒绝，API服务器可能未运行或地址错误';
  }
  
  if (errorString.includes('enotfound')) {
    return '找不到主机，请检查URL是否正确或互联网连接';
  }

  // TLS/SSL错误
  if (errorString.includes('certificate') || errorString.includes('ssl') || errorString.includes('tls')) {
    return 'SSL/TLS证书错误，API可能使用了不受信任的证书';
  }
  
  // CORS错误
  if (errorString.includes('cors') || errorString.includes('origin')) {
    return 'CORS跨域错误：API服务器不允许请求，请参考API_CORS_GUIDE.md';
  }
  
  // HTTP状态码相关错误
  if (errorString.includes('not found') || errorString.includes('404')) {
    return 'API地址未找到，请检查URL路径是否正确';
  }

  if (errorString.includes('unauthorized') || errorString.includes('401')) {
    return '未授权访问，API可能需要密钥或认证信息';
  }
  
  if (errorString.includes('forbidden') || errorString.includes('403')) {
    return '禁止访问此API，可能需要API密钥或更高权限';
  }
  
  if (errorString.includes('rate') || errorString.includes('429') || errorString.includes('limit')) {
    return 'API请求频率限制，请增加请求间隔时间';
  }
  
  if (errorString.includes('500') || errorString.includes('server error')) {
    return 'API服务器内部错误，请稍后再试或联系API提供者';
  }
  
  if (errorString.includes('502') || errorString.includes('bad gateway')) {
    return 'API网关错误，上游服务器可能存在问题';
  }
  
  if (errorString.includes('503') || errorString.includes('service unavailable')) {
    return 'API服务暂时不可用，可能正在维护，请稍后再试';
  }
  
  // 解析错误
  if (errorString.includes('json') && errorString.includes('parse')) {
    return 'JSON解析错误，API返回的数据格式可能不正确';
  }
  
  // 网络类型通用错误
  if (isNetworkError(error)) {
    return '网络连接错误，请检查网络设置和API地址';
  }
  
  // 未知错误
  return `API请求失败: ${error}`;
}
