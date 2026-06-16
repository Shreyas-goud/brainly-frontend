// Default matches the backend's dev port (3001). Port 3000 belongs to a
// different local service, so a fresh checkout without VITE_BACKEND_URL set
// must not silently target it.
export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
