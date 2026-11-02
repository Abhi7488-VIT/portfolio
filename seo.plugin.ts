/**
 * seo.plugin.ts: build-time SEO from content.ts, so the site URL and copy live in one place.
 *
 *  - Replaces %SITE_URL%, %SEO_TITLE%, %SEO_DESCRIPTION%, %OG_IMAGE%, %OG_IMAGE_ALT% in index.html.
 *  - Injects JSON-LD (schema.org Person) built from the résumé facts.
 *  - Emits sitemap.xml and robots.txt.
 *
 * Site URL priority: SITE_URL env var > Vercel's production domain > links.siteUrl in content.ts.
 */
import type { Plugin } from 'vite'
import { links, person, seo } from './src/content/content'

function siteUrl() {
  const fromEnv = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
  return (fromEnv || links.siteUrl).replace(/\/$/, '')
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

export function seoPlugin(): Plugin {
  return {
    name: 'ak-seo',
    transformIndexHtml(html) {
      const url = siteUrl()
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: person.name,
        url: `${url}/`,
        image: `${url}${seo.ogImage}`,
        jobTitle: person.role,
        email: `mailto:${links.email}`,
        address: { '@type': 'PostalAddress', addressLocality: 'Vellore', addressRegion: 'Tamil Nadu', addressCountry: 'IN' },
        alumniOf: { '@type': 'CollegeOrUniversity', name: 'Vellore Institute of Technology' },
        sameAs: [links.linkedin, links.github],
        knowsAbout: ['Multi-agent AI', 'LangGraph', 'RAG', 'Data analytics', 'SQL', 'Machine learning', 'Quantitative research'],
      }
      return html
        .replaceAll('%SITE_URL%', url)
        .replaceAll('%SEO_TITLE%', esc(seo.title))
        .replaceAll('%SEO_DESCRIPTION%', esc(seo.description))
        .replaceAll('%OG_IMAGE%', `${url}${seo.ogImage}`)
        .replaceAll('%OG_IMAGE_ALT%', esc(seo.ogImageAlt))
        .replaceAll('%THEME_COLOR%', seo.themeColor)
        .replace('</head>', `    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n  </head>`)
    },
    generateBundle() {
      const url = siteUrl()
      const today = new Date().toISOString().slice(0, 10)
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${url}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`,
      })
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n\nSitemap: ${url}/sitemap.xml\n` })
    },
  }
}
