// components/AuthButton.tsx
'use client';

import { createSupabaseBrowserClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

// 定义 EVE_SCOPES 变量
const EVE_SCOPES = 'publicData esi-characters.read_corporation_history.v1'; // 确保 scopes 完整

// 我们将回调 URL 修正为指向本地应用的 API 路由
// 注意：域名和端口号必须与你运行的项目匹配 (http://localhost:3000)
const LOCAL_API_CALLBACK_URL = 'http://localhost:3000/api/auth/callback'; 

const AuthButton = () => {
    const [user, setUser] = useState<any>(null);
    const supabase = createSupabaseBrowserClient(); 
    const router = useRouter();

    // 🔴 关键修复：改用 Supabase SDK 启动 OAuth 流程
    const handleEveLogin = async () => {
        // 1. 使用 signInWithOAuth 启动 EVE SSO
        const { error } = await supabase.auth.signInWithOAuth({
            // 2. 提供者名称必须与 EVE SSO 兼容
            //    尽管 Supabase 内部配置缺失，但前端 SDK 仍然需要它来生成 Auth 流程所需的 State/Verifier
            provider: 'eve-online', 
            options: {
                scopes: EVE_SCOPES,
                // 3. 核心修复：将回调 URL 指向我们创建的 Next.js API 路由
                redirectTo: LOCAL_API_CALLBACK_URL, 
            }
        });

        if (error) {
            console.error('EVE SSO 登录启动失败:', error);
            alert(`登录启动失败: ${error.message}`);
        }
    };

    // --- (省略 useEffect 和 handleSignOut，与你原有的逻辑相同) ---

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } = { user: null } } = await supabase.auth.getUser();
            setUser(user);
        };
        fetchUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
            if (event === 'SIGNED_OUT') {
                router.refresh();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase, router]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh(); // 刷新页面以更新 UI
    };

    return user ? (
        <div className="flex items-center gap-4 text-white">
            <span className="text-sm">欢迎, {user.email || 'Capsuleer'}</span>
            <button
                onClick={handleSignOut}
                className="py-2 px-4 rounded-md no-underline bg-red-600 hover:bg-red-700 transition duration-150"
            >
                退出登录
            </button>
        </div>
    ) : (
        <button
            onClick={handleEveLogin}
            className="py-2 px-4 rounded-md no-underline bg-blue-600 hover:bg-blue-700 transition duration-150 text-white font-semibold whitespace-nowrap"
        >
            通过 EVE SSO 登录
        </button>
    );
};

export { AuthButton };