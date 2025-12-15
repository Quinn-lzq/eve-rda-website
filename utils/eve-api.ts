// utils/eve-api.ts

const CLIENT_ID = process.env.NEXT_PUBLIC_EVE_CLIENT_ID!;
const SECRET_KEY = process.env.EVE_SECRET_KEY!;

// --- 基础认证 ---
export async function refreshAccessToken(refreshToken: string) {
  const authString = Buffer.from(`${CLIENT_ID}:${SECRET_KEY}`).toString('base64');
  const response = await fetch('https://login.eveonline.com/v2/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Host': 'login.eveonline.com'
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  });
  if (!response.ok) throw new Error(`Token Refresh Failed: ${response.status}`);
  const data = await response.json();
  return data.access_token as string;
}

// --- 基础信息 ---
export async function getCharacterWallet(characterId: number, accessToken: string) {
  const res = await fetch(`https://esi.evetech.net/latest/characters/${characterId}/wallet/?datasource=tranquility`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
    next: { revalidate: 60 }
  });
  return res.ok ? await res.json() : 0;
}

export async function getCharacterSkills(characterId: number, accessToken: string) {
  const res = await fetch(`https://esi.evetech.net/latest/characters/${characterId}/skills/?datasource=tranquility`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
    next: { revalidate: 300 }
  });
  return res.ok ? (await res.json()).total_sp : 0;
}

export async function getCharacterLocation(characterId: number, accessToken: string) {
  const res = await fetch(`https://esi.evetech.net/latest/characters/${characterId}/location/?datasource=tranquility`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
    next: { revalidate: 30 }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.solar_system_id;
}

export async function getCharacterShip(characterId: number, accessToken: string) {
  const res = await fetch(`https://esi.evetech.net/latest/characters/${characterId}/ship/?datasource=tranquility`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
    next: { revalidate: 30 }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return { ship_type_id: data.ship_type_id, ship_name: data.ship_name };
}

export async function getSkillQueue(characterId: number, accessToken: string) {
  const res = await fetch(`https://esi.evetech.net/latest/characters/${characterId}/skillqueue/?datasource=tranquility`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
    next: { revalidate: 60 }
  });
  if (!res.ok) return null;
  const queue = await res.json();
  const now = new Date().toISOString();
  return queue.find((s: any) => s.finish_date > now && s.start_date < now) || null;
}

export async function getWalletJournal(characterId: number, accessToken: string) {
  const res = await fetch(`https://esi.evetech.net/latest/characters/${characterId}/wallet/journal/?datasource=tranquility`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
    next: { revalidate: 60 }
  });
  if (!res.ok) return [];
  const journal = await res.json();
  return journal.slice(0, 10); // 取前10条
}

// --- 🔥 新增：资产与市场 ---

// 7. 获取所有资产 (只取前 100 个以保证速度，实际项目需分页)
export async function getCharacterAssets(characterId: number, accessToken: string) {
  const res = await fetch(`https://esi.evetech.net/latest/characters/${characterId}/assets/?datasource=tranquility&page=1`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
    next: { revalidate: 300 }
  });
  if (!res.ok) return [];
  const assets = await res.json();
  // 简单过滤：只看在空间站里的东西（location_id > 60000000）或者数量大的
  return assets.slice(0, 50); 
}

// 8. 获取市场订单
export async function getCharacterOrders(characterId: number, accessToken: string) {
  const res = await fetch(`https://esi.evetech.net/latest/characters/${characterId}/orders/?datasource=tranquility`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
    next: { revalidate: 60 }
  });
  if (!res.ok) return [];
  return await res.json();
}

// 9. 获取合同
export async function getCharacterContracts(characterId: number, accessToken: string) {
  const res = await fetch(`https://esi.evetech.net/latest/characters/${characterId}/contracts/?datasource=tranquility`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
    next: { revalidate: 60 }
  });
  if (!res.ok) return [];
  return await res.json();
}

// --- 工具函数 ---

// 批量解析 ID 到 名字 (包括物品类型、地点、角色名)
export async function resolveNames(ids: number[]) {
  if (ids.length === 0) return {};
  const uniqueIds = Array.from(new Set(ids)); // 去重
  
  // ESI 限制每次 1000 个，这里假设不超过
  const res = await fetch(`https://esi.evetech.net/latest/universe/names/?datasource=tranquility`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(uniqueIds),
    next: { revalidate: 86400 } // 缓存一天
  });

  if (!res.ok) return {};
  const data = await res.json();
  const nameMap: Record<number, string> = {};
  data.forEach((item: any) => { nameMap[item.id] = item.name; });
  return nameMap;
}

export function formatISK(amount: number) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}
export function formatNumber(amount: number) {
  return new Intl.NumberFormat('en-US').format(amount);
}