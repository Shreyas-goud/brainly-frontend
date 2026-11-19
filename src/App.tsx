import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { Signup } from "./pages/Signup";
import { Signin } from "./pages/Signin";
import { LandingPage } from "./pages/LandingPage";
import { ShareView } from "./pages/ShareView";
import { NotFound } from "./pages/NotFound";
import { SaveShared } from "./pages/SaveShared";
import { AppShell } from "./app/AppShell";
import { CatchUp } from "./app/CatchUp";
import { ViewPage } from "./app/ViewPage";
import { SavesPage } from "./app/SavesPage";
import { DonePage } from "./app/DonePage";
import { ToastProvider } from "./components/ui/Toast";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { GuestOnlyRoute } from "./components/GuestOnlyRoute";
import { AuthProvider } from "./lib/auth/AuthContext";
import { ThemeProvider } from "./lib/theme";
import { ConfirmProvider } from "./components/ConfirmDialog";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ConfirmProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/share/:hash" element={<ShareView />} />
                <Route path="/save" element={<SaveShared />} />
                <Route
                  path="/signup"
                  element={
                    <GuestOnlyRoute>
                      <Signup />
                    </GuestOnlyRoute>
                  }
                />
                <Route
                  path="/signin"
                  element={
                    <GuestOnlyRoute>
                      <Signin />
                    </GuestOnlyRoute>
                  }
                />
                <Route
                  path="/app"
                  element={
                    <ProtectedRoute>
                      <AppShell />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<SavesPage />} />
                  <Route path="catch-up" element={<CatchUp />} />
                  <Route path="view/:id" element={<ViewPage />} />
                  <Route path="done" element={<DonePage />} />
                  {/* One page per app: /app/youtube, /app/instagram, … Unknown names go home. */}
                  <Route path=":app" element={<SavesPage />} />
                  {/* Earlier addresses, kept so bookmarks and the installed app still land somewhere sensible. */}
                  <Route path="run" element={<Navigate to="/app/catch-up" replace />} />
                  <Route path="saves" element={<Navigate to="/app" replace />} />
                  <Route path="ask" element={<Navigate to="/app" replace />} />
                </Route>
                {/* Old address, kept so bookmarks and the installed app still land in the right place. */}
                <Route path="/dashboard" element={<Navigate to="/app" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </ConfirmProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
