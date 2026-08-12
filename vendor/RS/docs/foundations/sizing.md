# Sizing

Fixed **square** dimensions for the two elements whose box size isn't driven by
the spacing scale: **icons** and **avatars**. Everything else (control heights,
padding, gaps) comes from [Spacing](/foundations/spacing) — these tokens exist
because icon and avatar boxes need their own named steps, and the larger avatar
sizes go beyond where the 48px spacing scale stops.

Always consume the token (CSS variable, the Tailwind preset, or `tokens.js`) —
never hard-code the pixel value.

## Icon

The glyph box for UI icons. Sizes track the control they sit in; above 32px an
"icon" is really an illustration and isn't part of this scale.

<div class="ds-size-row">
  <div class="ds-size"><div class="ds-size__box" style="width:var(--size-icon-sm);height:var(--size-icon-sm)"></div><span>icon-sm · 16</span></div>
  <div class="ds-size"><div class="ds-size__box" style="width:var(--size-icon-md);height:var(--size-icon-md)"></div><span>icon-md · 20</span></div>
  <div class="ds-size"><div class="ds-size__box" style="width:var(--size-icon-lg);height:var(--size-icon-lg)"></div><span>icon-lg · 24</span></div>
  <div class="ds-size"><div class="ds-size__box" style="width:var(--size-icon-xl);height:var(--size-icon-xl)"></div><span>icon-xl · 32</span></div>
</div>

| Token | Value | px | Typical use |
| --- | --- | --- | --- |
| `size.icon.sm` | 1rem | 16 | inline with text, dense toolbars |
| `size.icon.md` | 1.25rem | 20 | default UI icon (buttons, inputs, list rows) |
| `size.icon.lg` | 1.5rem | 24 | section headers, primary actions |
| `size.icon.xl` | 2rem | 32 | feature tiles, empty states |

## Avatar

The user/entity image box — always square, usually clipped to a circle with
`radius.full`. Larger than icons and it keeps going past the spacing scale for
profile-level portraits.

<div class="ds-size-row">
  <div class="ds-size"><div class="ds-size__box ds-size__box--round" style="width:var(--size-avatar-sm);height:var(--size-avatar-sm)"></div><span>avatar-sm · 24</span></div>
  <div class="ds-size"><div class="ds-size__box ds-size__box--round" style="width:var(--size-avatar-md);height:var(--size-avatar-md)"></div><span>avatar-md · 32</span></div>
  <div class="ds-size"><div class="ds-size__box ds-size__box--round" style="width:var(--size-avatar-lg);height:var(--size-avatar-lg)"></div><span>avatar-lg · 40</span></div>
  <div class="ds-size"><div class="ds-size__box ds-size__box--round" style="width:var(--size-avatar-xl);height:var(--size-avatar-xl)"></div><span>avatar-xl · 48</span></div>
  <div class="ds-size"><div class="ds-size__box ds-size__box--round" style="width:var(--size-avatar-2xl);height:var(--size-avatar-2xl)"></div><span>avatar-2xl · 64</span></div>
</div>

| Token | Value | px | Typical use |
| --- | --- | --- | --- |
| `size.avatar.sm` | 1.5rem | 24 | inline mentions, dense lists |
| `size.avatar.md` | 2rem | 32 | default list / comment avatar |
| `size.avatar.lg` | 2.5rem | 40 | cards, account nav |
| `size.avatar.xl` | 3rem | 48 | list / card headers |
| `size.avatar.2xl` | 4rem | 64 | profile headers |

## Usage

```css
.icon-button svg {
  width: var(--size-icon-md);
  height: var(--size-icon-md);
}

.avatar {
  width: var(--size-avatar-lg);
  height: var(--size-avatar-lg);
  border-radius: var(--radius-full);
}
```

Same square value on both axes, so the box stays a circle after
`border-radius: var(--radius-full)`.

```html
<!-- Tailwind preset — same scale on width, height and the size utility -->
<span class="size-icon-md"><!-- icon --></span>
<img class="size-avatar-lg rounded-full" src="…" alt="" />
<!-- or per-axis: w-icon-md h-icon-md -->
```

The preset maps the scale onto `width`, `height`, and Tailwind's `size-*`
utility, keyed `icon-*` / `avatar-*` (e.g. `size-avatar-2xl`).
