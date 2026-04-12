'use client';
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">

      {/* Background */}
      <img
        src="/background.svg"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Subtle dark overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "rgba(0,0,0,0.08)" }} />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: `${8 + i * 4}px`,
            height: `${8 + i * 4}px`,
            borderRadius: "50%",
            background: `rgba(200,159,122,${0.15 + i * 0.05})`,
            top: `${10 + i * 14}%`,
            left: `${5 + i * 15}%`,
            animation: `float${i} ${3 + i}s ease-in-out infinite alternate`,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      ))}

      <style>{`
        @keyframes float0 { from { transform: translateY(0px); } to { transform: translateY(-12px); } }
        @keyframes float1 { from { transform: translateY(0px); } to { transform: translateY(-18px); } }
        @keyframes float2 { from { transform: translateY(0px); } to { transform: translateY(-10px); } }
        @keyframes float3 { from { transform: translateY(0px); } to { transform: translateY(-20px); } }
        @keyframes float4 { from { transform: translateY(0px); } to { transform: translateY(-14px); } }
        @keyframes float5 { from { transform: translateY(0px); } to { transform: translateY(-8px); } }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(200,159,122,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(200,159,122,0); }
        }
      `}</style>

      {/* Center content */}
      <div
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-10"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
        }}
      >
        {/* Glow behind SVG */}
        <div style={{
          position: "absolute",
          width: "600px",
          height: "300px",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(200,159,122,0.5), transparent 70%)",
          filter: "blur(20px)",
          pointerEvents: "none",
          zIndex: 0,
        }} />
        {/* Welcome SVG with bounce-in */}
        <div style={{
          animation: visible ? "fadeSlideUp 0.9s ease forwards" : "none",
          marginBottom: "24px",
        }}>
          <Link href="/login">
            <img
              src="/welcome-login.svg"
              alt="Welcome to FitForge"
              style={{
                width: "min(700px, 90vw)",
                height: "auto",
                cursor: "pointer",
                filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.15))",
                transition: "transform 0.3s ease, filter 0.3s ease",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLImageElement).style.transform = "scale(1.02) translateY(-4px)";
                (e.currentTarget as HTMLImageElement).style.filter = "drop-shadow(0 16px 32px rgba(0,0,0,0.2))";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLImageElement).style.transform = "scale(1) translateY(0)";
                (e.currentTarget as HTMLImageElement).style.filter = "drop-shadow(0 8px 24px rgba(0,0,0,0.15))";
              }}
            />
          </Link>
        </div>
      </div>
    </div>
  );
}