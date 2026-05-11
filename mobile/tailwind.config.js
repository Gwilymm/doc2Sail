/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './hooks/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Palette DaisyUI-inspired, alignée sur le web doc2sail
        primary: '#0284c7',
        'primary-focus': '#0369a1',
        'primary-content': '#ffffff',
        secondary: '#7c3aed',
        'secondary-content': '#ffffff',
        accent: '#0ea5e9',
        neutral: '#1f2937',
        'base-100': '#ffffff',
        'base-200': '#f3f4f6',
        'base-300': '#e5e7eb',
        'base-content': '#1f2937',
        info: '#0ea5e9',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      borderRadius: {
        btn: '8px',
        card: '12px',
        badge: '9999px',
      },
    },
  },
  plugins: [],
};
