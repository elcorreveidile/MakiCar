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
        noche:    '#0A0E1A',
        'noche-2': '#0D1117',
        carta:    '#141A28',
        ambar:    '#FFB627',
        ruta:     '#2BB6A4',
        violeta:  '#9b8cff',
        blanco:   '#F4F1EA',
        gris:     '#8A93A6',
        linea:    '#232C3F',
      },
      fontFamily: {
        fraunces: ['var(--font-fraunces)', 'serif'],
        sora:     ['var(--font-sora)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
