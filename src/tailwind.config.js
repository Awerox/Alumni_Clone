import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        enc: '#800020',
        orange_bessieres: '#f59e0b',
      },
    },
  },
  plugins: [],
}

export default config