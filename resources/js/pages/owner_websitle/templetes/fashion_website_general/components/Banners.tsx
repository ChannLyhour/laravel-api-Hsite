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

  useEffect(() => {
    if (ownerUserId) {
      socialMediaService
        .getPublicSocials(ownerUserId)
        .then((data) => setSocials((data || []).filter((s) => s.status)))
        .catch((err) => console.error('Failed to load socials:', err));
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
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative h-[250px] sm:h-[450px] lg:h-[420px] w-full rounded-md overflow-hidden group/slider bg-stone-100 border border-stone-200/20 cursor-pointer hover:shadow-lg transition-shadow duration-300 select-none touch-pan-y"
        >
          {/* Background Images Layer */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <HeroBannerSlider
              slides={slides}
              loopSlides={loopSlides}
              currentSlide={currentSlide}
              dragOffset={dragOffset}
              dragStartX={dragStartX}
              transitionEnabled={transitionEnabled}
              onTransitionEnd={handleTransitionEnd}
            />
          </div>

          {/* Floating Social Icon Strip (right edge, vertical) */}
          {socials.length > 0 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 flex-col items-center gap-2 p-2 rounded-full bg-stone-950/35 backdrop-blur-md border border-white/10 shadow-xl select-none"
            >
              {socials.map((social, idx) => {
                const { icon, bg } = getSocialIcon(social.name);
                return (
                  <a
                    key={social.id}
                    href={social.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={social.name}
                    className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center text-white shadow-md hover:scale-110 hover:shadow-lg active:scale-95 transition-all duration-300`}
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    {icon}
                  </a>
                );
              })}
            </div>
          )}

          {/* Pagination Dots Capsule */}
          {slides.length > 1 && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 z-20 flex items-center gap-1.5 sm:gap-2.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-stone-950/45 backdrop-blur-md border border-white/10 shadow-lg select-none"
            >
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (isDragging || activeDotIdx === index) return;
                    setCurrentSlide(index);
                  }}
                  className={`rounded-full transition-all duration-500 cursor-pointer border-none ${
                    activeDotIdx === index ? 'w-6 sm:w-7 bg-[#E61E25] h-1 sm:h-1.5' : 'w-1 sm:w-1.5 h-1 sm:h-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>


    </section>
  );
};
