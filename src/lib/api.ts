import axios, { AxiosError, type AxiosInstance } from "axios";
import { BACKEND_URL } from "../config";

const TOKEN_KEY = "token";

export const tokenStore = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable (private mode, etc.) — auth still works for the session */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* noop */
    }
  },
};

export const api: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  timeout: 60_000,
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export type AppErrorCode =
  | "INVALID_CREDENTIALS"
  | "EMAIL_TAKEN"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "SERVER_ERROR"
  | "UNKNOWN";

export type AppError = {
  code: AppErrorCode;
  message: string;
  serverMessage?: string;
};

const FRIENDLY: Record<AppErrorCode, string> = {
  INVALID_CREDENTIALS: "Email or password is incorrect.",
  EMAIL_TAKEN: "An account with this email already exists.",
  VALIDATION_ERROR: "Please check the details you entered and try again.",
  RATE_LIMITED: "Too many attempts. Please wait a moment and try again.",
  NETWORK_ERROR:
    "Can't reach the server. Check your connection and try again.",
  TIMEOUT:
    "The server is taking too long to respond. Please try again in a moment.",
  SERVER_ERROR: "Something went wrong on our side. Please try again shortly.",
  UNKNOWN: "Something went wrong. Please try again.",
};

export function normalizeError(error: unknown): AppError {
  if (axios.isCancel(error)) {
    return { code: "UNKNOWN", message: FRIENDLY.UNKNOWN };
  }
  if (axios.isAxiosError(error)) {
    const serverMessage = (
      error.response?.data as { message?: string } | undefined
    )?.message;

    if (error.code === "ECONNABORTED") {
      return { code: "TIMEOUT", message: FRIENDLY.TIMEOUT, serverMessage };
    }
    if (!error.response) {
      return {
        code: "NETWORK_ERROR",
        message: FRIENDLY.NETWORK_ERROR,
        serverMessage,
      };
    }

    const status = error.response.status;
    if (status === 401 || status === 403) {
      return {
        code: "INVALID_CREDENTIALS",
        message: FRIENDLY.INVALID_CREDENTIALS,
        serverMessage,
      };
    }
    if (status === 409 || serverMessage?.toLowerCase().includes("already")) {
      return {
        code: "EMAIL_TAKEN",
        message: FRIENDLY.EMAIL_TAKEN,
        serverMessage,
      };
    }
    if (status === 429) {
      return {
        code: "RATE_LIMITED",
        message: FRIENDLY.RATE_LIMITED,
        serverMessage,
      };
    }
    if (status >= 500) {
      return {
        code: "SERVER_ERROR",
        message: FRIENDLY.SERVER_ERROR,
        serverMessage,
      };
    }
    if (status >= 400) {
      return {
        code: "VALIDATION_ERROR",
        message: serverMessage ?? FRIENDLY.VALIDATION_ERROR,
        serverMessage,
      };
    }
  }
  return { code: "UNKNOWN", message: FRIENDLY.UNKNOWN };
}

export function warmupBackend(): void {
  // Hit the real health route — there is no "/" handler on the backend.
  api
    .get("/healthz", { timeout: 60_000, validateStatus: () => true })
    .catch(() => {
      /* warmup is fire-and-forget */
    });
}
