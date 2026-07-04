// autoLocationCustomer.ts
// A utility to dynamically load Leaflet, auto-detect location, render an interactive map, and retrieve reverse-geocoded address.

declare global {
    interface Window {
        L: any;
    }
}

// Leaflet CDN URLs
const LEAFLET_CSS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

// Standard Cambodian Provinces/Cities for matching
const CAMBODIA_CITIES = [
    "Phnom Penh",
    "Siem Reap",
    "Battambang",
    "Sihanoukville",
    "Kampong Cham",
    "Koh Kong",
    "Kratie",
    "Takeo",
    "Kampot",
    "Pursat",
    "Prey Veng",
    "Svay Rieng",
    "Kandal",
    "Mondulkiri",
    "Ratanakiri",
    "Stung Treng",
    "Preah Vihear",
    "Oddar Meanchey",
    "Pailin",
    "Kep",
    "Tbong Khmum",
    "Banteay Meanchey",
    "Kampong Chhnang",
    "Kampong Speu",
    "Kampong Thom",
];

/**
 * Load Leaflet JS & CSS dynamically from CDN
 */
export function loadLeaflet(): Promise<any> {
    return new Promise((resolve, reject) => {
        if (window.L) {
            resolve(window.L);
            return;
        }

        // Add CSS
        if (!document.querySelector(`link[href="${LEAFLET_CSS_URL}"]`)) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = LEAFLET_CSS_URL;
            document.head.appendChild(link);
        }

        // Add JS
        const scriptId = "leaflet-js-script";
        let script = document.getElementById(scriptId) as HTMLScriptElement;

        if (!script) {
            script = document.createElement("script");
            script.id = scriptId;
            script.src = LEAFLET_JS_URL;
            script.async = true;
            document.body.appendChild(script);
        }

        script.addEventListener("load", () => {
            // Leaflet default icon paths fix
            if (window.L) {
                delete window.L.Icon.Default.prototype._getIconUrl;
                window.L.Icon.Default.mergeOptions({
                    iconRetinaUrl:
                        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                    iconUrl:
                        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                    shadowUrl:
                        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
                });
                resolve(window.L);
            } else {
                reject(new Error("Leaflet failed to initialize."));
            }
        });

        script.addEventListener("error", (err) => {
            reject(new Error("Failed to load Leaflet script."));
        });
    });
}

/**
 * Find matching province name from OSM address response
 */
export function findMatchingProvince(addressObj: any): string {
    if (!addressObj) return "";
    const fieldsToSearch = [
        addressObj.province,
        addressObj.state,
        addressObj.city,
        addressObj.town,
        addressObj.county,
        addressObj.municipality,
    ];

    for (const val of fieldsToSearch) {
        if (!val) continue;
        const cleanVal = String(val).toLowerCase();

        if (
            cleanVal.includes("sihanouk") ||
            cleanVal.includes("sihanoukville")
        ) {
            return "Sihanoukville";
        }

        const matched = CAMBODIA_CITIES.find((city) => {
            const cleanCity = city
                .toLowerCase()
                .replace(/[\u0300-\u036f]/g, ""); // strip accents
            const cleanSearch = cleanVal.replace(/[\u0300-\u036f]/g, "");
            return (
                cleanSearch.includes(cleanCity) ||
                cleanCity.includes(cleanSearch)
            );
        });

        if (matched) return matched;
    }
    return "";
}

export interface GeolocationResult {
    latitude: number;
    longitude: number;
    address: string;
    city_province: string;
    country: string;
}

/**
 * Reverse geocode latitude and longitude using Nominatim OpenStreetMap
 */
export async function reverseGeocode(
    lat: number,
    lng: number,
): Promise<{ address: string; city_province: string; country: string }> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
            {
                headers: { "Accept-Language": "en" },
            },
        );
        const data = await res.json();
        if (data) {
            const fullAddress = data.display_name || "";
            const cleanAddress = fullAddress
                .replace(/, Cambodia$/, "")
                .replace(/, \d{5,6}$/, "")
                .trim();
            const matchedProvince = findMatchingProvince(data.address);
            return {
                address: cleanAddress,
                city_province: matchedProvince || "Phnom Penh",
                country: data.address?.country || "Cambodia",
            };
        }
    } catch (e) {
        console.error("Reverse geocoding error:", e);
    }
    return { address: "", city_province: "Phnom Penh", country: "Cambodia" };
}

