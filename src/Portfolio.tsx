import React, { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { PortableText } from '@portabletext/react';
import { disciplines } from './lib/data/youtubeUniversity';
import sanitizeHtml from 'sanitize-html';
import { Linkedin } from 'lucide-react';
import './portfolio.css';

type Interview = {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
  publishedAt?: string;
  body?: React.ComponentProps<typeof PortableText>['value'] | string;
  mainImage?: { asset?: { url: string }; caption?: string; alt?: string };
};

const email = 'danecoleanderson@gmail.com';
const linkedin = 'https://www.linkedin.com/in/danecoleanderson/';
const siteOrigin = (import.meta.env.VITE_SITE_URL || 'https://www.danecoleanderson.com').replace(/\/$/, '');
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;
const painting = asset('images/st-matthew-ebbo-gospels.jpg');
const headshot = asset('images/dane-anderson.jpg');
const cvUrl = asset('dane-cole-anderson-cv.pdf');
const resumeUrl = asset('dane-cole-anderson-resume.pdf');
const shareImage = `${siteOrigin}/og-image.jpg`;
const fullName = 'Dane Cole Anderson';
const formatDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/New_York' }) : '';
const nav = [['/about', 'About'], ['/research', 'Research & Teaching'], ['/blog', 'Blog'], ['/interviews', 'Interviews'], ['/courses', 'Favorite Courses']];
type BlogPost = Interview;
type PortableBlock = { _type?: string; style?: string; children?: { text?: string }[]; asset?: { url?: string; metadata?: { dimensions?: { width?: number; height?: number } } }; alt?: string; caption?: string };

const bodyComponents: React.ComponentProps<typeof PortableText>['components'] = {
  types: {
    image: ({ value }: { value: PortableBlock }) => value?.asset?.url ? <figure className="pf-interview-image"><img src={value.asset.url} alt={value.alt || ''} loading="lazy" width={value.asset.metadata?.dimensions?.width} height={value.asset.metadata?.dimensions?.height} />{value.caption && <figcaption>{value.caption}</figcaption>}</figure> : null,
  },
  marks: {
    link: ({ value, children }: { value?: { href?: string }; children?: React.ReactNode }) => {
      const href = value?.href || '';
      const external = /^https?:\/\//.test(href) && !href.includes('danecoleanderson.com');
      return <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>;
    },
  },
};
function Body({ body }: { body: Interview['body'] }) {
  return typeof body === 'string' ? <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }} /> : body ? <PortableText value={body} components={bodyComponents} /> : null;
}
// A short preview: the Sanity excerpt when there is one, otherwise the opening of the post.
function preview(post: BlogPost, limit = 220) {
  if (post.excerpt?.trim()) return post.excerpt.trim();
  const text = typeof post.body === 'string'
    ? sanitizeHtml(post.body, { allowedTags: [], allowedAttributes: {} })
    : Array.isArray(post.body) ? (post.body as PortableBlock[]).filter(b => b._type === 'block' && (!b.style || b.style === 'normal')).map(b => (b.children || []).map(c => c.text || '').join('')).join(' ') : '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= limit) return clean;
  return `${clean.slice(0, clean.lastIndexOf(' ', limit)).replace(/[,;:.\s]+$/, '')}…`;
}
function useBlogPosts() {
  return useQuery<BlogPost[]>({ queryKey: ['portfolio-blog'], queryFn: async () => {
    const response = await fetch(asset('blog.json'));
    if (!response.ok) throw new Error('The blog could not be loaded.');
    const posts: BlogPost[] = await response.json();
    if (!Array.isArray(posts)) throw new Error('The blog is invalid.');
    return posts;
  } });
}

