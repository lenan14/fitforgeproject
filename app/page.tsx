'use client';
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Home() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // [Auto-Login] \\
  useEffect(() => {
    const savedUser = localStorage.getItem("username");

    if (savedUser) {
      router.push("/feed");
    }
  }, [router]);

  // [Login] \\
  const handleLogin = () => {
    const users = JSON.parse(localStorage.getItem("users") || "{}");

    if (!users[username]) {
      alert("Account doesn't exists")
      return;
    }

    if (users[username] !== password) {
      alert("Incorrect password.");
      return;
    }

    localStorage.setItem("username", username);

    router.push("/feed")
  };

  // [Create Account] \\
  const handleCreate = () => {
    const users = JSON.parse(localStorage.getItem("users") || "{}");

    if (users[username]) {
      alert("Username already exists.");
      return;
    }

    users[username] = password;

    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("username", username);

    router.push("/feed");
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Fullscreen background SVG */}
      <img
        src="/background.svg"
        alt="Background"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Button-right temp button that navigates to main avatar screen */}
      <Link href="/main" aria-label="Go to main avatar screen">
        <img
          src="/temp button.svg"
          alt="Temporary main button"
          className="absolute right-0 bottom-0 z-20 h-[400px] w-[400px] cursor-pointer"
          style={{ filter: "none", boxShadow: "none", background: "transparent" }}
        />
      </Link>

      {/* Center overlay with welcome + login SVG */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
        <div className="max-w-lg text-center">
          <Link href="/login" aria-label="Go to login page">
            <img
              src="/welcome + login button.svg"
              alt="Welcome and Login"
              className="mx-auto mb-6 h-auto w-full max-w-[670px] cursor-pointer select-none"
            />
          </Link>

          <p className="text-sm text-white/90">
            Tap the welcome image to go to /login.
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-black/20" />
    </div>
  )
}

function useEffect(arg0: () => void, arg1: AppRouterInstance[]) {
  throw new Error("Function not implemented.");
}
