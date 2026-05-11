const { docType } = require('./theme/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './hooks/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // --- M3 semantic tokens (light/dark via CSS vars) ---
        background:             'var(--color-background)',
        'on-background':        'var(--color-on-background)',

        surface:                'var(--color-surface)',
        'on-surface':           'var(--color-on-surface)',
        'surface-container':    'var(--color-surface-container)',
        'surface-container-high': 'var(--color-surface-container-high)',

        primary:                'var(--color-primary)',
        'on-primary':           'var(--color-on-primary)',
        'primary-container':    'var(--color-primary-container)',
        'on-primary-container': 'var(--color-on-primary-container)',

        secondary:              'var(--color-secondary)',
        'on-secondary':         'var(--color-on-secondary)',
        'secondary-container':  'var(--color-secondary-container)',
        'on-secondary-container': 'var(--color-on-secondary-container)',

        tertiary:               'var(--color-tertiary)',
        'on-tertiary':          'var(--color-on-tertiary)',
        'tertiary-container':   'var(--color-tertiary-container)',
        'on-tertiary-container': 'var(--color-on-tertiary-container)',

        outline:                'var(--color-outline)',
        'outline-variant':      'var(--color-outline-variant)',

        error:                  'var(--color-error)',
        'on-error':             'var(--color-on-error)',

        // --- Document type badges (static) ---
        'doc-ac-bg':      docType.ac.bg,
        'doc-ac-text':    docType.ac.text,
        'doc-ic-bg':      docType.ic.bg,
        'doc-ic-text':    docType.ic.text,
        'doc-race-bg':    docType.race.bg,
        'doc-race-text':  docType.race.text,
        'doc-result-bg':  docType.result.bg,
        'doc-result-text': docType.result.text,
        'doc-jury-bg':    docType.jury.bg,
        'doc-jury-text':  docType.jury.text,
        'doc-safety-bg':  docType.safety.bg,
        'doc-safety-text': docType.safety.text,
      },
      borderRadius: {
        btn:    '8px',
        card:   '12px',
        badge:  '9999px',
      },
    },
  },
  plugins: [],
};
