/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        enc: {
          DEFAULT: '#800020', // Bordeaux ENC
          light: '#a52a2a',
          dark: '#5a0016',
        },
        orange_bessieres: '#ff8c00', // Orange du site
      },
    },
  },
  plugins: [],
}
