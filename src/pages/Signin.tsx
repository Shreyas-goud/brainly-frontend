import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Field, PasswordField } from "../components/ui/Field";
import { Button } from "../components/ui/Button";
import { AuthLayout } from "../components/AuthLayout";
import { useAuth } from "../lib/auth/AuthContext";
import { useAuthForm } from "../lib/auth/useAuthForm";
import { useElapsedSince, progressiveSubmitMessage } from "../hooks/useElapsedSince";
import { validateEmail, validatePasswordForSignin } from "../lib/validators";
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

  const submittingSince = state.status === "submitting" ? state.since : null;
  const elapsed = useElapsedSince(submittingSince);

  const returnTo =
    new URLSearchParams(location.search).get("returnTo") || (location.state as LocationState)?.from || "/app";

  useEffect(() => {
    warmupBackend();
    emailRef.current?.focus();
  }, []);

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
      succeed("Welcome back");
      // Let the success moment play before the dashboard takes over.
      window.setTimeout(() => {
        setSession(result.token!);
        navigate(returnTo, { replace: true });
      }, 1100);
    } else {
      fail({ code: "UNKNOWN", message: "Sign in succeeded but no token was provided." });
    }
  }

  const isSubmitting = state.status === "submitting";
  const isSuccess = state.status === "success";
  const submitMessage = isSubmitting ? progressiveSubmitMessage(elapsed, "Signing in") : null;

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your brain."
      isSuccess={isSuccess}
      successMessage={isSuccess ? state.message : ""}
    >
      {state.status === "error" && (
        <div role="alert" className="flex gap-2.5 rounded-xl bg-danger-soft px-3.5 py-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{state.error.message}</span>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field
          reference={emailRef}
          label="Email"
          placeholder="you@example.com"
          type="email"
          name="email"
          autoComplete="email"
          required
          disabled={isSubmitting || isSuccess}
          error={emailError}
          onChange={() => emailError && setEmailError(null)}
        />
        <PasswordField
          reference={passwordRef}
          label="Password"
          placeholder="Your password"
          name="password"
          autoComplete="current-password"
          required
          disabled={isSubmitting || isSuccess}
          error={passwordError}
          onChange={() => passwordError && setPasswordError(null)}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting || isSuccess}
          loadingText={isSuccess ? "Opening…" : "Signing in…"}
          fullWidth
          endIcon={<ArrowRight className="size-4" />}
          className="!mt-6"
        >
          Sign in
        </Button>

        {submitMessage && (
          <p role="status" aria-live="polite" className="text-center text-[13px] text-ink-3">
            {submitMessage}
          </p>
        )}
      </form>

      <p className="text-sm text-ink-2">
        New to Brainly?{" "}
        <Link to="/signup" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
