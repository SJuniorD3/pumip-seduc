import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sei: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#2563eb', // Azul SEI institucional
          600: '#1d4ed8',
          700: '#1e40af',
        },
        startgov: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981', // Verde StartGov
          600: '#059669',
          700: '#047857',
        },
        pncp: {
          50: '#fffbeb',
          500: '#f59e0b', // Âmbar PNCP
          600: '#d97706',
        },
        maranhao: {
          red: '#c9141d',
          blue: '#002b7f',
          dark: '#0f172a',
        }
      },
    },
  },
  plugins: [],
};
export default config;
