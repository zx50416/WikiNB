import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

const WIKI_DIR = path.join(process.cwd(), 'wiki');

export interface WikiPage {
  slug: string;
  title: string;
  description: string;
  type: 'note' | 'learning';
  status: 'active' | 'completed' | 'paused' | 'archived';
  tags: string[];
  date: string;
  updated?: string;
  priority?: 'high' | 'medium' | 'low';
  progress?: number;
  targetSkill?: string;
  relatedSkills?: string[];
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
  const base = (import.meta.env?.BASE_URL as string) || '/';
  return html.replace(
    /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (_match, slug: string, label?: string) => {
      const text = label || slug.replace(/-/g, ' ');
      return `<a href="${base}wiki/${slug.trim()}" class="wiki-link">${text.trim()}</a>`;
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
    type: (data.type as WikiPage['type']) || 'note',
    status: (data.status as WikiPage['status']) || 'active',
    tags: (data.tags as string[]) || [],
    date: (data.date as string) || new Date().toISOString().split('T')[0],
    updated: data.updated as string | undefined,
    priority: data.priority as WikiPage['priority'],
    progress: data.progress as number | undefined,
    targetSkill: data.targetSkill as string | undefined,
    relatedSkills: (data.relatedSkills as string[]) || [],
    body: content,
    html,
    excerpt: plain.slice(0, 200),
  };
}

export function getAllWikiPages(): WikiPage[] {
  if (!fs.existsSync(WIKI_DIR)) return [];

  const collectFiles = (dir: string, prefix = ''): string[] => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        files.push(...collectFiles(path.join(dir, entry.name), rel));
      } else if (entry.name.endsWith('.md') && entry.name !== 'index.md') {
        files.push(rel);
      }
    }
    return files;
  };

  const files = collectFiles(WIKI_DIR);

  return files
    .map((file) => {
      const slug = file.replace(/\.md$/, '');
      return parseWikiFile(path.join(WIKI_DIR, file), slug);
    })
    .sort((a, b) => {
      // 最新在上：優先 updated，否則 date
      const ta = new Date(a.updated || a.date).getTime();
      const tb = new Date(b.updated || b.date).getTime();
      return tb - ta;
    });
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
  // 維持呼叫端排序（預設最新在上）
  return pages.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    type: p.type,
    tags: p.tags,
    date: p.date,
    updated: p.updated,
    html: p.html,
    bodyText: stripMarkdown(p.body),
  }));
}

export function getPagesByType(pages: WikiPage[], type: WikiPage['type']) {
  return pages.filter((p) => p.type === type);
}
