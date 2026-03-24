'use client';
import Link from "next/link";

export default function MainPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">

      {/* Background */}
      <img
        src="/background.svg"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Center avatar */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
        <img
          src="/basic-avatar.svg"
          alt="User avatar"
          className="w-[300px] scale-[3] max-w-none rounded-full object-cover translate-y-80"
        />
      </div>

      {/* Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-black/20" />

    </div>
  );
}