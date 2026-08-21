import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import YAML from 'yaml';
import { normalizePlatformKey, type PlatformKey } from './platforms';

export type PersonLink = {
  platform?: PlatformKey | string;
  url?: string;
  [key: string]: unknown;
};

export type PersonStatus = 'core' | 'contributor' | string;

export type PersonRecord = {
  name: string;
  roles?: string[];
  status?: PersonStatus;
  links?: PersonLink[];
  slug: string;
  [key: string]: unknown;
};

const projectRoot = resolve(process.cwd(), '..', '..');
const peopleDir = join(projectRoot, 'packages', 'content', 'people');

const slugify = (value: string) => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized;
};

export function extractPeopleFromDirectory(directoryPath = peopleDir): PersonRecord[] {
  if (!directoryPath) {
    return [];
  }

  try {
    const files = readdirSync(directoryPath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && /\.(ya?ml)$/i.test(entry.name))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    return files
      .map((fileName) => {
        const filePath = join(directoryPath, fileName);
        const raw = readFileSync(filePath, 'utf8');
        const parsed = YAML.parse(raw) as Record<string, unknown> | null;

        if (!parsed || typeof parsed !== 'object' || !('name' in parsed) || typeof parsed.name !== 'string') {
          return null;
        }

        const rawRoles = Array.isArray(parsed.roles)
          ? parsed.roles
          : Array.isArray(parsed.role)
            ? parsed.role
            : typeof parsed.role === 'string'
              ? [parsed.role]
              : [];

        const normalizedLinks = Array.isArray(parsed.links)
          ? parsed.links.map((link) => {
              if (!link || typeof link !== 'object') {
                return link;
              }

              const nextLink = { ...link } as PersonLink;
              if (typeof nextLink.platform === 'string') {
                nextLink.platform = normalizePlatformKey(nextLink.platform);
              }
              return nextLink;
            })
          : [];

        const roles = rawRoles
          .filter((role): role is string => typeof role === 'string' && role.trim().length > 0)
          .map((role) => role.trim());

        const fileStem = fileName.replace(/\.[^.]+$/, '');
        const resolvedSlug =
          typeof parsed.slug === 'string' && parsed.slug.trim().length > 0
            ? slugify(parsed.slug)
            : slugify(parsed.name) || slugify(fileStem) || 'person';

        return {
          ...parsed,
          roles,
          links: normalizedLinks,
          slug: resolvedSlug,
        } as PersonRecord;
      })
      .filter((person): person is PersonRecord => person !== null);
  } catch (error) {
    console.warn('Unable to read people content directory:', directoryPath, error);
    return [];
  }
}

export const people = extractPeopleFromDirectory();
