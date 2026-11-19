import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Field, PasswordField } from "../components/ui/Field";
import { Button } from "../components/ui/Button";
import { AuthLayout } from "../components/AuthLayout";
import { useAuth } from "../lib/auth/AuthContext";
import { useAuthForm } from "../lib/auth/useAuthForm";
import { useElapsedSince, progressiveSubmitMessage } from "../hooks/useElapsedSince";
import { estimatePasswordStrength, validateEmail, validatePasswordForSignup } from "../lib/validators";
import { warmupBackend } from "../lib/api";

export function Signup() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const { signUp, signIn, setSession } = useAuth();
  const { state, submit, succeed, fail } = useAuthForm();
  const navigate = useNavigate();

  const submittingSince = state.status === "submitting" ? state.since : null;
  const elapsed = useElapsedSince(submittingSince);

  const strength = useMemo(() => (passwordValue ? estimatePasswordStrength(passwordValue) : null), [passwordValue]);

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
    if (!result.ok) {
      fail(result.error);
      if (result.error.code === "EMAIL_TAKEN") {
        emailRef.current?.focus();
        emailRef.current?.select();
      }
      return;
    }

    // Sign straight in, so a new account lands in its brain, not on another form.
    const session = await signIn(email, password);
    succeed("Your brain is ready");
    window.setTimeout(() => {
      if (session.ok && session.token) {
        setSession(session.token);
        navigate("/app", { replace: true });
      } else {
        navigate("/signin", { replace: true });
      }
    }, 1100);
  }

  const isSubmitting = state.status === "submitting";
  const isSuccess = state.status === "success";
  const submitMessage = isSubmitting ? progressiveSubmitMessage(elapsed, "Creating your account") : null;

  return (
    <AuthLayout
      title="Make your brain"
      subtitle="Free, and ready the moment you paste a link."
      isSuccess={isSuccess}
      successMessage={state.status === "success" ? state.message : ""}
    >
      {state.status === "error" && (
        <div role="alert" className="flex gap-2.5 rounded-xl bg-danger-soft px-3.5 py-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>
            {state.error.message}
            {state.error.code === "EMAIL_TAKEN" && (
              <>
                {" "}
                <Link to="/signin" className="font-semibold underline underline-offset-2">
                  Sign in instead
                </Link>
                .
              </>
            )}
          </span>
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
          value={emailValue}
          onChange={(e) => {
            setEmailValue(e.target.value);
            if (emailError) setEmailError(null);
          }}
        />
        <PasswordField
          reference={passwordRef}
          label="Password"
          placeholder="At least 8 characters"
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
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting || isSuccess}
          loadingText={isSuccess ? "Opening…" : "Creating account…"}
          fullWidth
          endIcon={<ArrowRight className="size-4" />}
          className="!mt-6"
        >
          Create account
        </Button>

        {submitMessage && (
          <p role="status" aria-live="polite" className="text-center text-[13px] text-ink-3">
            {submitMessage}
          </p>
        )}
      </form>

      <p className="text-sm text-ink-2">
        Already have one?{" "}
        <Link to="/signin" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
