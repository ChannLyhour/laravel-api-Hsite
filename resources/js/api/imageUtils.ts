import { API_BASE_URL } from './client';

/**
 * Normalizes and resolves a product, category, or brand image path to a full URL.
 * Supports absolute URLs, data URIs, arrays, stringified JSON arrays/objects, and server-hosted uploaded files.
 *
 * @param imagePath - The raw path or URL from the API.
 * @returns A fully qualified URL string, or an empty string if input is null/empty.
 */
export const resolveImageUrl = (imagePath: any): string => {
  if (!imagePath) return '';
  let path = imagePath;

  // 1. Handle arrays: take the first element
  if (Array.isArray(path)) {
    path = path[0];
  }

  // 2. Handle string inputs (including JSON-encoded strings)
  if (typeof path === 'string') {
    path = path.trim();
    if (!path || path === '---' || path === 'null') return '';

    // If it looks like JSON (array or object), try to parse it
    if (path.startsWith('[') || path.startsWith('{')) {
      try {
        const parsed = JSON.parse(path);
        if (Array.isArray(parsed)) {
          path = parsed[0];
        } else if (parsed && typeof parsed === 'object') {
          // If it's an object, take the first value (e.g. { "0": "url" })
          path = Object.values(parsed)[0];
        }
      } catch (e) {
        // Not valid JSON, continue with original string
      }
    }
  } 
  // 3. Handle object with image_url (common in API responses)
  else if (path && typeof path === 'object' && 'image_url' in path) {
    path = path.image_url;
  }
  // 4. Handle generic object: take first value
  else if (path && typeof path === 'object') {
    path = Object.values(path)[0] || '';
  }

  // Final resolution
  if (typeof path === 'string' && path.trim()) {
    let cleanPath = path.trim();
    
    // Upgrade http to https to avoid Mixed Content warnings in HTTPS environments
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    if (cleanPath.startsWith('http://') && isHttps) {
      cleanPath = cleanPath.replace(/^http:\/\//i, 'https://');
    }

    if (
      cleanPath.startsWith('https://') ||
      cleanPath.startsWith('http://') ||
      cleanPath.startsWith('data:') ||
      cleanPath.startsWith('blob:')
    ) {
      return cleanPath;
    } else {
      let serverBase = API_BASE_URL.replace(/\/api$/, '');
      if (isHttps) {
        serverBase = serverBase.replace(/^http:\/\//i, 'https://');
      }
      const cleanPathNoSlash = cleanPath.replace(/^\//, '');
      
      // Standard Laravel/BiteFlow upload paths
      if (cleanPathNoSlash.startsWith('uploads/') || cleanPathNoSlash.startsWith('static/')) {
        return `${serverBase}/${cleanPathNoSlash}`;
      } else {
        return `${serverBase}/uploads/${cleanPathNoSlash}`;
      }
    }
  }

  return '';
};
