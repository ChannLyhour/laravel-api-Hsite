import React from 'react';

interface HeroBannerSliderProps {
     slides: any[];
     loopSlides: any[];
     currentSlide: number;
     dragOffset: number;
     dragStartX: number | null;
     transitionEnabled: boolean;
     onTransitionEnd: (e: React.TransitionEvent) => void;
}

export const HeroBannerSlider: React.FC<HeroBannerSliderProps> = ({
     slides,
     loopSlides,
     currentSlide,
     dragOffset,
     dragStartX,
     transitionEnabled,
     onTransitionEnd,
}) => {
     return (
          <div
               className="flex w-full h-full flex-nowrap"
               style={{
                    transform: `translate3d(calc(${
                         slides.length <= 1 ? -currentSlide * 100 : (-currentSlide - 1) * 100
                    }% + ${dragOffset}px), 0, 0)`,
                    transition:
                         dragStartX !== null || !transitionEnabled
                              ? 'none'
                              : 'transform 1600ms ease',
               }}
               onTransitionEnd={onTransitionEnd}
          >
               {loopSlides.map((slide, idx) => (
                    <div key={idx} className="w-full h-full shrink-0 relative overflow-hidden">
                         <img
                              src={slide.image1}
                              alt={slide.title || 'Banner'}
                              className="w-full h-full object-cover object-center select-none pointer-events-none"
                              draggable={false}
                         />
                    </div>
               ))}
          </div>
     );
};
