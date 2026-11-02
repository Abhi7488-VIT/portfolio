"""
fonts.py: rebuild the three self-hosted font files from fonts-src/ (needs: pip install fonttools brotli).

  public/fonts/archivo-var.woff2    Archivo variable, subset to the site's characters, axes trimmed
                                    to the ranges the CSS uses (wght 240-800, wdth 82-125)
  public/fonts/archivo-hero.woff2   the same, but only the glyphs on the pre-rendered first screen
                                    (preloaded: it carries the name and the LCP)
  public/fonts/martian-mono.woff2   Martian Mono pinned to its one used instance (400, normal width)

Run after `npm run build` (the hero glyph set is read from dist/index.html), then build again:
    python scripts/fonts.py && npm run build
Print the hero unicode-range for tokens.css with:  python scripts/fonts.py --range
"""
import html
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'fonts-src'
OUT = ROOT / 'public' / 'fonts'
SITE = 'U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201E,U+2026,U+2190-2193,U+2212,U+2248,U+2318,U+20B9'


def hero_chars() -> str:
    page = (ROOT / 'dist' / 'index.html').read_text(encoding='utf-8')
    root = page[page.index('<div id="root">'):]
    # Archivo text only: drop the mono readouts (boot log, status figure, switches, kbd).
    for pattern in (r'<pre.*?</pre>', r'<figure class="hero__status.*?</figure>', r'<button[^>]*role="switch".*?</button>', r'<kbd>.*?</kbd>', r'<script.*?</script>'):
        root = re.sub(pattern, '', root, flags=re.S)
    text = html.unescape(re.sub(r'<[^>]+>', ' ', root))
    return ''.join(sorted(set(text) - {'\n', '\t', '\r'}))


def run(*args: str) -> None:
    subprocess.run([sys.executable, '-m', *args], check=True)


def main() -> None:
    chars = hero_chars()
    if '--range' in sys.argv:
        print(','.join('U+%X' % ord(c) for c in chars))
        return
    with tempfile.TemporaryDirectory() as tmp:
        t = Path(tmp)
        run('fontTools.varLib.instancer', str(SRC / 'archivo-source.woff2'), 'wght=240:800', 'wdth=82:125', '-o', str(t / 'archivo.ttf'))
        run('fontTools.varLib.instancer', str(SRC / 'martian-mono-source.woff2'), 'wght=400', 'wdth=100', '-o', str(t / 'martian.ttf'))
        run('fontTools.subset', str(t / 'archivo.ttf'), f'--unicodes={SITE}', "--layout-features=*", '--flavor=woff2', f'--output-file={OUT / "archivo-var.woff2"}')
        run('fontTools.subset', str(t / 'martian.ttf'), f'--unicodes={SITE}', "--layout-features=*", '--flavor=woff2', f'--output-file={OUT / "martian-mono.woff2"}')
        (t / 'hero.txt').write_text(chars, encoding='utf-8')
        run('fontTools.subset', str(t / 'archivo.ttf'), f'--text-file={t / "hero.txt"}', '--layout-features=kern', '--flavor=woff2', f'--output-file={OUT / "archivo-hero.woff2"}')
    print('fonts rebuilt; if the hero copy changed, update the unicode-range in src/styles/tokens.css:')
    print(','.join('U+%X' % ord(c) for c in chars))


if __name__ == '__main__':
    main()
