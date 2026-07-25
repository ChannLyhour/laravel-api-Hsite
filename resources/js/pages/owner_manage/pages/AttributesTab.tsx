import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { attributesService, type ProductAttribute } from '@/api/owner/categories';
import { ApiError } from '@/api/client';
import { toast } from '@/pages/owner_manage/utils/toast';
import {
  FiSliders, FiLayers, FiPlus,
  FiTrash2, FiInfo, FiFolderPlus,
  FiChevronRight, FiX
} from 'react-icons/fi';
import '@/pages/owner_manage/style/font.css';

interface AttributesTabProps {
  ownerId?: number | string;
}

export const AttributesTab: React.FC<AttributesTabProps> = ({ ownerId }) => {
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [selectedAttributeId, setSelectedAttributeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Values Inline Form State
  const [newValue, setNewValue] = useState('');
  const [newValueColor, setNewValueColor] = useState('#FF5500');
  const [addingValue, setAddingValue] = useState(false);

  // Create Attribute Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAttrName, setNewAttrName] = useState('');
  const [creatingAttr, setCreatingAttr] = useState(false);

  // Fetch all attributes from DB
  const fetchAttributes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await attributesService.getAttributes(ownerId);
      setAttributes(data || []);

      // Auto select first attribute if none is selected
      if (data && data.length > 0 && selectedAttributeId === null) {
        setSelectedAttributeId(data[0].id);
      }
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError) {
        setError(err.details.message);
      } else {
        setError('Failed to fetch product attributes. Please check database connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  const selectedAttribute = attributes.find(attr => attr.id === selectedAttributeId);

  // Add Attribute Handler
  const handleCreateAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttrName.trim()) return;

    setCreatingAttr(true);
    try {
      const created = await attributesService.createAttribute(newAttrName.trim());
      toast.success(`Attribute "${created.name}" created successfully!`);
      setNewAttrName('');
      setShowCreateModal(false);

      // Refresh list & select newly created attribute
      const updated = await attributesService.getAttributes(ownerId);
      setAttributes(updated || []);
      setSelectedAttributeId(created.id);
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError) {
        toast.error(err.details.message || 'Failed to create attribute.');
      } else {
        toast.error('Failed to create attribute.');
      }
    } finally {
      setCreatingAttr(false);
    }
  };

  // Add Value Handler
  const handleAddValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim() || selectedAttributeId === null) return;

    setAddingValue(true);
    try {
      const isColorAttr = selectedAttribute?.name.toLowerCase() === 'color';
      const finalValue = isColorAttr
        ? `${newValue.trim()}|${newValueColor}`
        : newValue.trim();

      const createdVal = await attributesService.createAttributeValue(selectedAttributeId, finalValue);
      const displayLabel = isColorAttr ? newValue.trim() : createdVal.value;
      toast.success(`Option value "${displayLabel}" added successfully!`);
      setNewValue('');

      // Refresh selected attribute values in local state instantly
      setAttributes(prev => prev.map(attr => {
        if (attr.id === selectedAttributeId) {
          const currentValues = attr.values || [];
          return {
            ...attr,
            values: [...currentValues, createdVal]
          };
        }
        return attr;
      }));
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError) {
        toast.error(err.details.message || 'Failed to add option value.');
      } else {
        toast.error('Failed to add option value. Verification of unique values required.');
      }
    } finally {
      setAddingValue(false);
    }
  };

  // Delete Value Handler
  const handleDeleteValue = async (valueId: number, valueName: string) => {
    try {
      await attributesService.deleteAttributeValue(valueId);
      toast.success(`Option value "${valueName}" deleted successfully!`);

      // Update local state instantly
      setAttributes(prev => prev.map(attr => {
        if (attr.id === selectedAttributeId) {
          const currentValues = attr.values || [];
          return {
            ...attr,
            values: currentValues.filter(v => v.id !== valueId)
          };
        }
        return attr;
      }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete option value.');
    }
  };

  // Delete Attribute Category (Active Option) Handler
  const handleDeleteAttribute = async (attrId: number, attrName: string) => {
    if (!window.confirm(`Are you sure you want to delete the attribute "${attrName}"? This will also delete all associated options/values and cannot be undone.`)) {
      return;
    }

    try {
      await attributesService.deleteAttribute(attrId);
      toast.success(`Attribute "${attrName}" deleted successfully!`);

      // Update local state instantly
      const updatedList = attributes.filter(attr => attr.id !== attrId);
      setAttributes(updatedList);

      // Select another attribute or null
      if (selectedAttributeId === attrId) {
        if (updatedList.length > 0) {
          setSelectedAttributeId(updatedList[0].id);
        } else {
          setSelectedAttributeId(null);
        }
      }
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError) {
        toast.error(err.details.message || 'Failed to delete attribute.');
      } else {
        toast.error('Failed to delete attribute.');
      }
    }
  };

  return (
    <div className="space-y-6 font-kuntomruy animate-fade-in text-slate-700">

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center space-x-2">
            <FiSliders className="text-primary" />
            <span>Product Attributes & Global Options</span>
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Configure global properties like Size, Storage levels, Colors, or Materials used to drive your multi-variant product selections.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary hover:bg-primary-hover text-white py-2.5 px-4 rounded-[5px] text-xs font-black transition-all flex items-center justify-center space-x-1.5 shadow-sm shadow-orange-500/10 cursor-pointer border-none select-none active:scale-95 duration-200"
        >
          <FiPlus className="stroke-[3]" />
          <span>Create Attribute</span>
        </button>
      </div>

      {/* Loading Spinner */}
      {loading && attributes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-bold text-xs">Loading database attributes...</p>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-5 bg-rose-50 border border-rose-100 rounded-[5px] flex items-start space-x-3 text-rose-800 text-xs animate-slide-up">
          <FiInfo className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="font-semibold leading-relaxed">
            {error}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && attributes.length === 0 && (
        <div className="text-center py-20 space-y-3 bg-white rounded-[5px] border border-slate-100/60 shadow-xs max-w-lg mx-auto">
          <div className="w-12 h-12 bg-orange-50 rounded-[5px] flex items-center justify-center text-primary mx-auto">
            <FiSliders className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-slate-800">No Product Attributes defined yet</h4>
          <p className="text-slate-400 text-xs font-medium max-w-sm mx-auto px-4 leading-relaxed">
            Attributes let you specify different sizes, storage configurations, or materials. Tap "Create Attribute" above to add your first one!
          </p>
        </div>
      )}

      {/* Main Split-Pane Workspace */}
      {!loading && !error && attributes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Left Column: List Pane */}
          <div className="lg:col-span-1 bg-white border border-slate-100 rounded-[5px] p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 pb-1 border-b border-slate-50">
              Attributes List
            </h3>

            <div className="space-y-1 max-h-[450px] overflow-y-auto pr-1">
              {attributes.map(attr => {
                const isSelected = attr.id === selectedAttributeId;
                const values = attr.values || [];
                const valueCount = values.length;
                const colorValues = values.filter(v => v.value.includes('|'));
                const hasColors = colorValues.length > 0;
                return (
                  <button
                    key={attr.id}
                    onClick={() => setSelectedAttributeId(attr.id)}
                    className={`w-full flex flex-col px-3.5 py-3 rounded-[5px] transition-all text-left cursor-pointer border-none bg-transparent group gap-1.5 ${isSelected
                      ? 'bg-primary/5 text-primary border border-primary/20 shadow-3xs'
                      : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                      }`}
                  >
                    {/* Row 1: Icon + Name + Count badge */}
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        <FiLayers className={`w-4 h-4 shrink-0 ${isSelected ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        <span className={`text-sm font-extrabold ${isSelected ? 'text-primary font-black' : 'text-slate-700'}`}>
                          {attr.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-[5px] ${isSelected
                          ? 'bg-primary text-white'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                          }`}>
                          {valueCount} {valueCount === 1 ? 'option' : 'options'}
                        </span>
                        <FiChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-primary' : 'text-slate-300 group-hover:text-slate-400'}`} />
                      </div>
                    </div>

                    {/* Row 2: Color swatches or plain value pills preview */}
                    {valueCount > 0 && (
                      <div className="flex flex-wrap gap-1 pl-6">
                        {hasColors ? (
                          // Show stacked color dot swatches
                          <>
                            {colorValues.slice(0, 8).map(v => {
                              const [, hex] = v.value.split('|');
                              return (
                                <span
                                  key={v.id}
                                  className="w-3.5 h-3.5 rounded-full border border-white shadow-sm shrink-0 ring-1 ring-slate-200/60"
                                  style={{ backgroundColor: hex }}
                                  title={v.value.split('|')[0]}
                                />
                              );
                            })}
                            {colorValues.length > 8 && (
                              <span className="text-[9px] font-bold text-slate-400 leading-3.5 self-center">
                                +{colorValues.length - 8}
                              </span>
                            )}
                          </>
                        ) : (
                          // Show plain text mini pills for non-color values
                          <>
                            {values.slice(0, 3).map(v => (
                              <span
                                key={v.id}
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-[3px] ${isSelected ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'
                                  }`}
                              >
                                {v.value}
                              </span>
                            ))}
                            {values.length > 3 && (
                              <span className="text-[9px] font-bold text-slate-400 self-center">
                                +{values.length - 3}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Attribute Values Controller Pane */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[5px] p-6 shadow-sm min-h-[300px]">
            {selectedAttribute ? (
              <div className="space-y-6 animate-fade-in">

                {/* Attribute title & Meta info */}
                <div className="border-b border-slate-50 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <FiSliders className="text-primary w-5 h-5 shrink-0" />
                      <h3 className="font-extrabold text-slate-800 text-lg sm:text-xl">
                        {selectedAttribute.name} Configuration
                      </h3>
                    </div>
                    <p className="text-slate-400 text-xs font-semibold mt-1">
                      Manage choices or select values associated with the global <strong className="text-slate-500 font-extrabold">"{selectedAttribute.name}"</strong> option.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteAttribute(selectedAttribute.id, selectedAttribute.name)}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 py-2 px-3.5 rounded-[5px] text-xs font-black transition-all flex items-center justify-center space-x-1.5 border border-rose-200/60 cursor-pointer select-none active:scale-95 duration-200 shrink-0"
                    title={`Delete global "${selectedAttribute.name}" option attribute`}
                  >
                    <FiTrash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Delete Attribute</span>
                  </button>
                </div>

                {/* Values Showcase grid */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                    Active Options / Values
                  </label>

                  {selectedAttribute.values && selectedAttribute.values.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedAttribute.values.map(val => {
                        const isColorAttr = selectedAttribute.name.toLowerCase() === 'color';
                        if (isColorAttr && val.value.includes('|')) {
                          const [colorName, colorHex] = val.value.split('|');
                          return (
                            <div
                              key={val.id}
                              className="px-3 py-1.5 rounded-[5px] text-xs font-bold bg-slate-50 border border-slate-200/60 text-slate-700 shadow-3xs flex items-center space-x-2 hover:border-slate-300 transition-all animate-fade-in group/pill"
                            >
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-slate-200 shrink-0 animate-scale-up"
                                style={{ backgroundColor: colorHex }}
                              />
                              <span className="font-extrabold text-slate-800">{colorName}</span>
                              <span className="text-[9px] font-mono text-slate-400 font-semibold">{colorHex.toUpperCase()}</span>

                              <button
                                type="button"
                                onClick={() => handleDeleteValue(val.id, colorName)}
                                className="text-slate-300 hover:text-rose-500 transition-colors p-0.5 rounded-[5px] cursor-pointer bg-transparent border-none outline-none flex items-center justify-center shrink-0"
                                title={`Delete ${colorName}`}
                              >
                                <FiX className="w-3 h-3 stroke-[3]" />
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={val.id}
                            className="px-3 py-1.5 rounded-[5px] text-xs font-bold bg-slate-50 border border-slate-200/60 text-slate-700 shadow-3xs flex items-center space-x-2 hover:border-slate-300 transition-all animate-fade-in"
                          >
                            <span className="inline-flex w-1.5 h-1.5 bg-primary rounded-full shrink-0" />
                            <span className="font-extrabold text-slate-800">{val.value}</span>

                            <button
                              type="button"
                              onClick={() => handleDeleteValue(val.id, val.value)}
                              className="text-slate-300 hover:text-rose-500 transition-colors p-0.5 rounded-[5px] cursor-pointer bg-transparent border-none outline-none flex items-center justify-center shrink-0"
                              title={`Delete ${val.value}`}
                            >
                              <FiX className="w-3 h-3 stroke-[3]" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-50 rounded-[5px] border border-dashed border-slate-200/80 text-center text-slate-400 font-bold text-xs space-y-1 py-10">
                      <FiFolderPlus className="w-8 h-8 text-slate-300 mx-auto block" />
                      <span>No options defined for this attribute yet</span>
                      <p className="text-[10px] text-slate-400 font-medium">Add some values below to drive your SKU variations!</p>
                    </div>
                  )}
                </div>

                {/* Add Value Form */}
                <div className="bg-slate-50/50 p-5 border border-slate-100 rounded-[5px] space-y-3">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Add New Option Value
                  </h4>

                  <form onSubmit={handleAddValue} className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-grow flex gap-2">
                      <input
                        type="text"
                        required
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        placeholder={
                          selectedAttribute.name.toLowerCase() === 'color'
                            ? "Color name (e.g. Space Black, Crimson Red)"
                            : selectedAttribute.name.toLowerCase() === 'storage'
                              ? "e.g. 512GB"
                              : "Standard Option"
                        }
                        className="flex-grow px-3.5 py-2.5 border border-slate-200 rounded-[5px] text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold text-slate-800 bg-white"
                      />

                      {selectedAttribute.name.toLowerCase() === 'color' && (
                        <div className="relative shrink-0 flex items-center border border-slate-200 rounded-[5px] px-2 bg-white gap-1.5 shadow-3xs hover:border-slate-300 transition-all duration-200 animate-fade-in">
                          <input
                            type="color"
                            value={newValueColor}
                            onChange={(e) => setNewValueColor(e.target.value)}
                            className="w-7 h-7 rounded-[5px] cursor-pointer bg-transparent outline-none shrink-0 border-0 p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-[4px] [&::-moz-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-[4px]"
                            title="Select color code swatch"
                          />
                          <span className="text-[10px] font-mono font-bold text-slate-400 pr-1 select-none">{newValueColor.toUpperCase()}</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={addingValue || !newValue.trim()}
                      className="bg-primary hover:bg-primary-hover text-white py-2.5 px-5 rounded-[5px] text-xs font-black transition-all flex items-center justify-center space-x-1 border-none cursor-pointer disabled:opacity-50 select-none active:scale-[0.98] duration-200 shrink-0"
                    >
                      {addingValue ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                          <span>Adding...</span>
                        </>
                      ) : (
                        <span>
                          {selectedAttribute.name.toLowerCase() === 'color' ? 'Add Color Option' : 'Add Value Option'}
                        </span>
                      )}
                    </button>
                  </form>
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 font-bold text-xs space-y-2">
                <FiSliders className="w-10 h-10 text-slate-200" />
                <span>Select an attribute from the list to configure its values</span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ── CREATE ATTRIBUTE MODAL POPUP ─────────────────────── */}
      {showCreateModal && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/60 animate-fade-in">
          {/* Close click area */}
          <div className="absolute inset-0 cursor-default" onClick={() => { setShowCreateModal(false); setNewAttrName(''); }}></div>

          <div className="bg-white rounded-[5px] border border-slate-100 shadow-xl max-w-md w-full p-6 space-y-6 animate-slide-up relative z-10">
            <button
              onClick={() => { setShowCreateModal(false); setNewAttrName(''); }}
              className="absolute top-4 right-4 p-1 rounded-[5px] hover:bg-slate-100 text-slate-400 cursor-pointer border-none bg-transparent"
            >
              <FiX className="w-4 h-4 stroke-[3]" />
            </button>

            <div>
              <h3 className="font-extrabold text-slate-800 text-base sm:text-lg flex items-center space-x-2">
                <FiFolderPlus className="text-primary" />
                <span>Create Global Attribute</span>
              </h3>
              <p className="text-slate-400 text-2xs font-semibold mt-0.5">
                Add a new property to differentiate your catalog products.
              </p>
            </div>

            <form onSubmit={handleCreateAttribute} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Attribute Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newAttrName}
                  onChange={(e) => setNewAttrName(e.target.value)}
                  placeholder="e.g. Storage, Color, Size, Material"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setNewAttrName(''); }}
                  className="py-2 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[5px] text-xs font-bold transition-all border border-slate-200/50 cursor-pointer min-w-[80px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAttr || !newAttrName.trim()}
                  className="py-2 px-5 bg-primary hover:bg-primary-hover text-white rounded-[5px] text-xs font-black transition-all flex items-center justify-center space-x-1.5 border-none cursor-pointer disabled:opacity-50 select-none min-w-[120px]"
                >
                  {creatingAttr ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Attribute</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

