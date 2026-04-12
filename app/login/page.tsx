"use client";

import { signInWithPopup } from "firebase/auth";
import type { Auth, GoogleAuthProvider } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { saveUserProfile } from "@/lib/firestore";

export default function LoginPage() {
  const router = useRouter();

  const [auth, setAuth] = useState<Auth | null>(null);
  const [googleProvider, setGoogleProvider] = useState<GoogleAuthProvider | null>(null);

  useEffect(() => {
    async function loadFirebase() {
      const firebase = await import("@/lib/firebase");
      setAuth(firebase.auth);
      setGoogleProvider(firebase.googleProvider);
    }
    loadFirebase();
  }, []);

  async function handleGoogleLogin() {
    if (!auth || !googleProvider) return;

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Save user to Firestore on first login
      await saveUserProfile(user.uid, {
        name: user.displayName ?? "Unknown",
        email: user.email ?? "",
      });

      console.log("Logged in as:", user.displayName, user.email);
      router.push("/main");
    } catch (error) {
      console.error("Login failed:", error);
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: "#f8e7e0" }}
    >
      {/* Decorative background circles */}
      <div style={{
        position: "absolute", top: "-120px", left: "-120px",
        width: "400px", height: "400px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(200,159,122,0.2), transparent)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-100px", right: "-100px",
        width: "350px", height: "350px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(232,147,122,0.2), transparent)",
        pointerEvents: "none",
      }} />
  
      {/* Card */}
      <div style={{
        background: "rgba(255,255,255,0.6)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.8)",
        borderRadius: "32px",
        padding: "48px 56px",
        boxShadow: "0 24px 64px rgba(180,120,80,0.15)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "32px",
        maxWidth: "480px",
        width: "90%",
        zIndex: 10,
      }}>
  
        {/* Logo / SVG */}
        <img
          src="/login-design.svg"
          alt="FitForge"
          style={{ width: "550px", height: "auto", marginLeft: "20px" }}
        />
  
        {/* Tagline */}
        <div style={{ textAlign: "center" }}>
          <p style={{
            color: "#8B6F5E",
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "0.05em",
            margin: 0,
          }}>
            Track your gains. Level up your body.
          </p>
        </div>
  
        {/* Divider */}
        <div style={{
          width: "100%",
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(180,120,80,0.3), transparent)",
        }} />
  
        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleLogin}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "14px",
            width: "100%",
            padding: "16px 24px",
            borderRadius: "999px",
            border: "1.5px solid rgba(180,120,80,0.3)",
            background: "rgba(255,255,255,0.9)",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(180,120,80,0.15)",
            transition: "all 0.2s ease",
            fontWeight: 700,
            fontSize: "15px",
            color: "#2c1f14",
            letterSpacing: "0.02em",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "#fff";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(180,120,80,0.25)";
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.9)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(180,120,80,0.15)";
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
          }}
        >
          {/* Google SVG icon */}
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Continue with Google
        </button>
  
        {/* Footer note */}
        <p style={{ color: "#b89880", fontSize: "11px", margin: 0, textAlign: "center" }}>
          By signing in you agree to our terms of service
        </p>
  
      </div>
    </div>
  );
}