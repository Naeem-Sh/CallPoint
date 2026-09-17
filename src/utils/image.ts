let globalDefaultAvatar: string | null = null;

export function setDefaultAvatar(url?: string | null): void {
  if (url && typeof url === 'string' && url.trim()) {
    globalDefaultAvatar = url.trim();
    try {
      localStorage.setItem('org_directory_default_avatar', globalDefaultAvatar);
    } catch (_) {}
  } else {
    globalDefaultAvatar = null;
    try {
      localStorage.removeItem('org_directory_default_avatar');
    } catch (_) {}
  }
}

export function getDefaultAvatar(): string | null {
  if (globalDefaultAvatar) return globalDefaultAvatar;
  try {
    return localStorage.getItem('org_directory_default_avatar');
  } catch (_) {
    return null;
  }
}

/**
 * Utility to ensure photos and graphics load in ultra-sharp, high-resolution quality
 * without pixelation or compression artifacts during 2X hover zoom, browser zoom,
 * Retina/4K displays, and high-DPI paper printing.
 */
export function getHighResImageUrl(url?: string | null): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  // Enhance Unsplash URLs: upgrade low-res w=... to high-res w=1200 and q=95
  if (trimmed.includes('images.unsplash.com')) {
    try {
      const u = new URL(trimmed);
      u.searchParams.set('w', '1200');
      u.searchParams.set('q', '95');
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      return u.toString();
    } catch {
      return trimmed
        .replace(/w=\d+/, 'w=1200')
        .replace(/q=\d+/, 'q=95');
    }
  }

  return trimmed;
}
