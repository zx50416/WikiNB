import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

const WIKI_DIR = path.join(process.cwd(), 'wiki');

export interface WikiPage {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  date: string;
  updated?: string;
  body: string;
  html: string;
  excerpt: string;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~`-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function linkifyWikiLinks(html: string): string {
  return html.replace(
    /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (_match, slug: string, label?: string) => {
      const text = label || slug.replace(/-/g, ' ');
      return `<a href="/wiki/${slug.trim()}" class="wiki-link">${text.trim()}</a>`;
    },
  );
}

function parseWikiFile(filePath: string, slug: string): WikiPage {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  const html = linkifyWikiLinks(marked.parse(content, { async: false }) as string);
  const plain = stripMarkdown(content);

  return {
    slug,
    title: (data.title as string) || slug,
    description: (data.description as string) || plain.slice(0, 120),
    tags: (data.tags as string[]) || [],
    date: (data.date as string) || new Date().toISOString().split('T')[0],
    updated: data.updated as string | undefined,
    body: content,
    html,
    excerpt: plain.slice(0, 200),
  };
}

export function getAllWikiPages(): WikiPage[] {
  if (!fs.existsSync(WIKI_DIR)) return [];

  const files = fs
    .readdirSync(WIKI_DIR)
    .filter((f) => f.endsWith('.md') && f !== 'index.md');

  return files
    .map((file) => parseWikiFile(path.join(WIKI_DIR, file), file.replace(/\.md$/, '')))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getWikiPage(slug: string): WikiPage | undefined {
  const filePath = path.join(WIKI_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return undefined;
  return parseWikiFile(filePath, slug);
}

export function getAllTags(pages: WikiPage[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const page of pages) {
    for (const tag of page.tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export function getSearchIndex(pages: WikiPage[]) {
  return pages.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    tags: p.tags,
    excerpt: p.excerpt,
    date: p.date,
  }));
}
