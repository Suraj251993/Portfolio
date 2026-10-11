// Structured data (schema.org JSON-LD). URLs are only included when a site URL
// is configured, because schema.org expects absolute URLs.

const withUrl = (ctx, obj, target) => {
  const url = ctx.absolute(target);
  return url ? { ...obj, url } : obj;
};

export function personLd(ctx) {
  const { site, data } = ctx;
  const edu = data.profile.education;
  return withUrl(ctx, {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': ctx.siteUrl ? `${ctx.siteUrl}/#person` : undefined,
    name: site.name,
    jobTitle: site.jobTitle,
    address: { '@type': 'PostalAddress', addressLocality: 'Kuala Lumpur', addressCountry: 'MY' },
    email: `mailto:${site.email}`,
    sameAs: [site.linkedin, site.researchgate].filter(Boolean),
    alumniOf: edu.map((e) => ({ '@type': 'CollegeOrUniversity', name: e.school.replace(/, Malaysia$/, '') })),
    knowsAbout: ['Product management', 'B2B SaaS', 'AI application development', 'Enterprise applications', 'CRM and ERP integration', 'Workflow automation', 'Advertising technology', 'Marketing technology', 'Digital out-of-home advertising', 'Programmatic advertising', 'Advertising measurement', 'Agentic AI'],
    image: ctx.siteUrl ? ctx.absolute('images/suraj-prakash-portrait.jpg') : undefined,
  }, '');
}

export function websiteLd(ctx) {
  return withUrl(ctx, {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: ctx.site.name,
    description: ctx.site.description,
    inLanguage: 'en',
  }, '');
}

export function breadcrumbLd(ctx, items) {
  if (!ctx.siteUrl) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, target], i) => ({ '@type': 'ListItem', position: i + 1, name, item: ctx.absolute(target) })),
  };
}

export function paperLd(ctx, a) {
  const obj = {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: a.title,
    alternativeHeadline: a.subtitle,
    description: a.summary,
    abstract: a.abstract || undefined,
    keywords: a.keywords?.length ? a.keywords.join(', ') : undefined,
    author: { '@type': 'Person', name: ctx.site.name, url: ctx.siteUrl ? `${ctx.siteUrl}/` : undefined },
    datePublished: a.date || undefined,
    sameAs: a.researchgate || undefined,
    inLanguage: 'en',
    isAccessibleForFree: true,
    numberOfPages: a.pages || undefined,
    wordCount: a.words || undefined,
  };
  if (ctx.siteUrl) {
    obj.url = ctx.absolute(`papers/${a.slug}`);
    if (a.pdf) obj.encoding = { '@type': 'MediaObject', encodingFormat: 'application/pdf', contentUrl: ctx.absolute(`papers/${a.slug}.pdf`) };
  }
  return obj;
}

export function magazineLd(ctx, ed) {
  const obj = {
    '@context': 'https://schema.org',
    '@type': 'PublicationIssue',
    issueNumber: ed.number,
    name: `${ctx.data.magazine.title}, edition ${ed.number}: ${ed.name}`,
    datePublished: ed.isoDate,
    pagination: `1-${ed.pages}`,
    description: ed.strap,
    author: { '@type': 'Person', name: ctx.site.name },
    isPartOf: { '@type': 'Periodical', name: ctx.data.magazine.title },
  };
  if (ctx.siteUrl) {
    obj.url = ctx.absolute('magazine');
    obj.image = ctx.absolute('images/media-intelligence-01-cover.jpg');
  }
  return obj;
}
