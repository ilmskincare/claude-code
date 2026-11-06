/**
 * Tailwind 4 relies on CSS cascade layers, which Safari only gained in 15.4. Flattening the
 * layers after Tailwind runs lets older Safari (and any other older browser) read the stylesheet
 * instead of dropping every layered rule and showing an unstyled page. Tailwind 4.1+ already
 * ships its own fallbacks for @property, oklab colours and color-mix().
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    "@csstools/postcss-cascade-layers": {},
  },
};

export default config;
