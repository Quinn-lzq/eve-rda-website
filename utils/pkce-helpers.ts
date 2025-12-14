// utils/pkce-helpers.ts

// 生成随机字符串 (用于 state 和 code_verifier)
export function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// 生成 Code Verifier (PKCE 第一步)
export function generateCodeVerifier(): string {
  return generateRandomString(128);
}

// 生成 Code Challenge (PKCE 第二步：SHA-256 + Base64Url 编码)
export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  
  // 使用浏览器原生的 Web Crypto API 进行 SHA-256 哈希
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  
  // 转换为 Base64Url 格式 (EVE SSO 要求)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}