// Palette alignée sur le web doc2sail (Tailwind sky-600 primary)
const primary = '#0284c7';
const primaryDark = '#0369a1';

export default {
  light: {
    text: '#1f2937',
    textMuted: '#6b7280',
    background: '#f3f4f6',
    card: '#ffffff',
    primary,
    primaryDark,
    tint: primary,
    tabIconDefault: '#9ca3af',
    tabIconSelected: primary,
    border: '#e5e7eb',
    error: '#ef4444',
    success: '#22c55e',
  },
  dark: {
    text: '#f9fafb',
    textMuted: '#9ca3af',
    background: '#111827',
    card: '#1f2937',
    primary,
    primaryDark,
    tint: primary,
    tabIconDefault: '#6b7280',
    tabIconSelected: primary,
    border: '#374151',
    error: '#f87171',
    success: '#4ade80',
  },
};
