// components/AuthButton.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { generateCodeChallenge, generateCodeVerifier, generateRandomString } from '@/utils/pkce-helpers'; 
import { createSupabaseBrowserClient } from '@/utils/supabase/client'; // 确保路径正确

// 移除 'publicData'，保留有效的 ESI Scopes
const EVE_SCOPES = 'esi-skills.read_skills.v1 esi-wallet.read_character_wallet.v1 esi-assets.read_assets.v1 esi-location.read_location.v1 esi-location.read_ship_type.v1';

export default function AuthButton() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();

    const handleEveLogin = async () => {
        setIsLoading(true);
        try {
            console.log("--- Starting EVE SSO Flow ---");
            
            const clientId = process.env.NEXT_PUBLIC_EVE_CLIENT_ID; 
            if (!clientId) {
                alert("配置错误：缺少 NEXT_PUBLIC_EVE_CLIENT_ID");
                return;
            }

            // 1. 生成 PKCE 参数
            const codeVerifier = generateCodeVerifier();
            const codeChallenge = await generateCodeChallenge(codeVerifier);
            const state = generateRandomString(16);

            // 2. 存入 Cookie (SameSite=Lax 以允许从 EVE 跳转回来读取)
            // 注意：生产环境建议加上 Secure
            document.cookie = `pkce_code_verifier=${codeVerifier}; Max-Age=600; path=/; sameSite=Lax`;
            document.cookie = `pkce_state=${state}; Max-Age=600; path=/; sameSite=Lax`;

            // 3. 动态构建回调 URL (自动适应 localhost 或 生产域名)
            const callbackUrl = `${window.location.origin}/api/auth/callback`;

            // 4. 构建 EVE 授权 URL
            const authUrl = 'https://login.eveonline.com/v2/oauth/authorize';
            const params = new URLSearchParams({
                response_type: 'code',
                redirect_uri: callbackUrl,
                client_id: clientId,
                scope: EVE_SCOPES,
                state: state,
                code_challenge: codeChallenge,
                code_challenge_method: 'S256',
            });

            // 5. 跳转
            window.location.href = `${authUrl}?${params.toString()}`;
            
        } catch (error) {
            console.error("Login failed:", error);
            alert("登录初始化失败，请查看控制台");
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleEveLogin}
            disabled={isLoading}
            className={`py-2 px-6 rounded-md font-semibold text-white transition duration-150 ${
                isLoading 
                ? 'bg-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/50'
            }`}
        >
            {isLoading ? '跳转中...' : '使用 EVE Online 登录'}
        </button>
    );
};