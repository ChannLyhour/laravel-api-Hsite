import React, { useState, useEffect } from 'react';

export type TextSize = '3xs' | '2xs' | 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | `${number}px`;

export interface ResponsiveProp<T> {
     mobile?: T;
     tablet?: T;
     desktop?: T;
}

export interface TextSpProps {
     /**
      * The text content to style and render.
      */
     children?: string;
     /**
      * The HTML tag/element to render. Defaults to 'span'.
      */
     as?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span';
     /**
      * Font size. Can be a static size or a responsive object mapping viewport breakpoints.
      * e.g., size="lg" or size={{ mobile: 'sm', tablet: 'md', desktop: '2xl' }}
      */
     size?: TextSize | ResponsiveProp<TextSize>;
     /**
      * Font weight weight.
      */
     weight?: 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
     /**
      * Text alignment. Can be responsive.
      */
     align?: 'left' | 'center' | 'right' | 'justify' | ResponsiveProp<'left' | 'center' | 'right' | 'justify'>;
     /**
      * Text color class (Tailwind class, e.g. 'text-slate-800' or 'text-primary').
      */
     color?: string;
     /**
      * Font family: 'sans' (Outfit) or 'kontomruy' (Plus Jakarta Sans / Kantumruy Pro).
      */
     font?: 'sans' | 'kontomruy' | string;
     /**
      * Letter spacing.
      */
     tracking?: 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest';
     /**
      * Line height.
      */
     leading?: 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose';
     /**
      * If true, applies gradient text using brand colors (orange to gold).
      * If a string is passed, it uses that custom gradient class (e.g. "from-purple-500 to-pink-500").
      */
     gradient?: boolean | string;
     /**
      * Italic text style.
      */
     italic?: boolean;
     /**
      * Text transform: uppercase.
      */
     uppercase?: boolean;
     /**
      * Text transform: lowercase.
      */
     lowercase?: boolean;
     /**
      * Text transform: capitalize.
      */
     capitalize?: boolean;
     /**
      * If true, highlights the first word of the text.
      */
     highlightFirstWord?: boolean;
     /**
      * If true, highlights the last word of the text.
      */
     highlightLastWord?: boolean;
     /**
      * Highlight specific word indices (0-indexed).
      */
     highlightIndices?: number[];
     /**
      * Custom className to apply to highlighted words. Defaults to 'text-primary font-black'.
      */
     highlightClassName?: string;
     /**
      * Custom style to apply to normal words (when splitting).
      */
     wordClassName?: string;
     /**
      * Micro-animation style: 'fade-in', 'slide-up', or none.
      */
     animate?: 'fade-in' | 'slide-up';
     /**
      * If true, adds a hover animation to each individual word (scale up slightly).
      */
     hoverScaleWords?: boolean;
     /**
      * Standard React classes.
      */
     className?: string;
     /**
      * If specified, truncates the text to a certain character count and appends '...'.
      * Can be a single number or a responsive object mapping viewport categories.
      */
     truncateCount?: number | ResponsiveProp<number>;
     /**
      * Inline styles.
      */
     style?: React.CSSProperties;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tailwind Class Mappers
// ─────────────────────────────────────────────────────────────────────────────

const sizeToClass = (size: TextSize): string => {
     if (size.endsWith('px')) {
          return `text-[${size}]`;
     }
     switch (size) {
          case '3xs': return 'text-3xs';
          case '2xs': return 'text-2xs';
          case 'xs': return 'text-xs';
          case 'sm': return 'text-sm';
          case 'base': return 'text-base';
          case 'md': return 'text-md';
          case 'lg': return 'text-lg';
          case 'xl': return 'text-xl';
          case '2xl': return 'text-2xl';
          case '3xl': return 'text-3xl';
          case '4xl': return 'text-4xl';
          case '5xl': return 'text-5xl';
          case '6xl': return 'text-6xl';
          case '7xl': return 'text-7xl';
          default: return 'text-base';
     }
};

const resolveResponsiveSize = (sizeProp?: TextSize | ResponsiveProp<TextSize>): string => {
     if (!sizeProp) return '';
     if (typeof sizeProp === 'string') {
          return sizeToClass(sizeProp);
     }
     const classes: string[] = [];
     if (sizeProp.mobile) {
          classes.push(sizeToClass(sizeProp.mobile));
     }
     if (sizeProp.tablet) {
          classes.push(`md:${sizeToClass(sizeProp.tablet)}`);
     }
     if (sizeProp.desktop) {
          classes.push(`lg:${sizeToClass(sizeProp.desktop)}`);
     }
     return classes.join(' ');
};

const alignToClass = (align: 'left' | 'center' | 'right' | 'justify'): string => {
     return `text-${align}`;
};

const resolveResponsiveAlign = (alignProp?: 'left' | 'center' | 'right' | 'justify' | ResponsiveProp<'left' | 'center' | 'right' | 'justify'>): string => {
     if (!alignProp) return '';
     if (typeof alignProp === 'string') {
          return alignToClass(alignProp);
     }
     const classes: string[] = [];
     if (alignProp.mobile) {
          classes.push(alignToClass(alignProp.mobile));
     }
     if (alignProp.tablet) {
          classes.push(`md:${alignToClass(alignProp.tablet)}`);
     }
     if (alignProp.desktop) {
          classes.push(`lg:${alignToClass(alignProp.desktop)}`);
     }
     return classes.join(' ');
};

const weightToClass = (weight?: TextSpProps['weight']): string => {
     if (!weight) return '';
     return `font-${weight}`;
};

const trackingToClass = (tracking?: TextSpProps['tracking']): string => {
     if (!tracking) return '';
     return `tracking-${tracking}`;
};

const leadingToClass = (leading?: TextSpProps['leading']): string => {
     if (!leading) return '';
     return `leading-${leading}`;
};

const fontToClass = (font?: TextSpProps['font']): string => {
     if (!font) return '';
     return font === 'sans' ? 'font-sans' : 'font-kontomruy';
};

// Custom hook to detect current viewport category: mobile (< 768px), tablet (>= 768px and < 1024px), desktop (>= 1024px)
const useBreakpoint = () => {
     const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

     useEffect(() => {
          const handleResize = () => {
               const width = window.innerWidth;
               if (width < 768) {
                    setBreakpoint('mobile');
               } else if (width < 1024) {
                    setBreakpoint('tablet');
               } else {
                    setBreakpoint('desktop');
               }
          };

          handleResize(); // call initially
          window.addEventListener('resize', handleResize);
          return () => window.removeEventListener('resize', handleResize);
     }, []);

     return breakpoint;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component Implementation
// ─────────────────────────────────────────────────────────────────────────────

export const TextSp: React.FC<TextSpProps> = ({
     children = '',
     as: Component = 'span',
     size,
     weight,
     align,
     color = '',
     font,
     tracking,
     leading,
     gradient,
     italic = false,
     uppercase = false,
     lowercase = false,
     capitalize = false,
     highlightFirstWord = false,
     highlightLastWord = false,
     highlightIndices,
     highlightClassName = 'text-primary font-black',
     wordClassName = '',
     animate,
     hoverScaleWords = false,
     truncateCount,
     className = '',
     style,
}) => {
     const breakpoint = useBreakpoint();

     const content = React.useMemo(() => {
          if (!children) return null;

          let textToProcess = children;

          let activeLimit: number | undefined;
          if (truncateCount !== undefined) {
               if (typeof truncateCount === 'number') {
                    activeLimit = truncateCount;
               } else {
                    if (breakpoint === 'mobile') {
                         activeLimit = truncateCount.mobile;
                    } else if (breakpoint === 'tablet') {
                         activeLimit = truncateCount.tablet ?? truncateCount.mobile;
                    } else {
                         activeLimit = truncateCount.desktop ?? truncateCount.tablet ?? truncateCount.mobile;
                    }
               }
          }

          if (activeLimit !== undefined && children.length > activeLimit) {
               textToProcess = children.substring(0, activeLimit).trim() + '...';
          }

          const shouldSplit = highlightFirstWord || highlightLastWord || (highlightIndices && highlightIndices.length > 0) || hoverScaleWords;
          if (!shouldSplit) return textToProcess;

          // Split text keeping spaces so we preserve original formatting
          const tokens = textToProcess.split(/(\s+)/);

          let wordIndex = 0;
          // Count actual words to compute the last word index correctly
          const actualWordsCount = tokens.filter(t => !/^\s+$/.test(t) && t.length > 0).length;

          return tokens.map((token, tokenIdx) => {
               // If it is whitespace, render as a plain text node
               if (/^\s+$/.test(token) || token === '') {
                    return <React.Fragment key={tokenIdx}>{token}</React.Fragment>;
               }

               const currentIdx = wordIndex;
               wordIndex++;

               // Check if this word should be highlighted
               let isHighlighted = false;
               if (highlightFirstWord && currentIdx === 0) {
                    isHighlighted = true;
               }
               if (highlightLastWord && currentIdx === actualWordsCount - 1) {
                    isHighlighted = true;
               }
               if (highlightIndices && highlightIndices.includes(currentIdx)) {
                    isHighlighted = true;
               }

               const wordClasses = [
                    wordClassName,
                    isHighlighted ? highlightClassName : '',
                    hoverScaleWords ? 'inline-block transition-transform duration-200 hover:scale-[1.08] origin-center cursor-default' : 'inline-block'
               ].filter(Boolean).join(' ');

               return (
                    <span key={tokenIdx} className={wordClasses}>
                         {token}
                    </span>
               );
          });
     }, [
          children,
          highlightFirstWord,
          highlightLastWord,
          highlightIndices,
          highlightClassName,
          wordClassName,
          hoverScaleWords,
          truncateCount,
          breakpoint,
     ]);

     // Build root container classes
     const rootClasses = [
          // Standard classes
          resolveResponsiveSize(size),
          weightToClass(weight),
          resolveResponsiveAlign(align),
          fontToClass(font),
          trackingToClass(tracking),
          leadingToClass(leading),

          // Gradient text support
          gradient
               ? `${typeof gradient === 'string' ? gradient : 'bg-gradient-to-r from-[#ff6b35] to-[#f59e0b]'} bg-clip-text text-transparent`
               : color,

          // Typography styles
          italic ? 'italic' : '',
          uppercase ? 'uppercase' : '',
          lowercase ? 'lowercase' : '',
          capitalize ? 'capitalize' : '',

          // Entrance animations
          animate === 'fade-in' ? 'animate-fade-in' : '',
          animate === 'slide-up' ? 'animate-slide-up' : '',

          className,
     ].filter(Boolean).join(' ');

     return (
          <Component className={rootClasses} style={style}>
               {content}
          </Component>
     );
};
