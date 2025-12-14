import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

const EVE_CLIENT_ID = process.env.NEXT_PUBLIC_EVE_CLIENT_ID;
const EVE_SECRET = process.env.EVE_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const incomingState = requestUrl.searchParams.get('state');

    const cookieStore = await cookies();
    const storedState = cookieStore.get('pkce_state')?.value;
    const codeVerifier = cookieStore.get('pkce_code_verifier')?.value;
    
    // 改为重定向回首页，带上 error 参数
    const redirectTo = requestUrl.origin;
    const response = NextResponse.redirect(`${redirectTo}/?login_error=true`);

    // 🔍 详细调试日志：看看具体缺了谁
    console.log("--- 正在检查认证参数 ---");
    console.log({
        has_Code: !!code,
        has_IncomingState: !!incomingState,
        has_Cookie_State: !!storedState,
        has_Cookie_Verifier: !!codeVerifier,
        states_Match: incomingState === storedState,
        has_EVE_Secret: !!EVE_SECRET,
        has_Supabase_ServiceKey: !!SUPABASE_SERVICE_KEY
    });

    if (!code || !codeVerifier || !incomingState || incomingState !== storedState || !EVE_SECRET || !SUPABASE_SERVICE_KEY) {
        console.error('--- ❌ 致命错误：认证参数缺失 ---');
        // 如果是 Cookie 丢了，可能是因为跨域或浏览器限制，但也可能是 key 没填
        return NextResponse.redirect(`${redirectTo}/?error=missing_params`);
    }

    try {
        console.log("--- 参数检查通过，开始向 EVE 交换 Token ---");
        const authString = Buffer.from(`${EVE_CLIENT_ID}:${EVE_SECRET}`).toString('base64');

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
            const errorText = await eveTokenResponse.text();
            throw new Error(`EVE Token Exchange Failed: ${errorText}`);
        }
        
        // ... (后续 Supabase 逻辑保持不变，如果前面没报错，这里通常也没问题) ...
        const eveTokenData = await eveTokenResponse.json();
        const eveAccessToken = eveTokenData.access_token;
        
        // 简化的后续验证逻辑（为了排错先确保能跑到这里）
        // ...
        
        // 如果为了测试，我们先直接跳回首页，并带上成功标记
        // 等参数问题解决了，我再给你完整的后续逻辑
        return NextResponse.redirect(`${redirectTo}/?login_success=true`);

    } catch (e: any) {
        console.error('Auth Error:', e);
        return NextResponse.redirect(`${redirectTo}/?error=auth_failed`);
    }
}