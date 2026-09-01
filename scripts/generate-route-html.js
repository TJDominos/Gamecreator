import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { routeTitleMap } from '../src/config/routeTitles.js';

const SITE_URL = 'https://randseed.org';
const STORAGE_URL = 'https://storage.randseed.org';
export const HOME_THUMBNAIL_URL = `${STORAGE_URL}/Thumbnail/HomeThumbnail.jpg`;
const MANAGED_BLOCK_START = '<!-- route-meta:start -->';
const MANAGED_BLOCK_END = '<!-- route-meta:end -->';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rankMetadata = {
  title: routeTitleMap['/rank'],
  description: 'Check out the top players and leaderboard standings on Randseed.',
  image: HOME_THUMBNAIL_URL,
};

export const routeMetadata = {
  // Legacy main site routes
  '/money': {
    title: routeTitleMap['/money'],
    description: 'Manage your bonus, WLT, deposits, and withdrawals on Randseed.',
    image: HOME_THUMBNAIL_URL,
  },
  '/rank': rankMetadata,
  '/global-rank': rankMetadata,
  '/payout': {
    title: routeTitleMap['/payout'],
    description: 'View prize pools and payouts across Randseed games.',
    image: HOME_THUMBNAIL_URL,
  },
  '/play/instant-win': {
    title: routeTitleMap['/play/instant-win'],
    description: 'Play Lucky Nickel on Randseed for instant decentralized wins and crypto prizes.',
    image: HOME_THUMBNAIL_URL,
  },
  '/play/quick-quid': {
    title: routeTitleMap['/play/quick-quid'],
    description: 'Play Quick Quid on Randseed for fast decentralized draws and crypto prizes.',
    image: HOME_THUMBNAIL_URL,
  },
  
  // Current project (Dev Portal) routes
  '/': {
    title: routeTitleMap['/'],
    description: 'Build Next-Gen AI Games. Launch faster, connect with players, and let real-time feedback shape your next hit.',
    image: HOME_THUMBNAIL_URL,
  },
  '/guides': {
    title: routeTitleMap['/guides'],
    description: 'Randseed Creator Guide. Learn how to integrate AI and manage your decentralized games.',
    image: HOME_THUMBNAIL_URL,
  },
  '/bounties': {
    title: routeTitleMap['/bounties'],
    description: 'Complete bounties, test features, and earn rewards on the Randseed Developer Portal.',
    image: HOME_THUMBNAIL_URL,
  }
};

const managedHeadTagPatterns = [
  /<!-- route-meta:start -->[\s\S]*?<!-- route-meta:end -->\s*/gi,
  /<title\b[^>]*>[\s\S]*?<\/title>\s*/gi,
  /<meta\b(?=[^>]*\bname=["']description["'])[^>]*>\s*/gi,
  /<meta\b(?=[^>]*\bproperty=["']og:title["'])[^>]*>\s*/gi,
  /<meta\b(?=[^>]*\bproperty=["']og:description["'])[^>]*>\s*/gi,
  /<meta\b(?=[^>]*\bproperty=["']og:image["'])[^>]*>\s*/gi,
  /<meta\b(?=[^>]*\bproperty=["']og:type["'])[^>]*>\s*/gi,
  /<meta\b(?=[^>]*\bproperty=["']og:url["'])[^>]*>\s*/gi,
  /<meta\b(?=[^>]*\bname=["']twitter:card["'])[^>]*>\s*/gi,
  /<meta\b(?=[^>]*\bname=["']twitter:title["'])[^>]*>\s*/gi,
  /<meta\b(?=[^>]*\bname=["']twitter:description["'])[^>]*>\s*/gi,
  /<meta\b(?=[^>]*\bname=["']twitter:image["'])[^>]*>\s*/gi,
  /<link\b(?=[^>]*\brel=["']icon["'])[^>]*>\s*/gi,
  /<link\b(?=[^>]*\brel=["']apple-touch-icon["'])[^>]*>\s*/gi,
];

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return character;
    }
  });
}

function getRouteUrl(route) {
  const isPortalRoute = ['/', '/guides', '/bounties'].includes(route);
  const baseUrl = isPortalRoute ? 'https://creator.randseed.org' : SITE_URL;
  return new URL(route, `${baseUrl}/`).toString();
}

export function stripManagedHeadTags(headHtml) {
  let cleaned = headHtml;

  for (const pattern of managedHeadTagPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  return cleaned.replace(/\n{3,}/g, '\n\n').trimEnd();
}

export function buildManagedHeadBlock(route, metadata) {
  const title = escapeHtml(metadata.title);
  const description = escapeHtml(metadata.description);
  const image = escapeHtml(metadata.image);
  const url = escapeHtml(getRouteUrl(route));

  return [
    `  ${MANAGED_BLOCK_START}`,
    `  <title>${title}</title>`,
    `  <meta name="description" content="${description}" />`,
    '  <link rel="icon" type="image/x-icon" href="/favicon.ico" />',
    '  <link rel="apple-touch-icon" href="/logo.png" />',
    `  <meta property="og:title" content="${title}" />`,
    `  <meta property="og:description" content="${description}" />`,
    `  <meta property="og:image" content="${image}" />`,
    '  <meta property="og:type" content="website" />',
    `  <meta property="og:url" content="${url}" />`,
    '  <meta name="twitter:card" content="summary_large_image" />',
    `  <meta name="twitter:title" content="${title}" />`,
    `  <meta name="twitter:description" content="${description}" />`,
    `  <meta name="twitter:image" content="${image}" />`,
    `  ${MANAGED_BLOCK_END}`,
  ].join('\n');
}

export function renderRouteHtml(templateHtml, route, metadata) {
  const managedBlock = buildManagedHeadBlock(route, metadata);

  return templateHtml.replace(/<head\b[^>]*>([\s\S]*?)<\/head>/i, (fullMatch, headContent) => {
    const strippedHead = stripManagedHeadTags(headContent);

    if (/<base\b[^>]*>/i.test(strippedHead)) {
      const updatedHead = strippedHead.replace(/(\s*<base\b[^>]*>\s*)/i, `\n${managedBlock}\n$1`);
      return `<head>${updatedHead}</head>`;
    }

    return `<head>${strippedHead}\n${managedBlock}\n</head>`;
  });
}

export function writeRouteHtmlFiles(distPath, templateHtml, routes = routeMetadata) {
  for (const [route, metadata] of Object.entries(routes)) {
    const outputPath =
      route === '/' ? path.join(distPath, 'index.html') : path.join(distPath, route.slice(1), 'index.html');

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, renderRouteHtml(templateHtml, route, metadata), 'utf8');
  }
}

export function main() {
  const distPath = path.resolve(__dirname, '..', 'dist');
  const indexPath = path.join(distPath, 'index.html');

  if (!fs.existsSync(indexPath)) {
    console.error('dist/index.html not found. Run vite build before generating route HTML files.');
    process.exit(1);
  }

  const templateHtml = fs.readFileSync(indexPath, 'utf8');
  writeRouteHtmlFiles(distPath, templateHtml);
  console.log(`Generated route HTML files for ${Object.keys(routeMetadata).length} routes.`);
}

const isMain = import.meta.url === new URL(path.resolve(process.argv[1]), 'file:').href;
if (isMain) {
  main();
}
