import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import YAML from 'yaml';

export type BlogPost = {
  title: string;
  slug: string;
  date: string;
  announcer?: string;
  message?: string;
  [key: string]: unknown;
};

const projectRoot = resolve(process.cwd(), '..', '..');
const blogDir = join(projectRoot, 'packages', 'content', 'blog');

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'blog-post';

export function extractBlogPostsFromDirectory(directoryPath = blogDir): BlogPost[] {
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

        const fileStem = fileName.replace(/\.[^.]+$/, '');
        const title = typeof parsed?.title === 'string' && parsed.title.trim().length > 0
          ? parsed.title.trim()
          : fileStem.match(/^\d{4}-\d{2}-\d{2}$/)
            ? ''
            : fileStem;
        const dateValue = typeof parsed?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date.trim())
          ? parsed.date.trim()
          : fileStem.match(/^\d{4}-\d{2}-\d{2}$/)
            ? fileStem
            : '1970-01-01';
        const slug = typeof parsed?.slug === 'string' && parsed.slug.trim().length > 0
          ? slugify(parsed.slug)
          : fileStem.match(/^\d{4}-\d{2}-\d{2}$/)
            ? fileStem
            : slugify(title || fileStem || 'blog-post');

        return {
          ...parsed,
          title,
          slug,
          date: dateValue,
          announcer: typeof parsed?.announcer === 'string' ? parsed.announcer.trim() : undefined,
          message: typeof parsed?.message === 'string'
            ? parsed.message
            : typeof parsed?.content === 'string'
              ? parsed.content
              : undefined,
        } as BlogPost;
      })
      .filter((post) => !!post && typeof post.title === 'string')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.warn('Unable to read blog content directory:', directoryPath, error);
    return [];
  }
}

export const blogPosts = extractBlogPostsFromDirectory();
