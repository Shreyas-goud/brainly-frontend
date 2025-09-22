import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { useRef, useState } from "react";
import { BACKEND_URL } from "../config";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export function Signin() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const navigate = useNavigate();

  async function signin(e: React.FormEvent) {
    e.preventDefault();
    const email = emailRef.current?.value;
    const password = passwordRef.current?.value;

    try {
      const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
        email,
        password,
      });
      const jwt = response.data.token;
      localStorage.setItem("token", jwt);

      setMessageType("success");
      setMessage("Signed in successfully! Redirecting…");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error: any) {
      const serverMsg = error.response?.data?.message;
      setMessageType("error");
      setMessage(
        serverMsg
          ? `Signin failed: ${serverMsg}`
          : "Signin failed: Unknown error"
      );
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-100 p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-purple-600 px-8 py-6 text-center">
          <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
          <p className="mt-2 text-purple-200">
            Sign in to access your second brain
          </p>
        </div>

        <div className="px-8 py-8">
          {message && (
            <div
              className={`
                mb-6 p-4 rounded-md text-center
                ${
                  messageType === "success"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }
              `}
            >
              {message}
            </div>
          )}

          <form onSubmit={signin} className="flex flex-col gap-6">
            <Input
              reference={emailRef}
              placeholder="Email address"
              className="w-full border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
            />
            <Input
              reference={passwordRef}
              type="password"
              placeholder="Password"
              className="w-full border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
            />
            <Button
              loading={false}
              variant="primary"
              text="Sign In"
              fullWidth
              startIcon={null}
            />
          </form>

          <div className="mt-6 text-center">
            <span className="text-gray-500">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/signup")}
                className="text-purple-600 font-medium hover:underline"
              >
                Sign Up
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
