export function normalizeUrl(input) {
  try {
    const u = new URL(input);
    u.hash = '';
    return u;
  } catch {
    return null;
  }
}

export function detectPlatform(hostname) {
  const h = hostname.toLowerCase();

  if (h === 'youtu.be' || h.endsWith('.youtu.be')) return 'youtube';
  if (h.endsWith('youtube.com')) return 'youtube';
  if (h.endsWith('instagram.com')) return 'instagram';
  if (h.endsWith('tiktok.com')) return 'tiktok';
  if (h.endsWith('facebook.com')) return 'facebook';

  return null;
}

export function validateSocialUrl(url) {
  const u = normalizeUrl(url);
  if (!u) return { valid: false, platform: null, normalizedUrl: null };

  const platform = detectPlatform(u.hostname);
  return {
    valid: !!platform,
    platform: platform ?? null,
    normalizedUrl: u.toString(),
  };
}