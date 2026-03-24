'use client';
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">

      {/* Background */}
      <img
        src="/background.svg"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Center content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
        <div className="text-center">

          <Link href="/login">
            <img
              src="/welcome-login.svg"
              alt="Welcome and Login"
              className="mx-auto mb-6 w-full max-w-[700px] cursor-pointer"
            />
          </Link>

        </div>
      </div>

      {/* Bottom-right button */}
      <Link
        href="/main"
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 999
        }}
      >
        <img
          src="/temp-button.svg"
          alt="Temp Button"
          style={{
            width: "200px",
            height: "auto",
            cursor: "pointer"
          }}
        />
      </Link>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

    </div>
  );
}