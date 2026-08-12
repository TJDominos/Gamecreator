/**
 * Bundles the generated token variables and every component stylesheet into a
 * single distributable file: dist/design-system.css.
 *
 * Run with: npm run css  (after npm run tokens)
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cssDir = join(root, 'src', 'css');

const tokens = readFileSync(join(root, 'dist', 'tokens.css'), 'utf8');

// All component stylesheets except the index entry point, in stable order.
const components = readdirSync(cssDir)
  .filter((f) => f.endsWith('.css') && f !== 'index.css')
  .sort()
  .map((f) => readFileSync(join(cssDir, f), 'utf8'));

const banner = '/* RS Design System — bundled stylesheet. Generated; do not edit. */\n';
const bundle = [banner, tokens, ...components].join('\n');

writeFileSync(join(root, 'dist', 'design-system.css'), bundle);
console.log('✓ CSS bundled → dist/design-system.css');
