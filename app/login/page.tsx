"use client";

import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  async function handleGoogleLogin() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log("Logged in as:", user.displayName, user.email);
      router.push("/main");
    } catch (error) {
      console.error("Login failed:", error);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center" style={{ backgroundColor: "#f8e7e0" }}>
      <img src="/login-design.svg" alt="Login design" className="mb-6 mx-auto max-w-full" style={{ width: "900px", height: "auto" }} />
      <button
        onClick={handleGoogleLogin}
        className="flex items-center gap-3 rounded-lg bg-white px-6 py-3 font-semibold text-black shadow-md hover:bg-zinc-100"
      >
        <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
        Sign in with Google
      </button>
    </div>
  );
}
