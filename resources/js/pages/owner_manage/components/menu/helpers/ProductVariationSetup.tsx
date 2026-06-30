import React, { useState, useEffect } from 'react';
import { FiUploadCloud, FiTrash2 } from 'react-icons/fi';
import { attributesService } from '@/api/owner/categories';
import type { ProductAttribute, ProductAttributeValue } from '@/api/owner/categories';
import { toast } from '@/pages/owner_manage/utils/toast';

async function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<File> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.src = objectUrl;
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) { resolve(file); return; }
          const baseName = file.name.replace(/\.[^.]+$/, '');
          resolve(new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() }));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
  });
}


export interface SelectedColor {
  name: string;
  hex: string;
  valueId?: number;
}

export interface SelectedAttributeChoice {
  value: string;
  id: number;
}

export interface GeneratedVariantRow {
  id?: number; // variant DB ID if exists
  combinationName: string;
  price: string;
  sku: string;
  stock: number;
  purchasePrice: string;
  attrValueIds: number[];
  colorName?: string;
  imageFile?: File;
  imageUrl?: string;
}

interface ProductVariationSetupProps {
  ownerId?: number | string;
  basePrice: string;
  baseSku: string;
  basePurchasePrice: string;
  hasOptions: boolean;
  onHasOptionsChange: (val: boolean) => void;
  // Dynamic output bound to parent submit
  variants: GeneratedVariantRow[];
  onChangeVariants: (variants: GeneratedVariantRow[]) => void;
  // Color wise images helper state
  colorWiseImages: Record<string, { file?: File; url?: string }>;
  onChangeColorWiseImages: (images: Record<string, { file?: File; url?: string }>) => void;
  // Shared attributes state
  onAttributesLoaded?: (attrs: ProductAttribute[]) => void;
}

