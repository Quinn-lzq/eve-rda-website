'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { generateCodeChallenge, generateCodeVerifier, generateRandomString } from '@/utils/pkce-helpers'; 
import { createClient } from '@/utils/supabase/client';

// components/AuthButton.tsx

// 替换原来的 EVE_SCOPES，加入更多有用的权限
const EVE_SCOPES =
 [
    'publicData',
    'esi-skills.read_skills.v1',
    'esi-skills.read_skillqueue.v1',
    'esi-wallet.read_character_wallet.v1',
    'esi-assets.read_assets.v1',
    'esi-location.read_location.v1',
    'esi-location.read_ship_type.v1',
    'esi-location.read_online.v1',
    'esi-characters.read_corporation_roles.v1',
    // 如果你是要做军团审计，建议加上 contracts 和 market
    'esi-markets.read_character_orders.v1',
    'esi-contracts.read_character_contracts.v1'
].join(' '); // 自动用空格连接

// 接收一个 size 属性，决定按钮大小
export default function AuthButton({ size = 'normal', isLogged = false }: { size?: 'normal' | 'large', isLogged?: boolean }) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleEveLogin = async () => {
        setIsLoading(true);
        try {
            const clientId = process.env.NEXT_PUBLIC_EVE_CLIENT_ID; 
            if (!clientId) return alert("Missing Client ID");

            const codeVerifier = generateCodeVerifier();
            const codeChallenge = await generateCodeChallenge(codeVerifier);
            const state = generateRandomString(16);

            document.cookie = `pkce_code_verifier=${codeVerifier}; Max-Age=600; path=/; sameSite=Lax`;
            document.cookie = `pkce_state=${state}; Max-Age=600; path=/; sameSite=Lax`;

            const callbackUrl = `${window.location.origin}/api/auth/callback`;
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

            window.location.href = `${authUrl}?${params.toString()}`;
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    const handleSignOut = async () => {
        setIsLoading(true);
        // 不再使用 supabase.auth.signOut() 和 router.refresh()
        // 而是直接跳转到我们刚写的服务端登出路由
        // 这能保证 100% 清除 Cookie 并刷新页面
        window.location.href = '/api/auth/signout';
    };

    // 如果已登录，显示注销按钮
    if (isLogged) {
        return (
            <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="px-6 py-2 border border-red-500/50 text-red-400 hover:bg-red-500/10 rounded transition uppercase tracking-widest text-sm font-bold"
            >
                {isLoading ? '注销中...' : '安全登出 / LOGOUT'}
            </button>
        );
    }

    // 未登录，显示登录按钮
    const sizeClasses = size === 'large' 
        ? 'py-4 px-10 text-lg shadow-blue-500/20 shadow-2xl scale-110' 
        : 'py-2 px-6 text-sm';

    return (
        <button
            onClick={handleEveLogin}
            disabled={isLoading}
            className={`${sizeClasses} rounded bg-blue-600 hover:bg-blue-500 text-white font-bold transition transform hover:scale-105 active:scale-95 duration-200`}
        >
            {isLoading ? '正在跳转 EVE SSO...' : 'EVE ONLINE 登录'}
        </button>
    );
};