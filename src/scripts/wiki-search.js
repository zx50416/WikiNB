/**
 * Shared client-side wiki search (used on /search and homepage).
 * Pass searchIndex via define:vars from Astro pages.
 */
export function createWikiSearch(searchIndex) {
  const escapeHtml = (text) =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const matchesQuery = (page, query) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const haystack = [page.title, page.description, page.tags.join(' '), page.bodyText]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  };

  const filterPages = (query) => {
    const q = query.trim();
    if (!q) return searchIndex;
    return searchIndex.filter((page) => matchesQuery(page, q));
  };

  const getBase = () => document.documentElement.dataset.base || '/';

  const renderItem = (page) => {
    const tags = page.tags
      .slice(0, 3)
      .map((t) => `<span class="tag-badge">${escapeHtml(t)}</span>`)
      .join('');
    const learningBadge =
      page.type === 'learning'
        ? '<span class="tag-badge bg-lavender-300/30 text-berry-700">學習中</span>'
        : '';

    return `
      <article class="wiki-item" data-slug="${escapeHtml(page.slug)}">
        <div class="flex items-start gap-2 px-4 py-5 md:gap-3 md:px-6">
          <button
            type="button"
            class="wiki-expand mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-pink-200/80 bg-white/50 text-pink-500 transition-all hover:border-pink-300 hover:bg-pink-50 hover:text-pink-600"
            aria-expanded="false"
            aria-controls="content-${escapeHtml(page.slug)}"
            aria-label="展開：${escapeHtml(page.title)}"
          >
            <span class="wiki-chevron text-sm transition-transform">▸</span>
          </button>
          <div class="min-w-0 flex-1">
            <div class="mb-1 flex flex-wrap items-center gap-2">
              <time class="text-xs font-semibold text-pink-500">${escapeHtml(page.date)}</time>
              ${learningBadge}
              ${tags}
            </div>
            <a href="${getBase()}wiki/${escapeHtml(page.slug)}" class="wiki-title-link block font-display text-lg font-bold text-berry-800 transition-colors hover:text-pink-600 md:text-xl">
              ${escapeHtml(page.title)}
            </a>
            <p class="mt-1 line-clamp-2 text-sm text-berry-700/75">${escapeHtml(page.description)}</p>
          </div>
        </div>
        <div id="content-${escapeHtml(page.slug)}" class="wiki-panel hidden border-t border-pink-100/60 bg-white/30 px-4 pb-6 pt-2 md:px-6" hidden>
          <div class="wiki-content pl-11 md:pl-12">${page.html}</div>
          <div class="mt-6 pl-11 md:pl-12">
              <a href="${getBase()}wiki/${escapeHtml(page.slug)}" class="text-sm font-semibold text-pink-600 hover:text-pink-700">專頁檢視 →</a>
          </div>
        </div>
      </article>
    `;
  };

  const closeItem = (item) => {
    const panel = item.querySelector('.wiki-panel');
    const expandBtn = item.querySelector('.wiki-expand');
    const chevron = item.querySelector('.wiki-chevron');
    if (panel) {
      panel.hidden = true;
      panel.classList.add('hidden');
    }
    if (expandBtn) expandBtn.setAttribute('aria-expanded', 'false');
    if (chevron) chevron.style.transform = '';
  };

  const openItem = (item, scroll = true) => {
    const panel = item.querySelector('.wiki-panel');
    const expandBtn = item.querySelector('.wiki-expand');
    const chevron = item.querySelector('.wiki-chevron');
    if (!panel || !expandBtn) return;

    item.closest('[data-search-results]')?.querySelectorAll('.wiki-item').forEach((other) => {
      if (other !== item) closeItem(other);
    });

    panel.hidden = false;
    panel.classList.remove('hidden');
    expandBtn.setAttribute('aria-expanded', 'true');
    if (chevron) chevron.style.transform = 'rotate(90deg)';
    if (scroll) item.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const bindExpandHandlers = (container) => {
    container.querySelectorAll('.wiki-expand').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = btn.closest('.wiki-item');
        const panel = item?.querySelector('.wiki-panel');
        const isOpen = panel && !panel.hidden;
        if (isOpen) closeItem(item);
        else openItem(item);
      });
    });
  };

  const renderResults = ({ query, resultsEl, emptyEl, metaEl }) => {
    const q = query.trim();
    const results = filterPages(q);

    if (metaEl) {
      if (!q) {
        metaEl.textContent =
          results.length > 0
            ? `共 ${results.length} 篇 · 最新在上 · 輸入關鍵字可即時過濾`
            : '還沒有筆記';
      } else {
        metaEl.textContent = results.length
          ? `找到 ${results.length} 筆包含「${q}」的筆記（最新在上）`
          : `沒有找到包含「${q}」的筆記`;
      }
    }

    if (results.length === 0) {
      resultsEl.classList.add('hidden');
      resultsEl.innerHTML = '';
      if (emptyEl) {
        emptyEl.textContent = q
          ? `沒有符合「${q}」的結果，試試其他關鍵字。`
          : '還沒有 Wiki 筆記。整理好後拖到 Codex 上傳，再同步即可。';
        emptyEl.classList.remove('hidden');
      }
      return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');
    resultsEl.innerHTML = results.map(renderItem).join('');
    resultsEl.classList.remove('hidden');
    bindExpandHandlers(resultsEl);
  };

  const getQueryFromUrl = () => new URLSearchParams(window.location.search).get('q') || '';

  const mount = ({ input, form, resultsEl, emptyEl, metaEl, syncUrl = false }) => {
    const runSearch = () => {
      const q = input?.value ?? '';
      if (syncUrl) {
        const url = new URL(window.location.href);
        if (q.trim()) url.searchParams.set('q', q.trim());
        else url.searchParams.delete('q');
        window.history.replaceState({}, '', url);
      }
      renderResults({ query: q, resultsEl, emptyEl, metaEl });
    };

    input?.addEventListener('input', runSearch);
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      runSearch();
    });

    return { runSearch, getQueryFromUrl };
  };

  return { mount, renderResults, getQueryFromUrl, filterPages };
}
