import React, { useState, useEffect } from 'react';
import { pagesBuilderApi, type PageBuilderRow } from '@/api/owner/pagesBuilder';
import { toast } from '@/pages/owner_manage/utils/toast';
import {
  FiMonitor,
  FiLayout,
  FiPlus,
  FiTrash2,
  FiChevronUp,
  FiChevronDown,
  FiSave,
  FiEye,
  FiEdit3,
  FiMove,
  FiSettings,
  FiSliders,
  FiGrid,
  FiFolderPlus,
  FiBookOpen,
  FiFileText,
} from 'react-icons/fi';
import { getStoreUrl } from '@Security/Owner/configUrl';
import '@/pages/owner_manage/style/font.css';

interface PagesBuilderTabProps {
  ownerId?: number | string;
  storeId?: number;
}

interface Block {
  id: string;
  type: string;
  settings: Record<string, any>;
  style?: Record<string, any>;
  children?: Block[];
}

export const PagesBuilderTab: React.FC<PagesBuilderTabProps> = ({ ownerId }) => {
  const [pages, setPages] = useState<PageBuilderRow[]>([]);
  const [activePage, setActivePage] = useState<PageBuilderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activeRightTab, setActiveRightTab] = useState<'add' | 'settings'>('add');

  // Modal / Form states for new page creation
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');

  // Fetch all pages on mount
  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const data = await pagesBuilderApi.list();
      setPages(data);
      if (data.length > 0) {
        const homePage = data.find((p) => p.slug === 'home') || data[0];
        setActivePage(homePage);
      }
    } catch (err) {
      console.error('Failed to load store pages:', err);
      toast.error('Failed to load custom storefront pages.');
    } finally {
      setLoading(false);
    }
  };

  const generateId = (type: string) => `${type.toLowerCase()}_${Math.random().toString(36).substr(2, 9)}`;

  // Default Preset Templates
  const applyPreset = (presetType: 'restaurant' | 'fashion' | 'tech') => {
    if (!activePage) return;

    let presetBlocks: Block[] = [];

    if (presetType === 'restaurant') {
      presetBlocks = [
        {
          id: generateId('Navbar'),
          type: 'Navbar',
          settings: {
            storeName: 'Gourmet Culinary Bistro',
            links: [
              { label: 'Home', url: '/' },
              { label: 'Menu', url: '/menu' },
              { label: 'About', url: '/about' },
            ],
          },
          style: { backgroundColor: '#1e293b', color: '#ffffff' },
        },
        {
          id: generateId('Section'),
          type: 'Section',
          settings: {},
          style: {
            backgroundColor: '#0f172a',
            backgroundImage: 'url(https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            paddingTop: '80px',
            paddingBottom: '80px',
          },
          children: [
            {
              id: generateId('Heading'),
              type: 'Heading',
              settings: { text: 'Fresh Culinary Delights Delivered', level: 'h1' },
              style: { color: '#ffffff', fontSize: '3rem', textAlign: 'center', fontWeight: '900', marginBottom: '16px' },
            },
            {
              id: generateId('Text'),
              type: 'Text',
              settings: { text: 'Experience the absolute best local recipes cooked by our professional chefs.' },
              style: { color: '#e2e8f0', fontSize: '1.125rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto 24px auto' },
            },
            {
              id: generateId('Button'),
              type: 'Button',
              settings: { text: 'Explore Menu', link: '/menu' },
              style: {
                backgroundColor: '#ea580c',
                color: '#ffffff',
                padding: '12px 32px',
                borderRadius: '9999px',
                fontWeight: 'bold',
                display: 'block',
                width: 'fit-content',
                margin: '0 auto',
              },
            },
          ],
        },
        {
          id: generateId('Section'),
          type: 'Section',
          settings: {},
          style: { backgroundColor: '#f8fafc', paddingTop: '48px', paddingBottom: '48px' },
          children: [
            {
              id: generateId('Heading'),
              type: 'Heading',
              settings: { text: 'Our Specialties', level: 'h2' },
              style: { color: '#0f172a', fontSize: '2rem', textAlign: 'center', fontWeight: '800', marginBottom: '32px' },
            },
            {
              id: generateId('ProductGrid'),
              type: 'ProductGrid',
              settings: { limit: 4 },
              style: {},
            },
          ],
        },
        {
          id: generateId('Footer'),
          type: 'Footer',
          settings: { text: '© 2026 Gourmet Culinary Bistro. All rights reserved.' },
          style: { backgroundColor: '#0f172a', color: '#94a3b8', padding: '24px 0', textAlign: 'center' },
        },
      ];
    } else if (presetType === 'fashion') {
      presetBlocks = [
        {
          id: generateId('Navbar'),
          type: 'Navbar',
          settings: {
            storeName: 'Boutique Vogue',
            links: [
              { label: 'Home', url: '/' },
              { label: 'Shop All', url: '/products' },
              { label: 'New Arrivals', url: '/new' },
            ],
          },
          style: { backgroundColor: '#ffffff', color: '#1c1917' },
        },
        {
          id: generateId('Section'),
          type: 'Section',
          settings: {},
          style: {
            backgroundColor: '#f5f5f4',
            backgroundImage: 'url(https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            paddingTop: '120px',
            paddingBottom: '120px',
          },
          children: [
            {
              id: generateId('Heading'),
              type: 'Heading',
              settings: { text: 'Summer Essentials', level: 'h1' },
              style: { color: '#1c1917', fontSize: '3.5rem', fontFamily: 'serif', fontWeight: '900', marginBottom: '8px' },
            },
            {
              id: generateId('Text'),
              type: 'Text',
              settings: { text: 'Discover our premium curation of comfortable, lightweight styles.' },
              style: { color: '#44403c', fontSize: '1rem', marginBottom: '24px', maxWidth: '400px' },
            },
            {
              id: generateId('Button'),
              type: 'Button',
              settings: { text: 'Shop Collections', link: '/products' },
              style: {
                backgroundColor: '#1c1917',
                color: '#ffffff',
                padding: '12px 28px',
                fontWeight: 'bold',
                display: 'inline-block',
              },
            },
          ],
        },
        {
          id: generateId('Footer'),
          type: 'Footer',
          settings: { text: '© 2026 Boutique Vogue. Elegance redefined.' },
          style: { backgroundColor: '#1c1917', color: '#d6d3d1', padding: '32px 0', textAlign: 'center' },
        },
      ];
    } else if (presetType === 'tech') {
      presetBlocks = [
        {
          id: generateId('Navbar'),
          type: 'Navbar',
          settings: {
            storeName: 'GizmoStore Tech',
            links: [
              { label: 'Home', url: '/' },
              { label: 'Gadgets', url: '/products' },
            ],
          },
          style: { backgroundColor: '#0f172a', color: '#38bdf8' },
        },
        {
          id: generateId('Section'),
          type: 'Section',
          settings: {},
          style: {
            backgroundColor: '#020617',
            paddingTop: '96px',
            paddingBottom: '96px',
          },
          children: [
            {
              id: generateId('Heading'),
              type: 'Heading',
              settings: { text: 'The Future of Sound', level: 'h1' },
              style: { color: '#ffffff', fontSize: '3rem', fontWeight: '900', textAlign: 'center', marginBottom: '16px' },
            },
            {
              id: generateId('Button'),
              type: 'Button',
              settings: { text: 'Order Now', link: '/products' },
              style: {
                backgroundColor: '#38bdf8',
                color: '#0f172a',
                padding: '12px 32px',
                borderRadius: '8px',
                fontWeight: '800',
                display: 'block',
                width: 'fit-content',
                margin: '0 auto',
              },
            },
          ],
        },
        {
          id: generateId('Footer'),
          type: 'Footer',
          settings: { text: '© 2026 GizmoStore Tech. High-performance accessories.' },
          style: { backgroundColor: '#020617', color: '#64748b', padding: '24px 0', textAlign: 'center' },
        },
      ];
    }

    setActivePage({
      ...activePage,
      content_json: presetBlocks,
    });
    setSelectedBlockId(null);
    toast.success(`Applied ${presetType} layout template preset.`);
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle.trim() || !newPageSlug.trim()) {
      toast.error('Title and Slug are required.');
      return;
    }

    const cleanSlug = newPageSlug.toLowerCase().replace(/[^a-z0-9-_]/g, '');

    try {
      const pageData = await pagesBuilderApi.save({
        title: newPageTitle,
        slug: cleanSlug,
        content_json: [
          {
            id: generateId('Navbar'),
            type: 'Navbar',
            settings: { storeName: newPageTitle, links: [{ label: 'Home', url: '/' }] },
            style: { backgroundColor: '#ea580c', color: '#ffffff' },
          },
          {
            id: generateId('Section'),
            type: 'Section',
            settings: {},
            style: { backgroundColor: '#f8fafc', paddingTop: '60px', paddingBottom: '60px' },
            children: [
              {
                id: generateId('Heading'),
                type: 'Heading',
                settings: { text: `Welcome to ${newPageTitle}`, level: 'h1' },
                style: { fontSize: '2.5rem', textAlign: 'center', color: '#0f172a' },
              },
            ],
          },
          {
            id: generateId('Footer'),
            type: 'Footer',
            settings: { text: `© 2026 ${newPageTitle}. All rights reserved.` },
            style: { backgroundColor: '#0f172a', color: '#ffffff', padding: '20px 0', textAlign: 'center' },
          },
        ],
        is_published: true,
      });

      setPages([...pages, pageData]);
      setActivePage(pageData);
      setShowNewPageModal(false);
      setNewPageTitle('');
      setNewPageSlug('');
      toast.success('Store page layout initialized successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create page layout.');
    }
  };

  const handleDeletePage = async (id: number) => {
    if (!confirm('Are you sure you want to delete this custom page layout? This cannot be undone.')) return;

    try {
      await pagesBuilderApi.delete(id);
      const filtered = pages.filter((p) => p.id !== id);
      setPages(filtered);
      if (filtered.length > 0) {
        setActivePage(filtered[0]);
      } else {
        setActivePage(null);
      }
      toast.success('Page layout deleted.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete page layout.');
    }
  };

  const handleSavePage = async () => {
    if (!activePage) return;
    setSaving(true);

    try {
      const saved = await pagesBuilderApi.save({
        id: activePage.id,
        slug: activePage.slug,
        title: activePage.title,
        content_json: activePage.content_json,
        is_published: activePage.is_published,
      });

      setPages(pages.map((p) => (p.id === saved.id ? saved : p)));
      setActivePage(saved);
      toast.success('Custom storefront design layout saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to sync layout changes with server.');
    } finally {
      setSaving(false);
    }
  };

  const updateBlockInTree = (blocks: Block[], targetId: string, callback: (block: Block) => Block): Block[] => {
    return blocks.map((b) => {
      if (b.id === targetId) {
        return callback(b);
      }
      if (b.children && b.children.length > 0) {
        return {
          ...b,
          children: updateBlockInTree(b.children, targetId, callback),
        };
      }
      return b;
    });
  };

  const findBlockInTree = (blocks: Block[], targetId: string): Block | null => {
    for (const b of blocks) {
      if (b.id === targetId) return b;
      if (b.children && b.children.length > 0) {
        const found = findBlockInTree(b.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const handleUpdateBlockSettings = (field: string, val: any) => {
    if (!activePage || !selectedBlockId) return;

    const nextBlocks = updateBlockInTree(activePage.content_json || [], selectedBlockId, (block) => {
      return {
        ...block,
        settings: {
          ...block.settings,
          [field]: val,
        },
      };
    });

    setActivePage({
      ...activePage,
      content_json: nextBlocks,
    });
  };

  const handleUpdateBlockStyle = (styleKey: string, val: any) => {
    if (!activePage || !selectedBlockId) return;

    const nextBlocks = updateBlockInTree(activePage.content_json || [], selectedBlockId, (block) => {
      return {
        ...block,
        style: {
          ...block.style,
          [styleKey]: val,
        },
      };
    });

    setActivePage({
      ...activePage,
      content_json: nextBlocks,
    });
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if (!activePage) return;
    const blocks = [...(activePage.content_json || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const temp = blocks[index];
    blocks[index] = blocks[targetIndex];
    blocks[targetIndex] = temp;

    setActivePage({
      ...activePage,
      content_json: blocks,
    });
  };

  const handleDeleteBlock = (blockId: string) => {
    if (!activePage) return;

    const removeBlockFromList = (list: Block[]): Block[] => {
      return list
        .filter((b) => b.id !== blockId)
        .map((b) => {
          if (b.children) {
            return {
              ...b,
              children: removeBlockFromList(b.children),
            };
          }
          return b;
        });
    };

    setActivePage({
      ...activePage,
      content_json: removeBlockFromList(activePage.content_json || []),
    });

    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
    toast.success('Element deleted from page layout canvas.');
  };

  const handleAddBlock = (type: string) => {
    if (!activePage) return;

    let defaultBlock: Block = {
      id: generateId(type),
      type,
      settings: {},
      style: {
        paddingTop: '24px',
        paddingBottom: '24px',
      },
    };

    switch (type) {
      case 'Heading':
        defaultBlock.settings = { text: 'New Heading Banner', level: 'h2' };
        defaultBlock.style = { color: '#0f172a', textAlign: 'center', fontSize: '24px', fontWeight: 'bold' };
        break;
      case 'Text':
        defaultBlock.settings = { text: 'Type paragraphs of descriptive storefront texts here.' };
        defaultBlock.style = { color: '#4b5563', textAlign: 'center', fontSize: '14px' };
        break;
      case 'Button':
        defaultBlock.settings = { text: 'Shop Now', link: '/products' };
        defaultBlock.style = {
          backgroundColor: '#ea580c',
          color: '#ffffff',
          padding: '10px 24px',
          fontWeight: 'bold',
          borderRadius: '6px',
          display: 'block',
          width: 'fit-content',
          margin: '0 auto',
        };
        break;
      case 'Image':
        defaultBlock.settings = { src: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80', alt: 'Demo Product' };
        defaultBlock.style = { width: '100%', maxHeight: '350px', borderRadius: '12px' };
        break;
      case 'Spacer':
        defaultBlock.settings = { height: 40 };
        break;
      case 'Divider':
        defaultBlock.style = { borderTopColor: '#e5e7eb', width: '100%' };
        break;
      case 'ProductGrid':
        defaultBlock.settings = { limit: 4 };
        break;
      case 'Testimonials':
        defaultBlock.settings = {
          items: [{ quote: 'Perfect customer care!', author: 'Jane Done', role: 'Buyer', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' }],
        };
        break;
      case 'Countdown':
        defaultBlock.settings = { title: 'Limited Flash Offer' };
        break;
      case 'Gallery':
        defaultBlock.settings = {
          images: [
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
            'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80',
          ],
        };
        break;
      case 'Accordion':
        defaultBlock.settings = {
          items: [{ title: 'What is your delivery range?', content: 'We deliver city-wide within 30 minutes.' }],
        };
        break;
      case 'Contact Form':
        defaultBlock.settings = { title: 'Ask Us A Question' };
        break;
      case 'Section':
        defaultBlock.style = { backgroundColor: '#f9fafb', paddingTop: '40px', paddingBottom: '40px' };
        defaultBlock.children = [];
        break;
      case 'Container':
        defaultBlock.style = { maxWidth: '1200px', margin: '0 auto' };
        defaultBlock.children = [];
        break;
      case 'Row':
        defaultBlock.style = { display: 'flex', flexWrap: 'wrap' };
        defaultBlock.children = [];
        break;
      case 'Column':
        defaultBlock.settings = { width: '6' };
        defaultBlock.style = { width: '50%' };
        defaultBlock.children = [];
        break;
    }

    let added = false;
    if (selectedBlockId) {
      const nextBlocks = updateBlockInTree(activePage.content_json || [], selectedBlockId, (block) => {
        if (['Section', 'Container', 'Row', 'Column'].includes(block.type)) {
          added = true;
          return {
            ...block,
            children: [...(block.children || []), defaultBlock],
          };
        }
        return block;
      });

      if (added) {
        setActivePage({
          ...activePage,
          content_json: nextBlocks,
        });
        toast.success(`Inserted ${type} inside selected container.`);
      }
    }

    if (!added) {
      setActivePage({
        ...activePage,
        content_json: [...(activePage.content_json || []), defaultBlock],
      });
      toast.success(`Added ${type} section to page canvas.`);
    }

    setSelectedBlockId(defaultBlock.id);
    setActiveRightTab('settings');
  };

  const selectedBlock = selectedBlockId && activePage ? findBlockInTree(activePage.content_json, selectedBlockId) : null;

  if (loading) {
    return (
      <div className="bg-white border border-slate-100 p-12 rounded-[5px] shadow-xs flex flex-col items-center justify-center space-y-3 font-kuntomruy">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-400">Fetching storefront pages layout metadata...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-kuntomruy text-slate-700 w-full">
      {/* ── Page Header (Outside of Card) ─────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
            <FiLayout className="text-orange-500" />
            <span>Storefront No-Code Website Builder</span>
          </h3>
          <p className="text-slate-400 text-xs mt-1">
            Build, structure, and design responsive custom landing pages, banner sections, and menu galleries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activePage && (
            <>
              <button
                onClick={() => {
                  const savedSettings = localStorage.getItem('store_settings');
                  let storeName = 'Store';
                  if (savedSettings) {
                    try {
                      const parsed = JSON.parse(savedSettings);
                      storeName = parsed.store_name || 'Store';
                    } catch (_) { }
                  }
                  let storefrontUrl = getStoreUrl(storeName, ownerId);
                  if (activePage && activePage.slug !== 'home') {
                    storefrontUrl = `${storefrontUrl}/${activePage.slug}`;
                  }
                  window.open(storefrontUrl, '_blank');
                }}
                className="px-5 py-2 bg-transparent border hover:bg-slate-50 text-slate-600 rounded-[5px] text-xs font-extrabold transition-all border-slate-205 cursor-pointer flex items-center space-x-1.5"
              >
                <FiEye className="w-3.5 h-3.5" />
                <span>Visit Storefront</span>
              </button>
              <button
                onClick={handleSavePage}
                disabled={saving}
                className="px-5 py-2 bg-orange-650 hover:bg-orange-700 text-white rounded-[5px] text-xs font-extrabold transition-all shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer disabled:opacity-60 border-none flex items-center space-x-1.5"
              >
                <FiSave className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Design'}</span>
              </button>
            </>
          )}
          <button
            onClick={() => setShowNewPageModal(true)}
            className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-[5px] text-xs font-extrabold transition-all shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer border-none flex items-center space-x-1.5"
          >
            <FiPlus className="w-3.5 h-3.5" />
            <span>Create Page</span>
          </button>
        </div>
      </div>

      {/* ── Preset Template Shortcuts ─────────────────────── */}
      {activePage && activePage.content_json?.length === 0 && (
        <div className="p-5 bg-orange-50/50 border border-orange-100 rounded-[5px] flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-orange-950">Get started fast with templates!</h4>
            <p className="text-xs text-orange-800 mt-1">Choose a layout archetype matching your retail catalog style to populate default grids.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => applyPreset('restaurant')}
              className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-[5px] border-none cursor-pointer flex items-center gap-1"
            >
              <FiBookOpen /> Restaurant / Cafe
            </button>
            <button
              onClick={() => applyPreset('fashion')}
              className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-[5px] border-none cursor-pointer flex items-center gap-1"
            >
              <FiSliders /> Fashion Boutique
            </button>
            <button
              onClick={() => applyPreset('tech')}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-[5px] border-none cursor-pointer flex items-center gap-1"
            >
              <FiMonitor /> Electronic Store
            </button>
          </div>
        </div>
      )}

      {/* ── Main Workspace Card ────────────────────────────── */}
      {pages.length === 0 ? (
        <div className="border p-12 rounded-[5px] shadow-xs text-center bg-white border-slate-200">
          <FiMonitor className="w-12 h-12 text-slate-350 mx-auto mb-4" />
          <h4 className="text-base font-extrabold text-slate-700">No Storefront Pages Installed</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Get started by initializing a custom landing page such as a home landing page.
          </p>
          <button
            onClick={() => setShowNewPageModal(true)}
            className="mt-4 px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-[5px] text-xs font-extrabold border-none cursor-pointer inline-flex items-center gap-1 shadow-2xs active:scale-98"
          >
            <FiPlus /> Initialize First Page
          </button>
        </div>
      ) : (
        <div className="border p-6 rounded-[5px] shadow-xs bg-white custom-card-container grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px] border-slate-200">

          {/* ── LEFT COLUMN: Page List & Section Tree ───────── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Pages Selector Panel */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-[5px] p-4">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Pages List</h3>
              <div className="space-y-1.5">
                {pages.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActivePage(p);
                      setSelectedBlockId(null);
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-[5px] text-xs font-bold cursor-pointer transition-all ${activePage?.id === p.id
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    <div className="truncate flex items-center gap-1.5">
                      <FiFileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{p.title}</span>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* Canvas Blocks Outline */}
            {activePage && (
              <div className="bg-slate-50/70 border border-slate-200 rounded-[5px] p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Canvas Outline</h3>
                  {activePage.content_json?.length > 0 && (
                    <button
                      onClick={() => {
                        setActivePage({ ...activePage, content_json: [] });
                        setSelectedBlockId(null);
                        toast.success('Page layout canvas cleared.');
                      }}
                      className="text-[10px] text-red-500 font-extrabold bg-transparent border-none cursor-pointer flex items-center gap-0.5 hover:underline"
                    >
                      <FiTrash2 /> Clear All
                    </button>
                  )}
                </div>

                {activePage.content_json?.length === 0 ? (
                  <p className="text-slate-400 text-2xs text-center py-8">Layout is empty. Click elements on the right panel to build.</p>
                ) : (
                  <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                    {activePage.content_json?.map((block, idx) => (
                      <div
                        key={block.id}
                        onClick={() => setSelectedBlockId(block.id)}
                        className={`flex items-center justify-between p-2.5 rounded-[5px] border text-2xs cursor-pointer transition-all ${selectedBlockId === block.id
                          ? 'border-orange-500 bg-orange-50 text-orange-950 font-extrabold'
                          : 'border-slate-200 bg-white text-slate-650 hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FiMove className="text-slate-400 cursor-grab shrink-0" />
                          <span className="truncate">{block.type}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            disabled={idx === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveBlock(idx, 'up');
                            }}
                            className="p-1 hover:bg-slate-100 text-slate-500 disabled:opacity-30 border-none bg-transparent"
                          >
                            <FiChevronUp />
                          </button>
                          <button
                            disabled={idx === activePage.content_json.length - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveBlock(idx, 'down');
                            }}
                            className="p-1 hover:bg-slate-100 text-slate-500 disabled:opacity-30 border-none bg-transparent"
                          >
                            <FiChevronDown />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBlock(block.id);
                            }}
                            className="p-1 hover:bg-red-50 text-red-550 hover:text-white rounded border-none bg-transparent"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── MIDDLE COLUMN: Live Preview Canvas ──────────── */}
          <div className="lg:col-span-6 flex flex-col border border-slate-200 rounded-[5px] overflow-hidden bg-slate-900 shadow-inner">
            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-[10px] font-mono text-slate-550 ml-2">storefront-preview: /{activePage?.slug}</span>
              </div>
              <span className="text-[9px] uppercase font-bold tracking-wider">Live Mockup View</span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto max-h-[600px] bg-slate-950/80 custom-scrollbar flex flex-col space-y-4">
              {activePage?.content_json?.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-24">
                  <FiLayout className="w-10 h-10 text-slate-600 mb-3 animate-pulse" />
                  <h4 className="text-xs font-bold text-slate-400">Empty Page Canvas</h4>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-xs">Select elements on the right panel to append sections or load a template shortcut above.</p>
                </div>
              ) : (
                activePage?.content_json?.map((block) => {
                  const isSelected = selectedBlockId === block.id;

                  return (
                    <div
                      key={block.id}
                      onClick={() => setSelectedBlockId(block.id)}
                      className={`relative border-2 rounded-[5px] transition-all overflow-hidden cursor-pointer ${isSelected
                        ? 'border-orange-550 ring-2 ring-orange-500/20'
                        : 'border-slate-850 hover:border-slate-700'
                        }`}
                      style={{
                        backgroundColor: block.style?.backgroundColor || '#1e293b',
                        color: block.style?.color || '#e2e8f0',
                        backgroundImage: block.style?.backgroundImage,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        paddingTop: block.style?.paddingTop || '16px',
                        paddingBottom: block.style?.paddingBottom || '16px',
                        textAlign: (block.style?.textAlign as any) || 'left',
                      }}
                    >
                      <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-slate-700 pointer-events-none z-10 font-sans">
                        {block.type}
                      </div>

                      <div className="px-4 py-2">
                        {block.type === 'Navbar' && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-extrabold uppercase tracking-widest text-orange-400">{block.settings.storeName || 'My Logo'}</span>
                            <div className="flex gap-3 font-semibold text-slate-400">
                              {(block.settings.links || []).map((l: any, i: number) => (
                                <span key={i} className="hover:underline">{l.label}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {block.type === 'Heading' && (
                          <div
                            style={{
                              fontSize: block.style?.fontSize || '20px',
                              fontWeight: block.style?.fontWeight || 'bold',
                            }}
                          >
                            {block.settings.text || 'Heading Title'}
                          </div>
                        )}

                        {block.type === 'Text' && (
                          <p className="text-xs font-light leading-relaxed max-w-lg mt-1 mx-auto text-slate-300">
                            {block.settings.text || 'Paragraph details...'}
                          </p>
                        )}

                        {block.type === 'Button' && (
                          <div
                            style={{
                              backgroundColor: block.style?.backgroundColor || '#ea580c',
                              color: block.style?.color || '#ffffff',
                              padding: block.style?.padding || '8px 16px',
                              borderRadius: block.style?.borderRadius || '4px',
                              fontWeight: 'bold',
                              width: 'fit-content',
                              margin: block.style?.margin || '8px 0',
                            }}
                            className="text-2xs uppercase text-center"
                          >
                            {block.settings.text || 'Click Here'}
                          </div>
                        )}

                        {block.type === 'Image' && (
                          <div className="w-full h-24 bg-slate-800 rounded-[5px] flex items-center justify-center overflow-hidden border border-slate-700 relative">
                            {block.settings.src ? (
                              <img src={block.settings.src} className="w-full h-full object-cover opacity-60" />
                            ) : (
                              <span className="text-[10px] text-slate-500">Image Source URL</span>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white uppercase bg-black/30">
                              {block.settings.alt || 'Visual Photo'}
                            </div>
                          </div>
                        )}

                        {block.type === 'ProductGrid' && (
                          <div className="mt-2 grid grid-cols-4 gap-2">
                            {Array.from({ length: block.settings.limit || 4 }).map((_, i) => (
                              <div key={i} className="bg-slate-800/80 border border-slate-700 p-2 rounded-[5px] text-center">
                                <div className="aspect-square bg-slate-700 rounded-[3px] mb-1.5 flex items-center justify-center text-slate-500 text-[10px]">Product</div>
                                <div className="w-12 h-2 bg-slate-600 rounded mx-auto mb-1"></div>
                                <div className="w-8 h-2 bg-slate-700 rounded mx-auto"></div>
                              </div>
                            ))}
                          </div>
                        )}

                        {block.type === 'Testimonials' && (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {(block.settings.items || []).map((t: any, i: number) => (
                              <div key={i} className="bg-slate-850 p-2.5 border border-slate-800 rounded-[5px] text-left">
                                <p className="text-[10px] text-slate-400 italic">"{t.quote}"</p>
                                <span className="text-[9px] font-black text-white mt-1 block">- {t.author}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {block.type === 'Countdown' && (
                          <div className="bg-orange-500/10 border border-orange-500/20 py-2 rounded-lg text-center mt-2">
                            <span className="text-[9px] uppercase tracking-wider text-orange-400 font-extrabold">{block.settings.title || 'Timer'}</span>
                            <div className="text-xs font-black text-white mt-1">02d : 14h : 32m : 05s</div>
                          </div>
                        )}

                        {block.type === 'Gallery' && (
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {(block.settings.images || []).slice(0, 3).map((img: string, i: number) => (
                              <div key={i} className="aspect-video bg-slate-800 rounded-md overflow-hidden border border-slate-700">
                                <img src={img} className="w-full h-full object-cover opacity-60" />
                              </div>
                            ))}
                          </div>
                        )}

                        {block.type === 'Accordion' && (
                          <div className="space-y-1.5 mt-2">
                            {(block.settings.items || []).map((item: any, i: number) => (
                              <div key={i} className="bg-slate-850 p-2 border border-slate-800 rounded-md text-left">
                                <span className="text-[10px] font-bold text-white block">{item.title}</span>
                                <span className="text-[9px] text-slate-400 mt-0.5 block">{item.content}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {block.type === 'Contact Form' && (
                          <div className="bg-slate-850 border border-slate-800 p-3 rounded-lg text-left mt-2">
                            <span className="text-[10px] font-black text-white">{block.settings.title || 'Contact Us'}</span>
                            <div className="space-y-1.5 mt-2">
                              <div className="h-5 bg-slate-800 rounded border border-slate-700 text-slate-500 text-[8px] flex items-center px-2">Your Name</div>
                              <div className="h-5 bg-slate-800 rounded border border-slate-700 text-slate-500 text-[8px] flex items-center px-2">Email Address</div>
                            </div>
                          </div>
                        )}

                        {block.type === 'Footer' && (
                          <div className="text-center py-2 text-3xs text-slate-400">
                            {block.settings.text || '© Footer copyright info.'}
                          </div>
                        )}

                        {block.type === 'Spacer' && (
                          <div
                            style={{ height: `${block.settings.height || 20}px` }}
                            className="bg-slate-900/40 border border-dashed border-slate-800/40 rounded flex items-center justify-center text-[9px] text-slate-650 font-mono"
                          >
                            Spacer ({block.settings.height || 20}px)
                          </div>
                        )}

                        {block.type === 'Divider' && <hr className="border-t border-slate-800 w-full" />}

                        {['Section', 'Container', 'Row', 'Column'].includes(block.type) && (
                          <div className="border border-dashed border-slate-800 p-2.5 rounded-[5px] bg-slate-900/20 text-slate-500 text-[10px] italic">
                            {block.children && block.children.length > 0 ? (
                              <div className="space-y-2">
                                {block.children.map((child) => (
                                  <div
                                    key={child.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedBlockId(child.id);
                                    }}
                                    className={`p-2 rounded border text-3xs flex items-center justify-between ${selectedBlockId === child.id ? 'border-orange-500 bg-orange-950/20 text-orange-250' : 'border-slate-800 bg-slate-900/50'
                                      }`}
                                  >
                                    <span>{child.type}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteBlock(child.id);
                                      }}
                                      className="text-red-500 hover:text-red-400 border-none bg-transparent cursor-pointer p-0"
                                    >
                                      <FiTrash2 />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              'Container block empty. Click to select, then add elements.'
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN: Element Drawer & Settings ────── */}
          <div className="lg:col-span-3 border border-slate-200 rounded-[5px] overflow-hidden bg-white flex flex-col shadow-2xs">
            <div className="flex border-b text-center text-xs font-bold bg-slate-50 border-slate-200">
              <button
                onClick={() => setActiveRightTab('add')}
                className={`flex-1 py-3 border-none cursor-pointer transition-all ${activeRightTab === 'add' ? 'bg-white border-b-2 border-b-orange-600 text-orange-600 font-extrabold' : 'text-slate-500 hover:bg-slate-100/50'
                  }`}
              >
                Elements
              </button>
              <button
                onClick={() => setActiveRightTab('settings')}
                className={`flex-1 py-3 border-none cursor-pointer transition-all ${activeRightTab === 'settings' ? 'bg-white border-b-2 border-b-orange-600 text-orange-600 font-extrabold' : 'text-slate-500 hover:bg-slate-100/50'
                  }`}
              >
                Inspector
              </button>
            </div>

            {/* ELEMENTS TAB */}
            {activeRightTab === 'add' && (
              <div className="p-4 overflow-y-auto max-h-[550px] space-y-4">
                {/* Structural elements */}
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Structure</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {['Section', 'Container', 'Row', 'Column'].map((t) => (
                      <button
                        key={t}
                        onClick={() => handleAddBlock(t)}
                        className="py-2.5 bg-slate-50 hover:bg-orange-50 border border-slate-100 hover:border-orange-200 rounded-[5px] text-slate-700 text-2xs font-extrabold flex flex-col items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FiGrid className="w-4 h-4 text-slate-400" />
                        <span>{t}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Elements */}
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Content</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { type: 'Heading', label: 'Heading Title' },
                      { type: 'Text', label: 'Paragraph text' },
                      { type: 'Button', label: 'Call to Action' },
                      { type: 'Image', label: 'Visual Photo' },
                      { type: 'Spacer', label: 'Spacers (gap)' },
                      { type: 'Divider', label: 'Separator lines' },
                    ].map((item) => (
                      <button
                        key={item.type}
                        onClick={() => handleAddBlock(item.type)}
                        className="py-2.5 bg-slate-50 hover:bg-orange-50 border border-slate-100 hover:border-orange-200 rounded-[5px] text-slate-700 text-2xs font-extrabold flex flex-col items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FiEdit3 className="w-4 h-4 text-slate-400" />
                        <span>{item.type}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Storefront Layout Components */}
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Widgets</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { type: 'Navbar', label: 'Header Menu' },
                      { type: 'ProductGrid', label: 'Catalog Grid' },
                      { type: 'Testimonials', label: 'Diners Quotes' },
                      { type: 'Countdown', label: 'Timer clocks' },
                      { type: 'Gallery', label: 'Image Gallery' },
                      { type: 'Accordion', label: 'FAQ accordions' },
                      { type: 'Contact Form', label: 'Message forms' },
                      { type: 'Footer', label: 'Footer info' },
                    ].map((item) => (
                      <button
                        key={item.type}
                        onClick={() => handleAddBlock(item.type)}
                        className="py-2.5 bg-slate-50 hover:bg-orange-50 border border-slate-100 hover:border-orange-200 rounded-[5px] text-slate-700 text-2xs font-extrabold flex flex-col items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FiLayout className="w-4 h-4 text-slate-400" />
                        <span>{item.type}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* INSPECTOR TAB */}
            {activeRightTab === 'settings' && (
              <div className="p-4 overflow-y-auto max-h-[550px] space-y-4">
                {!selectedBlock ? (
                  <div className="text-center py-12 text-slate-400 text-2xs">
                    <FiSliders className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                    <span>Select an element in the canvas to configure settings.</span>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs">
                    <div className="border-b border-slate-200 pb-2">
                      <h4 className="font-extrabold text-slate-800 flex items-center gap-1">
                        <FiSettings />
                        <span>Settings: {selectedBlock.type}</span>
                      </h4>
                      <p className="text-[10px] text-slate-400">ID: {selectedBlock.id}</p>
                    </div>

                    {/* Content settings */}
                    <div className="space-y-3">
                      <h5 className="font-bold text-slate-750 uppercase tracking-widest text-[9px]">Content Settings</h5>

                      {selectedBlock.type === 'Heading' && (
                        <>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Heading text</label>
                            <input
                              type="text"
                              value={selectedBlock.settings.text || ''}
                              onChange={(e) => handleUpdateBlockSettings('text', e.target.value)}
                              className="w-full border border-slate-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-orange-500 focus:border-orange-550"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Level</label>
                            <select
                              value={selectedBlock.settings.level || 'h2'}
                              onChange={(e) => handleUpdateBlockSettings('level', e.target.value)}
                              className="w-full border border-slate-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-orange-500"
                            >
                              {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((lvl) => (
                                <option key={lvl} value={lvl}>
                                  {lvl.toUpperCase()}
                                </option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}

                      {selectedBlock.type === 'Text' && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Text content</label>
                          <textarea
                            rows={4}
                            value={selectedBlock.settings.text || ''}
                            onChange={(e) => handleUpdateBlockSettings('text', e.target.value)}
                            className="w-full border border-slate-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-orange-550 resize-none font-medium text-slate-700"
                          />
                        </div>
                      )}

                      {selectedBlock.type === 'Button' && (
                        <>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Button label</label>
                            <input
                              type="text"
                              value={selectedBlock.settings.text || ''}
                              onChange={(e) => handleUpdateBlockSettings('text', e.target.value)}
                              className="w-full border border-slate-200 rounded p-1.5 text-xs focus:ring-orange-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Button Link</label>
                            <input
                              type="text"
                              value={selectedBlock.settings.link || ''}
                              onChange={(e) => handleUpdateBlockSettings('link', e.target.value)}
                              className="w-full border border-slate-200 rounded p-1.5 text-xs focus:ring-orange-500"
                            />
                          </div>
                        </>
                      )}

                      {selectedBlock.type === 'Image' && (
                        <>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Source URL</label>
                            <input
                              type="text"
                              value={selectedBlock.settings.src || ''}
                              onChange={(e) => handleUpdateBlockSettings('src', e.target.value)}
                              className="w-full border border-slate-200 rounded p-1.5 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Alt Description</label>
                            <input
                              type="text"
                              value={selectedBlock.settings.alt || ''}
                              onChange={(e) => handleUpdateBlockSettings('alt', e.target.value)}
                              className="w-full border border-slate-200 rounded p-1.5 text-xs"
                            />
                          </div>
                        </>
                      )}

                      {selectedBlock.type === 'Spacer' && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Height (pixels)</label>
                          <input
                            type="number"
                            value={selectedBlock.settings.height || 20}
                            onChange={(e) => handleUpdateBlockSettings('height', parseInt(e.target.value, 10))}
                            className="w-full border border-slate-200 rounded p-1.5 text-xs"
                          />
                        </div>
                      )}

                      {selectedBlock.type === 'Navbar' && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Store title logo</label>
                          <input
                            type="text"
                            value={selectedBlock.settings.storeName || ''}
                            onChange={(e) => handleUpdateBlockSettings('storeName', e.target.value)}
                            className="w-full border border-slate-200 rounded p-1.5 text-xs"
                          />
                        </div>
                      )}

                      {selectedBlock.type === 'Footer' && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Copyright texts</label>
                          <input
                            type="text"
                            value={selectedBlock.settings.text || ''}
                            onChange={(e) => handleUpdateBlockSettings('text', e.target.value)}
                            className="w-full border border-slate-200 rounded p-1.5 text-xs"
                          />
                        </div>
                      )}

                      {selectedBlock.type === 'ProductGrid' && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Grid items limit</label>
                          <input
                            type="number"
                            value={selectedBlock.settings.limit || 4}
                            onChange={(e) => handleUpdateBlockSettings('limit', parseInt(e.target.value, 10))}
                            className="w-full border border-slate-200 rounded p-1.5 text-xs"
                          />
                        </div>
                      )}
                    </div>

                    {/* Styling Inspector */}
                    <div className="space-y-3 border-t border-slate-200 pt-3">
                      <h5 className="font-bold text-slate-750 uppercase tracking-widest text-[9px]">Custom styling</h5>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Background color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={selectedBlock.style?.backgroundColor || '#ffffff'}
                            onChange={(e) => handleUpdateBlockStyle('backgroundColor', e.target.value)}
                            className="w-8 h-8 rounded border border-slate-200 p-0 bg-transparent cursor-pointer"
                          />
                          <input
                            type="text"
                            value={selectedBlock.style?.backgroundColor || ''}
                            onChange={(e) => handleUpdateBlockStyle('backgroundColor', e.target.value)}
                            placeholder="#ffffff"
                            className="flex-1 border border-slate-200 rounded px-1.5 py-1 text-xs focus:border-orange-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Text Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={selectedBlock.style?.color || '#000000'}
                            onChange={(e) => handleUpdateBlockStyle('color', e.target.value)}
                            className="w-8 h-8 rounded border border-slate-200 p-0 bg-transparent cursor-pointer"
                          />
                          <input
                            type="text"
                            value={selectedBlock.style?.color || ''}
                            onChange={(e) => handleUpdateBlockStyle('color', e.target.value)}
                            placeholder="#000000"
                            className="flex-1 border border-slate-200 rounded px-1.5 py-1 text-xs focus:border-orange-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {selectedBlock.type === 'Section' && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Background Image URL</label>
                          <input
                            type="text"
                            value={selectedBlock.style?.backgroundImage?.replace(/^url\(["']?|["']?\)$/g, '') || ''}
                            onChange={(e) => {
                              const val = e.target.value.trim();
                              handleUpdateBlockStyle('backgroundImage', val ? `url(${val})` : 'none');
                            }}
                            placeholder="https://image-link.com"
                            className="w-full border border-slate-200 rounded p-1.5 text-xs focus:border-orange-500 focus:outline-none"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Padding top</label>
                          <input
                            type="text"
                            value={selectedBlock.style?.paddingTop || ''}
                            onChange={(e) => handleUpdateBlockStyle('paddingTop', e.target.value)}
                            placeholder="40px"
                            className="w-full border border-slate-200 rounded p-1.5 text-xs focus:border-orange-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Padding bottom</label>
                          <input
                            type="text"
                            value={selectedBlock.style?.paddingBottom || ''}
                            onChange={(e) => handleUpdateBlockStyle('paddingBottom', e.target.value)}
                            placeholder="40px"
                            className="w-full border border-slate-200 rounded p-1.5 text-xs focus:border-orange-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Text Alignment</label>
                        <select
                          value={selectedBlock.style?.textAlign || 'left'}
                          onChange={(e) => handleUpdateBlockStyle('textAlign', e.target.value)}
                          className="w-full border border-slate-200 rounded p-1.5 text-xs focus:border-orange-500 focus:outline-none"
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CREATE PAGE MODAL ─────────────────────────────── */}
      {showNewPageModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-[5px] p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                <FiFolderPlus className="text-orange-500" />
                <span>Create Storefront Page</span>
              </h3>
              <button
                onClick={() => setShowNewPageModal(false)}
                className="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer p-0"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePage} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 mb-1">Page Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. About Us"
                  value={newPageTitle}
                  onChange={(e) => {
                    setNewPageTitle(e.target.value);
                    if (!newPageSlug) {
                      setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                    }
                  }}
                  className="w-full border border-slate-200 rounded p-2 text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">URL Slug</label>
                <div className="flex items-center border border-slate-200 rounded overflow-hidden focus-within:border-orange-500">
                  <span className="bg-slate-50 px-2 py-2 text-slate-400 text-3xs border-r border-slate-200 font-mono">/</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. about"
                    value={newPageSlug}
                    onChange={(e) => setNewPageSlug(e.target.value.replace(/\s+/g, '-'))}
                    className="w-full border-none px-2 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewPageModal(false)}
                  className="px-5 py-2 bg-black/[0.04] hover:bg-black/[0.08] text-inherit rounded-[5px] text-xs font-extrabold transition-all cursor-pointer border border-black/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-[5px] text-xs font-extrabold transition-all shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer border-none flex items-center"
                >
                  Create Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
