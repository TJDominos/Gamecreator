import { defineConfig } from 'vitepress';

// Base path is environment-driven so the same build serves both hosts:
//   - Root-domain hosts (Vercel, `npm run docs:dev`): default '/'.
//   - GitHub Pages project site (https://<org>.github.io/rs/): set DOCS_BASE=/rs/.
// The GitHub Pages workflow sets DOCS_BASE; Vercel leaves it unset.
const base = process.env.DOCS_BASE || '/';

export default defineConfig({
  title: 'RS Design System',
  description: 'Design tokens, framework-agnostic CSS components, and guidelines.',
  base,
  lang: 'en-US',
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: 'Overview', link: '/' },
      { text: 'Foundations', link: '/foundations/colors' },
      { text: 'Components', link: '/components/button' },
    ],
    sidebar: [
      {
        text: 'Foundations',
        items: [
          { text: 'Colors', link: '/foundations/colors' },
          { text: 'Typography', link: '/foundations/typography' },
          { text: 'Spacing & Radius', link: '/foundations/spacing' },
          { text: 'Sizing', link: '/foundations/sizing' },
        ],
      },
      {
        text: 'Components',
        items: [
          { text: 'Button', link: '/components/button' },
          { text: 'Input', link: '/components/input' },
          { text: 'Select', link: '/components/select' },
          { text: 'Checkbox', link: '/components/checkbox' },
          { text: 'Switch', link: '/components/switch' },
          { text: 'Popup', link: '/components/popup' },
          { text: 'Loading', link: '/components/loading' },
          { text: 'Spinner', link: '/components/spinner' },
          { text: 'Refresh', link: '/components/refresh' },
          { text: 'Toast', link: '/components/toast' },
          { text: 'Tabs', link: '/components/tabs' },
        ],
      },
    ],
    outline: 'deep',
  },
});
