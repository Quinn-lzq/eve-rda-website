// components/AuthButton.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { generateCodeChallenge, generateCodeVerifier, generateRandomString } from '@/utils/pkce-helpers'; 
// 👇 修改这里：导入 createClient
import { createClient } from '@/utils/supabase/client';

// 你的 EVE Scope 列表 (保持你之前改好的)
const EVE_SCOPES = 'esi-skills.read_skills.v1 esi-wallet.read_character_wallet.v1 esi-assets.read_assets.v1 esi-location.read_location.v1 esi-location.read_ship_type.v1';

export default function AuthButton() {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    // 👇 修改这里：使用 createClient()
    const supabase = createClient();

    // 检查登录状态
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, [supabase]);

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
        await supabase.auth.signOut();
        setUser(null);
        router.refresh();
    };

    if (user) {
        // 防止 user_metadata 为空导致的崩溃
        const charName = user.user_metadata?.character_name || 'Unknown Pilot';
        const charId = user.user_metadata?.character_id;

        return (
            <div className="flex items-center gap-4 bg-gray-800 p-2 rounded-lg border border-gray-700 shadow-lg">
                {charId && (
                    <img 
                        src={`https://images.evetech.net/characters/${charId}/portrait?size=64`} 
                        alt={charName}
                        className="w-10 h-10 rounded-full border border-gray-500"
                    />
                )}
                <div className="text-sm">
                    <p className="font-bold text-blue-300">{charName}</p>
                    <button 
                        onClick={handleSignOut} 
                        className="text-xs text-red-400 hover:text-red-200 transition"
                    >
                        注销
                    </button>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={handleEveLogin}
            disabled={isLoading}
            className={`py-2 px-6 rounded-md font-semibold text-white transition duration-150 ${
                isLoading 
                ? 'bg-gray-600 cursor-wait' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/50'
            }`}
        >
            {isLoading ? '跳转中...' : 'EVE SSO 登录'}
        </button>
    );
};