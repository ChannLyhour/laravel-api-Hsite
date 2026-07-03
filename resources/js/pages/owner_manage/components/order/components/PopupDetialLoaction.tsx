import React from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiMapPin, FiPhone, FiUser, FiExternalLink, FiShoppingBag, FiTruck } from 'react-icons/fi';
import { deliveryZonesService, type DeliveryZone } from '@/api/owner/deliveryZones';

interface PopupDetailLocationProps {
     onClose: () => void;
     customerName: string;
     customerPhone: string;
     addressText: string;
     latitude?: number | string | null;
     longitude?: number | string | null;
     storeLatitude?: number | string | null;
     storeLongitude?: number | string | null;
     storeName?: string;
     storeLogo?: string;
}

export const PopupDetailLocation: React.FC<PopupDetailLocationProps> = ({
     onClose,
     customerName,
     customerPhone,
     addressText,
     latitude,
     longitude,
     storeLatitude,
     storeLongitude,
     storeName,
     storeLogo,
}) => {
     const [mapView, setMapView] = React.useState<'delivery' | 'customer' | 'store'>('delivery');
     const [deliveryZones, setDeliveryZones] = React.useState<DeliveryZone[]>([]);
     const [loadingZones, setLoadingZones] = React.useState(false);

     const hasCoordinates = latitude && longitude;
     const latVal = parseFloat(String(latitude));
     const lngVal = parseFloat(String(longitude));

     // Fetch active delivery zones for this store
     React.useEffect(() => {
          setLoadingZones(true);
          deliveryZonesService.getMyDeliveryZones()
               .then((zones) => {
                    if (Array.isArray(zones)) {
                         setDeliveryZones(zones.filter(z => z.is_active));
                    }
               })
               .catch((err) => {
                    console.warn('Failed to fetch delivery zones:', err);
               })
               .finally(() => {
                    setLoadingZones(false);
               });
     }, []);

     // Robust store coordinates fallback logic: 
     // If the store coordinate settings are empty, we fall back to the first active radius zone's center coordinates.
     const hasExplicitStoreCoords = storeLatitude && storeLongitude;
     const fallbackZone = deliveryZones.find(z => (!z.type || z.type === 'radius') && z.center_lat && z.center_lng);
     
     const storeLatVal = hasExplicitStoreCoords
          ? parseFloat(String(storeLatitude))
          : (fallbackZone?.center_lat ? parseFloat(String(fallbackZone.center_lat)) : NaN);

     const storeLngVal = hasExplicitStoreCoords
          ? parseFloat(String(storeLongitude))
          : (fallbackZone?.center_lng ? parseFloat(String(fallbackZone.center_lng)) : NaN);

     const hasStoreCoordinates = !isNaN(storeLatVal) && !isNaN(storeLngVal);

     // Calculate Haversine distance
     const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
          const R = 6371; // Earth's radius in km
          const dLat = ((lat2 - lat1) * Math.PI) / 180;
          const dLon = ((lon2 - lon1) * Math.PI) / 180;
          const a =
               Math.sin(dLat / 2) * Math.sin(dLat / 2) +
               Math.cos((lat1 * Math.PI) / 180) *
                    Math.cos((lat2 * Math.PI) / 180) *
                    Math.sin(dLon / 2) *
                    Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c; // Distance in km
     };

     const distanceKm =
          hasCoordinates && !isNaN(latVal) && !isNaN(lngVal) &&
          hasStoreCoordinates
               ? getHaversineDistance(storeLatVal, storeLngVal, latVal, lngVal)
               : null;

     // Construct Google Map embed source based on active view selection
     const isStoreView = mapView === 'store';
     const activeLat = isStoreView ? storeLatVal : latVal;
     const activeLng = isStoreView ? storeLngVal : lngVal;
     const activeHasCoords = isStoreView ? hasStoreCoordinates : hasCoordinates;
     const activeAddress = isStoreView ? (storeName || 'Store Location') : addressText;

     const embedUrl = activeHasCoords && !isNaN(activeLat) && !isNaN(activeLng)
          ? `https://maps.google.com/maps?q=${activeLat},${activeLng}&z=15&output=embed`
          : `https://maps.google.com/maps?q=${encodeURIComponent(activeAddress)}&z=15&output=embed`;

     const externalMapUrl = activeHasCoords && !isNaN(activeLat) && !isNaN(activeLng)
          ? `https://www.google.com/maps?q=${activeLat},${activeLng}`
          : `https://www.google.com/maps?q=${encodeURIComponent(activeAddress)}`;

     // Ensure store logo is a fully qualified absolute URL so the srcDoc iframe can resolve it from about:blank
     const absoluteStoreLogo = React.useMemo(() => {
          if (!storeLogo) return '';
          if (storeLogo.startsWith('http://') || storeLogo.startsWith('https://') || storeLogo.startsWith('data:')) {
               return storeLogo;
          }
          const origin = typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8000';
          return `${origin}/${storeLogo.replace(/^\//, '')}`;
     }, [storeLogo]);

     // Generate interactive Leaflet map including store radius and polygons
     const generateMapSrcDoc = () => {
          const store = hasStoreCoordinates
               ? { lat: storeLatVal, lng: storeLngVal, name: storeName || 'Store', logo: absoluteStoreLogo || '' }
               : null;

          const customer = hasCoordinates && !isNaN(latVal) && !isNaN(lngVal)
               ? { lat: latVal, lng: lngVal, name: customerName || 'Customer', address: addressText }
               : null;

          const zonesData = deliveryZones.map(zone => {
               if (!zone.type || zone.type === 'radius') {
                    return {
                         type: 'radius',
                         name: zone.name,
                         lat: zone.center_lat ? parseFloat(String(zone.center_lat)) : (store?.lat || 0),
                         lng: zone.center_lng ? parseFloat(String(zone.center_lng)) : (store?.lng || 0),
                         radiusMeters: zone.radius_km ? parseFloat(String(zone.radius_km)) * 1000 : 0,
                         fee: zone.delivery_fee
                     };
               } else if (zone.type === 'polygon' && zone.polygon_coordinates) {
                    return {
                         type: 'polygon',
                         name: zone.name,
                         wkt: zone.polygon_coordinates,
                         fee: zone.delivery_fee
                    };
               }
               return null;
          }).filter(Boolean);

          return `
<!DOCTYPE html>
<html>
<head>
     <meta charset="utf-8" />
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
     <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
     <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          .custom-popup .leaflet-popup-content-wrapper {
               border-radius: 5px;
               box-shadow: 0 4px 20px rgba(0,0,0,0.15);
               padding: 4px;
          }
          .popup-title { font-weight: 800; font-size: 13px; color: #1e293b; margin-bottom: 4px; }
          .popup-desc { font-size: 11px; color: #64748b; margin-bottom: 2px; }
          .popup-badge { display: inline-block; background: #e0e7ff; color: #4338ca; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 9999px; margin-top: 4px; }
     </style>
</head>
<body>
     <div id="map"></div>
     <script>
          const storeData = ${JSON.stringify(store)};
          const customerData = ${JSON.stringify(customer)};
          const zones = ${JSON.stringify(zonesData)};

          // Initialize Leaflet map
          const map = L.map('map', { zoomControl: false });
          L.control.zoom({ position: 'bottomright' }).addTo(map);

          // Add OpenStreetMap tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
               attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);

          const bounds = [];

          // Helper to parse WKT POLYGON((lng lat, lng lat, ...))
          function parseWKTPolygon(wkt) {
               try {
                    const match = wkt.match(/POLYGON\\s*\\(\\s*\\(([^)]+)\\)\\s*\\)/i);
                    if (!match) return [];
                    const pointsStr = match[1].split(',');
                    const points = [];
                    for (const p of pointsStr) {
                         const coords = p.trim().split(/\\s+/);
                         if (coords.length >= 2) {
                              const lng = parseFloat(coords[0]);
                              const lat = parseFloat(coords[1]);
                              if (!isNaN(lng) && !isNaN(lat)) {
                                   points.push([lat, lng]);
                              }
                         }
                    }
                    return points;
               } catch (e) {
                    console.error("WKT parse error:", e);
                    return [];
               }
          }

          // Custom Store Pin HTML containing Store Logo image or storefront SVG fallback
          const storePinHtml = storeData && storeData.logo
               ? \`<div style="position: relative; width: 42px; height: 42px;">
                    <svg viewBox="0 0 100 100" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0;" xmlns="http://www.w3.org/2000/svg">
                         <path d="M50 0 C22.4 0 0 22.4 0 50 C0 85 50 100 50 100 C50 100 100 85 100 50 C100 22.4 77.6 0 50 0 Z" fill="#4f46e5"/>
                         <circle cx="50" cy="45" r="32" fill="white"/>
                    </svg>
                    <img src="\${storeData.logo}" style="position: absolute; width: 26px; height: 26px; top: 6px; left: 8px; border-radius: 50%; object-fit: cover; border: 1px solid #e2e8f0;" />
                  </div>\`
               : \`<div style="position: relative; width: 42px; height: 42px;">
                    <svg viewBox="0 0 100 100" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0;" xmlns="http://www.w3.org/2000/svg">
                         <path d="M50 0 C22.4 0 0 22.4 0 50 C0 85 50 100 50 100 C50 100 100 85 100 50 C100 22.4 77.6 0 50 0 Z" fill="#4f46e5"/>
                         <circle cx="50" cy="45" r="32" fill="white"/>
                    </svg>
                    <svg viewBox="0 0 24 24" style="position: absolute; width: 18px; height: 18px; top: 10px; left: 12px;" fill="#4f46e5" xmlns="http://www.w3.org/2000/svg">
                         <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z"/>
                    </svg>
                  </div>\`;

          const storeIcon = L.divIcon({
               html: storePinHtml,
               className: 'custom-pin-store',
               iconSize: [42, 42],
               iconAnchor: [21, 42],
               popupAnchor: [0, -38]
          });

          const customerIcon = L.divIcon({
               html: \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ea580c" width="36" height="36"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>\`,
               className: 'custom-pin-customer',
               iconSize: [36, 36],
               iconAnchor: [18, 36],
               popupAnchor: [0, -32]
          });

          // Draw Store Marker
          if (storeData) {
               const storeMarker = L.marker([storeData.lat, storeData.lng], { icon: storeIcon }).addTo(map);
               storeMarker.bindPopup(\`
                    <div class="custom-popup">
                         <div class="popup-title">\${storeData.name}</div>
                         <div class="popup-desc">Dispatch Center (Store)</div>
                         <div class="popup-badge" style="background:#e0e7ff; color:#4338ca;">Origin</div>
                    </div>
               \`);
               bounds.push([storeData.lat, storeData.lng]);
          }

          // Draw Customer Marker
          if (customerData) {
               const customerMarker = L.marker([customerData.lat, customerData.lng], { icon: customerIcon }).addTo(map);
               customerMarker.bindPopup(\`
                    <div class="custom-popup">
                         <div class="popup-title">\${customerData.name}</div>
                         <div class="popup-desc">\${customerData.address}</div>
                         <div class="popup-badge" style="background:#ffedd5; color:#c2410c;">Recipient</div>
                    </div>
               \`);
               bounds.push([customerData.lat, customerData.lng]);
               customerMarker.openPopup();
          }

          // Draw Delivery Zones (Radius Circles / Polygons)
          zones.forEach(zone => {
               if (zone.type === 'radius' && zone.lat && zone.lng && zone.radiusMeters > 0) {
                    const circle = L.circle([zone.lat, zone.lng], {
                         radius: zone.radiusMeters,
                         color: '#4f46e5',
                         fillColor: '#818cf8',
                         fillOpacity: 0.15,
                         weight: 2,
                         dashArray: '5, 5'
                    }).addTo(map);
                    circle.bindPopup(\`
                         <div class="custom-popup">
                              <div class="popup-title">\${zone.name}</div>
                              <div class="popup-desc">Radius: \${(zone.radiusMeters / 1000).toFixed(1)} km</div>
                              <div class="popup-badge">Fee: $\${parseFloat(zone.fee).toFixed(2)}</div>
                         </div>
                    \`);
               } else if (zone.type === 'polygon' && zone.wkt) {
                    const coords = parseWKTPolygon(zone.wkt);
                    if (coords.length > 0) {
                         const polygon = L.polygon(coords, {
                              color: '#10b981',
                              fillColor: '#34d399',
                              fillOpacity: 0.15,
                              weight: 2
                         }).addTo(map);
                         polygon.bindPopup(\`
                              <div class="custom-popup">
                                   <div class="popup-title">\${zone.name}</div>
                                   <div class="popup-desc">Delivery Area (Polygon)</div>
                                   <div class="popup-badge" style="background:#d1fae5; color:#065f46;">Fee: $\${parseFloat(zone.fee).toFixed(2)}</div>
                              </div>
                         \`);
                    }
               }
          });

          // Auto center and zoom map to show all elements
          if (bounds.length > 0) {
               map.fitBounds(bounds, { padding: [50, 50] });
          } else if (storeData) {
               map.setView([storeData.lat, storeData.lng], 13);
          } else {
               map.setView([11.5564, 104.9282], 13); // Default Phnom Penh fallback
          }
     </script>
</body>
</html>
          `;
     };

     return createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
               {/* Backdrop */}
               <div
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
                    onClick={onClose}
               />

               {/* Dialog Container - Styled with rounded-[5px] to match order show.tsx invoice containers */}
               <div className="relative z-10 bg-white w-full max-w-[95vw] xl:max-w-[90vw] h-[90vh] rounded-[5px] shadow-2xl overflow-hidden flex flex-col animate-scale-up">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 shrink-0">
                         <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-[5px] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                   <FiMapPin className="w-4.5 h-4.5 stroke-[2.2]" />
                              </div>
                              <div>
                                   <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">
                                        Delivery Location Map
                                   </h3>
                                   <p className="opacity-60 text-[10px] font-bold uppercase tracking-wider mt-1.5">
                                        {mapView === 'delivery' ? 'Interactive Radius & Zone Map Overlay' : 'Google Maps Embed Resolution'}
                                   </p>
                              </div>
                         </div>
                         <button
                              onClick={onClose}
                              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors border-none bg-transparent cursor-pointer"
                         >
                              <FiX className="w-4 h-4 stroke-[2.5]" />
                         </button>
                    </div>

                    {/* Two-Column Content Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 flex-1 overflow-hidden w-full h-full">
                         {/* Left Column: Map Frame */}
                         <div className="w-full h-80 md:h-full relative bg-slate-50 border-b md:border-b-0 md:border-r border-slate-150 min-h-[300px] md:min-h-0 flex flex-col">
                              {/* Map View Toggle Overlay - styled with rounded-[5px] */}
                              <div className="absolute top-4 left-4 z-20 flex bg-white/90 backdrop-blur-xs p-1 rounded-[5px] shadow-md border border-slate-150/50 gap-1">
                                   <button
                                        type="button"
                                        onClick={() => setMapView('delivery')}
                                        className={`px-3 py-1.5 rounded-[5px] text-[10px] font-black uppercase tracking-wider transition-all border-none cursor-pointer flex items-center gap-1 ${
                                             mapView === 'delivery'
                                                  ? 'bg-indigo-600 text-white shadow-xs'
                                                  : 'bg-transparent text-slate-600 hover:text-indigo-600'
                                        }`}
                                   >
                                        <FiMapPin className="w-3.5 h-3.5 shrink-0" />
                                        Delivery Map
                                   </button>
                                   <button
                                        type="button"
                                        onClick={() => setMapView('customer')}
                                        className={`px-3 py-1.5 rounded-[5px] text-[10px] font-black uppercase tracking-wider transition-all border-none cursor-pointer flex items-center gap-1 ${
                                             mapView === 'customer'
                                                  ? 'bg-indigo-600 text-white shadow-xs'
                                                  : 'bg-transparent text-slate-600 hover:text-indigo-600'
                                        }`}
                                   >
                                        <FiUser className="w-3.5 h-3.5 shrink-0" />
                                        Customer Google Map
                                   </button>
                                   {hasStoreCoordinates && (
                                        <button
                                             type="button"
                                             onClick={() => setMapView('store')}
                                             className={`px-3 py-1.5 rounded-[5px] text-[10px] font-black uppercase tracking-wider transition-all border-none cursor-pointer flex items-center gap-1 ${
                                                  mapView === 'store'
                                                       ? 'bg-indigo-600 text-white shadow-xs'
                                                       : 'bg-transparent text-slate-600 hover:text-indigo-600'
                                        }`}
                                        >
                                             <FiShoppingBag className="w-3.5 h-3.5 shrink-0" />
                                             Store Google Map
                                        </button>
                                   )}
                              </div>

                              {mapView === 'delivery' ? (
                                   <iframe
                                        title="Delivery Zone Map"
                                        srcDoc={generateMapSrcDoc()}
                                        className="w-full h-full flex-1 border-none"
                                        allowFullScreen
                                        loading="lazy"
                                   />
                              ) : (
                                   <iframe
                                        title={mapView === 'store' ? "Store Google Map" : "Customer Google Map"}
                                        src={embedUrl}
                                        className="w-full h-full flex-1 border-none"
                                        allowFullScreen
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                   />
                              )}
                         </div>

                         {/* Right Column: Details and Actions */}
                         <div className="p-8 space-y-6 overflow-y-auto flex flex-col justify-between h-full">
                              <div className="space-y-6 text-left">
                                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Customer / Recipient Card - Styled to match show.tsx custom-card-container */}
                                        <div className="border rounded-[5px] p-6 shadow-sm space-y-4 custom-card-container bg-white">
                                             <div className="pb-3 border-b">
                                                  <h3 className="font-extrabold text-sm flex items-center gap-2">
                                                       <FiUser className="text-blue-500 w-4.5 h-4.5 shrink-0" />
                                                       <span>Recipient Details</span>
                                                  </h3>
                                                  <p className="opacity-60 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                                                       delivery destination
                                                  </p>
                                             </div>
                                             <div className="space-y-3.5 text-xs font-semibold text-slate-700 leading-normal">
                                                  <div className="space-y-1">
                                                       <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Name</p>
                                                       <p className="font-black text-sm text-slate-800">{customerName}</p>
                                                  </div>
                                                  <div className="space-y-1">
                                                       <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Phone</p>
                                                       <p className="font-black text-sm text-slate-800">{customerPhone}</p>
                                                  </div>
                                                  <div className="text-[11px] pt-3 border-t font-mono space-y-1 text-slate-700">
                                                       {hasCoordinates && !isNaN(latVal) && !isNaN(lngVal) ? (
                                                            <>
                                                                 <p>Lat: <span className="text-indigo-600 font-bold">{latVal.toFixed(6)}</span></p>
                                                                 <p>Lng: <span className="text-indigo-600 font-bold">{lngVal.toFixed(6)}</span></p>
                                                            </>
                                                       ) : (
                                                            <p className="text-slate-400 italic font-sans font-medium">No Customer GPS coords</p>
                                                       )}
                                                  </div>
                                             </div>
                                        </div>

                                        {/* Store / Merchant Card - Styled to match show.tsx custom-card-container */}
                                        <div className="border rounded-[5px] p-6 shadow-sm space-y-4 custom-card-container bg-white">
                                             <div className="pb-3 border-b flex items-center justify-between">
                                                  <div>
                                                       <h3 className="font-extrabold text-sm flex items-center gap-2">
                                                            <FiShoppingBag className="text-indigo-500 w-4.5 h-4.5 shrink-0" />
                                                            <span>Store Details</span>
                                                       </h3>
                                                       <p className="opacity-60 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                                                            dispatch center
                                                       </p>
                                                  </div>
                                                  {storeLogo && (
                                                       <img 
                                                            src={storeLogo} 
                                                            alt="Store Logo" 
                                                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs" 
                                                       />
                                                  )}
                                             </div>
                                             <div className="space-y-3.5 text-xs font-semibold text-slate-700 leading-normal">
                                                  <div className="space-y-1">
                                                       <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Store</p>
                                                       <p className="font-black text-sm text-slate-800">{storeName || 'Store Location'}</p>
                                                  </div>
                                                  <div className="space-y-1">
                                                       <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Role</p>
                                                       <p className="font-black text-sm text-slate-800">Dispatch Center</p>
                                                  </div>
                                                  <div className="text-[11px] pt-3 border-t font-mono space-y-1 text-slate-700">
                                                       {hasStoreCoordinates ? (
                                                            <>
                                                                 <p>Lat: <span className="text-indigo-600 font-bold">{storeLatVal.toFixed(6)}</span></p>
                                                                 <p>Lng: <span className="text-indigo-600 font-bold">{storeLngVal.toFixed(6)}</span></p>
                                                            </>
                                                       ) : (
                                                            <p className="text-slate-450 italic font-sans font-medium">No Store GPS coords</p>
                                                       )}
                                                  </div>
                                             </div>
                                        </div>
                                   </div>

                                   {/* Distance computation card - Styled to match show.tsx invoices (rounded-[5px] and custom card styles) */}
                                   {distanceKm !== null && (
                                        <div className="border rounded-[5px] p-6 shadow-sm custom-card-container bg-gradient-to-r from-indigo-500/5 to-purple-500/5 flex items-center justify-between transition-all duration-300">
                                             <div className="flex items-center gap-3">
                                                  <div className="w-10 h-10 rounded-[5px] bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold shadow-2xs">
                                                       <FiTruck className="w-5 h-5 shrink-0" />
                                                  </div>
                                                  <div>
                                                       <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-wider leading-none">
                                                            Delivery Distance
                                                       </h4>
                                                       <p className="text-base font-black text-slate-800 mt-1.5 leading-none">
                                                            {distanceKm.toFixed(2)} km
                                                       </p>
                                                  </div>
                                             </div>
                                             <span className="text-[9px] font-extrabold bg-indigo-100 border border-indigo-200 text-indigo-750 px-2.5 py-1 rounded-[5px] uppercase tracking-wider leading-none shadow-3xs">
                                                  Direct Route
                                             </span>
                                        </div>
                                   )}

                                   {/* Active Delivery Zones List - Styled to match show.tsx list elements */}
                                   {deliveryZones.length > 0 && (
                                        <div className="border rounded-[5px] p-6 shadow-sm space-y-4 custom-card-container bg-white">
                                             <div className="pb-3 border-b">
                                                  <h4 className="font-extrabold text-sm flex items-center gap-2">
                                                       <FiMapPin className="text-emerald-500 w-4.5 h-4.5 shrink-0" />
                                                       <span>Active Delivery Zones</span>
                                                  </h4>
                                                  <p className="opacity-60 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                                                       applicable fee schedules
                                                  </p>
                                             </div>
                                             <div className="grid grid-cols-1 gap-2.5 max-h-[140px] overflow-y-auto pr-1">
                                                  {deliveryZones.map(zone => (
                                                       <div key={zone.id} className="flex items-center justify-between text-xs bg-slate-50 p-3 border rounded-[5px] font-semibold text-slate-700">
                                                            <div className="flex items-center gap-2">
                                                                 <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                                 <span className="font-extrabold text-slate-700">{zone.name}</span>
                                                                 <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                                                      {(!zone.type || zone.type === 'radius') ? `${zone.radius_km || 0} km radius` : 'polygon'}
                                                                 </span>
                                                            </div>
                                                            <span className="font-black text-emerald-600">
                                                                 ${parseFloat(String(zone.delivery_fee)).toFixed(2)}
                                                            </span>
                                                       </div>
                                                  ))}
                                             </div>
                                        </div>
                                   )}

                                   {/* Full Address Text - Styled to match show.tsx layout */}
                                   <div className="border rounded-[5px] p-6 shadow-sm space-y-3 custom-card-container bg-white">
                                        <div className="pb-2 border-b">
                                             <h4 className="font-extrabold text-sm flex items-center gap-2 text-slate-800">
                                                  <FiMapPin className="text-orange-500 w-4 h-4 shrink-0" />
                                                  <span>Street Address</span>
                                             </h4>
                                        </div>
                                        <p className="text-xs font-semibold text-slate-700 leading-relaxed bg-slate-50 p-3.5 border rounded-[5px]">
                                             {addressText || 'No custom street address specified.'}
                                        </p>
                                   </div>
                              </div>

                              {/* Action buttons - styled with rounded-[5px] */}
                              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100">
                                   <a
                                        href={externalMapUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-stone-900 hover:bg-stone-800 active:scale-[0.98] text-white text-[11px] font-black uppercase tracking-widest rounded-[5px] transition-all shadow-md decoration-none border-none cursor-pointer text-center"
                                   >
                                        <FiExternalLink className="w-4 h-4 shrink-0" /> Open in Google Maps
                                   </a>
                                   <button
                                        onClick={onClose}
                                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-800 text-[11px] font-black uppercase tracking-widest rounded-[5px] border-none cursor-pointer transition-all"
                                   >
                                        Close Details
                                   </button>
                              </div>
                         </div>
                    </div>
               </div>
          </div>,
          document.body
     );
};
