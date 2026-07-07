import React, { useState, useEffect } from 'react';
import { client } from '@/api/client';
import { resolveImageUrl } from '../utils/imageUtils';
import { FiShoppingBag, FiInfo, FiChevronRight, FiGrid } from 'react-icons/fi';

interface Block {
  id: string;
  type: string;
  settings: Record<string, any>;
}

interface PageData {
  id: number;
  slug: string;
  title: string;
  content_json: Block[];
}

interface PageRendererProps {
  ownerUserId: number | string;
  slug?: string;
  storeName: string;
  onNavigate?: (to: string) => void;
  addToCart?: (product: any) => void;
}

export const PageRenderer: React.FC<PageRendererProps> = ({
  ownerUserId,
  slug = 'home',
  storeName,
  onNavigate,
  addToCart,
}) => {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<PageData | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Fetch Custom Page Layout
  useEffect(() => {
    let active = true;
    setLoading(true);
    client
      .get(`/pages/public-builder?owner_id=${ownerUserId}&slug=${slug}`, { silent: true })
      .then((res: any) => {
        if (active && res && res.success && res.data) {
          setPage(res.data);
        }
      })
      .catch((err) => {
        console.warn('PageRenderer: Custom page layout not found or failed to load', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [ownerUserId, slug]);

  // Fetch Products if any block requests ProductGrid
  const hasProductGrid = page?.content_json?.some((block) => block.type === 'ProductGrid');
  useEffect(() => {
    if (!hasProductGrid) return;
    let active = true;
    setProductsLoading(true);
    client
      .get(`/products?owner_id=${ownerUserId}`, { silent: true })
      .then((res: any) => {
        // Support API formats (either direct array or paginated data wrapper)
        const items = res?.data || res || [];
        if (active) setProducts(items);
      })
      .catch((err) => {
        console.warn('PageRenderer: Failed to fetch products for grid', err);
      })
      .finally(() => {
        if (active) setProductsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [hasProductGrid, ownerUserId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 animate-pulse text-sm">Loading custom layout...</p>
      </div>
    );
  }

  // If no custom layout is defined for this owner, show a fallback configuration prompt
  if (!page || !page.content_json || page.content_json.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] p-6 max-w-lg mx-auto text-center">
        <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 text-indigo-400">
          <FiGrid className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Custom Layout Found</h3>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          The store owner has not created a custom builder page layout for slug <span className="font-semibold text-indigo-400">"{slug}"</span> yet.
        </p>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl w-full text-left">
          <p className="text-xs text-indigo-300 font-bold mb-2">💡 Quick Start Tip for Admins/Owners:</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            You can POST to <code className="bg-black/40 px-1.5 py-0.5 rounded text-white font-mono">/api/owner/pages-builder</code> to save a dynamic page schema.
          </p>
        </div>
      </div>
    );
  }

  // Helper to compile component style settings to CSS strings with !important
  const renderStyles = (blocks: any[]): string => {
    let css = '';
    const traverse = (el: any) => {
      if (el.id && el.style) {
        const rules = Object.entries(el.style)
          .map(([key, val]) => {
            if (val === undefined || val === null || val === '') return '';
            // Convert camelCase key to kebab-case
            const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            
            // Format background image if relative URL
            let finalVal = val;
            if (kebabKey === 'background-image' && typeof val === 'string' && val !== 'none') {
              const cleaned = val.replace(/^url\(["']?|["']?\)$/g, '');
              // Only resolve if it doesn't already start with http/https
              if (!cleaned.startsWith('http') && !cleaned.startsWith('data:')) {
                finalVal = `url(${resolveImageUrl(cleaned)})`;
              }
            }
            return `${kebabKey}: ${finalVal} !important;`;
          })
          .filter(Boolean)
          .join(' ');
        if (rules) {
          css += `[data-builder-id="${el.id}"] { ${rules} }\n`;
        }
      }
      if (el.children) {
        el.children.forEach(traverse);
      }
    };
    blocks.forEach(traverse);
    return css;
  };

  // Recursive element renderer for no-code nested layouts
  const renderElement = (el: any) => {
    let innerContent: React.ReactNode = null;
    if (el.children && el.children.length > 0) {
      innerContent = el.children.map((c: any) => renderElement(c));
    }

    switch (el.type) {
      case 'Section':
        return (
          <section
            key={el.id}
            data-builder-id={el.id}
            className="w-full relative py-12"
            style={{
              ...el.style,
              backgroundImage: el.style?.backgroundImage && el.style.backgroundImage !== 'none'
                ? `url(${resolveImageUrl(el.style.backgroundImage.replace(/^url\(["']?|["']?\)$/g, ''))})`
                : el.style?.backgroundImage
            }}
          >
            {innerContent}
          </section>
        );
      case 'Container':
        return (
          <div key={el.id} data-builder-id={el.id} className="max-w-7xl mx-auto px-4 relative" style={el.style}>
            {innerContent}
          </div>
        );
      case 'Row':
        return (
          <div key={el.id} data-builder-id={el.id} className="flex flex-wrap -mx-4 relative animate-fade-in" style={el.style}>
            {innerContent}
          </div>
        );
      case 'Column':
        const wClass = {
          '12': 'w-full',
          '10': 'w-10/12',
          '9': 'w-9/12',
          '8': 'w-8/12',
          '6': 'w-full md:w-1/2',
          '4': 'w-full md:w-1/3',
          '3': 'w-full md:w-1/4',
          '2': 'w-full md:w-1/6',
        }[el.settings?.width || '12'] || 'w-full';
        return (
          <div key={el.id} data-builder-id={el.id} className={`px-4 ${wClass} relative mb-6 md:mb-0`} style={el.style}>
            {innerContent}
          </div>
        );
      case 'Heading':
        const HeadingTag = (el.settings?.level || 'h1') as any;
        return (
          <HeadingTag key={el.id} data-builder-id={el.id} className="tracking-tight leading-tight" style={el.style}>
            {el.settings?.text || 'Heading'}
          </HeadingTag>
        );
      case 'Text':
        return (
          <p key={el.id} data-builder-id={el.id} className="leading-relaxed font-light" style={el.style}>
            {el.settings?.text || ''}
          </p>
        );
      case 'Button':
        return (
          <a
            key={el.id}
            data-builder-id={el.id}
            href={el.settings?.link || '#'}
            onClick={(e) => {
              const link = el.settings?.link;
              if (onNavigate && link && !link.startsWith('http') && !link.startsWith('#') && !link.startsWith('mailto:') && !link.startsWith('tel:')) {
                e.preventDefault();
                onNavigate(link.startsWith('/') ? link : `/${link}`);
              }
            }}
            className="inline-block hover:opacity-90 hover:scale-105 transition-all text-center"
            style={el.style}
          >
            {el.settings?.text || 'Button'}
          </a>
        );
      case 'Image':
        return (
          <img
            key={el.id}
            data-builder-id={el.id}
            src={resolveImageUrl(el.settings?.src || '')}
            alt={el.settings?.alt || ''}
            style={el.style}
            className="w-full object-cover"
          />
        );
      case 'Spacer':
        return <div key={el.id} data-builder-id={el.id} style={{ height: `${el.settings?.height || 20}px` }} />;
      case 'Divider':
        return <hr key={el.id} data-builder-id={el.id} style={el.style} className="border-t opacity-30" />;
      case 'Navbar':
        return (
          <header key={el.id} data-builder-id={el.id} className="w-full sticky top-0 z-40 shadow-xs" style={el.style}>
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
              <span className="font-black text-base uppercase tracking-widest text-white">{el.settings?.storeName}</span>
              <nav className="flex space-x-6">
                {(el.settings?.links || []).map((link: any, i: number) => (
                  <a
                    key={i}
                    href={link.url}
                    onClick={(e) => {
                      const url = link.url;
                      if (onNavigate && url && !url.startsWith('http') && !url.startsWith('#') && !url.startsWith('mailto:') && !url.startsWith('tel:')) {
                        e.preventDefault();
                        onNavigate(url.startsWith('/') ? url : `/${url}`);
                      }
                    }}
                    className="text-stone-300 hover:text-white text-xs font-bold uppercase transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
          </header>
        );
      case 'Footer':
        return (
          <footer key={el.id} data-builder-id={el.id} className="w-full border-t border-white/5 py-8" style={el.style}>
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-2xs font-semibold">{el.settings?.text}</p>
            </div>
          </footer>
        );
      case 'Countdown':
        return (
          <div key={el.id} data-builder-id={el.id} className="p-6 bg-orange-500/10 border border-orange-500/20 rounded-3xl text-center" style={el.style}>
            <div className="text-2xs uppercase font-black text-orange-500 tracking-wider mb-3">{el.settings?.title || 'Limited Time Offer'}</div>
            <div className="grid grid-cols-4 gap-3 text-white max-w-xs mx-auto">
              {[
                { val: '02', label: 'days' },
                { val: '14', label: 'hours' },
                { val: '32', label: 'mins' },
                { val: '05', label: 'secs' }
              ].map((t, idx) => (
                <div key={idx} className="bg-orange-500/20 py-3 rounded-2xl text-center border border-orange-500/10">
                  <div className="text-base font-black">{t.val}</div>
                  <div className="text-[9px] uppercase text-orange-300 font-semibold">{t.label}</div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Gallery':
        const galleryImgs = el.settings?.images || [];
        return (
          <div key={el.id} data-builder-id={el.id} className="grid grid-cols-2 md:grid-cols-3 gap-6" style={el.style}>
            {galleryImgs.map((src: string, i: number) => (
              <div key={i} className="aspect-square overflow-hidden rounded-2xl bg-white/5 border border-white/10 group shadow-lg">
                <img
                  src={resolveImageUrl(src)}
                  className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        );
      case 'FAQ':
      case 'Accordion':
        const accordionItems = el.settings?.items || [];
        return (
          <div key={el.id} data-builder-id={el.id} className="space-y-4" style={el.style}>
            {accordionItems.map((item: any, i: number) => (
              <div key={i} className="border border-white/10 rounded-2xl p-4 bg-white/5 backdrop-blur-xs shadow-xs hover:border-white/20 transition-colors">
                <h5 className="text-[13px] font-black text-white">{item.title}</h5>
                <p className="text-xs text-gray-300 mt-1.5 leading-relaxed font-light">{item.content}</p>
              </div>
            ))}
          </div>
        );
      case 'Testimonials':
        const testimonialItems = el.settings?.items || [];
        return (
          <div key={el.id} data-builder-id={el.id} className="grid grid-cols-1 md:grid-cols-2 gap-6" style={el.style}>
            {testimonialItems.map((item: any, i: number) => (
              <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-3xl flex flex-col justify-between shadow-lg">
                <p className="text-xs text-gray-300 font-light leading-relaxed italic">"{item.quote}"</p>
                <div className="flex items-center gap-3 mt-5">
                  <img src={resolveImageUrl(item.avatar)} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                  <div>
                    <h5 className="text-[11px] font-black text-white">{item.author}</h5>
                    <p className="text-[9px] text-gray-400 font-semibold">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'Pricing':
        const pricingPlans = el.settings?.plans || [];
        return (
          <div key={el.id} data-builder-id={el.id} className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto" style={el.style}>
            {pricingPlans.map((p: any, i: number) => (
              <div key={i} className={`p-8 border rounded-3xl flex flex-col justify-between relative ${p.isPopular ? 'border-orange-500 bg-orange-500/5 shadow-xl shadow-orange-500/5 animate-pulse' : 'border-white/10 bg-white/5 shadow-md'}`}>
                {p.isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-orange-500 text-white text-[8px] font-extrabold uppercase tracking-widest rounded-full">Popular</span>
                )}
                <div>
                  <h4 className="text-xs font-black uppercase text-white tracking-widest">{p.name}</h4>
                  <div className="flex items-baseline mt-4 mb-6">
                    <span className="text-3xl font-black text-white">{p.price}</span>
                    <span className="text-gray-400 text-2xs font-bold ml-1">/ {p.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {(p.features || []).map((f: string, idx: number) => (
                      <li key={idx} className="text-gray-300 text-xs font-light flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <a
                  href={p.link}
                  className={`w-full py-3 rounded-xl text-center text-xs font-extrabold transition-all duration-300 ${p.isPopular ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-white/10 hover:bg-white/15 text-white'}`}
                >
                  {p.buttonText}
                </a>
              </div>
            ))}
          </div>
        );
      case 'Contact Form':
        return (
          <div key={el.id} data-builder-id={el.id} className="p-6 border border-white/10 bg-white/5 rounded-3xl shadow-lg" style={el.style}>
            <h4 className="text-sm font-black text-white mb-4">{el.settings?.title || 'Get In Touch'}</h4>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('In demonstration mode — booking form submitted!'); }}>
              <div className="grid grid-cols-2 gap-4">
                <input required type="text" placeholder="First Name" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" />
                <input required type="text" placeholder="Last Name" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" />
              </div>
              <input required type="email" placeholder="Email Address" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" />
              <textarea required rows={4} placeholder="Your Message" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none" />
              <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 text-xs font-bold transition-colors cursor-pointer">Submit Message</button>
            </form>
          </div>
        );
      case 'Slider':
        const sliderSlides = el.settings?.slides || [];
        return (
          <div key={el.id} data-builder-id={el.id} className="relative w-full h-[350px] overflow-hidden rounded-3xl shadow-xl" style={el.style}>
            <div className="absolute inset-0 bg-black/40 z-10" />
            <img src={resolveImageUrl(sliderSlides[0]?.image || '')} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 text-left max-w-md">
              <span className="text-[10px] uppercase font-black tracking-widest text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20 w-fit mb-3">{sliderSlides[0]?.subtitle}</span>
              <h3 className="text-xl md:text-2xl font-black text-white leading-tight mb-2">{sliderSlides[0]?.title}</h3>
              <a
                href={sliderSlides[0]?.buttonLink || '#'}
                className="px-5 py-2.5 bg-orange-500 text-white text-[11px] font-black uppercase tracking-widest rounded-xl w-fit cursor-pointer"
              >
                {sliderSlides[0]?.buttonText}
              </a>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Inspect the layout content schema. If it contains a Section component, it is a page builder design.
  const isNewLayout = page.content_json.some((block: any) => ['Section', 'Navbar', 'Footer'].includes(block.type));

  if (isNewLayout) {
    return (
      <div className="flex flex-col w-full pb-16 animate-fade-in">
        <style dangerouslySetInnerHTML={{ __html: renderStyles(page.content_json) }} />
        {page.content_json.map((block: any) => renderElement(block))}
      </div>
    );
  }

  // Render individual layout blocks (Fallback backward compatibility mode)
  return (
    <div className="flex flex-col w-full space-y-16 pb-16 animate-fade-in">
      {page.content_json.map((block) => {
        switch (block.type) {
          case 'HeroBanner':
            const heroBg = block.settings.backgroundImage || '';
            return (
              <section
                key={block.id}
                className="relative w-full min-h-[500px] flex items-center justify-center overflow-hidden rounded-3xl mx-auto max-w-7xl border border-white/5 shadow-2xl"
                style={{
                  backgroundImage: heroBg ? `url(${resolveImageUrl(heroBg)})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {/* Dark rich overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>

                <div className="relative z-10 max-w-2xl px-8 py-16 mr-auto text-left space-y-6">
                  <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
                    {block.settings.title || 'Welcome To Our Store'}
                  </h1>
                  <p className="text-base md:text-lg text-gray-300 font-light leading-relaxed">
                    {block.settings.description || 'Explore our exclusive premium collections curated just for you.'}
                  </p>
                  <div className="flex items-center space-x-4 pt-2">
                    <button
                      onClick={() => onNavigate?.('/menu')}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all duration-300 flex items-center space-x-2 transform hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/30"
                    >
                      <span>{block.settings.buttonText || 'Shop Now'}</span>
                      <FiChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </section>
            );

          case 'ProductGrid':
            return (
              <section key={block.id} className="max-w-7xl mx-auto px-4 w-full space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h2 className="text-2xl font-bold text-white tracking-wide">
                    {block.settings.title || 'Featured Products'}
                  </h2>
                  <button
                    onClick={() => onNavigate?.('/menu')}
                    className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center space-x-1 transition-colors duration-200"
                  >
                    <span>View All</span>
                    <FiChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {productsLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4 animate-pulse">
                        <div className="aspect-square bg-white/10 rounded-xl w-full"></div>
                        <div className="h-4 bg-white/10 rounded w-2/3"></div>
                        <div className="h-3 bg-white/10 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-gray-400 text-sm">No products found in this store.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {products.slice(0, block.settings.limit || 8).map((product) => (
                      <div
                        key={product.id}
                        className="group relative bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 transform hover:-translate-y-1"
                      >
                        <div>
                          <div className="relative aspect-square overflow-hidden rounded-xl bg-white/10 mb-4">
                            <img
                              src={resolveImageUrl(product.image)}
                              alt={product.name}
                              className="object-cover w-full h-full transform transition-transform duration-500 group-hover:scale-110"
                            />
                          </div>
                          <h4 className="text-sm font-semibold text-white tracking-wide line-clamp-1">
                            {product.name}
                          </h4>
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                            {product.description}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-sm font-black text-indigo-400">
                            ${parseFloat(product.price).toFixed(2)}
                          </span>
                          <button
                            onClick={() => addToCart?.(product)}
                            className="p-2.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl transition-all duration-200 transform active:scale-90"
                          >
                            <FiShoppingBag className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );

          case 'TextBlock':
            return (
              <section
                key={block.id}
                className="max-w-3xl mx-auto px-6 py-12 rounded-2xl bg-white/5 border border-white/10 text-center space-y-4"
              >
                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto text-indigo-400">
                  <FiInfo className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">{block.settings.title || 'About Our Concept'}</h3>
                <p className="text-sm text-gray-300 leading-relaxed font-light">
                  {block.settings.content ||
                    'Add premium layout text explaining details of your store, announcements, story or guidelines.'}
                </p>
              </section>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};
