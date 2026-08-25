export const platformLabels = {
  x: 'X',
  youtube: 'YouTube',
  carrd: 'Carrd',
  linktree: 'Linktree',
  bandcamp: 'Bandcamp',
  vgen: 'VGen',
  weebly: 'Weebly',
  bio: 'Bio',
  github: 'GitHub',
  portfolio: 'Portfolio',
} as const;

export type PlatformKey = keyof typeof platformLabels;

const platformAliases: Record<string, PlatformKey> = {
  vegn: 'vgen',
};

export function normalizePlatformKey(platform?: string): PlatformKey | string {
  if (!platform) {
    return 'portfolio';
  }

  const normalizedRaw = platform.trim().toLowerCase();
  const normalized = platformAliases[normalizedRaw] ?? normalizedRaw;
  return normalized in platformLabels ? (normalized as PlatformKey) : platform;
}
