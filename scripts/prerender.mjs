/**
 * prerender.mjs: runs after `vite build`. Renders src/prerender.tsx with Vite's SSR loader and
 * writes the markup into dist/index.html's #root, so the hero is real HTML on first paint.
 * React (createRoot) replaces it on load with the identical live tree.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createServer } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const server = await createServer({ root, logLevel: 'error', server: { middlewareMode: true, hmr: false }, appType: 'custom' })
try {
  const { render } = await server.ssrLoadModule('/src/prerender.tsx')
  const html = render()
  const file = resolve(root, 'dist/index.html')
  const page = readFileSync(file, 'utf8')
  if (!page.includes('<div id="root"></div>')) throw new Error('dist/index.html has no empty #root to fill')
  let out = page.replace('<div id="root"></div>', `<div id="root">${html}</div>`)

  // The first screen is real HTML now, so no script is needed to paint it. Start the app one frame
  // after first paint instead of competing with the CSS and the display font for bandwidth:
  // drop the modulepreload hints and load the entry from a tiny inline starter.
  const entry = out.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/)
  if (!entry) throw new Error('entry <script type="module"> not found in dist/index.html')
  out = out
    .replace(/\s*<link rel="modulepreload"[^>]*>/g, '')
    .replace(
      entry[0],
      // Wait for the browser's first-contentful-paint entry (a rAF can fire before any text paints),
      // with a timeout so the app always starts.
      `<script>(function(){var d=0;function go(){if(d)return;d=1;var s=document.createElement('script');s.type='module';s.src='${entry[1]}';document.head.appendChild(s)}try{new PerformanceObserver(function(l){if(l.getEntriesByName('first-contentful-paint').length)setTimeout(go,0)}).observe({type:'paint',buffered:true})}catch(e){}setTimeout(go,1200)})()</script>`,
    )
  writeFileSync(file, out)
  console.log(`prerender: hero shell written (${(html.length / 1024).toFixed(1)} KB of HTML), app starts after first paint`)
} finally {
  await server.close()
}
