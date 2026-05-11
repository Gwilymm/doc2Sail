const m3 = {
  light: {
    background: '#F6FAFB',
    onBackground: '#071D2B',

    surface: '#FFFFFF',
    onSurface: '#071D2B',

    surfaceContainer: '#EAF3F5',
    surfaceContainerHigh: '#E2ECEF',

    primary: '#0B4F6C',
    onPrimary: '#FFFFFF',
    primaryContainer: '#C7EAF3',
    onPrimaryContainer: '#001F2A',

    secondary: '#2A6F7E',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#CDECF1',
    onSecondaryContainer: '#062127',

    tertiary: '#F2B544',
    onTertiary: '#3E2E00',
    tertiaryContainer: '#FFE3A6',
    onTertiaryContainer: '#261A00',

    outline: '#B7C8CE',
    outlineVariant: '#D3E0E4',

    error: '#BA1A1A',
    onError: '#FFFFFF',
  },

  dark: {
    background: '#061B29',
    onBackground: '#EAF7FA',

    surface: '#082437',
    onSurface: '#EAF7FA',

    surfaceContainer: '#0D2A3F',
    surfaceContainerHigh: '#143449',

    primary: '#8BD3E8',
    onPrimary: '#003543',
    primaryContainer: '#0B4F6C',
    onPrimaryContainer: '#C7EAF3',

    secondary: '#9DD7E1',
    onSecondary: '#07363F',
    secondaryContainer: '#245B67',
    onSecondaryContainer: '#CDECF1',

    tertiary: '#FFD285',
    onTertiary: '#432C00',
    tertiaryContainer: '#6A4700',
    onTertiaryContainer: '#FFE3A6',

    outline: '#78919A',
    outlineVariant: '#31515D',

    error: '#FFB4AB',
    onError: '#690005',
  },
};

const docType = {
  ac:     { bg: '#C7EAF3', text: '#003543' },
  ic:     { bg: '#E0E7FF', text: '#253060' },
  race:   { bg: '#DDF7ED', text: '#0F5138' },
  result: { bg: '#E9F8D8', text: '#365314' },
  jury:   { bg: '#FFE3A6', text: '#5A3B00' },
  safety: { bg: '#FFDAD6', text: '#690005' },
};

module.exports = { m3, docType };
