import React, { useState, useEffect, useMemo } from 'react';
import { FiChevronLeft, FiChevronRight, FiGlobe } from 'react-icons/fi';
import {
  FaFacebookF,
  FaTelegramPlane,
  FaTiktok,
  FaInstagram,
  FaYoutube,
  FaPinterest,
  FaTwitter,
  FaLinkedinIn,
} from 'react-icons/fa';
import '../styles/animation.css';
import type { HeroPageProps } from '../types';
import { resolveImageUrl } from '../utils/imageUtils';
import { FASHION_ROUTES } from '../routes';
import { socialMediaService, type SocialMediaRow } from '@/api/owner/socialMedia';
import { HeroBannerSlider } from './helpers/HeroBannerSlider';
import { brandsService, type Brand } from '@/api/owner/brands';


/* ── tiny platform-icon resolver (banner-only) ── */
const getSocialIcon = (platform: string) => {
  const name = platform.toLowerCase();
  const map: Record<string, { icon: React.ReactNode; bg: string }> = {
    facebook:  { icon: <FaFacebookF    className="w-3.5 h-3.5" />, bg: 'bg-[#1877F2]' },
    instagram: { icon: <FaInstagram    className="w-3.5 h-3.5" />, bg: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]' },
    tiktok:    { icon: <FaTiktok       className="w-3.5 h-3.5" />, bg: 'bg-black' },
    telegram:  { icon: <FaTelegramPlane className="w-3.5 h-3.5" />, bg: 'bg-[#229ED9]' },
    youtube:   { icon: <FaYoutube      className="w-3.5 h-3.5" />, bg: 'bg-[#FF0000]' },
    pinterest: { icon: <FaPinterest    className="w-3.5 h-3.5" />, bg: 'bg-[#BD081C]' },
    twitter:   { icon: <FaTwitter      className="w-3.5 h-3.5" />, bg: 'bg-[#1DA1F2]' },
    linkedin:  { icon: <FaLinkedinIn   className="w-3.5 h-3.5" />, bg: 'bg-[#0A66C2]' },
  };
  return map[name] || { icon: <FiGlobe className="w-3.5 h-3.5" />, bg: 'bg-stone-500' };
};


export const HeroPage: React.FC<HeroPageProps> = (props) => {
  if (props.isLoading) {
    return (
      <section className="relative bg-white font-sans overflow-hidden animate-pulse">
        <div className="w-full max-w-7xl mx-auto px-1.5 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="relative h-[150px] sm:h-[450px] lg:h-[420px] w-full rounded-md overflow-hidden bg-stone-250 dark:bg-stone-850 shadow-3xs" />
        </div>
      </section>
    );
  }
  if (!props.banners || props.banners.length === 0) return null;
  return <HeroPageInner {...props} />;
};

