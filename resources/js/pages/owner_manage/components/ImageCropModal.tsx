import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiRotateCw, FiRotateCcw, FiMaximize2, FiImage, FiCheck, FiMinimize2 } from 'react-icons/fi';
import { toast } from '@/pages/owner_manage/utils/toast';

interface ImageCropModalProps {
  imageSrc: string; // original image preview string/dataUrl
  fileName: string;
  onConfirm: (croppedFile: File) => void;
  onCancel: () => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  imageSrc,
  fileName,
  onConfirm,
  onCancel,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active transformed image source
  const [currentImageSrc, setCurrentImageSrc] = useState<string>(imageSrc);

  // UI state for image sizes
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 }); // rendered size on screen
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 }); // high-res dimensions

  // Crop coordinates (rendered scale)
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 100, height: 100 });

  // Custom output size (final resolution in px)
  const [outputWidth, setOutputWidth] = useState<number>(1200);
  const [outputHeight, setOutputHeight] = useState<number>(400);

  // Crop presets and locks
  const [preset, setPreset] = useState<string>('3:1'); // '3:1' | '16:9' | '1:1' | 'free'
  const [aspectRatioLocked, setAspectRatioLocked] = useState<boolean>(true);
  const [targetAspectRatio, setTargetAspectRatio] = useState<number>(3); // width / height
  const [userHasEditedOutputSize, setUserHasEditedOutputSize] = useState<boolean>(false);

  // Dragging states
  const [dragType, setDragType] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [dragStartCrop, setDragStartCrop] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const [applying, setApplying] = useState(false);

  const selectPreset = (p: string) => {
    setPreset(p);
    setUserHasEditedOutputSize(false);
    if (p === '3:1') {
      setTargetAspectRatio(3);
      setAspectRatioLocked(true);
      setOutputWidth(1200);
      setOutputHeight(400);
    } else if (p === '16:9') {
      setTargetAspectRatio(16 / 9);
      setAspectRatioLocked(true);
      setOutputWidth(1280);
      setOutputHeight(720);
    } else if (p === '1:1') {
      setTargetAspectRatio(1);
      setAspectRatioLocked(true);
      setOutputWidth(800);
      setOutputHeight(800);
    } else if (p === 'free') {
      setAspectRatioLocked(false);
      if (imgSize.width > 0) {
        const ar = crop.width / crop.height;
        setTargetAspectRatio(ar);
        const finalW = Math.round(crop.width * (naturalSize.width / imgSize.width));
        const finalH = Math.round(crop.height * (naturalSize.height / imgSize.height));
        setOutputWidth(finalW);
        setOutputHeight(finalH);
      }
    }
  };

  // When currentImageSrc changes, reload natural size and reset crops
  const handleImageLoaded = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const nW = img.naturalWidth;
    const nH = img.naturalHeight;
    setNaturalSize({ width: nW, height: nH });

    const renderedW = img.clientWidth;
    const renderedH = img.clientHeight;
    setImgSize({ width: renderedW, height: renderedH });

    setUserHasEditedOutputSize(false);
    // Initialize crop box based on preset
    initializeCropBox(renderedW, renderedH, nW, nH);
  };

  const initializeCropBox = (
    renderedW: number,
    renderedH: number,
    natW: number,
    natH: number
  ) => {
    let ar = targetAspectRatio;
    if (preset === 'free') {
      if (aspectRatioLocked) {
        ar = outputWidth / outputHeight;
      } else {
        // Just default crop to some aspect ratio or a centered box
        ar = natW / natH;
      }
    }

    let w = renderedW;
    let h = renderedW / ar;

    if (h > renderedH) {
      h = renderedH;
      w = renderedH * ar;
    }

    // Shrink slightly to avoid hugging boundaries
    w = w * 0.95;
    h = h * 0.95;

    const x = (renderedW - w) / 2;
    const y = (renderedH - h) / 2;

    const newCrop = { x, y, width: w, height: h };
    setCrop(newCrop);

    // If locked or preset, target size stays preset. If free and unlocked, set target size to natural crop size (unless user manually edited).
    if (preset === 'free' && !aspectRatioLocked && !userHasEditedOutputSize) {
      const finalW = Math.round(w * (natW / renderedW));
      const finalH = Math.round(h * (natH / renderedH));
      setOutputWidth(finalW);
      setOutputHeight(finalH);
    }
  };

  // Recalculate crop when aspect ratio or preset changes
  useEffect(() => {
    if (imgSize.width > 0 && imgSize.height > 0) {
      let ar = targetAspectRatio;
      if (preset === '3:1') {
        ar = 3;
        setTargetAspectRatio(3);
        setAspectRatioLocked(true);
        setOutputWidth(1200);
        setOutputHeight(400);
      } else if (preset === '16:9') {
        ar = 16 / 9;
        setTargetAspectRatio(16 / 9);
        setAspectRatioLocked(true);
        setOutputWidth(1280);
        setOutputHeight(720);
      } else if (preset === '1:1') {
        ar = 1;
        setTargetAspectRatio(1);
        setAspectRatioLocked(true);
        setOutputWidth(800);
        setOutputHeight(800);
      } else if (preset === 'free') {
        if (aspectRatioLocked) {
          ar = outputWidth / outputHeight;
          setTargetAspectRatio(ar);
        } else {
          // Free crop - aspect not locked
          return;
        }
      }

      // Re-center and size crop box
      let w = imgSize.width;
      let h = imgSize.width / ar;

      if (h > imgSize.height) {
        h = imgSize.height;
        w = imgSize.height * ar;
      }

      w = w * 0.95;
      h = h * 0.95;

      const x = (imgSize.width - w) / 2;
      const y = (imgSize.height - h) / 2;

      setCrop({ x, y, width: w, height: h });
    }
  }, [preset, aspectRatioLocked, targetAspectRatio]);

  // Handle Drag Start
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, type: string) => {
    e.stopPropagation();
    // Allow touch events to scroll if not dragging, but prevent default to avoid jitter
    if (e.cancelable) e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setDragType(type);
    setDragStartPos({ x: clientX, y: clientY });
    setDragStartCrop({ ...crop });
  };

  // Perform Resizing / Moving
  const handleDragMove = (clientX: number, clientY: number) => {
    if (!dragType || !dragStartPos || !dragStartCrop || imgSize.width === 0) return;

    const dx = clientX - dragStartPos.x;
    const dy = clientY - dragStartPos.y;

    const newCrop = { ...dragStartCrop };

    if (dragType === 'move') {
      newCrop.x = Math.max(0, Math.min(imgSize.width - newCrop.width, dragStartCrop.x + dx));
      newCrop.y = Math.max(0, Math.min(imgSize.height - newCrop.height, dragStartCrop.y + dy));
    } else {
      const aspect = aspectRatioLocked ? targetAspectRatio : null;

      if (dragType === 'br') {
        let w = Math.max(20, Math.min(imgSize.width - dragStartCrop.x, dragStartCrop.width + dx));
        let h = Math.max(20, Math.min(imgSize.height - dragStartCrop.y, dragStartCrop.height + dy));

        if (aspect) {
          if (w / aspect > imgSize.height - dragStartCrop.y) {
            h = imgSize.height - dragStartCrop.y;
            w = h * aspect;
          } else {
            h = w / aspect;
          }
        }
        newCrop.width = w;
        newCrop.height = h;
      } else if (dragType === 'tl') {
        let w = Math.max(20, Math.min(dragStartCrop.x + dragStartCrop.width, dragStartCrop.width - dx));
        let h = Math.max(20, Math.min(dragStartCrop.y + dragStartCrop.height, dragStartCrop.height - dy));
        let x = dragStartCrop.x + dragStartCrop.width - w;
        let y = dragStartCrop.y + dragStartCrop.height - h;

        if (aspect) {
          if (w / aspect > dragStartCrop.y + dragStartCrop.height) {
            h = dragStartCrop.y + dragStartCrop.height;
            w = h * aspect;
            x = dragStartCrop.x + dragStartCrop.width - w;
            y = 0;
          } else {
            h = w / aspect;
            y = dragStartCrop.y + dragStartCrop.height - h;
            x = dragStartCrop.x + dragStartCrop.width - w;
          }
        }
        newCrop.width = w;
        newCrop.height = h;
        newCrop.x = x;
        newCrop.y = y;
      } else if (dragType === 'tr') {
        let w = Math.max(20, Math.min(imgSize.width - dragStartCrop.x, dragStartCrop.width + dx));
        let h = Math.max(20, Math.min(dragStartCrop.y + dragStartCrop.height, dragStartCrop.height - dy));
        let y = dragStartCrop.y + dragStartCrop.height - h;

        if (aspect) {
          if (w / aspect > dragStartCrop.y + dragStartCrop.height) {
            h = dragStartCrop.y + dragStartCrop.height;
            w = h * aspect;
            y = 0;
          } else {
            h = w / aspect;
            y = dragStartCrop.y + dragStartCrop.height - h;
          }
        }
        newCrop.width = w;
        newCrop.height = h;
        newCrop.y = y;
      } else if (dragType === 'bl') {
        let w = Math.max(20, Math.min(dragStartCrop.x + dragStartCrop.width, dragStartCrop.width - dx));
        let h = Math.max(20, Math.min(imgSize.height - dragStartCrop.y, dragStartCrop.height + dy));
        let x = dragStartCrop.x + dragStartCrop.width - w;

        if (aspect) {
          if (w / aspect > imgSize.height - dragStartCrop.y) {
            h = imgSize.height - dragStartCrop.y;
            w = h * aspect;
            x = dragStartCrop.x + dragStartCrop.width - w;
          } else {
            h = w / aspect;
          }
        }
        newCrop.width = w;
        newCrop.height = h;
        newCrop.x = x;
      }
    }

    setCrop(newCrop);

    // If free and unlocked, update outputs to reflect exact selection pixels (unless user manually edited)
    if (preset === 'free' && !aspectRatioLocked && !userHasEditedOutputSize) {
      const finalW = Math.round(newCrop.width * (naturalSize.width / imgSize.width));
      const finalH = Math.round(newCrop.height * (naturalSize.height / imgSize.height));
      setOutputWidth(finalW);
      setOutputHeight(finalH);
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    handleDragMove(e.clientX, e.clientY);
  };

  const onMouseUp = () => {
    setDragType(null);
    setDragStartPos(null);
    setDragStartCrop(null);
  };

  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Manage events globally during active drag to avoid drag dropping off window bounds
  useEffect(() => {
    if (dragType) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, [dragType, dragStartPos, dragStartCrop, imgSize, aspectRatioLocked, targetAspectRatio]);

  // Rotations & Flips using HTML5 Canvas helper
  const performRotation = async (clockwise: boolean) => {
    try {
      const img = new Image();
      img.src = currentImageSrc;
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      // Swap width and height for 90 degree rotation
      canvas.width = img.height;
      canvas.height = img.width;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((clockwise ? 90 : -90) * Math.PI / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const rotatedData = canvas.toDataURL('image/jpeg', 0.95);
      setCurrentImageSrc(rotatedData);
    } catch (err) {
      toast.error('Failed to rotate image.');
    }
  };

  const performFlip = async (horizontal: boolean) => {
    try {
      const img = new Image();
      img.src = currentImageSrc;
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;

      if (horizontal) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      } else {
        ctx.translate(0, canvas.height);
        ctx.scale(1, -1);
      }

      ctx.drawImage(img, 0, 0);

      const flippedData = canvas.toDataURL('image/jpeg', 0.95);
      setCurrentImageSrc(flippedData);
    } catch (err) {
      toast.error('Failed to flip image.');
    }
  };

  // Perform the actual crop and scale operation on canvas
  const handleApplyCrop = async () => {
    if (imgSize.width === 0 || outputWidth <= 0 || outputHeight <= 0) return;
    setApplying(true);
    try {
      const img = new Image();
      img.src = currentImageSrc;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Calculate scale differences between screen render size and natural size
      const scaleX = naturalSize.width / imgSize.width;
      const scaleY = naturalSize.height / imgSize.height;

      const sX = crop.x * scaleX;
      const sY = crop.y * scaleY;
      const sW = crop.width * scaleX;
      const sH = crop.height * scaleY;

      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get 2D context');
      }

      // Smooth scaling properties
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw cropped section to target resolution canvas
      ctx.drawImage(img, sX, sY, sW, sH, 0, 0, outputWidth, outputHeight);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const extension = fileName.substring(fileName.lastIndexOf('.'));
            const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
            const croppedFile = new File([blob], `${nameWithoutExt}_cropped${extension}`, {
              type: blob.type || 'image/jpeg',
              lastModified: Date.now(),
            });
            onConfirm(croppedFile);
          } else {
            toast.error('Failed to crop image.');
          }
          setApplying(false);
        },
        'image/jpeg',
        0.95
      );
    } catch (err) {
      console.error(err);
      toast.error('Error generating cropped image.');
      setApplying(false);
    }
  };

  // Safe handlers for Width & Height inputs
  const handleWidthChange = (val: number) => {
    if (isNaN(val) || val <= 0) {
      setOutputWidth(0);
      return;
    }
    setOutputWidth(val);
    setUserHasEditedOutputSize(true);
    if (aspectRatioLocked) {
      setOutputHeight(Math.round(val / targetAspectRatio));
    } else {
      // Custom aspect update
      setTargetAspectRatio(val / outputHeight);
    }
  };

  const handleHeightChange = (val: number) => {
    if (isNaN(val) || val <= 0) {
      setOutputHeight(0);
      return;
    }
    setOutputHeight(val);
    setUserHasEditedOutputSize(true);
    if (aspectRatioLocked) {
      setOutputWidth(Math.round(val * targetAspectRatio));
    } else {
      // Custom aspect update
      setTargetAspectRatio(outputWidth / val);
    }
  };

  const toggleAspectLock = () => {
    if (!aspectRatioLocked) {
      // Lock it now to the current width / height ratio
      if (outputWidth > 0 && outputHeight > 0) {
        const ar = outputWidth / outputHeight;
        setTargetAspectRatio(ar);
        setAspectRatioLocked(true);
      }
    } else {
      setAspectRatioLocked(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in font-kuntomruy">
      <div className="bg-white w-full max-w-4xl rounded-[5px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-100 animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <FiImage className="text-orange-500 w-5 h-5" />
            <div>
              <h4 className="text-sm font-black text-slate-800">Crop & Edit Banner Image</h4>
              <p className="text-[10px] text-slate-400 font-semibold">{fileName} ({naturalSize.width}x{naturalSize.height} px)</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors border-none cursor-pointer"
            title="Cancel"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          {/* Left: Cropper viewport */}
          <div className="lg:col-span-8 flex flex-col justify-between items-center bg-slate-900 border border-slate-200/10 rounded-[5px] p-4 relative overflow-hidden select-none min-h-[300px] lg:min-h-[420px]">
            {/* Visual Grid Container */}
            <div className="flex-1 flex items-center justify-center w-full relative">
              <div ref={containerRef} className="relative inline-block">
                <img
                  src={currentImageSrc}
                  onLoad={handleImageLoaded}
                  className="max-h-[340px] lg:max-h-[380px] max-w-full object-contain select-none pointer-events-none rounded-[2px]"
                  alt="Crop Target"
                />

                {imgSize.width > 0 && (
                  <div
                    ref={overlayRef}
                    className="absolute top-0 left-0 w-full h-full cursor-default"
                  >
                    {/* Dark overlay around crop area */}
                    <div
                      style={{
                        position: 'absolute',
                        left: crop.x,
                        top: crop.y,
                        width: crop.width,
                        height: crop.height,
                        boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.65)',
                        cursor: 'move',
                      }}
                      className="border-2 border-orange-500 rounded-[2px]"
                      onMouseDown={(e) => handleDragStart(e, 'move')}
                      onTouchStart={(e) => handleDragStart(e, 'move')}
                    >
                      {/* Sub-grid guide lines */}
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                        <div className="border-r border-dashed border-white" />
                        <div className="border-r border-dashed border-white" />
                        <div className="border-b border-dashed border-white" />
                        <div className="border-b border-dashed border-white" />
                      </div>

                      {/* Corners dragging handles */}
                      <div
                        className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-orange-600 border border-white rounded-full cursor-nwse-resize active:scale-125 transition-transform"
                        onMouseDown={(e) => handleDragStart(e, 'tl')}
                        onTouchStart={(e) => handleDragStart(e, 'tl')}
                      />
                      <div
                        className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-orange-600 border border-white rounded-full cursor-nesw-resize active:scale-125 transition-transform"
                        onMouseDown={(e) => handleDragStart(e, 'tr')}
                        onTouchStart={(e) => handleDragStart(e, 'tr')}
                      />
                      <div
                        className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-orange-600 border border-white rounded-full cursor-nesw-resize active:scale-125 transition-transform"
                        onMouseDown={(e) => handleDragStart(e, 'bl')}
                        onTouchStart={(e) => handleDragStart(e, 'bl')}
                      />
                      <div
                        className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-orange-600 border border-white rounded-full cursor-nwse-resize active:scale-125 transition-transform"
                        onMouseDown={(e) => handleDragStart(e, 'br')}
                        onTouchStart={(e) => handleDragStart(e, 'br')}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick transformation toolbars */}
            <div className="flex items-center space-x-4 mt-4 bg-slate-800/80 backdrop-blur-xs px-4 py-2 rounded-full border border-slate-700/50">
              <button
                type="button"
                onClick={() => performRotation(false)}
                className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors border-none cursor-pointer flex items-center justify-center"
                title="Rotate Left 90°"
              >
                <FiRotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => performRotation(true)}
                className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors border-none cursor-pointer flex items-center justify-center"
                title="Rotate Right 90°"
              >
                <FiRotateCw className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-4 bg-slate-700" />
              <button
                type="button"
                onClick={() => performFlip(true)}
                className="px-2.5 py-1 text-[10px] font-black hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors border-none cursor-pointer"
                title="Flip Horizontally"
              >
                FLIP H
              </button>
              <button
                type="button"
                onClick={() => performFlip(false)}
                className="px-2.5 py-1 text-[10px] font-black hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors border-none cursor-pointer"
                title="Flip Vertically"
              >
                FLIP V
              </button>
            </div>
          </div>

          {/* Right: Settings and outputs */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              {/* Aspect Ratio Presets */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Aspect Ratio Preset</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => selectPreset('3:1')}
                    className={`py-2 px-3 text-xs font-bold rounded-[5px] border transition-all text-center cursor-pointer ${
                      preset === '3:1'
                        ? 'border-orange-500 bg-orange-50/50 text-orange-600'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    3:1 (Banner)
                  </button>
                  <button
                    type="button"
                    onClick={() => selectPreset('16:9')}
                    className={`py-2 px-3 text-xs font-bold rounded-[5px] border transition-all text-center cursor-pointer ${
                      preset === '16:9'
                        ? 'border-orange-500 bg-orange-50/50 text-orange-600'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    16:9 Widescreen
                  </button>
                  <button
                    type="button"
                    onClick={() => selectPreset('1:1')}
                    className={`py-2 px-3 text-xs font-bold rounded-[5px] border transition-all text-center cursor-pointer ${
                      preset === '1:1'
                        ? 'border-orange-500 bg-orange-50/50 text-orange-600'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    1:1 Square
                  </button>
                  <button
                    type="button"
                    onClick={() => selectPreset('free')}
                    className={`py-2 px-3 text-xs font-bold rounded-[5px] border transition-all text-center cursor-pointer ${
                      preset === 'free'
                        ? 'border-orange-500 bg-orange-50/50 text-orange-600'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    Free Custom
                  </button>
                </div>
              </div>

              {/* Resolution Dimensions Input */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-[5px]">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider">Output Size (Pixels)</label>
                  <div className="flex items-center space-x-2">
                    {preset === 'free' && !aspectRatioLocked && userHasEditedOutputSize && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserHasEditedOutputSize(false);
                          if (imgSize.width > 0) {
                            const finalW = Math.round(crop.width * (naturalSize.width / imgSize.width));
                            const finalH = Math.round(crop.height * (naturalSize.height / imgSize.height));
                            setOutputWidth(finalW);
                            setOutputHeight(finalH);
                          }
                        }}
                        className="text-[9px] text-orange-500 hover:text-orange-600 font-extrabold cursor-pointer border-none bg-transparent underline"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={toggleAspectLock}
                      className={`text-[10px] px-2 py-0.5 font-black border rounded-full flex items-center space-x-1 cursor-pointer transition-all ${
                        aspectRatioLocked
                          ? 'border-orange-200 bg-orange-100/50 text-orange-600'
                          : 'border-slate-300 bg-white text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {aspectRatioLocked ? <FiMinimize2 className="w-2.5 h-2.5 inline" /> : <FiMaximize2 className="w-2.5 h-2.5 inline" />}
                      <span>{aspectRatioLocked ? 'Locked' : 'Unlock'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold">Width (W)</span>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min="1"
                        value={outputWidth === 0 ? '' : outputWidth}
                        onChange={(e) => handleWidthChange(parseInt(e.target.value))}
                        className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-700 font-extrabold"
                      />
                      <span className="absolute right-2.5 text-[9px] font-bold text-slate-400">px</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold">Height (H)</span>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min="1"
                        value={outputHeight === 0 ? '' : outputHeight}
                        onChange={(e) => handleHeightChange(parseInt(e.target.value))}
                        className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-700 font-extrabold"
                      />
                      <span className="absolute right-2.5 text-[9px] font-bold text-slate-400">px</span>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">
                  Changing width/height inputs scales the cropped area to the targeted pixel dimensions on save. Recommended size is 1200x400.
                </p>
              </div>

              {/* Info stats */}
              {imgSize.width > 0 && (
                <div className="text-[10px] font-black text-slate-500 space-y-1.5 border-t border-slate-100 pt-3.5">
                  <div className="flex justify-between">
                    <span>Selection Area Size:</span>
                    <span className="text-slate-800">
                      {Math.round(crop.width * (naturalSize.width / imgSize.width))} x{' '}
                      {Math.round(crop.height * (naturalSize.height / imgSize.height))} px
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Aspect Ratio:</span>
                    <span className="text-slate-800">
                      {targetAspectRatio ? targetAspectRatio.toFixed(2) : 'Free'} : 1
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onCancel}
                disabled={applying}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-[5px] text-xs font-extrabold transition-all cursor-pointer bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCrop}
                disabled={applying || outputWidth <= 0 || outputHeight <= 0}
                className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-[5px] text-xs font-extrabold transition-all shadow-2xs hover:shadow-xs cursor-pointer border-none flex items-center justify-center space-x-1.5 disabled:opacity-60"
              >
                {applying ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FiCheck className="w-3.5 h-3.5" />
                )}
                <span>Apply Crop</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
