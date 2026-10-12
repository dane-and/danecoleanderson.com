import { writeFile } from 'node:fs/promises';

// Export only the published posts chosen for the portfolio blog in Sanity
// ("Show on danecoleanderson.com blog"). Every other post stays in Sanity as
// the archive. Like the interview export, serving this file from the site
// keeps previews and custom domains independent of Sanity browser CORS rules.
const query = `*[_type == "post" && showOnBlog == true && !(_id in path("drafts.**")) && defined(slug.current) && (!defined(publishedAt) || dateTime(publishedAt) <= dateTime(now()))] | order(publishedAt desc) {
  _id, title, slug, excerpt, publishedAt,
  body[]{..., _type == "image" => {..., asset->{url, metadata{dimensions}}}},
  mainImage{asset->{url}, caption, alt}
}`;
const url = new URL('https://nzyg33ca.api.sanity.io/v2023-05-03/data/query/production');
url.searchParams.set('query', query);
const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
if (!response.ok) throw new Error(`Blog export failed: HTTP ${response.status}`);
const { result } = await response.json();
if (!Array.isArray(result) || result.length === 0) {
  throw new Error('Blog export returned no posts; refusing an empty deployment.');
}
const slugs = new Set();
for (const post of result) {
  const slug = post.slug?.current;
  if (!post._id || !post.title || !slug || slugs.has(slug) ||
      !(typeof post.body === 'string' ? post.body.trim() : Array.isArray(post.body) && post.body.length)) {
    throw new Error(`Invalid or incomplete blog post: ${post._id || 'unknown'}`);
  }
  slugs.add(slug);
}
await writeFile(new URL('../public/blog.json', import.meta.url), JSON.stringify(result));
console.log(`Exported ${result.length} blog posts marked for the portfolio.`);
