export const platformLabels = {
  x: 'X',
  youtube: 'YouTube',
  carrd: 'Carrd',
  linktree: 'Linktree',
  bandcamp: 'Bandcamp',
  vegn: 'VEGN',
  weebly: 'Weebly',
  bio: 'Bio',
  github: 'GitHub',
  portfolio: 'Portfolio',
} as const;

export type PlatformKey = keyof typeof platformLabels;

export function normalizePlatformKey(platform?: string): PlatformKey | string {
  if (!platform) {
    return 'portfolio';
  }

  const normalized = platform.trim().toLowerCase();
  return normalized in platformLabels ? (normalized as PlatformKey) : platform;
}

export function getPlatformLabel(platform?: string): string {
  if (!platform) {
    return 'Link';
  }

  const normalized = normalizePlatformKey(platform);

  if (typeof normalized === 'string' && normalized in platformLabels) {
    return platformLabels[normalized as PlatformKey];
  }

  return platform.replace(/[-_]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
