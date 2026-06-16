import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  estimatePasswordStrength,
  validateEmail,
  validatePasswordForSignup,
} from "../lib/validators";
import { warmupBackend } from "../lib/api";

export function Signup() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const { signUp } = useAuth();
  const { state, submit, succeed, fail } = useAuthForm();
  const navigate = useNavigate();

  const submittingSince =
    state.status === "submitting" ? state.since : null;
  const elapsed = useElapsedSince(submittingSince);

  const strength = useMemo(
    () => (passwordValue ? estimatePasswordStrength(passwordValue) : null),
    [passwordValue]
  );

  useEffect(() => {
    warmupBackend();
    emailRef.current?.focus();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (state.status === "submitting" || state.status === "success") return;

    const email = emailRef.current?.value ?? "";
    const password = passwordRef.current?.value ?? "";

    const emailErr = validateEmail(email);
    const passwordErr = validatePasswordForSignup(password, email);
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
    const result = await signUp(email, password);
    if (result.ok) {
      succeed("Account created!");
      window.setTimeout(() => navigate("/signin", { replace: true }), 1200);
    } else {
      fail(result.error);
      if (result.error.code === "EMAIL_TAKEN") {
        emailRef.current?.focus();
        emailRef.current?.select();
      }
    }
  }

  const isSubmitting = state.status === "submitting";
  const isSuccess = state.status === "success";
  const submitMessage = isSubmitting
    ? progressiveSubmitMessage(elapsed, "Creating your account")
    : null;

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Join Brainlyy and start building your digital memory today."
      isSuccess={isSuccess}
      successMessage={state.status === "success" ? state.message : ""}
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
            <div>
              {state.error.message}
              {state.error.code === "EMAIL_TAKEN" && (
                <>
                  {" "}
                  <Link
                    to="/signin"
                    className="font-semibold underline hover:text-red-900"
                  >
                    Sign in instead
                  </Link>
                  .
                </>
              )}
            </div>
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
          value={emailValue}
          onChange={(e) => {
            setEmailValue(e.target.value);
            if (emailError) setEmailError(null);
          }}
          className="h-11"
        />
        <PasswordInput
          reference={passwordRef}
          label="Password"
          placeholder="Create a strong password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={isSubmitting || isSuccess}
          error={passwordError}
          strength={strength}
          value={passwordValue}
          onChange={(e) => {
            setPasswordValue(e.target.value);
            if (passwordError) setPasswordError(null);
          }}
          className="h-11"
        />

        <Button
          type="submit"
          variant="primary"
          text="Create Account"
          loading={isSubmitting || isSuccess}
          loadingText={isSuccess ? "Redirecting…" : "Creating account…"}
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
          Already have an account?{" "}
          <Link
            to="/signin"
            className="text-purple-600 font-semibold hover:text-purple-700 hover:underline transition"
          >
            Sign In
          </Link>
        </span>
      </div>
    </AuthLayout>
  );
}