const PRESET_COLORS = [
  { name: 'Red', hex: '#FF0000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Green', hex: '#008000' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'YellowGreen', hex: '#9ACD32' },
  { name: 'WhiteSmoke', hex: '#F5F5F5' },
  { name: 'SpaceGray', hex: '#5A5D64' },
  { name: 'RoseGold', hex: '#B76E79' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Gold', hex: '#FFD700' },
  { name: 'Pink', hex: '#FFC0CB' },
];

export const ProductVariationSetup: React.FC<ProductVariationSetupProps> = ({
  ownerId,
  basePrice,
  baseSku,
  basePurchasePrice,
  hasOptions,
  onHasOptionsChange,
  variants,
  onChangeVariants,
  colorWiseImages,
  onChangeColorWiseImages,
  onAttributesLoaded,
}) => {
  const [colorsEnabled, setColorsEnabled] = useState(false);
  const [selectedColors, setSelectedColors] = useState<SelectedColor[]>([]);
  const [availableAttributes, setAvailableAttributes] = useState<ProductAttribute[]>([]);
  const [selectedAttrNames, setSelectedAttrNames] = useState<string[]>([]);
  const [attributeChoices, setAttributeChoices] = useState<Record<string, SelectedAttributeChoice[]>>({});
  // Selector UI dropdowns
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showAttrDropdown, setShowAttrDropdown] = useState(false);

  // Custom tag inputs states
  const [choiceInputs, setChoiceInputs] = useState<Record<string, string>>({});

  const [deletedCombos, setDeletedCombos] = useState<string[]>([]);

  const getDropdownAttributes = () => {
    const defaults = ['type', 'size', 'storage', 'material'];
    const dbAttrNames = (availableAttributes || [])
      .map(a => a.name)
      .filter(name => name.toLowerCase() !== 'color');

    const unifiedMap = new Map<string, string>();
    defaults.forEach(d => unifiedMap.set(d.toLowerCase(), d));
    dbAttrNames.forEach(name => unifiedMap.set(name.toLowerCase(), name));

    return Array.from(unifiedMap.values());
  };

  // Initialize and load attributes
  const initAttributes = async () => {
    try {
      const data = await attributesService.getAttributes(ownerId);
      setAvailableAttributes(data || []);
      onAttributesLoaded?.(data || []);
    } catch {
      console.warn('Failed to load attributes.');
    }
  };

  useEffect(() => {
    initAttributes();
  }, [ownerId]);

  // If variants are pre-populated by parent (Edit Mode), reverse map them to initial states once
  useEffect(() => {
    if (variants.length > 0 && hasOptions && availableAttributes.length > 0 && selectedColors.length === 0 && selectedAttrNames.length === 0) {
      const tempColors: SelectedColor[] = [];
      const tempChoices: Record<string, SelectedAttributeChoice[]> = {};
      const tempAttrNames: string[] = [];

      variants.forEach(v => {
        // Parse variant combination attribute values
        v.attrValueIds.forEach(valId => {
          // Find which attribute it belongs to
          const matchedAttr = availableAttributes.find(a => (a.values || []).some(val => val.id === valId));
          if (!matchedAttr) return;

          const matchedVal = matchedAttr.values?.find(val => val.id === valId);
          if (!matchedVal) return;

          if (matchedAttr.name.toLowerCase() === 'color') {
            setColorsEnabled(true);
            const isColorFormat = matchedVal.value.includes('|');
            const [name, hex] = isColorFormat ? matchedVal.value.split('|') : [matchedVal.value, '#CCCCCC'];
            if (!tempColors.some(c => c.name === name)) {
              tempColors.push({ name, hex, valueId: valId });
            }
          } else {
            if (!tempAttrNames.includes(matchedAttr.name)) {
              tempAttrNames.push(matchedAttr.name);
            }
            if (!tempChoices[matchedAttr.name]) {
              tempChoices[matchedAttr.name] = [];
            }
            if (!tempChoices[matchedAttr.name].some(x => x.id === valId)) {
              tempChoices[matchedAttr.name].push({ value: matchedVal.value, id: valId });
            }
          }
        });
      });

      if (tempColors.length > 0) {
        setSelectedColors(tempColors);
      }
      if (tempAttrNames.length > 0) {
        setSelectedAttrNames(tempAttrNames);
      }
      if (Object.keys(tempChoices).length > 0) {
        setAttributeChoices(tempChoices);
      }

      // Calculate missing combinations from initial variants list to populate deletedCombos
      const factors: string[][] = [];
      if (tempColors.length > 0) {
        factors.push(tempColors.map(c => c.name));
      }
      tempAttrNames.forEach(attrName => {
        const choices = tempChoices[attrName] || [];
        if (choices.length > 0) {
          factors.push(choices.map(c => c.value));
        }
      });

      if (factors.length > 0) {
        const cartesian = (arr: any[]): any[] => {
          return arr.reduce((a, b) => a.flatMap((d: any) => b.map((e: any) => [d, e].flat())), [[]]);
        };
        const allPossibleCombos = cartesian(factors).map(combo => combo.join('-'));
        const existingCombos = variants.map(v => v.combinationName);

        const normalizeComboName = (name: string) => name.split('-').sort().join('-');
        const normalizedExisting = existingCombos.map(normalizeComboName);

        const initialDeleted: string[] = [];
        allPossibleCombos.forEach(combo => {
          const norm = normalizeComboName(combo);
          if (!normalizedExisting.includes(norm)) {
            initialDeleted.push(norm);
          }
        });
        if (initialDeleted.length > 0) {
          setDeletedCombos(initialDeleted);
        }
      }
    }
  }, [variants, hasOptions, availableAttributes]);

  // Dynamic cartesian product generator
  useEffect(() => {
    if (!hasOptions) return;

    // If we are waiting for Edit Mode reverse mapping to run, do not overwrite variants with empty
    const isWaitingForReverseMap = variants.length > 0 && selectedColors.length === 0 && selectedAttrNames.length === 0;
    if (isWaitingForReverseMap) {
      return;
    }

    // Build the factors
    const factors: { name: string; values: { text: string; id: number; colorHex?: string }[] }[] = [];

    // Factor 1: Colors
    if (colorsEnabled && selectedColors.length > 0) {
      factors.push({
        name: 'Color',
        values: selectedColors.map(c => ({
          text: c.name,
          id: c.valueId || 0,
          colorHex: c.hex,
        })),
      });
    }

    // Factor 2..N: Attributes
    selectedAttrNames.forEach(attrName => {
      const choices = attributeChoices[attrName] || [];
      if (choices.length > 0) {
        factors.push({
          name: attrName,
          values: choices.map(c => ({
            text: c.value,
            id: c.id,
          })),
        });
      }
    });

    if (factors.length === 0) {
      onChangeVariants([]);
      return;
    }

    // Cartesian product helper
    const cartesian = (arr: any[]): any[] => {
      return arr.reduce((a, b) => {
        return a.flatMap((d: any) => b.map((e: any) => [d, e].flat()));
      }, [[]]);
    };

    const factorValues = factors.map(f => f.values);
    const combinations = cartesian(factorValues);

    const generatedRows: GeneratedVariantRow[] = combinations.map(combo => {
      // If combo is empty array, skip
      if (combo.length === 0) return null;

      // Extract details
      const colorVal = colorsEnabled && selectedColors.length > 0 ? combo[0] : null;

      const combinationName = combo.map((x: any) => x.text).join('-');

      // Check if this combination has been deleted
      const normalizeComboName = (name: string) => name.split('-').sort().join('-');
      const normalizedName = normalizeComboName(combinationName);
      if (deletedCombos.includes(normalizedName)) {
        return null;
      }

      const attrValueIds = combo.map((x: any) => x.id).filter((id: number) => id > 0);
      const colorName = colorVal ? colorVal.text : undefined;

      // Check if this combination already exists to preserve inputs (order-independent comparison)
      const existing = variants.find(v => normalizeComboName(v.combinationName) === normalizedName);
      if (existing) {
        return {
          ...existing,
          attrValueIds,
          colorName,
        };
      }

      // Generate new SKU
      const cleanComboName = combinationName.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      const variantSku = baseSku ? `${baseSku}-${cleanComboName}` : `PROD-VAR-${cleanComboName}`;

      return {
        combinationName,
        price: basePrice ? parseFloat(String(basePrice)).toFixed(2) : '0.00',
        sku: variantSku,
        stock: 100,
        purchasePrice: basePurchasePrice ? parseFloat(String(basePurchasePrice)).toFixed(2) : '0.00',
        attrValueIds,
        colorName,
      };
    }).filter(Boolean) as GeneratedVariantRow[];

    onChangeVariants(generatedRows);

    // Sync Color wise images dictionary
    if (colorsEnabled) {
      const updatedColorImages: Record<string, { file?: File; url?: string }> = {};
      selectedColors.forEach(c => {
        updatedColorImages[c.name] = colorWiseImages[c.name] || {};
      });
      onChangeColorWiseImages(updatedColorImages);
    } else {
      onChangeColorWiseImages({});
    }
  }, [colorsEnabled, selectedColors, selectedAttrNames, attributeChoices, basePrice, baseSku, basePurchasePrice, hasOptions, deletedCombos]);

  // Database helper: Get or Create attribute on the fly
  const getOrCreateAttribute = async (name: string): Promise<ProductAttribute> => {
    const existing = availableAttributes.find(a => a.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;

    const created = await attributesService.createAttribute(name);
    const updated = [...availableAttributes, created];
    setAvailableAttributes(updated);
    onAttributesLoaded?.(updated);
    return created;
  };

  // Database helper: Get or Create value on the fly
  const getOrCreateValue = async (attribute: ProductAttribute, valText: string): Promise<ProductAttributeValue> => {
    const existing = (attribute.values || []).find(v => {
      const cleanVal = v.value.includes('|') ? v.value.split('|')[0] : v.value;
      return cleanVal.toLowerCase() === valText.toLowerCase();
    });
    if (existing) return existing;

    const created = await attributesService.createAttributeValue(attribute.id, valText);

    // Update local state values lists
    const updatedAttributes = availableAttributes.map(a =>
      a.id === attribute.id
        ? { ...a, values: [...(a.values || []), created] }
        : a
    );
    setAvailableAttributes(updatedAttributes);
    onAttributesLoaded?.(updatedAttributes);
    return created;
  };

  // Color actions
  const selectColor = async (color: { name: string; hex: string }) => {
    if (selectedColors.some(c => c.name === color.name)) return;
    try {
      const colorAttr = await getOrCreateAttribute('Color');
      const dbVal = await getOrCreateValue(colorAttr, `${color.name}|${color.hex}`);

      setSelectedColors(prev => [...prev, { name: color.name, hex: color.hex, valueId: dbVal.id }]);
      toast.success(`Color "${color.name}" selected.`);
    } catch (e: any) {
      console.error('Failed to register color:', e);
      const errMsg = e.details?.message || e.message || 'Failed to register color in database.';
      toast.error(errMsg);
    }
  };

  const removeColor = (colorName: string) => {
    setSelectedColors(prev => prev.filter(c => c.name !== colorName));
    const newImgs = { ...colorWiseImages };
    delete newImgs[colorName];
    onChangeColorWiseImages(newImgs);
  };

  // Custom Color Addition
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#1455ac');

  const addCustomColor = async () => {
    if (!customColorName.trim()) return;
    await selectColor({ name: customColorName.trim(), hex: customColorHex });
    setCustomColorName('');
  };

  // Attribute actions
  const selectAttributeName = async (name: string) => {
    if (selectedAttrNames.includes(name)) return;
    setSelectedAttrNames(prev => [...prev, name]);
  };

  const removeAttributeName = (name: string) => {
    setSelectedAttrNames(prev => prev.filter(x => x !== name));
    const updatedChoices = { ...attributeChoices };
    delete updatedChoices[name];
    setAttributeChoices(updatedChoices);
  };

  const [customAttrName, setCustomAttrName] = useState('');
  const addCustomAttribute = async () => {
    if (!customAttrName.trim()) return;
    try {
      await getOrCreateAttribute(customAttrName.trim());
      await selectAttributeName(customAttrName.trim());
      setCustomAttrName('');
      toast.success(`Attribute "${customAttrName.trim()}" created!`);
    } catch (e: any) {
      console.error('Failed to create attribute:', e);
      const errMsg = e.details?.message || e.message || 'Failed to create attribute.';
      toast.error(errMsg);
    }
  };

  // Choice tag actions
  const addChoiceTag = async (attrName: string, text: string) => {
    if (!text.trim()) return;
    try {
      const attrObj = await getOrCreateAttribute(attrName);
      const dbVal = await getOrCreateValue(attrObj, text.trim());

      const current = attributeChoices[attrName] || [];
      if (current.some(c => c.value === dbVal.value)) return;

      setAttributeChoices(prev => ({
        ...prev,
        [attrName]: [...current, { value: dbVal.value, id: dbVal.id }],
      }));
    } catch (e: any) {
      console.error('Failed to register choice tag:', e);
      const errMsg = e.details?.message || e.message || 'Failed to register choice tag in database.';
      toast.error(errMsg);
    }
  };

  const removeChoiceTag = (attrName: string, valId: number) => {
    const current = attributeChoices[attrName] || [];
    setAttributeChoices(prev => ({
      ...prev,
      [attrName]: current.filter(c => c.id !== valId),
    }));
  };

  const handleDeleteCombo = (comboName: string) => {
    const normalized = comboName.split('-').sort().join('-');
    setDeletedCombos(prev => [...prev, normalized]);
    toast.success(`Variation "${comboName}" removed.`);
  };

  const handleRestoreCombos = () => {
    setDeletedCombos([]);
    toast.success('All deleted variations restored.');
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[10px] p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            Product Variation Setup
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">Enable and manage different variations of a product.</p>
        </div>
        <div
          onClick={() => onHasOptionsChange(!hasOptions)}
          className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${hasOptions ? 'bg-[#1455ac]' : 'bg-slate-300'}`}
        >
          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${hasOptions ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
      </div>

      {hasOptions && (
        <div className="space-y-6 animate-fade-in">
          {/* Colors & Attributes row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Colors block */}
            <div className="space-y-2 border border-slate-100 p-4 rounded-[8px] bg-slate-50/30">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-slate-700">Colors</label>
                <div
                  onClick={() => setColorsEnabled(!colorsEnabled)}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-all duration-300 ${colorsEnabled ? 'bg-[#1455ac]' : 'bg-slate-300'}`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-all duration-300 ${colorsEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>

              {colorsEnabled && (
                <div className="space-y-3 pt-2">
                  {/* Select colors pills */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowColorDropdown(!showColorDropdown);
                        setShowAttrDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 border border-slate-200 rounded-[5px] bg-white text-xs font-bold text-slate-600 flex justify-between items-center cursor-pointer shadow-3xs"
                    >
                      <span>Choose color options</span>
                      <span className="text-[10px]">▼</span>
                    </button>

                    {showColorDropdown && (
                      <div className="absolute z-30 w-full mt-1 bg-white border border-slate-100 rounded-[8px] shadow-lg flex flex-col max-h-[260px] overflow-hidden">
                        {/* Scrollable list */}
                        <div className="overflow-y-auto p-2 space-y-1 max-h-[170px]">
                          {PRESET_COLORS.map(c => (
                            <button
                              key={c.name}
                              type="button"
                              onClick={() => {
                                selectColor(c);
                                setShowColorDropdown(false);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 rounded-[4px] text-xs font-extrabold text-slate-700 text-left cursor-pointer"
                            >
                              <span className="w-3.5 h-3.5 rounded-full border border-slate-200" style={{ backgroundColor: c.hex }} />
                              <span>{c.name}</span>
                            </button>
                          ))}
                        </div>

                        {/* Custom Color Inline */}
                        <div className="border-t border-slate-100 p-2.5 bg-slate-50 rounded-b-[8px] space-y-1.5">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Custom Color</p>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              placeholder="Name"
                              value={customColorName}
                              onChange={e => setCustomColorName(e.target.value)}
                              className="px-2 py-1 text-xs border border-slate-200 rounded-[4px] w-full font-bold focus:outline-none text-slate-800 bg-white"
                            />
                            <input
                              type="color"
                              value={customColorHex}
                              onChange={e => setCustomColorHex(e.target.value)}
                              className="w-8 h-7 cursor-pointer bg-transparent outline-none rounded-[4px] border border-slate-200 p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-[3px] [&::-moz-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-[3px]"
                            />
                            <button
                              type="button"
                              onClick={addCustomColor}
                              className="px-2.5 bg-[#1455ac] hover:bg-[#0f4d9c] text-white rounded-[4px] text-xs font-bold border-none cursor-pointer"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chosen color tags */}
                  {selectedColors.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-white border border-slate-100 rounded-[5px]">
                      {selectedColors.map(c => (
                        <span
                          key={c.name}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-[5px] text-[11px] font-bold text-slate-700"
                        >
                          <span className="w-2.5 h-2.5 rounded-full border border-slate-200" style={{ backgroundColor: c.hex }} />
                          {c.name}
                          <button
                            type="button"
                            onClick={() => removeColor(c.name)}
                            className="text-slate-400 hover:text-rose-500 cursor-pointer"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Attributes block */}
            <div className="space-y-2 border border-slate-100 p-4 rounded-[8px] bg-slate-50/30">
              <label className="text-xs sm:text-sm font-bold text-slate-700 flex justify-between items-center w-full">
                <span>Attributes <small className="text-slate-400 font-normal">(optional)</small></span>
                <div className="relative group">
                  <span 
                    className="inline-flex items-center gap-1.5 text-[10px] font-black text-[#1455ac] bg-[#1455ac]/10 hover:bg-[#1455ac]/15 px-2.5 py-0.5 rounded-full cursor-help transition-colors uppercase tracking-wider"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1455ac] animate-pulse" />
                    <span>How to use</span>
                  </span>

                  {/* Styled Hover Tooltip Card */}
                  <div className="absolute right-0 top-full mt-1.5 w-64 p-3 bg-white border border-slate-100 rounded-[8px] shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-40 space-y-2 normal-case font-normal text-left">
                    <p className="text-xs font-extrabold text-slate-800 border-b border-slate-100 pb-1.5 flex items-center gap-1">
                      💡 Quick Guide
                    </p>
                    <ul className="space-y-2 text-[11px] text-slate-600 list-disc list-inside">
                      <li>
                        For <span className="font-bold text-[#1455ac]">Colors</span>: Toggle color switch, then choose preset colors or add custom ones.
                      </li>
                      <li>
                        For <span className="font-bold text-[#1455ac]">Attributes</span>: Select attribute name (or create custom) from dropdown.
                      </li>
                      <li>
                        Type choice values (e.g., <span className="bg-slate-50 border border-slate-100 px-1 py-0.5 rounded font-mono text-[10px] text-slate-700">S</span>, <span className="bg-slate-50 border border-slate-100 px-1 py-0.5 rounded font-mono text-[10px] text-slate-700">M</span>) and press <span className="font-bold text-[#1455ac]">Enter</span> or <span className="font-bold text-[#1455ac]">comma (,)</span> to add.
                      </li>
                    </ul>
                  </div>
                </div>
              </label>

              <div className="space-y-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttrDropdown(!showAttrDropdown);
                      setShowColorDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 border border-slate-200 rounded-[5px] bg-white text-xs font-bold text-slate-600 flex justify-between items-center cursor-pointer shadow-3xs"
                  >
                    <span>Select attributes</span>
                    <span className="text-[10px]">▼</span>
                  </button>

                  {showAttrDropdown && (
                    <div className="absolute z-30 w-full mt-1 bg-white border border-slate-100 rounded-[8px] shadow-lg flex flex-col max-h-[240px] overflow-hidden">
                      {/* Scrollable list */}
                      <div className="overflow-y-auto p-2 space-y-1 max-h-[150px]">
                        {getDropdownAttributes().map(name => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => {
                              selectAttributeName(name);
                              setShowAttrDropdown(false);
                            }}
                            className="w-full px-2.5 py-1.5 hover:bg-slate-50 rounded-[4px] text-xs font-extrabold text-slate-700 text-left cursor-pointer"
                          >
                            {name}
                          </button>
                        ))}
                      </div>

                      {/* Custom Attribute Addition */}
                      <div className="border-t border-slate-100 p-2.5 bg-slate-50 rounded-b-[8px] space-y-1.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Custom Options</p>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Ex: material"
                            value={customAttrName}
                            onChange={e => setCustomAttrName(e.target.value)}
                            className="px-2 py-1 text-xs border border-slate-200 rounded-[4px] w-full font-bold focus:outline-none bg-white"
                          />
                          <button
                            type="button"
                            onClick={addCustomAttribute}
                            className="px-2.5 bg-[#1455ac] hover:bg-[#0f4d9c] text-white rounded-[4px] text-xs font-bold border-none cursor-pointer whitespace-nowrap"
                          >
                            Create
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chosen attributes tags */}
                {selectedAttrNames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-white border border-slate-100 rounded-[5px]">
                    {selectedAttrNames.map(name => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-[5px] text-[11px] font-bold text-slate-700"
                      >
                        {name}
                        <button
                          type="button"
                          onClick={() => removeAttributeName(name)}
                          className="text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tag inputs for selected attributes */}
          {selectedAttrNames.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedAttrNames.map(name => {
                const currentVal = choiceInputs[name] || '';
                return (
                  <div key={name} className="space-y-1.5 flex-1">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                      {name}
                    </label>
                    <div className="flex flex-wrap gap-1.5 items-center p-2 border border-slate-200 rounded-[5px] bg-white min-h-[42px] focus-within:ring-2 focus-within:ring-[#1455ac]/10 focus-within:border-[#1455ac]">
                      {(attributeChoices[name] || []).map(choice => (
                        <span
                          key={choice.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-[3px] text-[10px] font-bold text-slate-600"
                        >
                          {choice.value}
                          <button
                            type="button"
                            onClick={() => removeChoiceTag(name, choice.id)}
                            className="text-slate-400 hover:text-rose-500 text-xs cursor-pointer font-bold leading-none"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder="Enter choice values"
                        value={currentVal}
                        onChange={e => setChoiceInputs(prev => ({ ...prev, [name]: e.target.value }))}
                        onKeyDown={async e => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            const val = currentVal.trim().replace(/,$/, '');
                            if (val) {
                              await addChoiceTag(name, val);
                              setChoiceInputs(prev => ({ ...prev, [name]: '' }));
                            }
                          }
                        }}
                        className="flex-1 min-w-[100px] text-xs font-semibold focus:outline-none bg-transparent h-6"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Combination table */}
          {variants.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-100 overflow-x-auto">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Generated Variant Specifications</p>
                {deletedCombos.length > 0 && (
                  <button
                    type="button"
                    onClick={handleRestoreCombos}
                    className="text-xs font-bold text-[#1455ac] hover:underline cursor-pointer bg-transparent border-none p-0 outline-none"
                  >
                    Restore deleted variations ({deletedCombos.length})
                  </button>
                )}
              </div>

              <table className="w-full text-left border-collapse rounded-[8px] overflow-hidden text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 font-extrabold text-slate-600">
                    <th className="p-3 w-12 text-center">SL</th>
                    <th className="p-3">Attribute Variation</th>
                    <th className="p-3 w-40">Variation Wise Price ($)</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3 w-36">Variation Wise Stock</th>
                    <th className="p-3 w-16 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {variants.map((v, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 text-center text-slate-400 font-bold">{index + 1}</td>
                      <td className="p-3 font-extrabold text-[#1455ac]">{v.combinationName}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={v.price}
                          onChange={e => {
                            const updated = [...variants];
                            updated[index].price = e.target.value;
                            onChangeVariants(updated);
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-[5px] text-xs font-extrabold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#1455ac] focus:border-[#1455ac]"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          required
                          value={v.sku}
                          onChange={e => {
                            const updated = [...variants];
                            updated[index].sku = e.target.value;
                            onChangeVariants(updated);
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-[5px] text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#1455ac] focus:border-[#1455ac]"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          required
                          value={v.stock}
                          onChange={e => {
                            const updated = [...variants];
                            updated[index].stock = parseInt(e.target.value) || 0;
                            onChangeVariants(updated);
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-[5px] text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#1455ac] focus:border-[#1455ac]"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteCombo(v.combinationName)}
                          className="p-1 bg-transparent hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-[4px] cursor-pointer transition-colors border-none"
                          title="Delete variation"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Color Wise Images Upload Card */}
          {colorsEnabled && selectedColors.length > 0 && (
            <div className="space-y-3 pt-6 border-t border-slate-100">
              <div>
                <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm">Product Color Wise Images</h4>
                <p className="text-slate-400 text-2xs mt-0.5">Here you can add color wise product image. JPG, JPEG, PNG image size : Max 1 MB (Ratio 1:1 (500 x 500 px))</p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                {selectedColors.map(c => {
                  const data = colorWiseImages[c.name] || {};
                  return (
                    <div key={c.name} className="flex flex-col items-center gap-2 border border-slate-100 p-3 rounded-[8px] bg-slate-50/50 shrink-0">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: c.hex }} />
                        <span className="text-[11px] font-black text-slate-700">{c.name}</span>
                      </div>

                      <div className="relative w-24 h-24 border border-dashed border-slate-200 rounded-[8px] flex flex-col items-center justify-center bg-white cursor-pointer hover:border-[#1455ac]/50 hover:bg-blue-50/10 group overflow-hidden transition-all">
                        {data.url ? (
                          <>
                            <img src={data.url} alt={c.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = { ...colorWiseImages };
                                  delete updated[c.name];
                                  onChangeColorWiseImages(updated);
                                }}
                                className="p-1 bg-white hover:bg-rose-50 text-rose-500 rounded-full cursor-pointer shadow-sm transition-colors border-none"
                              >
                                <FiTrash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center p-2 text-center">
                            <FiUploadCloud className="w-6 h-6 text-slate-400 mb-1 group-hover:text-[#1455ac]" />
                            <span className="text-[9px] font-bold text-slate-400 group-hover:text-[#1455ac]">Click to upload</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const compressed = await compressImage(file);
                                  if (compressed.size > 2 * 1024 * 1024) {
                                    toast.error('Image exceeds 2MB limit even after compression.');
                                    return;
                                  }
                                  onChangeColorWiseImages({
                                    ...colorWiseImages,
                                    [c.name]: { file: compressed, url: URL.createObjectURL(compressed) },
                                  });
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

