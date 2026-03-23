import Link from "next/link";

export default function MainPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <img
        src="/background.svg"
        alt="Background"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center pt-36 px-6">
        <img
          src="/basic avatar.svg"
          alt="User avatar"
          className="h-[500px] w-[500px] rounded-full object-cover"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-black/20" />
    </div>
  );
}
