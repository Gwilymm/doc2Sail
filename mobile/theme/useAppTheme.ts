import { useTheme } from '../context/ThemeContext';

const { palette, themeVars, docType } = require('./colors');

type ThemeMode = 'light' | 'dark';
type ThemeVars = Record<string, string>;

function read(vars: ThemeVars, name: string): string {
  return vars[name];
}

function withAlpha(hex: string, alpha: string): string {
  return `${hex}${alpha}`;
}

function buildColors(mode: ThemeMode) {
  const vars = themeVars[mode] as ThemeVars;
  const isDark = mode === 'dark';

  const primary = read(vars, '--color-primary');
  const onPrimary = read(vars, '--color-on-primary');
  const primaryContainer = read(vars, '--color-primary-container');
  const onPrimaryContainer = read(vars, '--color-on-primary-container');
  const surface = read(vars, '--color-surface');
  const surfaceContainer = read(vars, '--color-surface-container');
  const surfaceContainerHigh = read(vars, '--color-surface-container-high');
  const onSurface = read(vars, '--color-on-surface');
  const onSurfaceVariant = isDark ? palette.tonal.a70 : palette.surface.a30;
  const outline = read(vars, '--color-outline');
  const outlineVariant = read(vars, '--color-outline-variant');
  const error = read(vars, '--color-error');
  const onError = read(vars, '--color-on-error');

  return {
    mode,
    isDark,
    background: read(vars, '--color-background'),
    onBackground: read(vars, '--color-on-background'),
    surface,
    onSurface,
    surfaceContainer,
    surfaceContainerHigh,
    onSurfaceVariant,
    primary,
    onPrimary,
    primaryContainer,
    onPrimaryContainer,
    secondary: read(vars, '--color-secondary'),
    onSecondary: read(vars, '--color-on-secondary'),
    secondaryContainer: read(vars, '--color-secondary-container'),
    onSecondaryContainer: read(vars, '--color-on-secondary-container'),
    outline,
    outlineVariant,
    error,
    onError,
    inputBg: surfaceContainer,
    inputBorder: outlineVariant,
    inputBorderFocus: primary,
    searchBg: surfaceContainer,
    searchIcon: onSurfaceVariant,
    searchText: onSurface,
    chipBg: primaryContainer,
    chipText: onPrimaryContainer,
    filterActive: primaryContainer,
    filterActiveBorder: primary,
    filterActiveText: onPrimaryContainer,
    divider: outlineVariant,
    iconBg: surfaceContainerHigh,
    iconBorder: outlineVariant,
    accent: surfaceContainerHigh,
    chevron: outline,
    danger: error,
    onDanger: onError,
    scrim: 'rgba(0,0,0,0.5)',
    shadow: '#000000',
    mutedFill: isDark ? surfaceContainerHigh : outlineVariant,
    loadingTrack: surfaceContainerHigh,
    labelBg: isDark ? read(themeVars.light, '--color-surface') : read(themeVars.dark, '--color-surface'),
    labelText: isDark ? read(themeVars.light, '--color-on-surface') : read(themeVars.dark, '--color-on-surface'),
    pressed: isDark ? withAlpha(primary, '22') : withAlpha(primary, '14'),
  };
}

export type AppColors = ReturnType<typeof buildColors>;

export function getAppColors(mode: ThemeMode): AppColors {
  return buildColors(mode);
}

export function useAppTheme() {
  const { theme, isDark, setTheme, toggle } = useTheme();
  return {
    theme,
    isDark,
    setTheme,
    toggle,
    colors: getAppColors(theme),
  };
}

export function getDocCategoryColor(category: string, isDark: boolean): { bg: string; text: string } {
  const byCategory: Record<string, keyof typeof docType> = {
    AC: 'ac',
    IC: 'ic',
    Modifications: 'safety',
    'Gestion de course': 'race',
    Jury: 'jury',
    Résultats: 'result',
  };

  const token = byCategory[category];
  if (token && docType[token]) {
    const base = docType[token];
    return isDark
      ? { bg: base.text, text: base.bg }
      : { bg: base.bg, text: base.text };
  }

  const colors = getAppColors(isDark ? 'dark' : 'light');
  return { bg: colors.surfaceContainerHigh, text: colors.onSurfaceVariant };
}
