import { useNavigate } from "react-router-dom";

export function BackIcon({ className = "" }: { className?: string }) {
  const navigate = useNavigate();

  return (
    <svg
      onClick={() => navigate(-1)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") navigate(-1);
      }}
      role="button"
      tabIndex={0}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={`inline-block align-middle ml-12 mb-0.5 w-6 h-6 text-gray-600 hover:text-gray-800 transition cursor-pointer ${className}`}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}
