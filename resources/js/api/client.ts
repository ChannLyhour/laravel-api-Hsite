// Type-safe API Client wrapper around native fetch

export interface ApiErrorDetail {
  success: boolean;
  message: string;
  code?: number;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  public status: number;
  public details: ApiErrorDetail;

  constructor(status: number, details: ApiErrorDetail) {
    super(details.message || `HTTP error ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export interface ExtendedRequestInit extends RequestInit {
  silent?: boolean;
}

const getApiBaseUrl = (): string => {
  // Vite env variables support import.meta.env
  const envUrl = import.meta.env?.VITE_API_BASE_URL;
  if (envUrl) return envUrl;

  // Use relative path for development proxy if running in dev mode
  if (import.meta.env.DEV) {
    return "/api";
  }

  // Dynamically resolve relative to current host if running in a browser
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }

  // Default fallback
  return "/api";
};

export const API_BASE_URL = getApiBaseUrl();

async function request<T>(
  endpoint: string,
  options: ExtendedRequestInit = {},
): Promise<T> {
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";

  let token: string | null = null;

  const getValidToken = (key: string) => {
    const t = localStorage.getItem(key);
    if (!t || t === "null" || t === "undefined" || t === "") return null;
    return t;
  };

  // Isolate tokens strictly by route to allow simultaneous sessions
  if (pathname.startsWith("/admin")) {
    token = getValidToken("master_admin_token");
  } else if (pathname.startsWith("/owner")) {
    token = getValidToken("admin_token");
  } else {
    // Main website uses customer token primarily
    token = getValidToken("auth_token") || getValidToken("aura_customer_token");

    // Fallback: If no customer token, check if they are logged in as a merchant
    if (!token) {
      token =
        getValidToken("admin_token") || getValidToken("master_admin_token");
    }
  }

  // Final fallback for any other routes
  if (!token) {
    token =
      getValidToken("master_admin_token") ||
      getValidToken("admin_token") ||
      getValidToken("auth_token") ||
      getValidToken("aura_customer_token");
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}/${endpoint.replace(/^\//, "")}`;

  const config: ExtendedRequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // Check if empty response (e.g. 204 No Content)
    const isNoContent = response.status === 204;

    let data: any = null;
    if (!isNoContent) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch {
          // Server returned a non-JSON body with application/json content-type
          // (e.g. PHP 413 HTML error page). Surface a clean error.
          const statusText =
            response.status === 413
              ? "Request body too large. Please reduce the file size and try again."
              : `Server returned an invalid response (status ${response.status}).`;
          data = { message: statusText };
        }
      } else {
        const rawText = await response.text();
        // Strip HTML tags if server returned an HTML error page
        const cleanText = rawText
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        data = { message: cleanText || `HTTP ${response.status}` };
      }
    }

    if (!response.ok) {
      if (!config.silent) {
        console.error(`API Error: ${config.method} ${url}`, data);
      }
      const errorDetail: ApiErrorDetail = {
        success: false,
        message:
          data?.message ||
          data?.detail ||
          `Request failed with status ${response.status}`,
        code: data?.code || response.status,
        errors: data?.errors || {},
      };
      throw new ApiError(response.status, errorDetail);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle network or parse error
    const genericError: ApiErrorDetail = {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "A network error occurred. Please check your connection.",
      errors: {},
    };
    throw new ApiError(500, genericError);
  }
}

export const client = {
  get: <T>(endpoint: string, options?: ExtendedRequestInit) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: any, options?: ExtendedRequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  postFormData: <T>(
    endpoint: string,
    formData: FormData,
    options?: ExtendedRequestInit,
  ) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: formData,
    }),

  putFormData: <T>(
    endpoint: string,
    formData: FormData,
    options?: ExtendedRequestInit,
  ) => {
    formData.append("_method", "PUT");
    return request<T>(endpoint, {
      ...options,
      method: "POST",
      body: formData,
    });
  },

  postForm: <T>(
    endpoint: string,
    body?: Record<string, string>,
    options?: ExtendedRequestInit,
  ) => {
    const params = new URLSearchParams(body).toString();
    return request<T>(endpoint, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...(options?.headers as Record<string, string>),
      },
      body: params,
    });
  },

  submitForm: <T>(
    method: string,
    endpoint: string,
    body?: Record<string, string>,
    options?: ExtendedRequestInit,
  ) => {
    const params = new URLSearchParams(body).toString();
    return request<T>(endpoint, {
      ...options,
      method: method,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...(options?.headers as Record<string, string>),
      },
      body: params,
    });
  },

  put: <T>(endpoint: string, body?: any, options?: ExtendedRequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: ExtendedRequestInit) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),

  patch: <T>(endpoint: string, body?: any, options?: ExtendedRequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patchFormData: <T>(
    endpoint: string,
    formData: FormData,
    options?: ExtendedRequestInit,
  ) => {
    formData.append("_method", "PATCH");
    return request<T>(endpoint, {
      ...options,
      method: "POST",
      body: formData,
    });
  },
};
