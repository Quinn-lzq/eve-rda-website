// app/api/auth/callback/route.ts

import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies, ReadonlyRequestCookies } from 'next/headers'; 
import { NextRequest, NextResponse } from 'next/server';

// ----------------------------------------------------
// ⚠️ 关键配置：将所有密钥定义为局部常量
// ----------------------------------------------------
const EVE_CLIENT_ID = process.env.NEXT_PUBLIC_EVE_CLIENT_ID;
const EVE_SECRET = process.env.EVE_SECRET_KEY; // 确保是私钥
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// 🔴 关键：使用私有 Service Key 进行服务器间通信
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    const cookieStore = cookies() as ReadonlyRequestCookies; 
    const storedState = cookieStore.get('pkce_state')?.value;
    const codeVerifier = cookieStore.get('pkce_code_verifier')?.value;
    const incomingState = requestUrl.searchParams.get('state');

    // 1. 验证所有必需的密钥和参数
    if (!code || !codeVerifier || !incomingState || incomingState !== storedState || !EVE_SECRET || !SUPABASE_SERVICE_KEY) {
        console.error('State/Verifier/Code/Secret Key 缺失或验证失败。');
        // 添加详细的错误信息到控制台，以便调试
        console.error({ code: !!code, verifier: !!codeVerifier, stateMatch: incomingState === storedState, eveSecret: !!EVE_SECRET, supabaseServiceKey: !!SUPABASE_SERVICE_KEY });
        return NextResponse.redirect(requestUrl.origin + '/login?error=auth_failed_verification');
    }
    
    // 2. 构造重定向响应
    const redirectTo = requestUrl.origin;
    const response = NextResponse.redirect(redirectTo);

    try {
        // 3. 🔴 核心步骤 A: 执行 EVE SSO Token Exchange
        const authString = btoa(`${EVE_CLIENT_ID}:${EVE_SECRET}`);
        
        const eveTokenResponse = await fetch('https://login.eveonline.com/v2/oauth/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authString}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                'grant_type': 'authorization_code',
                'code': code,
                'code_verifier': codeVerifier,
            }),
        });

        if (!eveTokenResponse.ok) {
            console.error('EVE Token Exchange Failed:', await eveTokenResponse.text());
            throw new Error('EVE Token Exchange Failed');
        }

        const eveTokenData = await eveTokenResponse.json();
        const eveAccessToken = eveTokenData.access_token;
        
        // 4. 🔴 核心步骤 B: 手动调用 Supabase Token Exchange API
        const supabaseApiUrl = `${SUPABASE_URL}/auth/v1/token?grant_type=external_provider`;
        
        const supabaseTokenResponse = await fetch(supabaseApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 🔴 关键：使用 Service Key 授权
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 
            },
            body: JSON.stringify({
                // 使用通用提供者名称
                provider: 'generic', 
                access_token: eveAccessToken,
            }),
        });
        
        if (!supabaseTokenResponse.ok) {
             console.error('Supabase Token Exchange Failed:', await supabaseTokenResponse.text());
             throw new Error('Supabase Token Exchange Failed');
        }

        // 5. 将 Supabase 返回的 Session 写入 Cookie
        const supabaseSessionData = await supabaseTokenResponse.json();
        const supabaseAccessToken = supabaseSessionData.access_token;
        const supabaseRefreshToken = supabaseSessionData.refresh_token;

        const supabase = createServerClient(
            SUPABASE_URL!,
            SUPABASE_ANON_KEY!, 
            { cookies: () => cookieStore }
        );
        
        const { error: sessionError } = await supabase.auth.setSession({
            access_token: supabaseAccessToken,
            refresh_token: supabaseRefreshToken,
        });

        if (sessionError) {
            console.error('Supabase Set Session Failed:', sessionError);
            throw new Error('Supabase Set Session Failed');
        }

    } catch (e) {
        console.error('Authentication Flow Failed:', e);
        response.headers.set('Location', `${requestUrl.origin}/login?error=flow_error`);
        // 清除 Cookie 并返回错误
        response.cookies.set('pkce_state', '', { maxAge: 0, path: '/' });
        response.cookies.set('pkce_code_verifier', '', { maxAge: 0, path: '/' });
        return response;
    }

    // 6. 清除 Cookie 并返回成功重定向
    response.cookies.set('pkce_state', '', { maxAge: 0, path: '/' });
    response.cookies.set('pkce_code_verifier', '', { maxAge: 0, path: '/' });
    return response;
}