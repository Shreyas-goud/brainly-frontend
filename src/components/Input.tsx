export function Input({
  placeholder,
  reference,
  type = "text",
  className = "",
}: {
  placeholder: string;
  reference?: React.RefObject<HTMLInputElement>;
  type?: string;
  className?: string;
}) {
  return (
    <div>
      <input
        ref={reference}
        placeholder={placeholder}
        type={type}
        className={`border px-4 py-2 rounded ${className}`}
      ></input>
    </div>
  );
}
