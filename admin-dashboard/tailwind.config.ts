import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#F0F9F5',
          100: '#E0F3EC',
          500: '#2D8B6B',
          600: '#247056',
          700: '#1B5642',
        },
        navy: {
          800: '#1B254B',
          900: '#111827',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