function useInterviews() {
  return useQuery<Interview[]>({ queryKey: ['portfolio-interviews'], queryFn: async () => {
    const response = await fetch(asset('interviews.json'));
    if (!response.ok) throw new Error('The interview collection could not be loaded.');
    const interviews: Interview[] = await response.json();
    if (!Array.isArray(interviews)) throw new Error('The interview collection is invalid.');
    return interviews;
  } });
}
function Metadata({ title, description, noindex = false, image, article = false }: { title: string; description: string; noindex?: boolean; image?: string; article?: boolean }) {
  const { pathname } = useLocation();
  const pageTitle = title === fullName ? `${fullName} — Intellectual History, Teaching, and AI` : `${title} | ${fullName}`;
  return <Helmet>
    <title>{pageTitle}</title>
    <meta name="description" content={description} />
    <meta name="robots" content={noindex ? 'noindex, follow' : 'index, follow'} />
    <meta property="og:title" content={title} /><meta property="og:description" content={description} />
    <meta property="og:site_name" content={fullName} /><meta property="og:type" content={article ? 'article' : 'website'} />
    <meta property="og:url" content={`${siteOrigin}${pathname}`} />
    <meta property="og:image" content={image || shareImage} />
    <meta name="twitter:card" content="summary_large_image" />
    {!noindex && <link rel="canonical" href={`${siteOrigin}${pathname}`} />}
  </Helmet>;
}
function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  return <header className="pf-header">
    <Link to="/" className="pf-wordmark" aria-label="Dane Anderson — home">Dane Anderson</Link>
    <button className="pf-menu" aria-expanded={open} aria-controls="portfolio-navigation" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Menu'}</button>
    <nav id="portfolio-navigation" aria-label="Main navigation" className={open ? 'pf-nav is-open' : 'pf-nav'}>
      {nav.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}
      <NavLink to="/contact">Contact <span aria-hidden="true">↗</span></NavLink>
    </nav>
  </header>;
}
function Footer() {
  return <footer className="pf-footer"><div><Link to="/" className="pf-footer-name">Dane Anderson</Link><p>Intellectual history, teaching, and AI.</p></div><div><div className="pf-footer-links"><Link to="/contact">Get in touch <span aria-hidden="true">↗</span></Link><a className="pf-social-link" href={linkedin} target="_blank" rel="noopener noreferrer" aria-label="Dane Anderson on LinkedIn" title="LinkedIn"><Linkedin size={18} aria-hidden="true" /></a></div><span>© {new Date().getFullYear()} {fullName}</span></div></footer>;
}
function Intro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return <div className="pf-intro"><p className="pf-eyebrow">{eyebrow}</p><h1>{title}</h1>{children && <div className="pf-lead">{children}</div>}</div>;
}
function InterviewCards({ interviews, headingLevel = 'h3' }: { interviews: Interview[]; headingLevel?: 'h2' | 'h3' }) {
  const Heading = headingLevel;
  return <div className="pf-interview-grid">{interviews.map(interview => <article className="pf-interview-card" key={interview._id}>
    {interview.mainImage?.asset?.url && <Link to={`/article/${interview.slug.current}`} tabIndex={-1} aria-hidden="true"><div className="pf-card-image"><img src={interview.mainImage.asset.url} alt="" loading="lazy" /></div></Link>}
    <Heading><Link to={`/article/${interview.slug.current}`}>{interview.title}</Link></Heading>
    {interview.excerpt && <p>{interview.excerpt}</p>}
    <Link className="pf-text-link" to={`/article/${interview.slug.current}`}>Read the interview <span aria-hidden="true">↗</span></Link>
  </article>)}</div>;
}
function Home() {
  const { data = [] } = useInterviews();
  const selected = ['hollis-robbins-on-ai-and-thinking-across-boundaries', 'stanley-fish-on-interpretive-communities-viewpoint-diversity-and-frank-sinatra', 'michael-clune-on-aesthetic-judgment-ai-and-the-future-of-the-english-departments'].map(slug => data.find(i => i.slug.current === slug)).filter((i): i is Interview => Boolean(i));
  return <>
    <Metadata title={fullName} description="Dane Cole Anderson studies nineteenth-century British intellectual history, teaches, and helps train and evaluate frontier AI models. Essays, interviews with scholars, and free humanities courses." />
    <section className="pf-hero"><div className="pf-hero-copy"><h1>Intellectual History, Teaching, and AI</h1><p className="pf-hero-description">I’m Dane Cole Anderson, a PhD candidate in English at the University of Michigan. I study nineteenth-century British intellectual history, teach, and help train and evaluate frontier AI models. I also write essays and talk with scholars about their work.</p><div className="pf-actions"><Link className="pf-button" to="/about">More about me <span aria-hidden="true">↗</span></Link><Link className="pf-text-link" to="/interviews">Explore the interviews <span aria-hidden="true">→</span></Link></div></div>
    <figure className="pf-hero-art"><img src={painting} alt="Saint Matthew writing at his desk, from the Ebbo Gospels" width="433" height="599" /><figcaption><em>Saint Matthew</em>, from the <em>Ebbo Gospels</em></figcaption></figure></section>
    <section className="pf-work" aria-labelledby="work-heading"><div className="pf-section-label"><p className="pf-eyebrow">An introduction</p><h2 id="work-heading">My work</h2></div><div className="pf-work-list">
      <Link to="/research"><span className="pf-number">01</span><div><h3>Research & teaching</h3><p>I study nineteenth-century British intellectual culture by examining how writers across disciplines theorized the relationship between subjectivity and objectivity, mind and world.</p></div><span aria-hidden="true">↗</span></Link>
      <Link to="/blog"><span className="pf-number">02</span><div><h3>Blog</h3><p>Short essays on intellectual history, literature, teaching, and AI.</p></div><span aria-hidden="true">↗</span></Link>
      <Link to="/interviews"><span className="pf-number">03</span><div><h3>Interviews</h3><p>My series of interviews with leading scholars explores why the liberal arts are important and the best ways to ensure they remain relevant.</p></div><span aria-hidden="true">↗</span></Link>
      <Link to="/courses"><span className="pf-number">04</span><div><h3>Favorite courses</h3><p>I curated a collection of my favorite free online courses for self-directed learning.</p></div><span aria-hidden="true">↗</span></Link>
    </div></section>
    <section className="pf-featured"><div className="pf-section-heading"><div><h2>Check out some of my favorite interviews</h2></div><Link className="pf-text-link" to="/interviews">View the series <span aria-hidden="true">→</span></Link></div>{selected.length > 0 ? <InterviewCards interviews={selected} /> : <p>Conversations about literature, interpretation, AI, and the future of education. <Link to="/interviews">Explore the interview series.</Link></p>}</section>
  </>;
}
function CvLinks() {
  return <p className="pf-cv-links"><a href={cvUrl} target="_blank" rel="noopener">CV <span className="pf-file">PDF</span></a><a href={resumeUrl} target="_blank" rel="noopener">Résumé <span className="pf-file">PDF</span></a></p>;
}
function About() {
  return <><Metadata title="About" description="About Dane Cole Anderson: PhD candidate in English at the University of Michigan, university teacher, AI model trainer, and interviewer." />
    <Intro eyebrow="About me" title={fullName}><p>PhD candidate, teacher, and AI model trainer based in the Washington, D.C. area.</p></Intro>
    <div className="pf-about"><figure className="pf-portrait"><img src={headshot} alt="Dane Cole Anderson" width="640" height="800" /></figure><div className="pf-prose"><p>I’m a PhD candidate in English Language and Literature at the University of Michigan. My research concerns nineteenth-century British literature and intellectual history, particularly how writers understood the relationship between the mind and the world.</p><p>My dissertation develops an intellectual history of nineteenth-century Britain through the concepts of subjectivity and objectivity, examining how they were introduced and how their meanings evolved throughout the century.</p><p>My teaching experience includes first-year writing, Shakespeare, and the Bible as literature at the University of Michigan and George Mason University.</p><p>I also work as a contractor for leading AI labs, applying my experience in teaching and writing to the <Link to="/research#ai-training">training and evaluation of frontier models</Link>.</p><p>I researched, conducted, and edited a series of fifteen <Link to="/interviews">interviews</Link> with scholars working across literature, history, religion, and education.</p><p>This site collects that work alongside my <Link to="/blog">essays</Link> and <Link to="/courses">some of my favorite free courses</Link>.</p><CvLinks /><Link className="pf-text-link" to="/contact">Get in touch <span aria-hidden="true">↗</span></Link></div></div>
  </>;
}
function Research() {
  return <>
    <Metadata title="Research & Teaching" description="Dane Cole Anderson’s intellectual history of subjectivity and objectivity in nineteenth-century Britain, research using AI and ProQuest TDM Studio, teaching experience, and AI training and evaluation." />
    <Intro eyebrow="My work" title="Research & Teaching"><p>An intellectual history of nineteenth-century Britain, university teaching, and work on frontier AI models.</p></Intro>
    <div className="pf-essay-sections">
      <section><p className="pf-eyebrow">Research</p><div className="pf-prose">
        <h2>Subjectivity and objectivity in nineteenth-century Britain</h2>
        <p>My dissertation develops an intellectual history of nineteenth-century Britain by examining the concepts of subjectivity and objectivity: how they were introduced and how their meanings evolved throughout the century.</p>
        <p>I use AI and <a href="https://about.proquest.com/en/products-services/TDM-Studio/" target="_blank" rel="noopener noreferrer">ProQuest TDM Studio</a> to analyze millions of pages of nineteenth-century British periodicals. This work helps me identify the sources that speak most directly to my research and check that I’m not being overly selective in the evidence I use.</p>
      </div></section>
      <section><h2 className="pf-eyebrow">Teaching</h2><div className="pf-prose">
        <p>My teaching experience includes first-year writing, Shakespeare, and the Bible as literature at the University of Michigan and George Mason University.</p>
      </div></section>
      <section id="ai-training"><h2 className="pf-eyebrow">AI training and evaluation</h2><div className="pf-prose">
        <p>As a contractor for leading AI labs, I help train and evaluate frontier AI models. I create and review training data, evaluate model responses, and identify weaknesses in reasoning and writing. I view this work as an extension of my teaching: by creating golden responses, developing rubrics, and eliminating AI slop, I help improve tools that people will use to learn far beyond my classroom.</p>
      </div></section>
      <section id="cv"><h2 className="pf-eyebrow">CV</h2><div className="pf-prose">
        <p>My full academic record, including fellowships, conference presentations, and teaching, is in my CV. A shorter résumé focuses on AI evaluation and teaching.</p>
        <CvLinks />
      </div></section>
    </div>
  </>;
}
function InterviewSeries() {
  const { data = [], isPending, isError, refetch } = useInterviews();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const filtered = data.filter(i => `${i.title} ${i.excerpt || ''}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <><Metadata title="Interviews" description="Long-form interviews conducted and edited by Dane Cole Anderson, on literature, history, religion, AI, and education." /><Intro eyebrow="The interview series" title="Interviews"><p>Conversations about the humanities and the people who practice them. I researched, conducted, and edited this series to bring scholars’ work to readers beyond the university.</p></Intro><div className="pf-collection-bar"><span>{isPending ? 'Loading the collection…' : `${data.length} interviews`}</span><label className="pf-search"><span className="sr-only">Search interviews by name or topic</span><input type="search" placeholder="Search by name or topic" value={query} onChange={e => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })} /></label></div>
    {isPending ? <p role="status" className="pf-status">Loading interviews…</p> : isError ? <div className="pf-status" role="alert"><p>The interviews couldn’t be loaded. Please try again.</p><button className="pf-button" onClick={() => refetch()}>Retry</button></div> : filtered.length ? <InterviewCards interviews={filtered} headingLevel="h2" /> : <p className="pf-status">{query ? 'No interviews match that search. Try another name or topic.' : 'The interview collection is temporarily unavailable.'}</p>}</>;
}
function InterviewPage() {
  const { slug } = useParams();
  const { data = [], isPending, isError, refetch } = useInterviews();
  const blog = useBlogPosts();
  const interview = data.find(i => i.slug.current === slug);
  if (!isPending && !interview && blog.data?.some(p => p.slug.current === slug)) return <Navigate to={`/blog/${slug}`} replace />;
  if (isPending || (!interview && blog.isPending)) return <p className="pf-status" role="status">Loading interview…</p>;
  if (isError) return <div className="pf-status" role="alert"><p>The interview couldn’t be loaded.</p><button className="pf-button" onClick={() => refetch()}>Retry</button></div>;
  if (!interview) return <Unavailable />;
  return <div className="pf-reading"><Metadata title={interview.title} description={interview.excerpt || 'An interview by Dane Cole Anderson.'} image={interview.mainImage?.asset?.url} /><Link className="pf-text-link" to="/interviews">← All interviews</Link><p className="pf-eyebrow">Interviews</p><h1>{interview.title}</h1><p className="pf-byline">Interview by Dane Cole Anderson</p>{interview.excerpt && <p className="pf-interview-deck">{interview.excerpt}</p>}{interview.mainImage?.asset?.url && <figure className="pf-interview-image"><img src={interview.mainImage.asset.url} alt={interview.mainImage.alt || interview.title} />{interview.mainImage.caption && <figcaption>{interview.mainImage.caption}</figcaption>}</figure>}<article className="pf-transcript prose max-w-none"><Body body={interview.body} /></article><div className="pf-reading-end"><Link className="pf-text-link" to="/interviews">← Return to the interview series</Link></div></div>;
}
function Blog() {
  const { data = [], isPending, isError, refetch } = useBlogPosts();
  return <><Metadata title="Blog" description="Essays by Dane Cole Anderson on intellectual history, literature, teaching, and AI." /><Intro eyebrow="Writing" title="Blog"><p>Short essays on intellectual history, literature, teaching, and AI.</p></Intro>
    {isPending ? <p role="status" className="pf-status">Loading posts…</p> : isError ? <div className="pf-status" role="alert"><p>The blog couldn’t be loaded. Please try again.</p><button className="pf-button" onClick={() => refetch()}>Retry</button></div> : data.length ? <div className="pf-post-list">{data.map(post => { const text = preview(post); return <article className="pf-post" key={post._id}>{post.publishedAt && <p className="pf-date"><time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time></p>}<h2><Link to={`/blog/${post.slug.current}`}>{post.title}</Link></h2>{text && <p>{text}</p>}<Link className="pf-text-link" to={`/blog/${post.slug.current}`} aria-label={`Read “${post.title}”`}>Read the post <span aria-hidden="true">↗</span></Link></article>; })}</div> : <p className="pf-status">No posts yet.</p>}</>;
}
function BlogPostPage() {
  const { slug } = useParams();
  const { data = [], isPending, isError, refetch } = useBlogPosts();
  const post = data.find(p => p.slug.current === slug);
  if (isPending) return <p className="pf-status" role="status">Loading post…</p>;
  if (isError) return <div className="pf-status" role="alert"><p>The post couldn’t be loaded.</p><button className="pf-button" onClick={() => refetch()}>Retry</button></div>;
  if (!post) return <Unavailable />;
  return <div className="pf-reading"><Metadata title={post.title.trim()} description={preview(post, 160) || 'An essay by Dane Cole Anderson.'} image={post.mainImage?.asset?.url} article /><Link className="pf-text-link" to="/blog">← All posts</Link><p className="pf-eyebrow">Blog</p><h1>{post.title.trim()}</h1><p className="pf-byline">By Dane Cole Anderson{post.publishedAt && <> · <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time></>}</p>{post.excerpt && <p className="pf-interview-deck">{post.excerpt}</p>}{post.mainImage?.asset?.url && <figure className="pf-interview-image"><img src={post.mainImage.asset.url} alt={post.mainImage.alt || post.title} />{post.mainImage.caption && <figcaption>{post.mainImage.caption}</figcaption>}</figure>}<article className="pf-transcript prose max-w-none"><Body body={post.body} /></article><div className="pf-reading-end"><Link className="pf-text-link" to="/blog">← Return to the blog</Link></div></div>;
}
function Courses() {
  const [query, setQuery] = useState('');
  const matches = disciplines.map(d => ({ ...d, courses: d.courses.filter(c => `${d.name} ${c.title} ${c.instructor}`.toLowerCase().includes(query.trim().toLowerCase())) })).filter(d => d.courses.length);
  return <><Metadata title="Favorite Courses" description="Dane Cole Anderson’s collection of free lecture courses in literature, philosophy, history, religion, and other disciplines." /><Intro eyebrow="For the curious" title="My favorite free courses"><p>A collection of lectures and courses for learning at your own pace. Browse by subject, or search for a teacher or topic. Many entries include course sites and reading lists.</p></Intro><div className="pf-collection-bar"><span>Lectures, courses & reading lists</span><label className="pf-search"><span className="sr-only">Search courses</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search courses or instructors" /></label></div><div className="pf-course-list">{matches.map(d => <details key={`${d.id}-${Boolean(query)}`} open={query ? true : undefined}><summary><h2>{d.name}</h2><span>{d.courses.length} {d.courses.length === 1 ? 'course' : 'courses'} <span aria-hidden="true">+</span></span></summary><div>{d.courses.map(c => <article className="pf-course" key={c.id}><h3><a href={c.link} target="_blank" rel="noopener noreferrer">{c.title} <span aria-hidden="true">↗</span></a></h3><p className="pf-course-instructor">{c.instructor}</p>{c.description && <p>{c.description}</p>}{c.alternateLinks?.length ? <div className="pf-course-links">{c.alternateLinks.map((l, i) => <a key={`${l.url}-${i}`} href={l.url} target="_blank" rel="noopener noreferrer">{l.platform} ↗</a>)}</div> : null}</article>)}</div></details>)}</div>{!matches.length && <p className="pf-status">No courses match that search.</p>}</>;
}
function Contact() {
  return <><Metadata title="Contact" description="Get in touch with Dane Cole Anderson about research, teaching, AI evaluation, or his interviews." /><Intro eyebrow="Get in touch" title="Contact"><p>For questions about my research, teaching, AI work, or interviews, you can reach me by email or connect with me on LinkedIn.</p></Intro><div className="pf-contact"><a href={`mailto:${email}`}>{email} <span aria-hidden="true">↗</span></a><a className="pf-contact-link" href={linkedin} target="_blank" rel="noopener noreferrer"><Linkedin size={20} aria-hidden="true" />Connect on LinkedIn <span aria-hidden="true">↗</span></a><p>Based in the Washington, D.C. area.</p></div></>;
}
function Unavailable() {
  return <><Metadata title="Page unavailable" description="This page is no longer available. Explore Dane Cole Anderson’s research, interviews, and favorite courses." noindex /><Intro eyebrow="Page unavailable" title="This page is no longer here."><p>Some older posts and reviews have been retired. You can still read the blog and explore the complete interview series.</p></Intro><div className="pf-actions"><Link className="pf-button" to="/blog">Read the blog <span aria-hidden="true">→</span></Link><Link className="pf-text-link" to="/interviews">Browse the interviews <span aria-hidden="true">→</span></Link></div></>;
}
function LegacySearch() {
  const { search } = useLocation();
  return <Navigate to={`/interviews${search}`} replace />;
}
export default function Portfolio() {
  return <div className="portfolio"><a className="pf-skip" href="#main-content">Skip to content</a><Header /><main id="main-content" className="pf-main"><Routes><Route index element={<Home />} /><Route path="about" element={<About />} /><Route path="research" element={<Research />} /><Route path="blog" element={<Blog />} /><Route path="blog/:slug" element={<BlogPostPage />} /><Route path="articles/blog" element={<Navigate to="/blog" replace />} /><Route path="interviews" element={<InterviewSeries />} /><Route path="articles/interviews" element={<Navigate to="/interviews" replace />} /><Route path="article/:slug" element={<InterviewPage />} /><Route path="courses" element={<Courses />} /><Route path="resources" element={<Navigate to="/courses" replace />} /><Route path="contact" element={<Contact />} /><Route path="search" element={<LegacySearch />} /><Route path="*" element={<Unavailable />} /></Routes></main><Footer /></div>;
}
