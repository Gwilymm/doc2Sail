// theme/nativewindVars.ts

import { vars } from 'nativewind';

const { themeVars } = require('./colors');

export const lightThemeVars = vars(themeVars.light);
export const darkThemeVars = vars(themeVars.dark);