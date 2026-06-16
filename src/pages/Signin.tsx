import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Input } from "../components/Input";
import { PasswordInput } from "../components/PasswordInput";
import { Button } from "../components/Button";
import { AuthLayout } from "../components/AuthLayout";
import { useAuth } from "../lib/auth/AuthContext";
import { useAuthForm } from "../lib/auth/useAuthForm";
import {
  useElapsedSince,
  progressiveSubmitMessage,
} from "../hooks/useElapsedSince";
import {
  validateEmail,
  validatePasswordForSignin,
} from "../lib/validators";
import { warmupBackend } from "../lib/api";

type LocationState = { from?: string } | null;

export function Signin() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const { signIn, setSession, isAuthenticated } = useAuth();
  const { state, submit, succeed, fail } = useAuthForm();
  const navigate = useNavigate();
  const location = useLocation();

  const submittingSince =
    state.status === "submitting" ? state.since : null;
  const elapsed = useElapsedSince(submittingSince);

  const returnTo =
    new URLSearchParams(location.search).get("returnTo") ||
    (location.state as LocationState)?.from ||
    "/dashboard";

  useEffect(() => {
    warmupBackend();
    emailRef.current?.focus();
  }, []);

  // Detection for already-logged-in users on mount
  useEffect(() => {
    if (isAuthenticated && state.status === "idle") {
      navigate(returnTo, { replace: true });
    }
  }, [isAuthenticated, state.status, navigate, returnTo]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (state.status === "submitting" || state.status === "success") return;

    const email = emailRef.current?.value ?? "";
    const password = passwordRef.current?.value ?? "";

    const emailErr = validateEmail(email);
    const passwordErr = validatePasswordForSignin(password);
    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (emailErr) {
      emailRef.current?.focus();
      return;
    }
    if (passwordErr) {
      passwordRef.current?.focus();
      return;
    }

    submit();
    const result = await signIn(email, password);
    if (!result.ok) {
      fail(result.error);
      if (result.error.code === "INVALID_CREDENTIALS") {
        passwordRef.current?.focus();
        passwordRef.current?.select();
      }
      return;
    }

    if (result.token) {
      succeed("Welcome back!");
      // 1. Wait for the beautiful AuthLayout transition to play (1200ms)
      window.setTimeout(() => {
        // 2. Commit the session (this will trigger isAuthenticated=true)
        setSession(result.token!);
        // 3. Navigate immediately after
        navigate(returnTo, { replace: true });
      }, 1200);
    } else {
      fail({
        code: "UNKNOWN",
        message: "Sign in succeeded but no token was provided.",
      });
    }
  }

  const isSubmitting = state.status === "submitting";
  const isSuccess = state.status === "success";
  const submitMessage = isSubmitting
    ? progressiveSubmitMessage(elapsed, "Signing in")
    : null;

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your digital library."
      isSuccess={isSuccess}
      successMessage={isSuccess ? state.message : ""}
    >
      {state.status === "error" && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-800 text-sm animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="flex gap-2">
            <svg
              className="h-5 w-5 text-red-400 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{state.error.message}</span>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <Input
          reference={emailRef}
          label="Email address"
          placeholder="name@example.com"
          type="email"
          name="email"
          autoComplete="email"
          required
          disabled={isSubmitting || isSuccess}
          error={emailError}
          onChange={() => emailError && setEmailError(null)}
          className="h-11"
        />
        <PasswordInput
          reference={passwordRef}
          label="Password"
          placeholder="Enter your password"
          name="password"
          autoComplete="current-password"
          required
          disabled={isSubmitting || isSuccess}
          error={passwordError}
          onChange={() => passwordError && setPasswordError(null)}
          className="h-11"
        />

        <Button
          type="submit"
          variant="primary"
          text="Sign In"
          loading={isSubmitting || isSuccess}
          loadingText={isSuccess ? "Redirecting…" : "Signing in…"}
          fullWidth
          className="h-12 text-base shadow-sm"
        />

        {submitMessage && (
          <p
            role="status"
            aria-live="polite"
            className="text-center text-sm text-gray-500 animate-pulse"
          >
            {submitMessage}
          </p>
        )}
      </form>

      <div className="pt-6 text-center text-sm border-t border-gray-100">
        <span className="text-gray-500">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-purple-600 font-semibold hover:text-purple-700 hover:underline transition"
          >
            Sign Up
          </Link>
        </span>
      </div>
    </AuthLayout>
  );
}
