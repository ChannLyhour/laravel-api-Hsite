import React, { useState, useEffect, useMemo } from 'react';
import { toast } from '@/pages/owner_manage/utils/toast';
import { FiSliders, FiSave, FiRotateCcw, FiInfo, FiDroplet, FiLayout, FiChevronDown, FiChevronRight, FiCheck, FiInbox } from 'react-icons/fi';
import '@/pages/owner_manage/style/font.css';

// ── Cookie helpers ──────────────────────────────────────────────────────────
const setCookie = (name: string, value: string, days = 365) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Lax`;
};

const getCookie = (name: string): string => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : '';
};

// ── Color Picker Row Component ──────────────────────────────────────────────
interface ColorRowProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  hint?: string;
}

const ColorRow: React.FC<ColorRowProps> = ({ label, value, onChange, hint }) => (
  <div className="group flex items-center justify-between py-3.5 px-4 rounded-[5px] border hover:shadow-xs transition-all duration-200 relative overflow-hidden custom-card-container">
    {/* Left color accent bar */}
    <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full transition-all duration-300 opacity-60 group-hover:opacity-100" style={{ backgroundColor: value }} />
    <div className="flex-1 min-w-0 pr-3 pl-2">
      <p className="text-[12px] font-extrabold leading-tight">{label}</p>
      {hint && <p className="text-[10px] opacity-60 font-medium mt-0.5 leading-snug">{hint}</p>}
    </div>
    <div className="flex items-center gap-3 shrink-0">
      <span className="text-[10px] font-mono font-bold uppercase tracking-wide hidden sm:inline bg-black/[0.03] px-2 py-0.5 rounded-[4px] border border-black/5">{value}</span>
      <label className="relative w-9 h-9 rounded-[8px] cursor-pointer overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-200 hover:scale-110 ring-2 ring-slate-200/60 group-hover:ring-slate-350">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <span className="block w-full h-full rounded-[6px]" style={{ backgroundColor: value }} />
      </label>
    </div>
  </div>
);

// ── Collapsible Section Component ───────────────────────────────────────────
interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Section: React.FC<SectionProps> = ({ title, icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-[5px] overflow-hidden shadow-2xs hover:shadow-xs transition-shadow custom-card-container">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 transition-all cursor-pointer border-none text-left relative custom-card-header-bar"
      >
        <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-primary rounded-r-full" />
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[6px] bg-primary/10 flex items-center justify-center">
            <span className="text-primary">{icon}</span>
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider">{title}</span>
        </div>
        <div className={`w-6 h-6 rounded-full bg-black/[0.04] flex items-center justify-center transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}>
          <FiChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </button>
      {open && (
        <div className="p-4 space-y-2.5 border-t animate-slide-up bg-black/[0.015]">
          {children}
        </div>
      )}
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────
export const CustomizeSystemTab: React.FC = () => {
  const [sidebarBg, setSidebarBg] = useState(() => getCookie('sidebar_menu_bg') || '#3f51b5');
  const [sidebarLeftBg, setSidebarLeftBg] = useState(() => getCookie('sidebar_left_bg') || '#303f9f');
  const [sidebarTextColor, setSidebarTextColor] = useState(() => getCookie('sidebar_text_color') || '#e0e7ff');
  const [sidebarActiveColor, setSidebarActiveColor] = useState(() => getCookie('sidebar_active_color') || '#ff6b35');
  const [sidebarLabelBg, setSidebarLabelBg] = useState(() => getCookie('sidebar_label_bg') || '#0f172a');
  const [sidebarLabelTextColor, setSidebarLabelTextColor] = useState(() => getCookie('sidebar_label_text_color') || '#ffffff');
  const [sidebarChildBg, setSidebarChildBg] = useState(() => getCookie('sidebar_child_bg') || '#3f51b5');
  const [sidebarChildTextColor, setSidebarChildTextColor] = useState(() => getCookie('sidebar_child_text') || '#e0e7ff');
  const [sidebarChildActiveBg, setSidebarChildActiveBg] = useState(() => getCookie('sidebar_child_active_bg') || '#ffffff');
  const [sidebarChildActiveTextColor, setSidebarChildActiveTextColor] = useState(() => getCookie('sidebar_child_active_text') || '#ffffff');
  const [dashboardMainBg, setDashboardMainBg] = useState(() => getCookie('dashboard_main_bg') || '#F4F7FE');
  const [dashboardH2Color, setDashboardH2Color] = useState(() => getCookie('dashboard_h2_color') || '#1e293b');
  const [dashboardCardBg, setDashboardCardBg] = useState(() => getCookie('dashboard_card_bg') || '#ffffff');
  const [dashboardCardBorder, setDashboardCardBorder] = useState(() => getCookie('dashboard_card_border') || '#e2e8f0');
  const [dashboardCardText, setDashboardCardText] = useState(() => getCookie('dashboard_card_text') || '#334155');
  const [dashboardHeaderBg, setDashboardHeaderBg] = useState(() => getCookie('dashboard_header_bg') || '#ffffff');
  const [dashboardHeaderBorder, setDashboardHeaderBorder] = useState(() => getCookie('dashboard_header_border') || '#e2e8f0');
  const [dashboardHeaderText, setDashboardHeaderText] = useState(() => getCookie('dashboard_header_text') || '#334155');
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Dynamically update CSS variables on the root element for live preview
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--sidebar-menu-bg', sidebarBg);
    root.style.setProperty('--sidebar-left-bg', sidebarLeftBg);
    root.style.setProperty('--sidebar-text-color', sidebarTextColor);
    root.style.setProperty('--sidebar-active-color', sidebarActiveColor);
    root.style.setProperty('--sidebar-label-bg', sidebarLabelBg);
    root.style.setProperty('--sidebar-label-text-color', sidebarLabelTextColor);
    root.style.setProperty('--sidebar-child-bg', sidebarChildBg);
    root.style.setProperty('--sidebar-child-text-color', sidebarChildTextColor);
    root.style.setProperty('--sidebar-child-active-bg', sidebarChildActiveBg);
    root.style.setProperty('--sidebar-child-active-text-color', sidebarChildActiveTextColor);
    root.style.setProperty('--dashboard-main-bg', dashboardMainBg);
    root.style.setProperty('--dashboard-h2-color', dashboardH2Color);
    root.style.setProperty('--dashboard-card-bg', dashboardCardBg);
    root.style.setProperty('--dashboard-card-border', dashboardCardBorder);
    root.style.setProperty('--dashboard-card-text', dashboardCardText);
    root.style.setProperty('--dashboard-header-bg', dashboardHeaderBg);
    root.style.setProperty('--dashboard-header-border', dashboardHeaderBorder);
    root.style.setProperty('--dashboard-header-text', dashboardHeaderText);
  }, [
    sidebarBg, sidebarLeftBg, sidebarTextColor, sidebarActiveColor,
    sidebarLabelBg, sidebarLabelTextColor, sidebarChildBg, sidebarChildTextColor,
    sidebarChildActiveBg, sidebarChildActiveTextColor, dashboardMainBg, dashboardH2Color,
    dashboardCardBg, dashboardCardBorder, dashboardCardText, dashboardHeaderBg,
    dashboardHeaderBorder, dashboardHeaderText
  ]);

  const handleSaveTheme = () => {
    setCookie('sidebar_menu_bg', sidebarBg);
    setCookie('sidebar_left_bg', sidebarLeftBg);
    setCookie('sidebar_text_color', sidebarTextColor);
    setCookie('sidebar_active_color', sidebarActiveColor);
    setCookie('sidebar_label_bg', sidebarLabelBg);
    setCookie('sidebar_label_text_color', sidebarLabelTextColor);
    setCookie('sidebar_child_bg', sidebarChildBg);
    setCookie('sidebar_child_text', sidebarChildTextColor);
    setCookie('sidebar_child_active_bg', sidebarChildActiveBg);
    setCookie('sidebar_child_active_text', sidebarChildActiveTextColor);
    setCookie('dashboard_main_bg', dashboardMainBg);
    setCookie('dashboard_h2_color', dashboardH2Color);
    setCookie('dashboard_card_bg', dashboardCardBg);
    setCookie('dashboard_card_border', dashboardCardBorder);
    setCookie('dashboard_card_text', dashboardCardText);
    setCookie('dashboard_header_bg', dashboardHeaderBg);
    setCookie('dashboard_header_border', dashboardHeaderBorder);
    setCookie('dashboard_header_text', dashboardHeaderText);
    toast.success('Theme preferences saved successfully!');
  };

  const handleResetTheme = () => {
    setSidebarBg('#3f51b5');
    setSidebarLeftBg('#303f9f');
    setSidebarTextColor('#e0e7ff');
    setSidebarActiveColor('#ff6b35');
    setSidebarLabelBg('#0f172a');
    setSidebarLabelTextColor('#ffffff');
    setSidebarChildBg('#3f51b5');
    setSidebarChildTextColor('#e0e7ff');
    setSidebarChildActiveBg('#ffffff');
    setSidebarChildActiveTextColor('#ffffff');
    setDashboardMainBg('#F4F7FE');
    setDashboardH2Color('#1e293b');
    setDashboardCardBg('#ffffff');
    setDashboardCardBorder('#e2e8f0');
    setDashboardCardText('#334155');
    setDashboardHeaderBg('#ffffff');
    setDashboardHeaderBorder('#e2e8f0');
    setDashboardHeaderText('#334155');
    setActivePreset('Indigo (Default)');

    setCookie('sidebar_menu_bg', '', -1);
    setCookie('sidebar_left_bg', '', -1);
    setCookie('sidebar_text_color', '', -1);
    setCookie('sidebar_active_color', '', -1);
    setCookie('sidebar_label_bg', '', -1);
    setCookie('sidebar_label_text_color', '', -1);
    setCookie('sidebar_child_bg', '', -1);
    setCookie('sidebar_child_text', '', -1);
    setCookie('sidebar_child_active_bg', '', -1);
    setCookie('sidebar_child_active_text', '', -1);
    setCookie('dashboard_main_bg', '', -1);
    setCookie('dashboard_h2_color', '', -1);
    setCookie('dashboard_card_bg', '', -1);
    setCookie('dashboard_card_border', '', -1);
    setCookie('dashboard_card_text', '', -1);
    setCookie('dashboard_header_bg', '', -1);
    setCookie('dashboard_header_border', '', -1);
    setCookie('dashboard_header_text', '', -1);
    toast.success('Colors reset to default Indigo theme!');
  };

  const applyPreset = (theme: typeof presets[0]) => {
    setSidebarBg(theme.bg);
    setSidebarLeftBg(theme.leftBg);
    setSidebarTextColor(theme.text);
    setSidebarActiveColor(theme.active);
    setSidebarLabelBg(theme.labelBg);
    setSidebarLabelTextColor(theme.labelText);
    setSidebarChildBg(theme.childBg);
    setSidebarChildTextColor(theme.childText);
    setSidebarChildActiveBg(theme.childActiveBg);
    setSidebarChildActiveTextColor(theme.childActiveText);
    setDashboardMainBg(theme.mainBg);
    setDashboardH2Color(theme.h2Color);
    setDashboardCardBg(theme.cardBg);
    setDashboardCardBorder(theme.cardBorder);
    setDashboardCardText(theme.cardText);
    setDashboardHeaderBg(theme.headerBg || '#ffffff');
    setDashboardHeaderBorder(theme.headerBorder || '#e2e8f0');
    setDashboardHeaderText(theme.headerText || '#334155');
    setActivePreset(theme.name);
  };

  const presets = useMemo(() => [
    {
      name: 'Indigo (Default)',
      bg: '#3f51b5', leftBg: '#303f9f', text: '#e0e7ff', active: '#ff6b35',
      labelBg: '#0f172a', labelText: '#ffffff',
      childBg: '#3f51b5', childText: '#e0e7ff', childActiveBg: '#ffffff', childActiveText: '#ffffff',
      mainBg: '#F4F7FE', h2Color: '#1e293b',
      cardBg: '#ffffff', cardBorder: '#e2e8f0', cardText: '#334155',
      headerBg: '#ffffff', headerBorder: '#e2e8f0', headerText: '#334155',
      gradient: 'from-indigo-600 to-indigo-800'
    },
    {
      name: 'Midnight Slate',
      bg: '#0f172a', leftBg: '#020617', text: '#cbd5e1', active: '#3b82f6',
      labelBg: '#1e293b', labelText: '#f8fafc',
      childBg: '#0f172a', childText: '#cbd5e1', childActiveBg: '#ffffff', childActiveText: '#ffffff',
      mainBg: '#0b0f19', h2Color: '#f8fafc',
      cardBg: '#1e293b', cardBorder: '#334155', cardText: '#cbd5e1',
      headerBg: '#1e293b', headerBorder: '#334155', headerText: '#cbd5e1',
      gradient: 'from-slate-700 to-slate-900'
    },
    {
      name: 'Forest Emerald',
      bg: '#065f46', leftBg: '#047857', text: '#ecfdf5', active: '#10b981',
      labelBg: '#064e3b', labelText: '#f0fdf4',
      childBg: '#065f46', childText: '#ecfdf5', childActiveBg: '#ffffff', childActiveText: '#ffffff',
      mainBg: '#022c22', h2Color: '#ecfdf5',
      cardBg: '#064e3b', cardBorder: '#047857', cardText: '#ecfdf5',
      headerBg: '#064e3b', headerBorder: '#047857', headerText: '#ecfdf5',
      gradient: 'from-emerald-600 to-emerald-800'
    },
    {
      name: 'Deep Crimson',
      bg: '#881337', leftBg: '#9f1239', text: '#ffe4e6', active: '#f43f5e',
      labelBg: '#4c0519', labelText: '#fff1f2',
      childBg: '#881337', childText: '#ffe4e6', childActiveBg: '#ffffff', childActiveText: '#ffffff',
      mainBg: '#1c0209', h2Color: '#ffe4e6',
      cardBg: '#4c0519', cardBorder: '#9f1239', cardText: '#ffe4e6',
      headerBg: '#4c0519', headerBorder: '#9f1239', headerText: '#ffe4e6',
      gradient: 'from-rose-700 to-rose-900'
    },
    {
      name: 'Ocean Blue',
      bg: '#1e40af', leftBg: '#1e3a8a', text: '#dbeafe', active: '#60a5fa',
      labelBg: '#172554', labelText: '#eff6ff',
      childBg: '#1e40af', childText: '#dbeafe', childActiveBg: '#ffffff', childActiveText: '#ffffff',
      mainBg: '#0c1a3d', h2Color: '#dbeafe',
      cardBg: '#0f172a', cardBorder: '#1e3a8a', cardText: '#dbeafe',
      headerBg: '#0f172a', headerBorder: '#1e3a8a', headerText: '#dbeafe',
      gradient: 'from-blue-600 to-blue-900'
    },
    {
      name: 'Royal Purple',
      bg: '#581c87', leftBg: '#6b21a8', text: '#f3e8ff', active: '#c084fc',
      labelBg: '#3b0764', labelText: '#faf5ff',
      childBg: '#581c87', childText: '#f3e8ff', childActiveBg: '#ffffff', childActiveText: '#ffffff',
      mainBg: '#1a0533', h2Color: '#f3e8ff',
      cardBg: '#2e0854', cardBorder: '#6b21a8', cardText: '#f3e8ff',
      headerBg: '#2e0854', headerBorder: '#6b21a8', headerText: '#f3e8ff',
      gradient: 'from-purple-700 to-purple-900'
    }
  ], []);

  // Auto-detect active preset on mount
  useEffect(() => {
    const match = presets.find(p =>
      p.bg === sidebarBg && p.leftBg === sidebarLeftBg && p.active === sidebarActiveColor
    );
    if (match) setActivePreset(match.name);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6 animate-fade-in font-sans">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-[5px] p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_70%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-[8px] bg-white/10 border border-white/10 flex items-center justify-center">
              <FiSliders className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-black tracking-tight">System Sidebar Customizer</h2>
          </div>
          <p className="text-[12px] text-slate-300 font-medium leading-relaxed max-w-lg">
            Personalize your admin console sidebar, submenu, tooltips, and dashboard layout colors.
            All changes preview instantly — save to persist across sessions.
          </p>
        </div>
      </div>

      {/* ── Main Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Left: Color Pickers ──────────────────────────── */}
        <div className="xl:col-span-2 space-y-4">

          {/* Section 1: Dashboard & Sidebar */}
          <Section
            title="Dashboard & Sidebar Colors"
            icon={<FiLayout className="w-3.5 h-3.5" />}
          >
            <ColorRow label="Left Column Background" value={sidebarLeftBg} onChange={setSidebarLeftBg} hint="The narrow icon bar on the left" />
            <ColorRow label="Main Sidebar Background" value={sidebarBg} onChange={setSidebarBg} hint="Primary sidebar panel background" />
            <ColorRow label="Sidebar Text Color" value={sidebarTextColor} onChange={setSidebarTextColor} hint="Default text color for menu items" />
            <ColorRow label="Active Highlight Color" value={sidebarActiveColor} onChange={setSidebarActiveColor} hint="Accent color for active menu indicator" />
            <ColorRow label="Dashboard Background" value={dashboardMainBg} onChange={setDashboardMainBg} hint="Main content area background color" />
            <ColorRow label="Heading (H2) Text Color" value={dashboardH2Color} onChange={setDashboardH2Color} hint="Page heading text color" />
          </Section>

          {/* Section 2: Content Cards */}
          <Section
            title="Main Card Container Colors"
            icon={<FiLayout className="w-3.5 h-3.5 text-primary" />}
          >
            <ColorRow label="Card Background Color" value={dashboardCardBg} onChange={setDashboardCardBg} hint="Background for main lists, tables, and modal contents" />
            <ColorRow label="Card Border Color" value={dashboardCardBorder} onChange={setDashboardCardBorder} hint="Borders for containers, row cells, and inputs" />
            <ColorRow label="Card Primary Text Color" value={dashboardCardText} onChange={setDashboardCardText} hint="Primary text color inside main container cards" />
          </Section>

          {/* Section 3: Top Header Colors */}
          <Section
            title="Top Header Colors"
            icon={<FiSliders className="w-3.5 h-3.5 text-orange-500" />}
          >
            <ColorRow label="Header Background Color" value={dashboardHeaderBg} onChange={setDashboardHeaderBg} hint="Background for the top navigation dashboard bar" />
            <ColorRow label="Header Border Color" value={dashboardHeaderBorder} onChange={setDashboardHeaderBorder} hint="Bottom border color of the top bar" />
            <ColorRow label="Header Text Color" value={dashboardHeaderText} onChange={setDashboardHeaderText} hint="Text, breadcrumb, and icon colors inside the header" />
          </Section>

          {/* Section 3: Submenu */}
          <Section
            title="Submenu (Child Sidebar) Colors"
            icon={<FiDroplet className="w-3.5 h-3.5" />}
            defaultOpen={false}
          >
            <ColorRow label="Submenu Background" value={sidebarChildBg} onChange={setSidebarChildBg} hint="Background of expanded submenu panel" />
            <ColorRow label="Submenu Text Color" value={sidebarChildTextColor} onChange={setSidebarChildTextColor} hint="Default text color in submenus" />
            <ColorRow label="Submenu Active Background" value={sidebarChildActiveBg} onChange={setSidebarChildActiveBg} hint="Background highlight for active sub-item" />
            <ColorRow label="Submenu Active Text" value={sidebarChildActiveTextColor} onChange={setSidebarChildActiveTextColor} hint="Text color of active sub-item" />
          </Section>

          {/* Section 4: Tooltip */}
          <Section
            title="Hover Tooltip Colors"
            icon={<FiInfo className="w-3.5 h-3.5" />}
            defaultOpen={false}
          >
            <ColorRow label="Tooltip Background" value={sidebarLabelBg} onChange={setSidebarLabelBg} hint="Background color of hover label tooltips" />
            <ColorRow label="Tooltip Text Color" value={sidebarLabelTextColor} onChange={setSidebarLabelTextColor} hint="Text color inside hover label tooltips" />
          </Section>
        </div>

        {/* ── Right: Presets + Actions ─────────────────────── */}
        <div className="space-y-4">

          {/* Preset Themes */}
          <div className="border rounded-[5px] overflow-hidden shadow-2xs custom-card-container">
            <div className="px-5 py-3.5 border-b relative custom-card-header-bar">
              <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-primary rounded-r-full" />
              <span className="text-[11px] font-black uppercase tracking-wider">Preset Themes</span>
            </div>
            <div className="p-3 space-y-2">
              {presets.map((preset) => {
                const isActive = activePreset === preset.name;
                return (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className={`w-full flex items-center gap-3 p-3 rounded-[5px] border transition-all duration-200 cursor-pointer text-left group hover:-translate-y-0.5 ${
                      isActive
                        ? 'border-primary/30 bg-primary/[0.04] shadow-sm ring-1 ring-primary/10'
                        : 'border-slate-200/50 bg-black/[0.02] hover:bg-black/[0.05]'
                    }`}
                  >
                    {/* Theme Color Preview Bar */}
                    <div className={`w-9 h-9 rounded-[8px] bg-gradient-to-br ${preset.gradient} shrink-0 shadow-sm flex items-center justify-center ring-1 ring-black/5`}>
                      {isActive && <FiCheck className="w-4 h-4 text-white stroke-[3] drop-shadow-sm" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-extrabold leading-tight ${isActive ? 'text-primary' : 'text-inherit group-hover:opacity-90'}`}>
                        {preset.name}
                      </p>
                      {/* Color dots preview */}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {[preset.bg, preset.leftBg, preset.active, preset.mainBg, preset.cardBg].map((c, idx) => (
                          <span key={idx} className="w-3.5 h-3.5 rounded-full border border-slate-200/60 shadow-3xs group-hover:shadow-sm transition-shadow" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                    {isActive && (
                      <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">Active</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview Mini-Sidebar */}
          <div className="border rounded-[5px] overflow-hidden shadow-2xs custom-card-container">
            <div className="px-5 py-3.5 border-b relative custom-card-header-bar">
              <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-primary rounded-r-full" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider">Live Preview</span>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live</span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex rounded-[5px] overflow-hidden border border-slate-200/80 h-[190px] shadow-sm relative group/preview">
                
                {/* Mini Left Bar */}
                <div className="w-[30px] shrink-0 flex flex-col items-center pt-3 gap-2.5 relative z-10" style={{ backgroundColor: sidebarLeftBg }}>
                  {/* Active highlight */}
                  <span className="w-4.5 h-4.5 rounded-[4px] shadow-sm flex items-center justify-center relative cursor-pointer group/logo" style={{ backgroundColor: sidebarActiveColor }}>
                    <span className="w-2 h-2 rounded-[1px] bg-white" />
                  </span>
                  
                  {/* Tooltip demonstration item */}
                  <div className="relative flex items-center justify-center w-full">
                    <span className="w-4.5 h-4.5 rounded-[4px] opacity-40 block" style={{ backgroundColor: sidebarTextColor }} />
                    {/* Live miniature tooltip */}
                    <div 
                      className="absolute left-7 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-[3px] text-[7px] font-bold whitespace-nowrap shadow-sm pointer-events-none transition-all duration-300 opacity-90 scale-95"
                      style={{ backgroundColor: sidebarLabelBg, color: sidebarLabelTextColor }}
                    >
                      Store
                    </div>
                  </div>

                  <span className="w-4.5 h-4.5 rounded-[4px] opacity-45" style={{ backgroundColor: sidebarTextColor }} />
                  <span className="w-4.5 h-4.5 rounded-[4px] opacity-45" style={{ backgroundColor: sidebarTextColor }} />
                </div>

                {/* Mini Sidebar */}
                <div className="w-[70px] shrink-0 flex flex-col pt-3 px-1.5 gap-2 border-r border-black/5" style={{ backgroundColor: sidebarBg }}>
                  <span className="h-2 rounded-[2px] w-full" style={{ backgroundColor: sidebarActiveColor }} />
                  <span className="h-1.5 rounded-[1px] w-[80%]" style={{ backgroundColor: sidebarTextColor, opacity: 0.3 }} />
                  <span className="h-1.5 rounded-[1px] w-[65%]" style={{ backgroundColor: sidebarTextColor, opacity: 0.3 }} />
                  <span className="h-1.5 rounded-[1px] w-[75%]" style={{ backgroundColor: sidebarTextColor, opacity: 0.3 }} />
                </div>

                {/* Mini Submenu / Child Sidebar */}
                <div className="w-[65px] shrink-0 flex flex-col pt-3 px-1.5 gap-2 border-r border-black/5" style={{ backgroundColor: sidebarChildBg }}>
                  <span className="h-2 rounded-[2px] w-[65%] mb-1" style={{ backgroundColor: sidebarChildTextColor, opacity: 0.4 }} />
                  {/* Child Active menu item */}
                  <div className="h-4.5 rounded-[3px] w-full flex items-center px-1.5" style={{ backgroundColor: sidebarChildActiveBg }}>
                    <span className="h-1 rounded-[1.5px] w-[70%]" style={{ backgroundColor: sidebarChildActiveTextColor }} />
                  </div>
                  <span className="h-1.5 rounded-[1px] w-[75%]" style={{ backgroundColor: sidebarChildTextColor, opacity: 0.4 }} />
                  <span className="h-1.5 rounded-[1px] w-[60%]" style={{ backgroundColor: sidebarChildTextColor, opacity: 0.4 }} />
                </div>

                {/* Mini Content Area container */}
                <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                  {/* Mini Top Header Mockup */}
                  <div 
                    className="h-7 border-b px-2 flex items-center justify-between transition-all shrink-0"
                    style={{ backgroundColor: dashboardHeaderBg, borderColor: dashboardHeaderBorder, color: dashboardHeaderText }}
                  >
                    <span className="text-[6px] font-black tracking-wide truncate max-w-[60px]" style={{ color: dashboardHeaderText }}>Dashboard Overview</span>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-black/[0.04] border border-black/5" />
                      <span className="w-2.5 h-2.5 rounded-full bg-black/[0.04] border border-black/5" />
                    </div>
                  </div>

                  {/* Mini Dashboard Scrollable Content */}
                  <div className="flex-grow flex flex-col p-2 gap-1.5 overflow-y-auto animate-fade-in" style={{ backgroundColor: dashboardMainBg }}>
                    {/* Dynamic H2 Header */}
                    <h4 className="text-[7px] font-black tracking-tight" style={{ color: dashboardH2Color }}>
                      Store Analytics
                    </h4>
                    
                    {/* Card wrapper 1 */}
                    <div className="rounded-[4px] border shadow-3xs overflow-hidden flex flex-col" style={{ backgroundColor: dashboardCardBg, borderColor: dashboardCardBorder }}>
                      {/* Header bar inside the card with customized bg styles */}
                      <div 
                        className="h-3.5 px-1.5 flex items-center justify-between border-b"
                        style={{ 
                          borderColor: dashboardCardBorder,
                          background: `linear-gradient(to right, color-mix(in srgb, ${dashboardCardText} 5%, ${dashboardCardBg}), ${dashboardCardBg})`
                        }}
                      >
                        <span className="w-10 h-1.5 rounded-[0.5px] block" style={{ backgroundColor: dashboardCardText, opacity: 0.3 }} />
                        <span className="w-3 h-1.5 rounded-[1px]" style={{ backgroundColor: sidebarActiveColor }} />
                      </div>
                      {/* Card Body content */}
                      <div className="p-1.5 flex items-center gap-2">
                        <div className="w-4 h-4 rounded-[3px]" style={{ backgroundColor: sidebarActiveColor, opacity: 0.2 }} />
                        <div className="flex-1 flex flex-col gap-0.5">
                          <span className="h-1 rounded-[0.5px] w-[75%] block" style={{ backgroundColor: dashboardCardText, opacity: 0.8 }} />
                          <span className="h-1 rounded-[0.5px] w-[45%] block" style={{ backgroundColor: dashboardCardText, opacity: 0.4 }} />
                        </div>
                      </div>
                    </div>

                    {/* Card wrapper 2 */}
                    <div className="h-6 rounded-[4px] border shadow-3xs overflow-hidden flex flex-col p-1.5 gap-1 justify-center shrink-0" style={{ backgroundColor: dashboardCardBg, borderColor: dashboardCardBorder }}>
                      <span className="h-1 rounded-[0.5px] w-[40%] block" style={{ backgroundColor: dashboardCardText, opacity: 0.6 }} />
                      <span className="h-1 rounded-[0.5px] w-[80%] block" style={{ backgroundColor: dashboardCardText, opacity: 0.4 }} />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border rounded-[5px] overflow-hidden shadow-2xs custom-card-container">
            <div className="px-5 py-3.5 border-b relative custom-card-header-bar">
              <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-primary rounded-r-full" />
              <span className="text-[11px] font-black uppercase tracking-wider">Actions</span>
            </div>
            <div className="p-4 space-y-3">
              <button
                onClick={handleSaveTheme}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-hover text-white font-extrabold rounded-[5px] transition-all cursor-pointer border-none shadow-sm hover:shadow-md text-xs active:scale-[0.97]"
              >
                <FiSave className="w-4 h-4" />
                <span>Save Theme Preference</span>
              </button>
              <button
                onClick={handleResetTheme}
                className="w-full flex items-center justify-center gap-2 py-3 bg-black/[0.04] hover:bg-black/[0.08] text-inherit border border-black/10 font-extrabold rounded-[5px] transition-all cursor-pointer text-xs active:scale-[0.97] hover:shadow-3xs"
              >
                <FiRotateCcw className="w-4 h-4" />
                <span>Reset to Defaults</span>
              </button>
            </div>
          </div>

          {/* Info Hint */}
          <div className="flex gap-2.5 p-4 rounded-[5px] bg-primary/[0.04] border border-primary/10 text-[11px] leading-relaxed">
            <FiInfo className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
            <div className="text-slate-600">
              <strong className="font-bold text-slate-700">Live Preview:</strong> Changes apply instantly to the sidebar.
              Click <strong className="font-extrabold text-primary">Save Theme Preference</strong> to persist across sessions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
