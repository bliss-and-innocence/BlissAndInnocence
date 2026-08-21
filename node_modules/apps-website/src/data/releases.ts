import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import YAML from 'yaml';
import { normalizePlatformKey } from './platforms';

export type ReleaseLink = {
  platform?: string;
  url?: string;
  [key: string]: unknown;
};

export type ReleaseTrack = {
  title: string;
  duration?: string;
  artists?: string[];
  links?: ReleaseLink[];
  [key: string]: unknown;
};

export type ReleaseCredit = {
  role?: string;
  name?: string;
  links?: ReleaseLink[];
  [key: string]: unknown;
};

export type ReleaseRecord = {
  title: string;
  slug?: string;
  releaseDate?: string;
  catalogNumber?: string;
  description?: string;
  links?: ReleaseLink[];
  credits?: ReleaseCredit[];
  tracks?: ReleaseTrack[];
  [key: string]: unknown;
};

const projectRoot = resolve(process.cwd(), '..', '..');
const releasesDir = join(projectRoot, 'packages', 'content', 'releases');

const slugify = (value: string) => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'release';
};

const normalizeLinks = (links: unknown): ReleaseLink[] => {
  if (!Array.isArray(links)) {
    return [];
  }

  return links
    .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object')
    .map((entry) => {
      const nextLink = { ...entry } as ReleaseLink;
      if (typeof nextLink.platform === 'string') {
        nextLink.platform = normalizePlatformKey(nextLink.platform);
      }
      return nextLink;
    });
};

export function extractReleasesFromDirectory(directoryPath = releasesDir): ReleaseRecord[] {
  try {
    const releaseDirs = readdirSync(directoryPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    return releaseDirs
      .map((releaseFolder) => {
        const releaseFile = join(directoryPath, releaseFolder, 'release.yaml');
        const raw = readFileSync(releaseFile, 'utf8');
        const parsed = YAML.parse(raw) as Record<string, unknown> | null;

        if (!parsed || typeof parsed !== 'object' || !('title' in parsed) || typeof parsed.title !== 'string') {
          return null;
        }

        const normalizedTracks = Array.isArray(parsed.tracks)
          ? parsed.tracks.map((track) => {
              if (!track || typeof track !== 'object') {
                return track;
              }

              const normalizedTrack = { ...(track as Record<string, unknown>) } as ReleaseTrack;
              normalizedTrack.links = normalizeLinks(normalizedTrack.links);

              if (Array.isArray(normalizedTrack.artists)) {
                normalizedTrack.artists = normalizedTrack.artists
                  .filter((artist): artist is string => typeof artist === 'string')
                  .map((artist) => artist.trim());
              }

              return normalizedTrack;
            })
          : [];

        const normalizedCredits = Array.isArray(parsed.credits)
          ? parsed.credits.map((credit) => {
              if (!credit || typeof credit !== 'object') {
                return credit;
              }

              const normalizedCredit = { ...(credit as Record<string, unknown>) } as ReleaseCredit;
              normalizedCredit.links = normalizeLinks(normalizedCredit.links);
              return normalizedCredit;
            })
          : [];

        return {
          ...parsed,
          slug: typeof parsed.slug === 'string' ? parsed.slug : slugify(parsed.title),
          links: normalizeLinks(parsed.links),
          credits: normalizedCredits,
          tracks: normalizedTracks,
        } as ReleaseRecord;
      })
      .filter((release): release is ReleaseRecord => release !== null)
      .sort((a, b) => {
        const aDate = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
        const bDate = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
        return bDate - aDate;
      });
  } catch (error) {
    console.warn('Unable to read release content directory:', directoryPath, error);
    return [];
  }
}

export const releases = extractReleasesFromDirectory();
