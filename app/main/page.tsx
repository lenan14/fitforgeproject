'use client';
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

type Modal = "log-goal" | "view-goals" | "log-workout" | "view-workouts" | null;

export default function MainPage() {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<"goals" | "workouts" | null>(null);
  const [modal, setModal] = useState<Modal>(null);

  const [goals, setGoals] = useState<string[]>([]);
  const [workouts, setWorkouts] = useState<string[]>([]);
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/login");
    });
  }, [router]);

  const toggle = (menu: "goals" | "workouts") => {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  const openModal = (m: Modal) => {
    setModal(m);
    setOpenMenu(null);
    setInputText("");
  };

  const closeModal = () => {
    setModal(null);
    setInputText("");
  };

  const handleLog = () => {
    if (!inputText.trim()) return;
    if (modal === "log-goal") setGoals((prev) => [...prev, inputText.trim()]);
    if (modal === "log-workout") setWorkouts((prev) => [...prev, inputText.trim()]);
    closeModal();
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">

      {/* Background */}
      <img
        src="/background.svg"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dropdown menus */}
      <div className="absolute top-6 left-6 z-20 flex gap-4">

        {/* Goals */}
        <div className="relative">
          <button
            onClick={() => toggle("goals")}
            className="flex items-center gap-2 rounded-lg bg-white/90 px-5 py-2 font-semibold text-black shadow-md hover:bg-white"
          >
            Goals
            <span className="text-xs">{openMenu === "goals" ? "▲" : "▼"}</span>
          </button>
          {openMenu === "goals" && (
            <div className="absolute left-0 mt-2 w-52 rounded-lg bg-white shadow-lg">
              <button
                onClick={() => openModal("log-goal")}
                className="block w-full px-4 py-3 text-left text-sm font-medium hover:bg-zinc-100"
              >
                Log a Goal
              </button>
              <button
                onClick={() => openModal("view-goals")}
                className="block w-full px-4 py-3 text-left text-sm font-medium hover:bg-zinc-100"
              >
                View My Goals
              </button>
            </div>
          )}
        </div>

        {/* Workouts */}
        <div className="relative">
          <button
            onClick={() => toggle("workouts")}
            className="flex items-center gap-2 rounded-lg bg-white/90 px-5 py-2 font-semibold text-black shadow-md hover:bg-white"
          >
            Workouts
            <span className="text-xs">{openMenu === "workouts" ? "▲" : "▼"}</span>
          </button>
          {openMenu === "workouts" && (
            <div className="absolute left-0 mt-2 w-52 rounded-lg bg-white shadow-lg">
              <button
                onClick={() => openModal("log-workout")}
                className="block w-full px-4 py-3 text-left text-sm font-medium hover:bg-zinc-100"
              >
                Log a Workout
              </button>
              <button
                onClick={() => openModal("view-workouts")}
                className="block w-full px-4 py-3 text-left text-sm font-medium hover:bg-zinc-100"
              >
                View My Workouts
              </button>
            </div>
          )}
        </div>

      </div>

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

      {/* Modal */}
      {modal && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl mx-4">

            {/* Log Goal */}
            {modal === "log-goal" && (
              <>
                <h2 className="mb-4 text-lg font-bold">Log a Goal</h2>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Describe your goal..."
                  className="w-full rounded-lg border border-zinc-300 p-3 text-sm outline-none focus:border-zinc-500 resize-none"
                  rows={4}
                  autoFocus
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={closeModal} className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100">Cancel</button>
                  <button onClick={handleLog} className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">Save</button>
                </div>
              </>
            )}

            {/* Log Workout */}
            {modal === "log-workout" && (
              <>
                <h2 className="mb-4 text-lg font-bold">Log a Workout</h2>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Describe your workout..."
                  className="w-full rounded-lg border border-zinc-300 p-3 text-sm outline-none focus:border-zinc-500 resize-none"
                  rows={4}
                  autoFocus
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={closeModal} className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100">Cancel</button>
                  <button onClick={handleLog} className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">Save</button>
                </div>
              </>
            )}

            {/* View Goals */}
            {modal === "view-goals" && (
              <>
                <h2 className="mb-4 text-lg font-bold">My Goals</h2>
                {goals.length === 0 ? (
                  <p className="text-sm text-zinc-400">No goals logged yet.</p>
                ) : (
                  <ul className="space-y-2 max-h-64 overflow-y-auto">
                    {goals.map((g, i) => (
                      <li key={i} className="rounded-lg bg-zinc-100 px-4 py-2 text-sm">{g}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 flex justify-end">
                  <button onClick={closeModal} className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100">Close</button>
                </div>
              </>
            )}

            {/* View Workouts */}
            {modal === "view-workouts" && (
              <>
                <h2 className="mb-4 text-lg font-bold">My Workouts</h2>
                {workouts.length === 0 ? (
                  <p className="text-sm text-zinc-400">No workouts logged yet.</p>
                ) : (
                  <ul className="space-y-2 max-h-64 overflow-y-auto">
                    {workouts.map((w, i) => (
                      <li key={i} className="rounded-lg bg-zinc-100 px-4 py-2 text-sm">{w}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 flex justify-end">
                  <button onClick={closeModal} className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100">Close</button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
