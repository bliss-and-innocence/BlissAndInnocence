import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import YAML from 'yaml';

export type SubmissionRecord = {
  name: string;
  slug: string;
  description?: string;
  deadline?: string;
  submissionLink?: string;
};

const projectRoot = resolve(process.cwd(), '..', '..');
const submissionsRoot = join(projectRoot, 'packages', 'content', 'album-submission');

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'submission';

function readSubmissionsFromDir(dir: string): SubmissionRecord[] {
  try {
    const files = readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && /\.(ya?ml)$/i.test(e.name))
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b));

    return files
      .map((fileName) => {
        const raw = readFileSync(join(dir, fileName), 'utf8');
        const parsed = YAML.parse(raw) as Record<string, unknown> | null;
        if (!parsed || typeof parsed !== 'object') return null;

        const fileStem = fileName.replace(/\.[^.]+$/, '');
        const name =
          typeof parsed.name === 'string' && parsed.name.trim().length > 0
            ? parsed.name.trim()
            : fileStem;

        const slug =
          typeof parsed.slug === 'string' && parsed.slug.trim().length > 0
            ? slugify(parsed.slug)
            : slugify(name);

        const submissionLink =
          typeof parsed['submission-link'] === 'string' && parsed['submission-link'].trim().length > 0
            ? parsed['submission-link'].trim()
            : typeof parsed.submissionLink === 'string' && parsed.submissionLink.trim().length > 0
              ? parsed.submissionLink.trim()
              : undefined;

        return {
          name,
          slug,
          description: typeof parsed.description === 'string' ? parsed.description.trim() : undefined,
          deadline: typeof parsed.deadline === 'string' ? parsed.deadline.trim() : undefined,
          submissionLink,
        } as SubmissionRecord;
      })
      .filter((s): s is SubmissionRecord => s !== null);
  } catch (error) {
    console.warn('Unable to read submissions from', dir, error);
    return [];
  }
}

export const activeSubmissions = readSubmissionsFromDir(join(submissionsRoot, 'active'));
export const archivedSubmissions = readSubmissionsFromDir(join(submissionsRoot, 'archive'));
