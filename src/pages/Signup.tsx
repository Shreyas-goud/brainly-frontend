import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { useRef, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { useNavigate } from "react-router-dom";

export function Signup() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const navigate = useNavigate();

  async function signup(e: React.FormEvent) {
    e.preventDefault();
    const email = emailRef.current?.value;
    const password = passwordRef.current?.value;

    try {
      await axios.post(`${BACKEND_URL}/api/v1/signup`, { email, password });
      setMessageType("success");
      setMessage("Signed up successfully! Redirecting to Sign In…");

      setTimeout(() => {
        navigate("/signin");
      }, 2 * 1000);
    } catch (error: any) {
      const serverMsg = error.response?.data?.message;
      setMessageType("error");
      if (serverMsg?.includes("already")) {
        setMessage("You are already signed up. Please Sign In.");
      } else {
        setMessage("Signup failed: Invalid credentials");
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-100 p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-purple-600 px-8 py-6 text-center">
          <h2 className="text-3xl font-bold text-white">Create Your Account</h2>
          <p className="mt-2 text-purple-200">
            Join Brainly and build your second brain today
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

          <form onSubmit={signup} className="flex flex-col gap-6">
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
              text="Sign Up"
              fullWidth
              startIcon={null}
            />
          </form>

          <div className="mt-6 text-center">
            <span className="text-gray-500">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/signin")}
                className="text-purple-600 font-medium hover:underline"
              >
                Sign In
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
