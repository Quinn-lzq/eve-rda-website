// utils/eve-api.ts

const CLIENT_ID = process.env.NEXT_PUBLIC_EVE_CLIENT_ID!;
const SECRET_KEY = process.env.EVE_SECRET_KEY!;

/**
 * 1. 刷新 Access Token (通用)
 */
export async function refreshAccessToken(refreshToken: string) {
  const authString = Buffer.from(`${CLIENT_ID}:${SECRET_KEY}`).toString('base64');

  const response = await fetch('https://login.eveonline.com/v2/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Host': 'login.eveonline.com'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

/**
 * 2. 获取角色钱包余额 (Wallet API)
 */
export async function getCharacterWallet(characterId: number, accessToken: string) {
  const response = await fetch(
    `https://esi.evetech.net/latest/characters/${characterId}/wallet/?datasource=tranquility`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      next: { revalidate: 60 }
    }
  );

  if (!response.ok) {
    console.error(`ESI Wallet Error: ${response.status}`);
    return 0;
  }
  return await response.json();
}

/**
 * 3. 获取角色技能信息 (Skills API)
 * 返回 total_sp (总技能点)
 */
export async function getCharacterSkills(characterId: number, accessToken: string) {
  const response = await fetch(
    `https://esi.evetech.net/latest/characters/${characterId}/skills/?datasource=tranquility`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      next: { revalidate: 300 } // 技能点变化慢，缓存 5 分钟
    }
  );

  if (!response.ok) {
    console.error(`ESI Skills Error: ${response.status}`);
    return null; // 如果没权限或报错，返回 null
  }

  const data = await response.json();
  // ESI 返回结构: { skills: [], total_sp: 123456, unallocated_sp: 0 }
  return data.total_sp;
}

/**
 * 辅助：格式化金额 (带2位小数) -> 100,000.00
 */
export function formatISK(amount: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * 辅助：格式化整数 (无小数) -> 26,000,000
 */
export function formatNumber(amount: number) {
  return new Intl.NumberFormat('en-US').format(amount);
}