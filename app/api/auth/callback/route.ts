// app/api/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const EVE_CLIENT_ID = process.env.NEXT_PUBLIC_EVE_CLIENT_ID;
const EVE_SECRET = process.env.EVE_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const origin = requestUrl.origin; 
    const callbackUrl = `${origin}/api/auth/callback`; // 必须与 AuthButton 中的完全一致

    const cookieStore = await cookies();
    const codeVerifier = cookieStore.get('pkce_code_verifier')?.value;

    console.log(`🔍 收到回调 Code, 准备交换 Token...`);

    if (!code || !codeVerifier) {
        return NextResponse.redirect(`${origin}/?error=missing_code_or_verifier`);
    }

    try {
        // ============================================
        // 1. EVE Token 交换 (回归 Header 认证 + 完整参数)
        // ============================================
        
        // 1.1 构造 Basic Auth Header
        const authString = Buffer.from(`${EVE_CLIENT_ID}:${EVE_SECRET}`).toString('base64');

        // 1.2 构造 Body 参数 (包含 redirect_uri 和 code_verifier)
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', callbackUrl); // 🚨 之前缺失的关键参数
        params.append('code_verifier', codeVerifier); // PKCE 关键参数

        const tokenRes = await fetch('https://login.eveonline.com/v2/oauth/token', {
            method: 'POST',
            headers: { 
                'Authorization': `Basic ${authString}`, // ✅ 使用 Header 认证
                'Content-Type': 'application/x-www-form-urlencoded',
                'Host': 'login.eveonline.com'
            },
            body: params,
        });

        // 1.3 错误检查
        if (!tokenRes.ok) {
            const errorText = await tokenRes.text();
            console.error(`❌ EVE Token 失败 (Status ${tokenRes.status}):`);
            // 尝试解析错误原因
            try {
                const jsonErr = JSON.parse(errorText);
                console.error("错误详情:", jsonErr);
            } catch {
                console.error("原始响应:", errorText.substring(0, 200));
            }
            throw new Error(`EVE Token Failed: ${tokenRes.status}`);
        }

        const tokenData = await tokenRes.json();
        console.log("✅ EVE Token 获取成功");

        // ============================================
        // 2. 身份验证
        // ============================================
        const verifyRes = await fetch('https://login.eveonline.com/oauth/verify', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });
        if (!verifyRes.ok) throw new Error("EVE Verify Failed");
        const charData = await verifyRes.json();
        
        console.log(`✅ 角色确认: ${charData.CharacterName}`);

        // ============================================
        // 3. Supabase 用户处理 (使用 v4_ 前缀，确保纯净)
        // ============================================
        const email = `v4_${charData.CharacterID}@eve-online.com`;
        const tempPassword = `Eve-${charData.CharacterID}-${Date.now()}!Secure`;

        const supabaseAdmin = createSupabaseAdmin(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } });

        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = users.find(u => u.email === email);
        
        const metadata = { 
            character_id: charData.CharacterID, 
            character_name: charData.CharacterName,
            eve_refresh_token: tokenData.refresh_token
        };

        if (!existingUser) {
            console.log("👤 创建新用户...");
            const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
                email, password: tempPassword, email_confirm: true, user_metadata: metadata
            });
            if (createErr) throw createErr;
        } else {
            console.log("👤 更新旧用户...");
            const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
                password: tempPassword, user_metadata: metadata, email_confirm: true
            });
            if (updateErr) throw updateErr;
        }

        // ============================================
        // 4. 登录并设置 Cookie
        // ============================================
        const response = NextResponse.redirect(`${origin}/dashboard`);
        
        const supabaseSsr = createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => {
                        response.cookies.set(name, value, {
                            path: '/', 
                            httpOnly: true, 
                            sameSite: 'lax', 
                            secure: false, // Localhost 环境
                            maxAge: 60 * 60 * 24 * 7
                        });
                    });
                },
            },
        });

        const { error: signInError } = await supabaseSsr.auth.signInWithPassword({
            email, password: tempPassword
        });

        if (signInError) throw signInError;

        console.log("🎉 登录成功，正在跳转 Dashboard...");
        return response;

    } catch (e: any) {
        console.error("🔥 流程中断:", e.message);
        return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(e.message)}`);
    }
}