const HeroPageInner: React.FC<HeroPageProps> = ({
  storeName = 'Prime Store',
  stores,
  onNavigate,
  ownerUserId,
  banners = [],
}) => {
  const storeSlug = (stores?.store_name || storeName).replace(/\s+/g, '_');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animating, setAnimating] = useState(false);

  /* ── Swipe/Drag state ── */
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);

  /* ── Social media links (compact banner strip) ── */
  const [socials, setSocials] = useState<SocialMediaRow[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    if (ownerUserId) {
      socialMediaService
        .getPublicSocials(ownerUserId)
        .then((data) => setSocials((data || []).filter((s) => s.status)))
        .catch((err) => console.error('Failed to load socials:', err));

      brandsService
        .getBrands(100, 0, ownerUserId)
        .then((data) => setBrands((data || []).filter((b) => b.status)))
        .catch((err) => console.error('Failed to load brands:', err));
    }
  }, [ownerUserId]);

  const slides = useMemo(() => {
    return banners.map((b, idx) => {
      const hasContent = !!(b.title || b.description);
      return {
        tagline: hasContent ? 'PROMOTIONAL' : '',
        title: b.title || '',
        desc: b.description || '',
        image1: resolveImageUrl(b.image),
        badge: hasContent ? (idx % 2 === 0 ? "Featured" : "Trending") : '',
        hasContent,
      };
    });
  }, [banners]);

  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartedRef = React.useRef(false);

  // Create cloned list for infinite looping [CloneLast, Item1, Item2, ..., CloneFirst]
  const loopSlides = useMemo(() => {
    if (slides.length <= 1) return slides;
    return [
      slides[slides.length - 1],
      ...slides,
      slides[0]
    ];
  }, [slides]);

  // Current active dot index mapping
  const activeDotIdx = useMemo(() => {
    if (currentSlide === -1) return slides.length - 1;
    if (currentSlide === slides.length) return 0;
    return currentSlide;
  }, [currentSlide, slides.length]);

  useEffect(() => {
    setCurrentSlide(0);
  }, [slides]);

  useEffect(() => {
    if (slides.length <= 1 || dragStartX !== null || isDragging) return;
    const timer = setInterval(() => {
      if (!document.hidden) {
        handleNext();
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [currentSlide, slides.length, dragStartX, isDragging]);

  const handleNext = () => {
    if (slides.length <= 1) return;
    setCurrentSlide(prev => prev + 1);
  };

  const handlePrev = () => {
    if (slides.length <= 1) return;
    setCurrentSlide(prev => prev - 1);
  };

  const handleDragStart = (clientX: number) => {
    if (slides.length <= 1) return;

    // Instantly snap back to bounds if we are currently out of bounds
    if (currentSlide < 0) {
      setTransitionEnabled(false);
      setCurrentSlide(slides.length - 1);
    } else if (currentSlide >= slides.length) {
      setTransitionEnabled(false);
      setCurrentSlide(0);
    }

    setDragStartX(clientX);
    setIsDragging(true);
    setDragStartTime(Date.now());
    dragStartedRef.current = false;
  };

  const handleDragMove = (clientX: number) => {
    if (dragStartX === null || !isDragging) return;
    const diff = clientX - dragStartX;
    setDragOffset(diff);
  };

  const handleDragEnd = () => {
    if (dragStartX === null || !isDragging) return;

    const threshold = 50;
    if (dragOffset < -threshold) {
      handleNext();
    } else if (dragOffset > threshold) {
      handlePrev();
    }

    setDragStartX(null);
    setDragOffset(0);
    setIsDragging(false);
  };

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    if (e.target !== e.currentTarget) return;
    if (currentSlide === -1) {
      setTransitionEnabled(false);
      setCurrentSlide(slides.length - 1);
    } else if (currentSlide === slides.length) {
      setTransitionEnabled(false);
      setCurrentSlide(0);
    }
  };

  useEffect(() => {
    if (!transitionEnabled) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionEnabled(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [transitionEnabled]);

  /* ── Touch event handlers for mobile swiping ── */
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleDragStart(e.touches[0].clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartX !== null && e.touches.length > 0) {
      const diff = Math.abs(e.touches[0].clientX - dragStartX);
      if (diff > 5) {
        dragStartedRef.current = true;
      }
    }
    if (e.touches.length > 0) {
      handleDragMove(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  /* ── Mouse event handlers for desktop dragging ── */
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    handleDragStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStartX !== null) {
      const diff = Math.abs(e.clientX - dragStartX);
      if (diff > 5) {
        dragStartedRef.current = true;
      }
    }
    handleDragMove(e.clientX);
  };

  const handleMouseUpOrLeave = () => {
    handleDragEnd();
  };

  const handleClick = (e: React.MouseEvent) => {
    if (dragStartedRef.current) {
      dragStartedRef.current = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const dragDuration = Date.now() - dragStartTime;
    // If the mouse/finger moved significantly or the press was long, prevent standard navigation click
    if (Math.abs(dragOffset) > 8 || dragDuration > 300) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (onNavigate) {
      onNavigate(FASHION_ROUTES.getShop(ownerUserId || '', storeSlug));
    }
  };

  if (slides.length === 0) return null;

  return (
    <section className="relative bg-white font-sans overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-1.5 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div 
          onClick={handleClick}
          className="relative h-[250px] sm:h-[450px] lg:h-[420px] w-full rounded-md overflow-hidden group/slider bg-[#EAEAEA] bg-[radial-gradient(#C5C5C5_1px,transparent_1px)] [background-size:16px_16px] border border-stone-200/20 cursor-pointer hover:shadow-lg transition-shadow duration-300 select-none"
        >
          {/* Collage Layer */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            {/* New Season Blue Badge Sticker */}
            <div className="absolute top-[8%] left-[4%] sm:top-[12%] sm:left-[10%] z-20 bg-[#003CFF] text-white px-3 py-1 sm:px-6 sm:py-2.5 font-sans font-black text-lg sm:text-4xl uppercase tracking-tighter -rotate-[6deg] shadow-lg inline-block select-none pointer-events-none animate-bounce-slow">
              New Season
            </div>

            {/* Black Leather Bag */}
            <img 
              src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=500&q=80"
              className="absolute left-[1%] sm:left-[6%] top-[28%] sm:top-[22%] w-[80px] sm:w-[220px] h-auto object-contain z-10 filter grayscale contrast-[150%] mix-blend-darken select-none pointer-events-none"
              alt="Fashion Bag"
            />

            {/* Black Jacket (Center) */}
            <img 
              src="https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=600&q=80"
              className="absolute left-1/2 top-[5%] -translate-x-1/2 w-[120px] sm:w-[350px] h-auto object-contain z-0 filter grayscale contrast-[140%] mix-blend-darken select-none pointer-events-none"
              alt="Jacket"
            />

            {/* Black Baseball Cap (overlaps jacket bottom) */}
            <img 
              src="https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=400&q=80"
              className="absolute left-[38%] sm:left-[45%] top-[55%] sm:top-[48%] w-[60px] sm:w-[170px] h-auto object-contain z-20 filter grayscale contrast-[160%] mix-blend-darken select-none pointer-events-none"
              alt="Cap"
            />

            {/* White Sticker text on right */}
            <div className="absolute right-[2%] sm:right-[10%] top-[25%] sm:top-[22%] z-20 bg-white text-black px-3 py-1 sm:px-5 sm:py-2.5 font-sans font-bold text-[8px] sm:text-xs tracking-wider uppercase rotate-[4deg] shadow-md border border-slate-200/40 select-none max-w-[100px] sm:max-w-[200px] text-center pointer-events-none">
              Discover the latest arrivals, all in one place.
            </div>

            {/* Sneakers (Right side) */}
            <img 
              src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=500&q=80"
              className="absolute right-[1%] sm:right-[5%] top-[35%] sm:top-[28%] w-[90px] sm:w-[260px] h-auto object-contain z-10 filter grayscale contrast-[140%] mix-blend-darken select-none pointer-events-none"
              alt="Sneakers"
            />

            {/* Bottom buttons row */}
            <div className="absolute bottom-[6%] sm:bottom-[8%] left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onNavigate) {
                    onNavigate(FASHION_ROUTES.getShop(ownerUserId, storeSlug, { hash: '#men-fashion' }));
                  }
                }}
                className="px-4 py-1.5 sm:px-6 sm:py-2 border border-black bg-white hover:bg-black hover:text-white text-black font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all cursor-pointer shadow-sm rounded-none"
              >
                Men
              </button>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onNavigate) {
                    onNavigate(FASHION_ROUTES.getShop(ownerUserId, storeSlug, { hash: '#women-fashion' }));
                  }
                }}
                className="px-4 py-1.5 sm:px-6 sm:py-2 border border-black bg-white hover:bg-black hover:text-white text-black font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all cursor-pointer shadow-sm rounded-none"
              >
                Women
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Logos Strip */}
      <div className="w-full bg-white py-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 items-center justify-items-center">
            {(brands.length > 0 ? brands : [
              { id: 1, name: 'TEN & ELEVEN', logo: null },
              { id: 2, name: 'ROUTINE', logo: null },
              { id: 3, name: 'TAG SPACE', logo: null },
              { id: 4, name: '361°', logo: null },
              { id: 5, name: 'Pomelo.', logo: null },
              { id: 6, name: 'GATONI', logo: null },
            ]).map((brand, idx) => (
              <div 
                key={brand.id || idx} 
                className="w-full max-w-[140px] aspect-[5/2] bg-black text-white flex items-center justify-center font-black tracking-widest text-[10px] sm:text-xs uppercase border border-neutral-900 select-none shadow-xs rounded-[2px]"
              >
                {brand.logo ? (
                  <img 
                    src={resolveImageUrl(brand.logo)} 
                    alt={brand.name} 
                    className="max-h-[75%] max-w-[85%] object-contain"
                  />
                ) : (
                  <span className="font-sans font-black text-center px-2">{brand.name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
