import { mkdir, readFile, writeFile } from 'node:fs/promises';

// The site renders in the browser, but link-preview services (LinkedIn, Slack,
// iMessage, X) read only the HTML they download. After `vite build`, write a copy
// of index.html for every public route with that page's own title, description,
// image, and canonical URL already in the <head>. Each is written as
// `<path>.html` (e.g. dist/blog/laughing-at-othello.html), which Netlify serves at
// the clean URL without adding a trailing slash; the app then takes over as usual.
const origin = 'https://www.danecoleanderson.com';
const name = 'Dane Cole Anderson';
const shareImage = `${origin}/og-image.jpg`;
const dist = new URL('../dist/', import.meta.url);
const template = await readFile(new URL('index.html', dist), 'utf8');
const blog = JSON.parse(await readFile(new URL('blog.json', dist), 'utf8'));
const interviews = JSON.parse(await readFile(new URL('interviews.json', dist), 'utf8'));

const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const stripHtml = s => s.replace(/<[^>]+>/g, ' ');
function summary(doc, limit = 160) {
  if (doc.excerpt?.trim()) return doc.excerpt.trim();
  const text = typeof doc.body === 'string' ? stripHtml(doc.body)
    : (doc.body || []).filter(b => b._type === 'block' && (!b.style || b.style === 'normal'))
      .map(b => (b.children || []).map(c => c.text || '').join('')).join(' ');
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= limit ? clean : `${clean.slice(0, clean.lastIndexOf(' ', limit)).replace(/[,;:.\s]+$/, '')}…`;
}

const pages = [
  { path: '/about', title: 'About', description: 'About Dane Cole Anderson: PhD candidate in English at the University of Michigan, university teacher, AI model trainer, and interviewer.' },
  { path: '/research', title: 'Research & Teaching', description: 'Dane Cole Anderson’s intellectual history of subjectivity and objectivity in nineteenth-century Britain, his teaching, and his work training and evaluating frontier AI models.' },
  { path: '/blog', title: 'Blog', description: 'Essays by Dane Cole Anderson on intellectual history, literature, teaching, and AI.' },
  { path: '/interviews', title: 'Interviews', description: 'Long-form interviews conducted and edited by Dane Cole Anderson, on literature, history, religion, AI, and education.' },
  { path: '/courses', title: 'Favorite Courses', description: 'Dane Cole Anderson’s collection of free lecture courses in literature, philosophy, history, religion, and other disciplines.' },
  { path: '/contact', title: 'Contact', description: 'Get in touch with Dane Cole Anderson about research, teaching, AI evaluation, or his interviews.' },
  ...blog.map(p => ({ path: `/blog/${p.slug.current}`, title: p.title.trim(), description: summary(p) || 'An essay by Dane Cole Anderson.',
    image: p.mainImage?.asset?.url, article: { published: p.publishedAt } })),
  ...interviews.map(i => ({ path: `/article/${i.slug.current}`, title: i.title.trim(), description: summary(i) || 'An interview by Dane Cole Anderson.',
    image: i.mainImage?.asset?.url, article: { published: i.publishedAt } })),
];

function head({ path, title, description, image, article }) {
  const url = `${origin}${path}`;
  const tags = [
    `<title>${esc(`${title} | ${name}`)}</title>`,
    `<meta data-react-helmet="true" name="description" content="${esc(description)}" />`,
    `<meta data-react-helmet="true" property="og:title" content="${esc(title)}" />`,
    `<meta data-react-helmet="true" property="og:description" content="${esc(description)}" />`,
    `<meta data-react-helmet="true" property="og:site_name" content="${name}" />`,
    `<meta data-react-helmet="true" property="og:type" content="${article ? 'article' : 'website'}" />`,
    `<meta data-react-helmet="true" property="og:url" content="${url}" />`,
    `<meta data-react-helmet="true" property="og:image" content="${esc(image || shareImage)}" />`,
    `<meta data-react-helmet="true" name="twitter:card" content="summary_large_image" />`,
    `<link data-react-helmet="true" rel="canonical" href="${url}" />`,
  ];
  if (article) {
    tags.push(`<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Article', headline: title, description, url,
      image: image || shareImage, ...(article.published ? { datePublished: article.published } : {}),
      author: { '@type': 'Person', name, url: `${origin}/` },
    }).replace(/</g, '\\u003c')}</script>`);
  }
  return tags.join('\n    ');
}

const start = '<!--page-meta:start-->', end = '<!--page-meta:end-->';
if (!template.includes(start) || !template.includes(end)) throw new Error('index.html is missing the page-meta markers.');
const [before, rest] = template.split(start);
const after = rest.split(end)[1];
for (const page of pages) {
  const file = new URL(`.${page.path}.html`, dist);
  await mkdir(new URL('./', file), { recursive: true });
  await writeFile(file, `${before}${start}\n    ${head(page)}\n    ${end}${after}`);
}
console.log(`Wrote share metadata for ${pages.length} pages.`);
