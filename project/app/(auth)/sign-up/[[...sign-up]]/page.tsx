// TODO: Task 2.3 - Create sign-in and sign-up pages

/*
TODO: Task 2.3 Implementation Notes:
- Import SignUp from @clerk/nextjs
- Configure sign-up redirects
- Style to match design system
- Add proper error handling
- Set up webhook for user data sync (Task 2.5)
*/
'use client';

import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function CustomSignUp() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState("");

  if (!isLoaded) return null;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await signUp.create({
        emailAddress: email,
        password,
        username, // 🟣 Include username here
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Sign-up failed.");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Verification failed.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-platinum-900 to-outer_space-600 px-4">
      <div className="w-full max-w-md bg-white dark:bg-outer_space-500 p-8 rounded-xl shadow-lg border border-french_gray-300 dark:border-payne's_gray-400">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-outer_space-700 dark:text-platinum-100">
            {pendingVerification ? "Verify Email" : "Create Your Account"}
          </h1>
          <p className="text-payne's_gray-500 dark:text-french_gray-400 text-sm">
            {pendingVerification
              ? "Enter the code sent to your email."
              : "Sign up to start managing your projects"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-sm">
            {error}
          </div>
        )}

        {pendingVerification ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-white">
                Verification Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-french_gray-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue_munsell-500 dark:bg-outer_space-400 dark:text-white"
                placeholder="Enter the code"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue_munsell-500 hover:bg-blue_munsell-600 text-white font-semibold rounded-md transition"
            >
              Verify Email
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-white">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-french_gray-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue_munsell-500 dark:bg-outer_space-400 dark:text-white"
                placeholder="Choose a username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-white">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-french_gray-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue_munsell-500 dark:bg-outer_space-400 dark:text-white"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-white">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-french_gray-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue_munsell-500 dark:bg-outer_space-400 dark:text-white"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue_munsell-500 hover:bg-blue_munsell-600 text-white font-semibold rounded-md transition"
            >
              Sign Up
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
          Already have an account?{" "}
          <a href="/sign-in" className="text-blue_munsell-500 hover:underline font-medium">
            Sign in here
          </a>
        </p>
      </div>
    </div>
  );
}

