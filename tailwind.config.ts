import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Crimson Text', 'serif'],
      },
      backgroundImage: {
        'cool-gradient': 'linear-gradient(to bottom right, #f0f9ff, #e0f2fe, #dbeafe)',
        'dark-cool-gradient': 'linear-gradient(to bottom right, #0f172a, #1e293b, #1e3a8a)',
      },
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],

}

export default config