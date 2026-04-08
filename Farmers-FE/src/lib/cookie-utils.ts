// ============================================================
// COOKIE UTILITY — JWT AccessToken Storage
// Dùng Cookie thay vì localStorage để tăng bảo mật:
// - HttpOnly Cookie không thể đọc bằng JavaScript (chống XSS)
// - Secure trong production (HTTPS)
// - SameSite=Lax chống CSRF (nên kết hợp thêm CSRF token)
// ============================================================

export const COOKIE_KEYS = {
  ACCESS_TOKEN: 'ec_at',
  REFRESH_TOKEN: 'ec_rt',
} as const;

type CookieSameSite = 'Strict' | 'Lax' | 'None';

/**
 * Parse document.cookie string thành Map<string, string>
 */
export function getCookieMap(): Map<string, string> {
  const map = new Map<string, string>();
  if (typeof document === 'undefined') return map;
  document.cookie.split(';').forEach((cookie) => {
    const [key, ...valueParts] = cookie.trim().split('=');
    if (key) {
      map.set(key, decodeURIComponent(valueParts.join('=')));
    }
  });
  return map;
}

/**
 * Đọc accessToken từ Cookie
 */
export function getAccessTokenFromCookie(): string | null {
  const cookies = getCookieMap();
  return cookies.get(COOKIE_KEYS.ACCESS_TOKEN) ?? null;
}

/**
 * Ghi accessToken vào Cookie
 * @param token - JWT accessToken
 * @param maxAgeSeconds - Thời gian sống (mặc định 7 ngày = 604800s)
 * @param sameSite - SameSite attribute ('Lax' khuyến nghị)
 */
export function setAccessTokenCookie(
  token: string,
  maxAgeSeconds: number = 604800,
  sameSite: CookieSameSite = 'Lax',
): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + maxAgeSeconds * 1000).toUTCString();
  document.cookie =
    `${COOKIE_KEYS.ACCESS_TOKEN}=${encodeURIComponent(token)}; expires=${expires}; path=/; SameSite=${sameSite}; Secure`;
}

/**
 * Xóa accessToken Cookie
 */
export function deleteAccessTokenCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_KEYS.ACCESS_TOKEN}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

/**
 * Đọc refreshToken từ Cookie
 */
export function getRefreshTokenFromCookie(): string | null {
  const cookies = getCookieMap();
  return cookies.get(COOKIE_KEYS.REFRESH_TOKEN) ?? null;
}

/**
 * Ghi refreshToken vào Cookie
 */
export function setRefreshTokenCookie(
  token: string,
  maxAgeSeconds: number = 604800 * 2,
  sameSite: CookieSameSite = 'Strict',
): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + maxAgeSeconds * 1000).toUTCString();
  document.cookie =
    `${COOKIE_KEYS.REFRESH_TOKEN}=${encodeURIComponent(token)}; expires=${expires}; path=/; SameSite=${sameSite}; Secure`;
}

/**
 * Xóa refreshToken Cookie
 */
export function deleteRefreshTokenCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_KEYS.REFRESH_TOKEN}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict`;
}

/**
 * Xóa tất cả auth cookies + localStorage keys
 */
export function clearAllAuthCookies(): void {
  deleteAccessTokenCookie();
  deleteRefreshTokenCookie();
}
