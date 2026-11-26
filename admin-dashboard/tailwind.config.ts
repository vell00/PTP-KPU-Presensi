import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        canvas: '#F6F7F9',
        navy: {
          700: '#1C3E7A',
          800: '#10244D',
          900: '#07142F',
          950: '#040C1D',
        },
        kpuRed: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          DEFAULT: '#D52832',
          hover: '#B91C1C',
          dark: '#991B1B',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
