# RS Design System

Design tokens, framework-agnostic CSS components, documentation, and a Figma
library — all derived from one set of tokens.

**Brand:** primary Black `#000000`; secondary Purple — Foreground `#5F40A1`,
Background `#F4F0FB`.

## Contents

| Deliverable | Location |
| --- | --- |
| Authoritative spec | [`Design.md`](./Design.md) |
| Design tokens (W3C DTCG) | [`tokens/`](./tokens) → `dist/tokens.{css,scss,js}` |
| Tailwind preset | `tailwind.preset.js` |
| CSS components | [`src/css/`](./src/css) → `dist/design-system.css` |
| Interactive docs (VitePress) | [`docs/`](./docs) |
| AI guidelines | [`.github/copilot-instructions.md`](./.github/copilot-instructions.md), [`CLAUDE.md`](./CLAUDE.md), [`.claude/skills/design-system/SKILL.md`](./.claude/skills/design-system/SKILL.md) |
| Figma library | [RS Design System](https://www.figma.com/design/pGzbgIgTk5NXteRflrGCSB) |

## Develop

```bash
npm install
npm run build        # tokens -> dist/ + tailwind.preset.js, then bundle CSS
npm run docs:dev     # run the docs site locally
npm run docs:build   # build the static docs site
```

> `tokens/` is the single source of truth. Never edit `dist/` or `tailwind.preset.js`
> by hand — edit `tokens/` and run `npm run build`.

## Use

```html
<link rel="stylesheet" href="@tripletree/rs-design-system/design-system.css" />
<button class="btn btn--solid">Save changes</button>
<button class="btn btn--outline">Cancel</button>
```

Tailwind:

```js
import rsPreset from '@tripletree/rs-design-system/tailwind';
export default { presets: [rsPreset], content: ['./src/**/*.{html,js,ts,jsx,tsx}'] };
```

See [`Design.md`](./Design.md) for the full specification.
