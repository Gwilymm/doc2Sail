// theme/colors.js

const palette = {
  primary: {
    a0: '#0b4f6c',
    a10: '#2a5f7a',
    a20: '#437088',
    a30: '#5a8197',
    a40: '#7092a5',
    a50: '#87a4b4',
    a60: '#9fb5c3',
    a70: '#b6c7d1',
    a80: '#cedae1',
    a90: '#e6ecf0',
  },

  surface: {
    app: '#050a14',
    a0: '#121212',
    a10: '#252525',
    a20: '#393939',
    a30: '#4f4f4f',
    a40: '#666666',
    a50: '#7d7d7d',
    a60: '#969696',
    a70: '#afafaf',
  },

  tonal: {
    a0: '#151d22',
    a10: '#283035',
    a20: '#3c4448',
    a30: '#52585d',
    a40: '#686e72',
    a50: '#808588',
    a60: '#989c9f',
    a70: '#b1b4b6',
  },

  success: {
    a0: '#22946e',
    a10: '#5ba989',
    a20: '#86bfa6',
  },

  warning: {
    a0: '#a87a2a',
    a10: '#ba945a',
    a20: '#cbae84',
  },

  danger: {
    a0: '#9c2121',
    a10: '#b4544c',
    a20: '#ca7f77',
  },

  info: {
    a0: '#21498a',
    a10: '#4b6ca2',
    a20: '#7590ba',
  },
};

const themeVars = {
  light: {
    '--color-background': palette.primary.a90,
    '--color-on-background': palette.surface.a0,

    '--color-surface': '#ffffff',
    '--color-on-surface': palette.surface.a0,

    '--color-surface-container': '#f7fafb',
    '--color-surface-container-high': palette.primary.a80,

    '--color-primary': palette.primary.a0,
    '--color-on-primary': '#ffffff',

    '--color-primary-container': palette.primary.a80,
    '--color-on-primary-container': palette.surface.a0,

    '--color-secondary': palette.primary.a20,
    '--color-on-secondary': '#ffffff',

    '--color-secondary-container': palette.primary.a80,
    '--color-on-secondary-container': palette.surface.a0,

    '--color-tertiary': palette.warning.a0,
    '--color-on-tertiary': '#ffffff',

    '--color-tertiary-container': palette.warning.a20,
    '--color-on-tertiary-container': '#241800',

    '--color-outline': palette.primary.a70,
    '--color-outline-variant': palette.primary.a80,

    '--color-error': palette.danger.a0,
    '--color-on-error': '#ffffff',
  },

  dark: {
    '--color-background': palette.surface.app,
    '--color-on-background': palette.primary.a90,

    '--color-surface': palette.surface.a0,
    '--color-on-surface': palette.primary.a90,

    '--color-surface-container': palette.tonal.a0,
    '--color-surface-container-high': palette.tonal.a10,

    '--color-primary': palette.primary.a70,
    '--color-on-primary': palette.surface.app,

    '--color-primary-container': palette.primary.a0,
    '--color-on-primary-container': palette.primary.a90,

    '--color-secondary': palette.primary.a50,
    '--color-on-secondary': palette.surface.app,

    '--color-secondary-container': palette.primary.a10,
    '--color-on-secondary-container': palette.primary.a90,

    '--color-tertiary': palette.warning.a20,
    '--color-on-tertiary': '#241800',

    '--color-tertiary-container': palette.warning.a0,
    '--color-on-tertiary-container': '#fff2d2',

    '--color-outline': palette.tonal.a20,
    '--color-outline-variant': palette.tonal.a10,

    '--color-error': palette.danger.a20,
    '--color-on-error': '#3a0505',
  },
};

const docType = {
  ac: {
    bg: palette.primary.a80,
    text: palette.primary.a0,
  },

  ic: {
    bg: palette.info.a20,
    text: '#0f2347',
  },

  race: {
    bg: palette.success.a20,
    text: '#063325',
  },

  result: {
    bg: '#dcebc9',
    text: '#2f3f1f',
  },

  jury: {
    bg: palette.warning.a20,
    text: '#3a2700',
  },

  safety: {
    bg: palette.danger.a20,
    text: '#4a0808',
  },
};

module.exports = {
  palette,
  themeVars,
  docType,
};