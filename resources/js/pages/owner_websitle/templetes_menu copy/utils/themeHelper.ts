import type { ThemeConfig } from '@/pages/owner_manage/templete_website/themes';

/**
 * Transforms storefront themes to solid, high-contrast light-mode configurations.
 * Overrides semi-transparent and dark background classes with solid light background classes.
 */
export function getLightTheme(theme: ThemeConfig): ThemeConfig {
  // 1. Process themes that are originally dark
  if (theme.id === 'minimal_dark_green') {
    return {
      ...theme,
      bgClass: 'bg-slate-50 text-slate-800',
      navbarBg: 'bg-white/95 backdrop-blur-md border-b border-slate-100',
      footerBg: 'bg-slate-900 border-t border-slate-800 text-slate-300',
      cardBg: 'bg-white border border-slate-100',
      primaryText: 'text-green-600',
      primaryBg: 'bg-green-600',
      primaryHover: 'hover:bg-green-700',
      badgeBg: 'bg-green-50 border-green-100/50',
      badgeText: 'text-green-700',
      borderClass: 'border-slate-100',
      shadowClass: 'shadow-md shadow-green-500/5 hover:shadow-green-500/10',
      glassClass: undefined,
    };
  }

  if (theme.id === 'glass_gradient') {
    return {
      ...theme,
      bgClass: 'bg-slate-50 text-slate-800',
      navbarBg: 'bg-white/95 backdrop-blur-md border-b border-slate-100',
      footerBg: 'bg-slate-900 border-t border-slate-800 text-slate-300',
      cardBg: 'bg-white border border-slate-100',
      primaryText: 'text-cyan-600',
      primaryBg: 'bg-gradient-to-r from-cyan-500 to-purple-500',
      primaryHover: 'hover:opacity-90',
      badgeBg: 'bg-cyan-50 border-cyan-100/50',
      badgeText: 'text-cyan-700',
      borderClass: 'border-slate-100',
      shadowClass: 'shadow-md shadow-cyan-500/5 hover:shadow-cyan-500/10',
      glassClass: undefined,
    };
  }

  if (theme.id === 'electronic') {
    return {
      ...theme,
      bgClass: 'bg-slate-50 text-slate-800',
      navbarBg: 'bg-white/95 backdrop-blur-md border-b border-slate-100',
      footerBg: 'bg-slate-900 border-t border-slate-800 text-slate-300',
      cardBg: 'bg-white border border-slate-100',
      primaryText: 'text-blue-600',
      primaryBg: 'bg-blue-600',
      primaryHover: 'hover:bg-blue-700',
      badgeBg: 'bg-blue-50 border-blue-100',
      badgeText: 'text-blue-700',
      borderClass: 'border-slate-100',
      shadowClass: 'shadow-md shadow-blue-500/5 hover:shadow-blue-500/10',
      glassClass: undefined,
    };
  }

  if (theme.id === 'minimal_dark_gold') {
    return {
      ...theme,
      bgClass: 'bg-slate-50 text-slate-800',
      navbarBg: 'bg-white/95 backdrop-blur-md border-b border-slate-100',
      footerBg: 'bg-slate-900 border-t border-slate-800 text-slate-300',
      cardBg: 'bg-white border border-slate-100',
      primaryText: 'text-[#ca8a04]',
      primaryBg: 'bg-[#eab308]',
      primaryHover: 'hover:bg-[#ca8a04]',
      badgeBg: 'bg-yellow-50 border-yellow-100',
      badgeText: 'text-yellow-800',
      borderClass: 'border-slate-100',
      shadowClass: 'shadow-md shadow-yellow-500/5 hover:shadow-yellow-500/10',
      glassClass: undefined,
    };
  }

  // 2. Process light themes that use semi-transparent background classes
  if (theme.id === 'default') {
    return {
      ...theme,
      bgClass: 'bg-slate-50 text-slate-800',
    };
  }

  if (theme.id === 'elegant_rose') {
    return {
      ...theme,
      bgClass: 'bg-[#FAF6F0] text-slate-800', // Solid light stone background instead of bg-stone-50/60
    };
  }

  if (theme.id === 'sweet_pastry') {
    return {
      ...theme,
      bgClass: 'bg-[#FFF9F9] text-rose-955', // Solid light pink background instead of bg-rose-50/30
    };
  }

  return theme;
}
