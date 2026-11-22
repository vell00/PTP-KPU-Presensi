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
          50: '#FEE2E2',   // sekarang menjadi red-50
          100: '#FECACA',
          500: '#D52832',  // Merah KPU
          600: '#B91C1C',
          700: '#991B1B',
        },
        navy: {
          800: '#16366C',
          900: '#07142F',  // Navy KPU
        },
        kpuRed: {
          DEFAULT: '#D52832',
          hover: '#B91C1C',
          light: '#FEE2E2',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
