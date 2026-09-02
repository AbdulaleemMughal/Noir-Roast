import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        void: '#050302',
        espresso: '#120804',
        roast: '#2A150B',
        ember: '#7A3410',
        amber: '#C8752B',
        gold: '#E2A857',
        crema: '#E8D9C2',
        cream: '#F5EDE0',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.055em',
      },
    },
  },
  plugins: [],
};

export default config;
