// utils/pkce-helpers.ts

// 生成随机字符串（用于 code_verifier 和 state）
export const generateRandomString = (length: number) => {
    const array = new Uint8Array(length);
    if (typeof window !== 'undefined' && window.crypto) {
        window.crypto.getRandomValues(array);
    } else {
        for (let i = 0; i < length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Base64Url 编码器
function base64UrlEncode(bytes: ArrayBuffer) {
    let binary = '';
    const bytesArray = new Uint8Array(bytes);
    const len = bytesArray.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytesArray[i]);
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

// 1. 生成 code_verifier (Code Verifier)
export const generateCodeVerifier = () => {
    return generateRandomString(32); 
};

// 2. 生成 code_challenge (Code Challenge)
// 修正后的正确 async function 语法
export const generateCodeChallenge = async (verifier: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    // 使用 S256 (SHA-256) 算法
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return base64UrlEncode(digest);
}