import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        billiard: {
          dark: '#071510',
          darker: '#040b08',
          card: '#0d221a',
          cardHover: '#132f25',
          border: '#1b4332',
          borderLight: '#2d6a4f',
          felt: '#0f3d2e',
          green: '#10b981',
          gold: '#f59e0b',
          goldLight: '#fbbf24',
          ivory: '#f8fafc',
          muted: '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
