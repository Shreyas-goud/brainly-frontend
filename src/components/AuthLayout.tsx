import type { ReactNode } from "react";
import { Logo } from "../icons/Logo";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  isSuccess?: boolean;
  successMessage?: string;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  isSuccess = false,
  successMessage,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-white font-sans text-gray-900 overflow-hidden">
      {/* Left Side: Branded Sidebar (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-50 flex-col items-center justify-center p-12 overflow-hidden border-r border-gray-100">
        {/* Animated Background Blobs */}
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-200 rounded-full opacity-30 animate-pulse" />
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-purple-200 rounded-full opacity-25 animate-pulse" />

        <div className="relative z-10 max-w-md text-center">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 transition-transform duration-700 hover:scale-105">
              <Logo size="lg" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
            Brainlyy
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Your personal digital memory. Save, organize, and share your
            favorite content from the web in one beautiful space.
          </p>
        </div>

        <div className="absolute bottom-12 left-12 right-12 text-center">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">
            A Second Brain for the Content Era
          </p>
        </div>
      </div>

      {/* Right Side: Auth Form with Success Overlay */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-24 bg-white relative">
        <div className="w-full max-w-md relative">
          {/* Success Overlay (Premium Transition) */}
          {isSuccess && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white animate-fade-in">
              <div className="mb-6 relative">
                <div className="absolute inset-0 bg-purple-100 rounded-full animate-ping opacity-25" />
                <div className="relative bg-white p-4 rounded-full shadow-lg border border-purple-50-200 animate-zoom-in">
                  <Logo size="lg" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 animate-slide-up [animation-delay:200ms]">
                {successMessage || "Success!"}
              </h3>
              <p className="text-gray-500 animate-slide-up [animation-delay:400ms]">
                Preparing your experience...
              </p>
            </div>
          )}

          {/* Form Content (Fades out on success) */}
          <div
            className={`transition-all duration-500 ${
              isSuccess ? "opacity-0 scale-95 blur-sm" : "opacity-100 scale-100"
            }`}
          >
            <div className="lg:hidden flex justify-center mb-8">
              <Logo size="md" />
            </div>

            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-3">
                {title}
              </h2>
              <p className="text-lg text-gray-500">{subtitle}</p>
            </div>

            <div className="space-y-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
