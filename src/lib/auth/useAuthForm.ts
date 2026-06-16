import { useCallback, useReducer } from "react";
import type { AppError } from "../api";

export type AuthFormState =
  | { status: "idle" }
  | { status: "submitting"; since: number }
  | { status: "success"; message: string }
  | { status: "error"; error: AppError };

type Action =
  | { type: "submit" }
  | { type: "success"; message: string }
  | { type: "error"; error: AppError }
  | { type: "reset" };

function reducer(_: AuthFormState, action: Action): AuthFormState {
  switch (action.type) {
    case "submit":
      return { status: "submitting", since: Date.now() };
    case "success":
      return { status: "success", message: action.message };
    case "error":
      return { status: "error", error: action.error };
    case "reset":
      return { status: "idle" };
  }
}

export function useAuthForm() {
  const [state, dispatch] = useReducer(reducer, { status: "idle" });

  const submit = useCallback(() => dispatch({ type: "submit" }), []);
  const succeed = useCallback(
    (message: string) => dispatch({ type: "success", message }),
    []
  );
  const fail = useCallback(
    (error: AppError) => dispatch({ type: "error", error }),
    []
  );
  const reset = useCallback(() => dispatch({ type: "reset" }), []);

  return { state, submit, succeed, fail, reset };
}
