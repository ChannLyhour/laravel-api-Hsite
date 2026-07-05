import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiChevronRight } from 'react-icons/fi';
import '@/pages/owner_manage/style/font.css';

export interface FilterOption {
  id: string;
  label: string;
  hasArrow?: boolean;
  onArrowClick?: () => void;
}

export interface FilterSection {
  id: string;
  title: string;
  type: 'radio' | 'checkbox';
  options: FilterOption[];
  hasSeeMore?: boolean;
  seeMoreLabel?: string;
  onSeeMoreClick?: () => void;
}

interface HelperFilterProps {
  isOpen: boolean;
  onClose: () => void;
  sections: FilterSection[];
  selectedValues: Record<string, any>; // maps sectionId to string (for radio) or string[] (for checkbox)
  onChange: (sectionId: string, value: any) => void;
  onClear: () => void;
  onApply: () => void;
  children?: React.ReactNode;
}

export const HelperFilter: React.FC<HelperFilterProps> = ({
  isOpen,
  onClose,
  sections,
  selectedValues,
  onChange,
  onClear,
  onApply,
  children,
}) => {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheckboxChange = (sectionId: string, optionId: string, checked: boolean) => {
    const currentList = Array.isArray(selectedValues[sectionId]) ? selectedValues[sectionId] : [];
    let updatedList: string[];
    if (checked) {
      updatedList = [...currentList, optionId];
    } else {
      updatedList = currentList.filter((id: string) => id !== optionId);
    }
    onChange(sectionId, updatedList);
  };

  return createPortal(
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-900/40 z-[200] transition-opacity duration-300 ease-in-out"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-slate-50 border-l border-slate-200 z-[210] flex flex-col shadow-2xl animate-slide-left font-kuntomruy">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50/80 to-white px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Filter</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[5px] hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border-none bg-transparent"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {children}
          {sections.map((section) => {
            const isRadio = section.type === 'radio';
            const val = selectedValues[section.id];

            return (
              <div
                key={section.id}
                className="bg-white border border-slate-200/80 p-5 rounded-[5px] space-y-4 shadow-2xs text-left"
              >
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  {section.title}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 pt-1">
                  {section.options.map((opt) => {
                    const isChecked = isRadio
                      ? val === opt.id
                      : Array.isArray(val) && val.includes(opt.id);

                    return (
                      <div
                        key={opt.id}
                        className="flex items-center justify-between group hover:bg-slate-50/50 p-1 rounded-[5px] transition-colors"
                      >
                        <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-semibold text-slate-650 w-full select-none">
                          {isRadio ? (
                            <input
                              type="radio"
                              name={section.id}
                              checked={isChecked}
                              onChange={() => onChange(section.id, opt.id)}
                              className="w-4 h-4 text-primary border-slate-300 focus:ring-primary/20 accent-primary"
                            />
                          ) : (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) =>
                                handleCheckboxChange(section.id, opt.id, e.target.checked)
                              }
                              className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary/20 accent-primary"
                            />
                          )}
                          <span className="leading-none mt-0.5">{opt.label}</span>
                        </label>

                        {opt.hasArrow && (
                          <button
                            type="button"
                            onClick={() => opt.onArrowClick?.()}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-650 transition-colors border-none bg-transparent cursor-pointer"
                          >
                            <FiChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {section.hasSeeMore && (
                  <div className="pt-2 border-t border-slate-100 flex justify-center">
                    <button
                      type="button"
                      onClick={section.onSeeMoreClick}
                      className="text-xs font-extrabold text-[#0f53a1] hover:text-[#0b4789] hover:underline bg-transparent border-none cursor-pointer"
                    >
                      {section.seeMoreLabel || 'See More'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sticky Footer */}
        <div className="bg-white border-t border-slate-100 px-6 py-4 flex gap-4 shrink-0 shadow-sm">
          <button
            type="button"
            onClick={onClear}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-[5px] text-xs transition-colors cursor-pointer border-none text-center select-none"
          >
            Clear Filter
          </button>
          <button
            type="button"
            onClick={onApply}
            className="flex-1 py-2.5 bg-[#0f53a1] hover:bg-[#0b4789] text-white font-extrabold rounded-[5px] text-xs transition-all cursor-pointer border-none text-center shadow-xs active:scale-98 select-none"
          >
            Apply
          </button>
        </div>
      </div>
    </>
    ,
    document.body
  );
};
