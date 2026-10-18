import { readFileSync, readdirSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(process.argv[2] || fileURLToPath(new URL('../website/', import.meta.url)));
const origin = 'https://igorcouto.com';
// These applications are deployed separately from this static website.
const applications = new Set([
  '/newsletter-api/api/swagger/index.html', '/projects/copa-de-filmes/',
  '/projects/dice-roll/', '/projects/guess-the-state/',
  '/projects/story-nodes-editor/', '/projects/wordle/',
]);
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const read = file => readFileSync(resolve(root, file), 'utf8');
function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return entry.name === 'dist' ? [] : walk(path);
    return [relative(root, path).split(sep).join('/')];
  });
}
const files = new Set(walk(root));
const decode = value => value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, entity => {
  const named = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' };
  return named[entity.toLowerCase()] ?? String.fromCodePoint(
    entity[2].toLowerCase() === 'x' ? parseInt(entity.slice(3), 16) : parseInt(entity.slice(2), 10));
});
// The site's HTML uses ordinary start tags and quoted or unquoted attributes.
function tags(html) {
  return [...html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<([a-z][\w:-]*)\b([^>]*)>/gi)]
    .map(([, name, attributes]) => ({
      name: name.toLowerCase(),
      attrs: Object.fromEntries([...attributes.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)]
        .map(([, key, quoted, single, bare]) => [key.toLowerCase(), decode(quoted ?? single ?? bare ?? '')])),
    }));
}
const publicPath = file => '/' + (file === 'index.html' || file.endsWith('/index.html')
  ? file.slice(0, -'index.html'.length) : file.slice(0, -'.html'.length));
const pages = new Map([...files].filter(file => file.endsWith('.html')).map(file => {
  const html = read(file);
  const all = tags(html);
  return [file, { all, head: tags(html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || ''),
    ids: new Set(all.map(tag => tag.attrs.id).filter(Boolean)) }];
}));
const publicFiles = [...pages.keys()].filter(file => !file.startsWith('error/'));
const expected = publicFiles.map(file => origin + publicPath(file)).sort();
const sitemap = [...read('sitemap.xml').matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map(match => decode(match[1]));
check(expected.length > 0 && JSON.stringify([...sitemap].sort()) === JSON.stringify(expected),
  'sitemap.xml must list every public HTML page exactly once using its canonical URL');

for (const [file, page] of pages) {
  const url = origin + publicPath(file);
  const canonical = page.head.filter(tag => tag.name === 'link' &&
    tag.attrs.rel?.toLowerCase().split(/\s+/).includes('canonical')).map(tag => tag.attrs.href);
  const meta = property => page.head.filter(tag => tag.name === 'meta' &&
    (tag.attrs.property || tag.attrs.name)?.toLowerCase() === property).map(tag => tag.attrs.content);
  if (file.startsWith('error/')) {
    check(meta('robots').some(value => /\bnoindex\b/i.test(value)), `${file}: error pages must be noindex`);
    check(canonical.length === 0, `${file}: error pages must not declare a canonical URL`);
  } else {
    check(canonical.length === 1 && canonical[0] === url, `${file}: canonical must be ${url}`);
    check(meta('og:url').length === 1 && meta('og:url')[0] === url, `${file}: og:url must be ${url}`);
    check(!meta('robots').some(value => /\bnoindex\b/i.test(value)), `${file}: sitemap pages must be indexable`);
    for (const key of ['og:title', 'og:description', 'og:type', 'og:image', 'og:image:alt']) {
      check(meta(key).length === 1 && Boolean(meta(key)[0]?.trim()), `${file}: require one nonempty ${key}`);
    }
    const image = meta('og:image')[0] || '';
    check(image.startsWith(origin + '/assets/') && files.has(image.slice(origin.length + 1)),
      `${file}: og:image must be an absolute HTTPS URL to a local asset`);
  }
  for (const tag of page.all) {
    for (const value of [tag.attrs.href, tag.attrs.src, tag.attrs.poster].filter(Boolean)) {
      if (value === '#') continue;
      let target;
      try { target = new URL(value, url); } catch { check(false, `${file}: invalid URL ${value}`); continue; }
      if (!['igorcouto.com', 'www.igorcouto.com'].includes(target.hostname)) continue;
      check(target.origin === origin, `${file}: internal URL must use ${origin}: ${value}`);
      if (applications.has(target.pathname)) continue;
      const path = decodeURIComponent(target.pathname).slice(1);
      const destination = [path, path.endsWith('/') || !path ? path + 'index.html' : path + '.html']
        .find(candidate => files.has(candidate));
      check(Boolean(destination), `${file}: missing internal target ${value}`);
      if (!destination || !pages.has(destination)) continue;
      if (!destination.startsWith('error/')) {
        check(target.pathname === publicPath(destination), `${file}: use the canonical path for ${value}`);
      }
      if (target.hash) check(pages.get(destination).ids.has(decodeURIComponent(target.hash.slice(1))),
        `${file}: missing fragment in ${value}`);
    }
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`SEO checks passed for ${publicFiles.length} public pages.`);
}
