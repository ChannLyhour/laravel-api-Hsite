import React, { useEffect, useState } from 'react';
import { FiSliders, FiPlus, FiX, FiChevronDown, FiChevronUp, FiCheck } from 'react-icons/fi';
import { attributesService } from '@/api/owner/categories';
import type { ProductAttribute, ProductAttributeValue } from '@/api/owner/categories';
import { ApiError } from '@/api/client';
import { toast } from '@/pages/owner_manage/utils/toast';

export interface SelectedAttributeValue {
  attributeId: number;
  attributeName: string;
  valueId: number;
  value: string;
}

interface ProductAttributesSelectorProps {
  ownerId?: number | string;
  selected: SelectedAttributeValue[];
  onChange: (selected: SelectedAttributeValue[]) => void;
  onAttributesUpdated?: (attributes: ProductAttribute[]) => void;
}

export const ProductAttributesSelector: React.FC<ProductAttributesSelectorProps> = ({
  ownerId,
  selected,
  onChange,
  onAttributesUpdated,
}) => {
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAttrId, setExpandedAttrId] = useState<number | null>(null);

  // Quick-create new attribute inline
  const [showNewAttr, setShowNewAttr] = useState(false);
  const [newAttrName, setNewAttrName] = useState('');
  const [creatingAttr, setCreatingAttr] = useState(false);

  // Quick-add value to an existing attribute
  const [addingValueForId, setAddingValueForId] = useState<number | null>(null);
  const [newValueText, setNewValueText] = useState('');
  const [newValueColor, setNewValueColor] = useState('#FF5500');
  const [addingValue, setAddingValue] = useState(false);

  const fetchAttributes = async () => {
    try {
      setLoading(true);
      const data = await attributesService.getAttributes(ownerId);
      setAttributes(data || []);
      onAttributesUpdated?.(data || []);
      // Auto-expand first attribute
      if (data && data.length > 0 && expandedAttrId === null) {
        setExpandedAttrId(data[0].id);
      }
    } catch {
      toast.error('Failed to load attributes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, [ownerId]);

  const isValueSelected = (valueId: number) =>
    selected.some(s => s.valueId === valueId);

  const toggleValue = (attr: ProductAttribute, val: ProductAttributeValue) => {
    if (isValueSelected(val.id)) {
      onChange(selected.filter(s => s.valueId !== val.id));
    } else {
      onChange([
        ...selected,
        {
          attributeId: attr.id,
          attributeName: attr.name,
          valueId: val.id,
          value: val.value,
        },
      ]);
    }
  };

  const handleCreateAttribute = async () => {
    if (!newAttrName.trim() || creatingAttr) return;
    setCreatingAttr(true);
    try {
      const created = await attributesService.createAttribute(newAttrName.trim());
      toast.success(`Attribute "${created.name}" created!`);
      setNewAttrName('');
      setShowNewAttr(false);
      const updated = await attributesService.getAttributes(ownerId);
      setAttributes(updated || []);
      onAttributesUpdated?.(updated || []);
      setExpandedAttrId(created.id);
    } catch (err) {
      if (err instanceof ApiError) {
        // Show field-level validation errors (e.g. duplicate name) if present
        const fieldError = err.details.errors?.name?.[0];
        toast.error(fieldError || err.details.message || 'Failed to create attribute.');
      } else {
        toast.error('Failed to create attribute.');
      }
    } finally {
      setCreatingAttr(false);
    }
  };

  const handleAddValue = async (attr: ProductAttribute) => {
    if (!newValueText.trim() || addingValueForId === null || addingValue) return;
    setAddingValue(true);
    try {
      const isColorAttr = attr.name.toLowerCase() === 'color';
      const finalValue = isColorAttr
        ? `${newValueText.trim()}|${newValueColor}`
        : newValueText.trim();

      const created = await attributesService.createAttributeValue(attr.id, finalValue);
      toast.success(`Value added!`);
      setNewValueText('');
      setAddingValueForId(null);

      // Update local attribute values without refetching all
      const updatedAttributes = attributes.map(a =>
        a.id === attr.id
          ? { ...a, values: [...(a.values || []), created] }
          : a
      );
      setAttributes(updatedAttributes);
      onAttributesUpdated?.(updatedAttributes);

      // Automatically select the newly created value globally
      onChange([
        ...selected,
        {
          attributeId: attr.id,
          attributeName: attr.name,
          valueId: created.id,
          value: created.value,
        }
      ]);
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldError = err.details.errors?.value?.[0];
        toast.error(fieldError || err.details.message || 'Failed to add value.');
      } else {
        toast.error('Failed to add value.');
      }
    } finally {
      setAddingValue(false);
    }
  };

  const parseValue = (raw: string) => {
    if (raw.includes('|')) {
      const [name, hex] = raw.split('|');
      return { name, hex };
    }
    return { name: raw, hex: null };
  };

  return (
    <div className="space-y-3">
      {/* Selected chips summary */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-3 bg-orange-50/60 border border-orange-100 rounded-[5px]">
          {selected.map(s => {
            const { name, hex } = parseValue(s.value);
            return (
              <span
                key={s.valueId}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-orange-200 rounded-[5px] text-[11px] font-bold text-slate-700 shadow-3xs"
              >
                {hex && (
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-slate-200 shrink-0"
                    style={{ backgroundColor: hex }}
                  />
                )}
                <span className="text-slate-400 text-[10px]">{s.attributeName}:</span>
                {name}
                <button
                  type="button"
                  onClick={() => onChange(selected.filter(x => x.valueId !== s.valueId))}
                  className="text-slate-300 hover:text-rose-500 transition-colors cursor-pointer bg-transparent border-none p-0 leading-none"
                >
                  <FiX className="w-3 h-3 stroke-[3]" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 py-4 text-slate-400 text-xs font-bold">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading attributes...
        </div>
      )}

      {/* Attributes accordion list */}
      {!loading && attributes.length > 0 && (
        <div className="space-y-2">
          {attributes.map(attr => {
            const isExpanded = expandedAttrId === attr.id;
            const values = attr.values || [];
            const colorValues = values.filter(v => v.value.includes('|'));
            const hasColors = colorValues.length > 0;
            const selectedCount = values.filter(v => isValueSelected(v.id)).length;
            const isColorAttr = attr.name.toLowerCase() === 'color';

            return (
              <div
                key={attr.id}
                className={`border rounded-[5px] transition-all duration-200 ${isExpanded ? 'border-orange-200 shadow-sm' : 'border-slate-100'
                  }`}
              >
                {/* Accordion header */}
                <button
                  type="button"
                  onClick={() => setExpandedAttrId(isExpanded ? null : attr.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer bg-transparent border-none rounded-[5px] hover:bg-slate-50/80 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <FiSliders className={`w-3.5 h-3.5 shrink-0 ${isExpanded ? 'text-primary' : 'text-slate-400'}`} />
                    <span className={`text-xs font-extrabold ${isExpanded ? 'text-primary' : 'text-slate-700'}`}>
                      {attr.name}
                    </span>
                    {/* Color dot preview */}
                    {hasColors && (
                      <div className="flex gap-0.5">
                        {colorValues.slice(0, 5).map(v => {
                          const [, hex] = v.value.split('|');
                          return (
                            <span
                              key={v.id}
                              className="w-3 h-3 rounded-full border border-white ring-1 ring-slate-200/60"
                              style={{ backgroundColor: hex }}
                            />
                          );
                        })}
                        {colorValues.length > 5 && (
                          <span className="text-[9px] text-slate-400 font-bold self-center ml-0.5">
                            +{colorValues.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedCount > 0 && (
                      <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-[5px]">
                        {selectedCount} selected
                      </span>
                    )}
                    {isExpanded ? (
                      <FiChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <FiChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Accordion body */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-50 pt-3 animate-fade-in">
                    {/* Values grid */}
                    {values.length === 0 ? (
                      <p className="text-xs text-slate-400 font-semibold italic">
                        No values yet — add one below.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {values.map(val => {
                          const { name, hex } = parseValue(val.value);
                          const checked = isValueSelected(val.id);
                          return (
                            <button
                              key={val.id}
                              type="button"
                              onClick={() => toggleValue(attr, val)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] text-xs font-bold border transition-all duration-150 cursor-pointer ${checked
                                  ? 'bg-primary/10 border-primary/30 text-primary shadow-3xs'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                            >
                              {hex ? (
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-slate-200 shrink-0"
                                  style={{ backgroundColor: hex }}
                                />
                              ) : (
                                <span
                                  className={`w-3.5 h-3.5 rounded-[3px] border-2 flex items-center justify-center shrink-0 transition-all ${checked ? 'border-primary bg-primary' : 'border-slate-300 bg-white'
                                    }`}
                                >
                                  {checked && <FiCheck className="w-2.5 h-2.5 text-white stroke-[4]" />}
                                </span>
                              )}
                              <span>{name}</span>
                              {hex && (
                                <span className="text-[9px] font-mono text-slate-400">
                                  {hex.toUpperCase()}
                                </span>
                              )}
                              {hex && checked && (
                                <FiCheck className="w-3 h-3 text-primary stroke-[3] ml-0.5" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Inline add value — div not form to avoid nested form bug */}
                    {addingValueForId === attr.id ? (
                      <div className="flex gap-2 items-center animate-fade-in">
                        <input
                          type="text"
                          value={newValueText}
                          onChange={e => setNewValueText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); handleAddValue(attr); }
                            if (e.key === 'Escape') { setAddingValueForId(null); setNewValueText(''); }
                          }}
                          placeholder={isColorAttr ? 'Color name, e.g. Space Black' : 'New value...'}
                          autoFocus
                          className="flex-grow px-3 py-1.5 border border-slate-200 rounded-[5px] text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                        />
                        {isColorAttr && (
                          <div className="flex items-center gap-1 border border-slate-200 rounded-[5px] px-1.5 bg-white">
                            <input
                              type="color"
                              value={newValueColor}
                              onChange={e => setNewValueColor(e.target.value)}
                              className="w-6 h-6 cursor-pointer bg-transparent outline-none rounded-[5px] border-0 p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-[4px] [&::-moz-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-[4px]"
                            />
                            <span className="text-[10px] font-mono text-slate-400">{newValueColor.toUpperCase()}</span>
                          </div>
                        )}
                        <button
                          type="button"
                          disabled={addingValue || !newValueText.trim()}
                          onClick={() => handleAddValue(attr)}
                          className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-[5px] border-none cursor-pointer disabled:opacity-50 flex items-center gap-1 shrink-0"
                        >
                          {addingValue ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FiCheck className="w-3 h-3 stroke-[3]" />
                          )}
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAddingValueForId(null); setNewValueText(''); }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 border-none bg-transparent cursor-pointer rounded-[5px] hover:bg-rose-50 transition-all"
                        >
                          <FiX className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setAddingValueForId(attr.id); setNewValueText(''); }}
                        className="text-[11px] text-slate-400 hover:text-primary font-bold flex items-center gap-1 cursor-pointer border-none bg-transparent transition-colors"
                      >
                        <FiPlus className="w-3 h-3 stroke-[3]" />
                        Add new value to "{attr.name}"
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && attributes.length === 0 && (
        <div className="text-center py-6 text-slate-400 text-xs font-semibold border border-dashed border-slate-200 rounded-[5px]">
          No attributes yet — create your first one below.
        </div>
      )}

      {/* Create new attribute inline — div not form to avoid nested form bug */}
      <div className="border-t border-slate-100 pt-3">
        {showNewAttr ? (
          <div className="flex gap-2 items-center animate-fade-in">
            <FiSliders className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={newAttrName}
              onChange={e => setNewAttrName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); handleCreateAttribute(); }
                if (e.key === 'Escape') { setShowNewAttr(false); setNewAttrName(''); }
              }}
              placeholder="New attribute name, e.g. Size, Color, Storage"
              autoFocus
              className="flex-grow px-3 py-1.5 border border-slate-200 rounded-[5px] text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
            />
            <button
              type="button"
              disabled={creatingAttr || !newAttrName.trim()}
              onClick={handleCreateAttribute}
              className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-[5px] border-none cursor-pointer disabled:opacity-50 flex items-center gap-1 shrink-0"
            >
              {creatingAttr ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiCheck className="w-3 h-3 stroke-[3]" />
              )}
              Create
            </button>
            <button
              type="button"
              onClick={() => { setShowNewAttr(false); setNewAttrName(''); }}
              className="p-1.5 text-slate-400 hover:text-rose-500 border-none bg-transparent cursor-pointer rounded-[5px] hover:bg-rose-50 transition-all"
            >
              <FiX className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowNewAttr(true)}
            className="text-[11px] text-slate-400 hover:text-primary font-bold flex items-center gap-1.5 cursor-pointer border-none bg-transparent transition-colors"
          >
            <FiPlus className="w-3.5 h-3.5 stroke-[3]" />
            Create new attribute
          </button>
        )}
      </div>
    </div>
  );
};