/**
 * Geocode text address search queries
 */
export async function geocodeSearch(
    query: string,
): Promise<{ lat: number; lng: number; displayName: string }[]> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Cambodia")}&addressdetails=1&limit=5`,
            {
                headers: { "Accept-Language": "en" },
            },
        );
        const data = await res.json();
        return data.map((item: any) => ({
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            displayName: item.display_name,
        }));
    } catch (e) {
        console.error("Geocoding error:", e);
        return [];
    }
}

/**
 * Requests browser location coordinates.
 */
export function getBrowserLocation(): Promise<{
    latitude: number;
    longitude: number;
}> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported by your browser."));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => {
                reject(error);
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    });
}

/**
 * Opens a modal dialog with an interactive Leaflet map to let the user select/detect their location.
 */
export function openLocationMapModal(
    initialLat?: number | null,
    initialLng?: number | null,
): Promise<GeolocationResult | null> {
    return new Promise(async (resolve) => {
        let L: any;
        try {
            L = await loadLeaflet();
        } catch (err) {
            alert(
                "Failed to load map library. Please check your internet connection.",
            );
            resolve(null);
            return;
        }

        // Initialize state
        // Defaults to Phnom Penh center
        let currentLat = initialLat || 11.5564;
        let currentLng = initialLng || 104.9282;
        let selectedAddressStr = "";
        let selectedCityProvince = "Phnom Penh";
        let selectedCountry = "Cambodia";
        let isFetchingAddress = false;

        // Create Modal DOM Elements
        const overlay = document.createElement("div");
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(28, 25, 23, 0.6);
            backdrop-filter: blur(8px);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
            opacity: 0;
            transition: opacity 0.25s ease;
        `;

        const container = document.createElement("div");
        container.style.cssText = `
            background: white;
            border-radius: 24px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            width: 92%;
            max-width: 520px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            transform: scale(0.95);
            transition: transform 0.25s ease;
            max-height: 90vh;
        `;

        // Inner markup
        container.innerHTML = `
            <!-- Modal Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; border-b: 1px solid #f4f4f5;">
                <div>
                    <h3 style="margin: 0; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #1c1917;">Select Shipping Location</h3>
                    <p style="margin: 4px 0 0; font-size: 10px; color: #78716c; font-weight: 500;">Drag the marker or search to point your address</p>
                </div>
                <button id="loc-modal-close" style="background: transparent; border: none; cursor: pointer; color: #a8a29e; display: flex; align-items: center; justify-content: center; padding: 6px; border-radius: 12px; transition: all 0.2s;" onmouseover="this.style.color='#1c1917'; this.style.backgroundColor='#f4f4f5'" onmouseout="this.style.color='#a8a29e'; this.style.backgroundColor='transparent'">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>

            <!-- Search Area -->
            <div style="padding: 16px 24px; background: #fafaf9; border-b: 1px solid #f4f4f5; display: flex; gap: 8px;">
                <div style="position: relative; flex: 1;">
                    <input type="text" id="loc-search-input" placeholder="Search town, street, landmark in Cambodia..." style="width: 100%; padding: 10px 14px; border: 1px solid #e4e4e7; border-radius: 14px; font-size: 12px; font-weight: 600; outline: none; transition: border-color 0.2s; box-sizing: border-box;" />
                    <div id="loc-search-results" style="position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #e4e4e7; border-radius: 14px; margin-top: 4px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); max-height: 200px; overflow-y: auto; display: none; z-index: 10;"></div>
                </div>
                <button id="loc-search-btn" style="background: #1c1917; border: none; border-radius: 14px; padding: 10px 16px; color: white; cursor: pointer; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px; transition: background-color 0.2s;">
                    Search
                </button>
            </div>

            <!-- Map Container -->
            <div style="position: relative; flex: 1; min-height: 280px; background: #e5e5e0;">
                <div id="loc-map" style="width: 100%; height: 280px;"></div>
                
                <!-- GPS Auto Detect button on Map -->
                <button id="loc-gps-btn" style="position: absolute; bottom: 16px; right: 16px; z-index: 1000; background: white; border: 1px solid #e4e4e7; border-radius: 14px; padding: 10px 14px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; color: #1c1917; transition: all 0.2s;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line></svg>
                    Locate Me
                </button>
            </div>

            <!-- Address Preview -->
            <div style="padding: 18px 24px; border-t: 1px solid #f4f4f5; background: #fafaf9;">
                <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #a8a29e; margin-bottom: 6px;">Detected Shipping Address</div>
                <div id="loc-address-text" style="font-size: 11.5px; font-weight: 600; color: #27272a; min-height: 34px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                    Fetching location details...
                </div>
                <div style="display: flex; gap: 8px; margin-top: 10px; font-size: 10px; color: #71717a;">
                    <div style="background: #f4f4f5; padding: 4px 8px; border-radius: 6px; font-weight: 700;">Lat: <span id="loc-lat-val">${currentLat.toFixed(5)}</span></div>
                    <div style="background: #f4f4f5; padding: 4px 8px; border-radius: 6px; font-weight: 700;">Lng: <span id="loc-lng-val">${currentLng.toFixed(5)}</span></div>
                </div>
            </div>

            <!-- Modal Actions -->
            <div style="padding: 16px 24px; border-t: 1px solid #f4f4f5; display: flex; justify-content: flex-end; gap: 12px; background: white;">
                <button id="loc-modal-cancel" style="background: #f4f4f5; border: none; border-radius: 14px; padding: 12px 20px; color: #44403c; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#e4e4e7'" onmouseout="this.style.backgroundColor='#f4f4f5'">
                    Cancel
                </button>
                <button id="loc-modal-confirm" style="background: #10b981; border: none; border-radius: 14px; padding: 12px 24px; color: white; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);" onmouseover="this.style.backgroundColor='#059669'" onmouseout="this.style.backgroundColor='#10b981'">
                    Confirm Location
                </button>
            </div>
        `;

        overlay.appendChild(container);
        document.body.appendChild(overlay);

        // Animate open
        setTimeout(() => {
            overlay.style.opacity = "1";
            container.style.transform = "scale(1)";
        }, 10);

        // Get references to elements
        const closeBtn = document.getElementById("loc-modal-close")!;
        const cancelBtn = document.getElementById("loc-modal-cancel")!;
        const confirmBtn = document.getElementById("loc-modal-confirm")!;
        const gpsBtn = document.getElementById("loc-gps-btn")!;
        const searchBtn = document.getElementById("loc-search-btn")!;
        const searchInput = document.getElementById(
            "loc-search-input",
        ) as HTMLInputElement;
        const searchResultsDiv = document.getElementById("loc-search-results")!;
        const addressTextDiv = document.getElementById("loc-address-text")!;
        const latValSpan = document.getElementById("loc-lat-val")!;
        const lngValSpan = document.getElementById("loc-lng-val")!;

        let map: any;
        let marker: any;

        // Initialize Map
        const initMap = () => {
            map = L.map("loc-map", {
                zoomControl: false, // will put on top right
                attributionControl: false,
            }).setView([currentLat, currentLng], 14);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
            }).addTo(map);

            // Add clean zoom controls
            L.control.zoom({ position: "topright" }).addTo(map);

            // Draggable Marker
            marker = L.marker([currentLat, currentLng], {
                draggable: true,
            }).addTo(map);

            // Event Listeners for Marker
            marker.on("dragend", async () => {
                const position = marker.getLatLng();
                updateLocation(position.lat, position.lng);
            });

            map.on("click", (e: any) => {
                marker.setLatLng(e.latlng);
                updateLocation(e.latlng.lat, e.latlng.lng);
            });
        };

        // Update Coordinates & Trigger Geocoding
        const updateLocation = async (
            lat: number,
            lng: number,
            shouldCenterMap: boolean = false,
        ) => {
            currentLat = lat;
            currentLng = lng;
            latValSpan.textContent = lat.toFixed(5);
            lngValSpan.textContent = lng.toFixed(5);

            if (shouldCenterMap && map) {
                map.setView([lat, lng], 16);
                marker.setLatLng([lat, lng]);
            }

            addressTextDiv.textContent = "Resolving address...";
            isFetchingAddress = true;

            const res = await reverseGeocode(lat, lng);
            selectedAddressStr = res.address;
            selectedCityProvince = res.city_province;
            selectedCountry = res.country;
            isFetchingAddress = false;

            if (selectedAddressStr) {
                addressTextDiv.textContent = `${selectedAddressStr} (${selectedCityProvince})`;
            } else {
                addressTextDiv.textContent = `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`;
            }
        };

        // Start Leaflet Map
        initMap();

        // Get initial reverse geocoding address
        updateLocation(currentLat, currentLng);

        // Locate user via browser Geolocation automatically on open if coordinates aren't provided
        const triggerGPS = async () => {
            addressTextDiv.textContent = "Detecting coordinates via GPS...";
            gpsBtn.style.opacity = "0.5";
            gpsBtn.setAttribute("disabled", "true");

            try {
                const coords = await getBrowserLocation();
                updateLocation(coords.latitude, coords.longitude, true);
            } catch (err) {
                console.error(err);
                addressTextDiv.textContent =
                    "GPS failed. Click or drag marker on map manually.";
            } finally {
                gpsBtn.style.opacity = "1";
                gpsBtn.removeAttribute("disabled");
            }
        };

        if (!initialLat || !initialLng) {
            triggerGPS();
        }

        // Search Handlers
        const executeSearch = async () => {
            const query = searchInput.value.trim();
            if (!query) return;

            searchBtn.style.opacity = "0.5";
            searchBtn.setAttribute("disabled", "true");

            const results = await geocodeSearch(query);

            searchBtn.style.opacity = "1";
            searchBtn.removeAttribute("disabled");

            if (results.length > 0) {
                searchResultsDiv.innerHTML = "";
                searchResultsDiv.style.display = "block";

                results.forEach((item) => {
                    const row = document.createElement("div");
                    row.style.cssText = `
                        padding: 10px 14px;
                        font-size: 11px;
                        font-weight: 600;
                        color: #3f3f46;
                        cursor: pointer;
                        border-bottom: 1px solid #f4f4f5;
                        transition: background 0.15s;
                    `;
                    row.onmouseover = () => {
                        row.style.backgroundColor = "#fafaf9";
                    };
                    row.onmouseout = () => {
                        row.style.backgroundColor = "white";
                    };
                    row.textContent = item.displayName;

                    row.onclick = () => {
                        updateLocation(item.lat, item.lng, true);
                        searchInput.value = item.displayName;
                        searchResultsDiv.style.display = "none";
                    };
                    searchResultsDiv.appendChild(row);
                });
            } else {
                searchResultsDiv.innerHTML =
                    '<div style="padding: 12px; text-align: center; font-size: 11px; color: #a1a1aa; font-weight: 600;">No locations found.</div>';
                searchResultsDiv.style.display = "block";
            }
        };

        // Click outside search results to close dropdown
        document.addEventListener("click", (e) => {
            if (e.target !== searchInput && e.target !== searchResultsDiv) {
                searchResultsDiv.style.display = "none";
            }
        });

        searchBtn.onclick = executeSearch;
        searchInput.onkeydown = (e) => {
            if (e.key === "Enter") {
                executeSearch();
            }
        };

        gpsBtn.onclick = triggerGPS;

        // Closing the Modal
        const cleanAndClose = () => {
            overlay.style.opacity = "0";
            container.style.transform = "scale(0.95)";
            setTimeout(() => {
                if (map) map.remove();
                document.body.removeChild(overlay);
            }, 250);
        };

        closeBtn.onclick = () => {
            cleanAndClose();
            resolve(null);
        };

        cancelBtn.onclick = () => {
            cleanAndClose();
            resolve(null);
        };

        confirmBtn.onclick = () => {
            if (isFetchingAddress) {
                alert("Please wait until address resolution completes.");
                return;
            }
            cleanAndClose();
            resolve({
                latitude: currentLat,
                longitude: currentLng,
                address: selectedAddressStr,
                city_province: selectedCityProvince,
                country: selectedCountry,
            });
        };
    });
}
