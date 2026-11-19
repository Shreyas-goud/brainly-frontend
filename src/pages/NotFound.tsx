import { Link } from "react-router-dom";
import { Logo } from "../components/brand/Logo";

export function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg px-6 py-6 text-ink sm:px-10">
      <Link to="/" className="self-start rounded-lg" aria-label="Brainly home">
        <Logo />
      </Link>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="font-mono text-sm text-ink-3">404</p>
        <h1 className="mt-3 text-[32px] font-semibold tracking-display">Not in this brain</h1>
        <p className="mt-2 max-w-sm text-[15px] text-ink-2">The page you were looking for doesn't exist, or it moved.</p>
        <Link to="/" className="mt-8 inline-flex h-10 items-center rounded-xl bg-inverse px-4 text-sm font-medium text-inverse-ink">
          Back home
        </Link>
      </div>
    </div>
  );
}
