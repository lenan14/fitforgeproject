'use client';
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { saveWorkout, saveBodyProgression, getUserProfile, getBodyProgression } from "@/lib/firestore";

const upperWorkoutOptions = {
  noEquipment: [
    "Push-Ups",
    "Diamond Push-Ups",
    "Pike Push-Ups",
    "Plank Shoulder Taps",
    "Pull-Ups",
  ],
  equipment: [
    "Bench Press",
    "One-Arm Dumbbell Row",
    "Shoulder Press",
    "Bicep Curls",
    "Tricep Dips",
  ],
};

const lowerWorkoutOptions = {
  noEquipment: [
    "Squats",
    "Lunges",
    "Jump Squats",
    "Wall Sit",
    "Calf Raises",
  ],
  equipment: [
    "Barbell Squat",
    "Deadlift",
    "Leg Press",
    "Romanian Deadlift",
    "Weighted Lunges",
  ],
};

const workoutXPConfig: Record<string, { baseMultiplier: number; weightMultiplier?: number }> = {
  "Push-Ups": { baseMultiplier: 2 },
  "Diamond Push-Ups": { baseMultiplier: 2.2 },
  "Pike Push-Ups": { baseMultiplier: 2 },
  "Plank Shoulder Taps": { baseMultiplier: 1.8 },
  "Pull-Ups": { baseMultiplier: 2.5 },
  "Bench Press": { baseMultiplier: 1, weightMultiplier: 0.05 },
  "One-Arm Dumbbell Row": { baseMultiplier: 1, weightMultiplier: 0.05 },
  "Shoulder Press": { baseMultiplier: 1, weightMultiplier: 0.05 },
  "Bicep Curls": { baseMultiplier: 1, weightMultiplier: 0.05 },
  "Tricep Dips": { baseMultiplier: 1.2, weightMultiplier: 0.03 },
  "Squats": { baseMultiplier: 2 },
  "Lunges": { baseMultiplier: 2 },
  "Jump Squats": { baseMultiplier: 2.4 },
  "Wall Sit": { baseMultiplier: 1.5 },
  "Calf Raises": { baseMultiplier: 1.6 },
  "Barbell Squat": { baseMultiplier: 1, weightMultiplier: 0.05 },
  "Deadlift": { baseMultiplier: 1, weightMultiplier: 0.06 },
  "Leg Press": { baseMultiplier: 1, weightMultiplier: 0.05 },
  "Romanian Deadlift": { baseMultiplier: 1, weightMultiplier: 0.05 },
  "Weighted Lunges": { baseMultiplier: 1, weightMultiplier: 0.05 },
};

const workoutStatImpact: Record<
  string,
  {
    strength: number;
    endurance: number;
    muscles: string[];
  }
> = {
  "Push-Ups": { strength: 1.8, endurance: 1.3, muscles: ["Chest", "Shoulders", "Arms"] },
  "Diamond Push-Ups": { strength: 2.0, endurance: 1.2, muscles: ["Chest", "Arms"] },
  "Pike Push-Ups": { strength: 1.6, endurance: 1.2, muscles: ["Shoulders", "Core"] },
  "Plank Shoulder Taps": { strength: 1.0, endurance: 1.7, muscles: ["Shoulders", "Core", "Abs"] },
  "Pull-Ups": { strength: 2.2, endurance: 1.0, muscles: ["Back", "Arms"] },
  "Bench Press": { strength: 2.5, endurance: 0.9, muscles: ["Chest", "Shoulders", "Arms"] },
  "One-Arm Dumbbell Row": { strength: 2.3, endurance: 0.8, muscles: ["Back", "Arms"] },
  "Shoulder Press": { strength: 2.4, endurance: 0.8, muscles: ["Shoulders", "Arms"] },
  "Bicep Curls": { strength: 2.0, endurance: 0.7, muscles: ["Arms"] },
  "Tricep Dips": { strength: 2.0, endurance: 0.8, muscles: ["Arms"] },
  "Squats": { strength: 2.3, endurance: 1.0, muscles: ["Quads", "Glutes"] },
  "Lunges": { strength: 2.1, endurance: 1.1, muscles: ["Quads", "Glutes"] },
  "Jump Squats": { strength: 2.2, endurance: 1.2, muscles: ["Quads", "Glutes"] },
  "Wall Sit": { strength: 1.0, endurance: 1.8, muscles: ["Quads", "Glutes"] },
  "Calf Raises": { strength: 1.7, endurance: 1.0, muscles: ["Calves"] },
  "Barbell Squat": { strength: 2.6, endurance: 0.9, muscles: ["Quads", "Glutes", "Core"] },
  "Deadlift": { strength: 2.8, endurance: 0.9, muscles: ["Glutes", "Hamstrings", "Back"] },
  "Leg Press": { strength: 2.4, endurance: 0.9, muscles: ["Quads", "Glutes"] },
  "Romanian Deadlift": { strength: 2.5, endurance: 0.9, muscles: ["Hamstrings", "Glutes"] },
  "Weighted Lunges": { strength: 2.3, endurance: 1.0, muscles: ["Quads", "Glutes"] },
};

type WorkoutTask = {
  id: string;
  category: "upper" | "lower";
  equipmentType: "noEquipment" | "equipment";
  workout: string;
  sets: string;
  reps: string;
  weight: string;
  timestamp: string;
  status: "pending" | "completed";
  xpEarned?: number;
};

export default function MainPage() {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<"workouts" | "avatar" | "master" | null>(null);
  const [openWorkoutModal, setOpenWorkoutModal] = useState<"upper" | "lower" | null>(null);
  const [openTasksModal, setOpenTasksModal] = useState(false);
  const [openStatsModal, setOpenStatsModal] = useState(false);
  const [openBodyProgressionModal, setOpenBodyProgressionModal] = useState(false);
  const [tasks, setTasks] = useState<WorkoutTask[]>([]);
  const [equipmentType, setEquipmentType] = useState<"noEquipment" | "equipment">("noEquipment");
  const [selectedWorkout, setSelectedWorkout] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [totalXP, setTotalXP] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastCompletionDate, setLastCompletionDate] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // [Sign out Function] //
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // [Level Progression] //
  /*
    Tier 1: Base Form (0/1000 XP)
    Tier 2: Active Form (0/3000 XP)
    Tier 3: Advancded Form (0/7,500 XP)
    Tier 4: Athletic Form (0/15,000 XP)
    Tier 5: Bodybuilder Form (0/30,000 XP)

    Notes:
      - User levels up a Tier when total XP crosses a threshold
      - Tier determines avatar appearance
      - The User's Avatar changes depending on the Tier
  */

  // [Experience Points Formula] //
  /*
    Purpose: Calculate XP gained from a workout based on effort and difficulty.

    Base Formula: XP = (Sets x Reps x BaseValue)

    If Weight is used: XP = (Sets x Reps x Weight x WeightMultiplier)

    Modifers:
      - Workout Difficulty
        - Easy: x1.0
        - Medium: x1.2
        - Hard: x1.5
      - Dicipline Bonus (Streak):
        - XP x (1 + Streak Bonus)
      - Time Validation (IMPORTANT):
        - XP reduced or rejected if workout completed unrealistically fast

    Examples:
      - Push-Ups: 3 sets x 15 reps x 2 = 90 XP
      - Bench Press: 3 x 10 x 100 x 0.05 = 150 XP
      
    Notes:
      - Final XP feeds into Level Progression
      - Total XP determines Level Progression
  */


  // [Task Modal Handler]
  const handleTasksPopUp = async () => {
    setOpenMenu(null);
    setOpenTasksModal(true);
  }

  // [Upper Body Modal Handler]
  const handleUpperPopUp = async () => {
    console.log("handleUpperPopUp fired");
    setOpenMenu(null);
    setOpenWorkoutModal("upper");
    setEquipmentType("noEquipment");
    setSelectedWorkout("");
    setSets("");
    setReps("");
    setWeight("");
  }

  // [Lower Body Modal Handler]
  const handleLowerPopUp = async () => {
    console.log("handleLowerPopUp fired");
    setOpenMenu(null);
    setOpenWorkoutModal("lower");
    setEquipmentType("noEquipment");
    setSelectedWorkout("");
    setSets("");
    setReps("");
    setWeight("");
  }

  // [Confirm Workout Handler]
  // Purpose: Validates User Input
  const handleConfirmWorkout = async () => {
    if (!selectedWorkout || !sets || !reps || (equipmentType === "equipment" && !weight)) {
      alert("Please select a workout and fill in all required fields.");
      return;
    }

    const newTask: WorkoutTask = {
      id: Date.now().toString(),
      category: openWorkoutModal as "upper" | "lower",
      equipmentType,
      workout: selectedWorkout,
      sets,
      reps,
      weight: equipmentType === "equipment" ? weight : "Bodyweight",
      timestamp: new Date().toISOString(),
      status: "pending",
    };

    setTasks((prevTasks) => [newTask, ...prevTasks]);
    console.log("Workout added to tasks:", newTask);
    setOpenWorkoutModal(null);
  }

  const xpTierThresholds = [0, 1000, 3000, 7500, 15000, 30000];

  // [Tier XP Level]
  // Purpose: Determines the User's Tier Level based on Total XP
  const getTierFromXP = (xp: number): number => {
    if (xp >= xpTierThresholds[4]) return 5;
    if (xp >= xpTierThresholds[3]) return 4;
    if (xp >= xpTierThresholds[2]) return 3;
    if (xp >= xpTierThresholds[1]) return 2;
    return 1;
  };

  // [Tier Name]
  const getTierName = (tier: number): string => {
    switch (tier) {
      case 2:
        return "Active Form";
      case 3:
        return "Advanced Form";
      case 4:
        return "Athletic Form";
      case 5:
        return "Bodybuilder Form";
      default:
        return "Base Form";
    }
  };

  // [Avatar Tier]
  // Purpose: Avatar Changes depending on Tier Level
  const getAvatarForTier = (tier: number): string => {
    return `/AvatarT${Math.max(1, Math.min(5, tier))}.png`;
  };

  // [Bonus Streak Multiplier]
  // Note: Caps at 25%
  const getStreakBonusMultiplier = (streakDays: number): number => {
    return Math.min(streakDays * 0.05, 0.25);
  };

  // [Task XP Computation]
  // Purpose: Computes XP earned from a Workout Tasks
  const calculateXPFromTask = (task: WorkoutTask, streakDays: number): number => {
    const config = workoutXPConfig[task.workout] ?? { baseMultiplier: 2 };
    const setsValue = Math.max(1, parseInt(task.sets) || 1);
    const repsValue = Math.max(1, parseInt(task.reps) || 1);
    const baseXP = config.weightMultiplier
      ? setsValue * repsValue * (parseFloat(task.weight) || 1) * config.weightMultiplier
      : setsValue * repsValue * config.baseMultiplier;

    const streakBonus = getStreakBonusMultiplier(streakDays);
    return Math.round(baseXP * (1 + streakBonus));
  };

  // [Tier Progress]
  const getTierProgress = (xp: number) => {
    const tier = getTierFromXP(xp);
    const minXP = xpTierThresholds[tier - 1];
    const nextXP = xpTierThresholds[tier] ?? xpTierThresholds[xpTierThresholds.length - 1];
    const cappedXP = Math.min(xp, nextXP);
    const progress = Math.min(100, Math.floor(((cappedXP - minXP) / (nextXP - minXP)) * 100));
    return { tier, minXP, nextXP, progress };
  };

  // [Workout Effor Factor]
  const getWorkoutEffortFactor = (task: WorkoutTask) => {
    const setsValue = Math.max(1, parseInt(task.sets) || 1);
    const repsValue = Math.max(1, parseInt(task.reps) || 1);
    return setsValue * repsValue;
  };

  // [Game Stats]
  // Purpose: Computes Overall Stats
  const calculateGameStats = (tasks: WorkoutTask[], streakDays: number, xp: number) => {
    const completedTasks = tasks.filter((task) => task.status === "completed");
    let strength = 15;
    let endurance = 15;

    completedTasks.forEach((task) => {
      const impact = workoutStatImpact[task.workout] ?? { strength: 1, endurance: 1, muscles: [] };
      const effort = Math.sqrt(getWorkoutEffortFactor(task));
      strength += impact.strength * effort * 0.25;
      endurance += impact.endurance * effort * 0.25;
    });

    const discipline = Math.min(100, 10 + streakDays * 6 + Math.floor(xp / 400));
    return {
      strength: Math.round(strength),
      endurance: Math.round(endurance),
      discipline,
    };
  };

  // [Body Attribute Progress]
  const calculateBodyAttributeProgression = (tasks: WorkoutTask[]) => {
    const progression: Record<string, number> = {
      Chest: 10,
      Shoulders: 10,
      Arms: 10,
      Back: 10,
      Quads: 10,
      Hamstrings: 10,
      Glutes: 10,
      Calves: 10,
      Core: 10,
      Abs: 10,
    };

    const completedTasks = tasks.filter((task) => task.status === "completed");
    completedTasks.forEach((task) => {
      const impact = workoutStatImpact[task.workout] ?? { strength: 1, endurance: 1, muscles: [] };
      const effort = Math.sqrt(getWorkoutEffortFactor(task));

      impact.muscles.forEach((muscle) => {
        progression[muscle] = Math.min(100, progression[muscle] + (impact.strength + impact.endurance) * effort * 0.15);
      });
    });

    return progression;
  };

  // [Estimated Streak]
  // Purpose: Estimates New Streak Value after Completing Tasks
  const getEstimatedStreakAfterCompletion = (): number => {
    const today = new Date();
    const lastDate = lastCompletionDate ? new Date(lastCompletionDate) : null;
    const isSameDay = lastDate && today.toDateString() === lastDate.toDateString();
    const isYesterday = lastDate && new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toDateString() === lastDate.toDateString();
    return isSameDay ? streak : isYesterday ? streak + 1 : 1;
  };

  // [Estimate Task Rewards]
  // Purpose: Estimate XP, Stat, and Attributes Gain
  const estimateTaskRewards = (task: WorkoutTask) => {
    const estimatedStreak = getEstimatedStreakAfterCompletion();
    const xp = calculateXPFromTask(task, estimatedStreak);
    const impact = workoutStatImpact[task.workout] ?? { strength: 1, endurance: 1, muscles: [] };
    const effort = Math.sqrt(getWorkoutEffortFactor(task));

    return {
      xp,
      strengthGain: Math.max(0, Math.round(impact.strength * effort * 0.25)),
      enduranceGain: Math.max(0, Math.round(impact.endurance * effort * 0.25)),
      muscles: impact.muscles,
    };
  };

  // [calculate Minimum Time] - Validates realistic workout completion time
  const calculateMinimumTime = (task: WorkoutTask): number => {
    // Constraints: minimum 1.5 seconds per rep, 30 seconds rest between sets
    const reps = parseInt(task.reps) || 1;
    const sets = parseInt(task.sets) || 1;
    const minTimePerRep = 1.5; // seconds
    const restTimeBetweenSets = 30; // seconds

    const exerciseTime = sets * reps * minTimePerRep;
    const restTime = (sets - 1) * restTimeBetweenSets;
    return Math.ceil((exerciseTime + restTime) / 60); // return in minutes
  };

  // [Elapsed Time]
  // Purpose: Time for Task
  const getElapsedTime = (timestamp: string): number => {
    const taskTime = new Date(timestamp).getTime();
    const currentTime = new Date().getTime();
    return Math.floor((currentTime - taskTime) / 60000); // in minutes
  };

  // [Remove Task]
  const handleRemoveTask = (taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    console.log("Task removed:", taskId);
  };

  // [Confirm Task]
  // Purpose: Make Sure Tasks is Complete According to Time
  const handleConfirmTask = async (task: WorkoutTask) => {
    const elapsedTime = getElapsedTime(task.timestamp);
    const minimumTime = calculateMinimumTime(task);
    //if (elapsedTime < minimumTime) {
    //  alert(`Minimum required time is ${minimumTime} minute(s). Elapsed: ${elapsedTime} min.`);
    //  return;
    //}
    const today = new Date();
    const lastDate = lastCompletionDate ? new Date(lastCompletionDate) : null;
    const isSameDay = lastDate && today.toDateString() === lastDate.toDateString();
    const isYesterday = lastDate && new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toDateString() === lastDate.toDateString();
    const newStreak = isSameDay ? streak : isYesterday ? streak + 1 : 1;
    const earnedXP = calculateXPFromTask(task, newStreak);
 
    // Update local state
    const updatedTasks = tasks.map((t) =>
      t.id === task.id ? { ...t, status: "completed" as const, xpEarned: earnedXP } : t
    );
    setTasks(updatedTasks);
    setTotalXP((prev) => prev + earnedXP);
    setStreak(newStreak);
    setLastCompletionDate(today.toISOString());
 
    // Save to Firestore
    if (userId) {
      try {
        await saveWorkout(userId, {
          date: today.toISOString(),
          exercises: [{
            exercise: task.workout,
            category: task.category,
            equipmentType: task.equipmentType,
            sets: parseInt(task.sets),
            reps: parseInt(task.reps),
            weight: task.weight === "Bodyweight" ? "Bodyweight" : parseFloat(task.weight),
          }],
          streakAtTime: newStreak,
          xpEarned: earnedXP,
        });
        const updatedProgression = calculateBodyAttributeProgression(updatedTasks);
        await saveBodyProgression(userId, updatedProgression as Record<string, number>);
      } catch (error) {
        console.error("Failed to save to Firestore:", error);
      }
    }
  };

  const [, setRenderTrigger] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setRenderTrigger((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // [Stat Modal Handler]
  const handleStatsPopUp = async () => {
    setOpenMenu(null);
    setOpenWorkoutModal(null);
    setOpenTasksModal(false);
    setOpenBodyProgressionModal(false);
    setOpenStatsModal(true);
  };

  // [Body Progression Modal Handler]
  const handleBodyProgressionPopUp = async () => {
    setOpenMenu(null);
    setOpenWorkoutModal(null);
    setOpenTasksModal(false);
    setOpenStatsModal(false);
    setOpenBodyProgressionModal(true);
  };

  // [Add XP For Master Control] - Master Control function for testing
  const handleAddXP = (xpAmount: number) => {
    setTotalXP((prevXP) => Math.min(prevXP + xpAmount, xpTierThresholds[xpTierThresholds.length - 1]));
    console.log(`Added ${xpAmount} XP for testing`);
  };

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUserId(u.uid);
      try {
        const profile = await getUserProfile(u.uid);
        if (profile) {
          setTotalXP(profile.totalXP ?? 0);
          setStreak(profile.streak ?? 0);
          setLastCompletionDate(profile.lastCompletionDate ?? null);
        }
        await getBodyProgression(u.uid);
      } catch (error) {
        console.error("Failed to load user data:", error);
      } finally {
        setIsLoading(false);
      }
    });
  }, [router]);

  const toggle = (menu: "workouts" | "avatar" | "master") => {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  const workoutOptions = openWorkoutModal === "lower" ? lowerWorkoutOptions : upperWorkoutOptions;
  const availableWorkouts = workoutOptions[equipmentType];
  const tierInfo = getTierProgress(totalXP);
  const tierName = getTierName(tierInfo.tier);
  const avatarSrc = getAvatarForTier(tierInfo.tier);
  const streakBonusPercent = Math.round(getStreakBonusMultiplier(streak) * 100);
  const gameStats = calculateGameStats(tasks, streak, totalXP);
  const bodyProgression = calculateBodyAttributeProgression(tasks);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">

      {/* Background */}
      <img
        src="/background.svg"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* UI - User Interface (Dropdown menus) */}
      {/* <div className="absolute top-6 left-6 z-20 flex items-center gap-12 rounded-[32px] border-[3px] border-[#d7c4b4] bg-[#f8efe4] px-4 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.14)]"> */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-16 rounded-[36px] border-2 border-[#cbb6a4] bg-[#f8efe4] px-8 py-5 shadow-[0_20px_50px_rgba(0,0,0,0.18)]">

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => toggle("avatar")}
            className="flex items-center gap-3 rounded-[22px] bg-white border border-[#d7c4b4] px-4 py-2 text-sm font-semibold text-[#5b4636] shadow-sm hover:bg-[#f3e1d3] transition-all duration-200 active:scale-[0.98]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3e1d3] text-lg text-[#5b4636]">🙂</span>
            <span>Profile</span>
            <span className="text-[10px]">{openMenu === "avatar" ? "▲" : "▼"}</span>
          </button>

          {openMenu === "avatar" && (
            <div className="absolute left-0 mt-3 w-64 rounded-2xl bg-white border border-[#d7c4b4] shadow-[0_10px_30px_rgba(0,0,0,0.12)] p-2">

              {[
                { label: "Stats", action: handleStatsPopUp, icon: "📊" },
                { label: "Tasks", action: handleTasksPopUp, icon: "📋" },
                { label: "Body Progression", action: handleBodyProgressionPopUp, icon: "💪" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[#5b4636] font-semibold hover:bg-[#f3e1d3] transition-all duration-150 active:scale-[0.98]"
                >
                  <span className="text-lg opacity-80">{item.icon}</span>
                  {item.label}
                </button>
              ))}

              <div className="h-px bg-[#e2d5c8] my-2" />

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[#7a2e2e] font-semibold hover:bg-[#f8d7d7] transition-all duration-150 active:scale-[0.98]"
              >
                <span className="text-lg opacity-80">🚪</span>
                Log Out
              </button>

            </div>
          )}
        </div>  

        {/* Workouts */}
        <div className="relative">
          <button
            onClick={() => toggle("workouts")}
            className="flex items-center gap-2 rounded-[22px] bg-white border border-[#d7c4b4] px-4 py-2 text-sm font-semibold text-[#5b4636] shadow-sm hover:bg-[#f3e1d3] transition-all duration-200 active:scale-[0.98]"
          >
            <span className="text-lg">🏋️</span>
            <span>Workouts</span>
            <span className="text-[10px]">{openMenu === "workouts" ? "▲" : "▼"}</span>
          </button>

          {openMenu === "workouts" && (
            <div className="absolute left-0 mt-3 w-56 rounded-2xl bg-white border border-[#d7c4b4] shadow-[0_10px_30px_rgba(0,0,0,0.12)] p-2">

              <button
                onClick={handleUpperPopUp}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[#5b4636] font-semibold hover:bg-[#f3e1d3] transition-all duration-150 active:scale-[0.98]"
              >
                <span className="text-lg opacity-80">💪</span>
                Upper Body
              </button>

              <button
                onClick={handleLowerPopUp}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[#5b4636] font-semibold hover:bg-[#f3e1d3] transition-all duration-150 active:scale-[0.98]"
              >
                <span className="text-lg opacity-80">🦵</span>
                Lower Body
              </button>

            </div>
          )}
        </div>

        {/* Master Control */}
        <div className="relative">
          <button
            onClick={() => toggle("master")}
            className="flex items-center gap-2 rounded-[22px] bg-white border border-[#d7c4b4] px-4 py-2 text-sm font-semibold text-[#5b4636] shadow-sm hover:bg-[#f3e1d3] transition-all duration-200 active:scale-[0.98]"
          >
            <span className="text-lg">🧠</span>
            <span>Master Control</span>
            <span className="text-[10px]">{openMenu === "master" ? "▲" : "▼"}</span>
          </button>

          {openMenu === "master" && (
            <div className="absolute left-0 mt-3 w-56 rounded-2xl bg-white border border-[#d7c4b4] shadow-[0_10px_30px_rgba(0,0,0,0.12)] p-2">

              <div className="px-4 py-2 text-sm font-semibold text-[#5b4636]">
                Add XP (Testing)
              </div>

              {[100, 500, 1000, 5000].map((xp) => (
                <button
                  key={xp}
                  onClick={() => handleAddXP(xp)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[#5b4636] font-semibold hover:bg-[#f3e1d3] transition-all duration-150 active:scale-[0.98]"
                >
                  <span className="text-lg opacity-80">⭐</span>
                  +{xp} XP
                </button>
              ))}

            </div>
          )}
        </div>

        {/* Tier Progression Level */}
        <div className="flex min-w-[300px] max-w-[520px] flex-col rounded-[24px] bg-white border border-[#d7c4b4] p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-[#5b4636]">⭐</span>
            <span className="text-sm font-semibold text-[#5b4636]"> ({tierName})  Tier {tierInfo.tier}: XP {totalXP} / {tierInfo.nextXP} {streak} Streak</span>
          </div>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-[#d6c3b5]">
            <div
              className="h-full bg-[#c89f7a] rounded-full transition-all duration-500"
              style={{ width: `${tierInfo.progress}%` }}
            />
          </div>
        </div>

      </div>


      {/* Center avatar */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
        {/* IMPORTANT: Avatar changes based on the User's Tier */}
        <img
          src={avatarSrc}
          alt={`User avatar tier ${tierInfo.tier}`}
          className="w-[300px] scale-[3] max-w-none rounded-full object-cover translate-y-80"
        />
      </div>


      {/* Modals */}
      {/* Workout Modal */}
      {openWorkoutModal !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            backgroundColor: "rgba(0, 0, 0, 0.75)",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "900px",
              background: "white",
              border: "4px solid #d4c0b7",
              backgroundColor: "#e7d5cd",
              borderRadius: "24px",
              padding: "24px",
              boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
              minHeight: "360px",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-20px",
                left: "20%",
                transform: "translateX(-50%)",
              border: "3px solid #ab958c",
                background: "#bea69d",
                color: "#000",
                padding: "8px 16px",
                borderRadius: "999px",
                fontWeight: 800,
              }}
            >
              Workout Modal Section: {openWorkoutModal}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start", marginBottom: "24px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "28px", fontWeight: 700 }}>
                  {openWorkoutModal === "upper" ? "Upper Body" : "Lower Body"} Workout
                </h2>
                <p style={{ marginTop: "8px", color: "#475569" }}>
                  Log a workout and add it to your tasks.
                </p>
              </div>
              {/* <button
                type="button"
                onClick={() => setOpenWorkoutModal(null)}
                style={{
                  borderRadius: "999px",
                  background: "#e2e8f0",
                  padding: "10px 16px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#0f172a",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Close
              </button> */}
            </div>

            <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: "20px" }}>
              <div style={{ borderRadius: "20px", border: "1px solid #a39893", background: "#b4a8a3", padding: "20px" }}>
                <div style={{ marginBottom: "12px", fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                  Workout Type
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setEquipmentType("noEquipment")}
                    style={{
                      borderRadius: "999px",
                      padding: "10px 14px",
                      fontSize: "14px",
                      fontWeight: 700,
                      border: equipmentType === "noEquipment" ? "none" : "1px solid #cbd5e1",
                      background: equipmentType === "noEquipment" ? "#0f172a" : "white",
                      color: equipmentType === "noEquipment" ? "white" : "#0f172a",
                      cursor: "pointer",
                    }}
                  >
                    No Equipment
                  </button>
                  <button
                    type="button"
                    onClick={() => setEquipmentType("equipment")}
                    style={{
                      borderRadius: "999px",
                      padding: "10px 14px",
                      fontSize: "14px",
                      fontWeight: 700,
                      border: equipmentType === "equipment" ? "none" : "1px solid #cbd5e1",
                      background: equipmentType === "equipment" ? "#0f172a" : "white",
                      color: equipmentType === "equipment" ? "white" : "#0f172a",
                      cursor: "pointer",
                    }}
                  >
                    With Equipment
                  </button>
                </div>
              </div>

              <div style={{ borderRadius: "20px", border: "1px solid #a39893", background: "#b4a8a3", padding: "20px" }}>
                <label htmlFor="selectedWorkout" style={{ display: "block", marginBottom: "8px", fontWeight: 700, color: "#0f172a" }}>
                  Select Workout
                </label>
                <select
                  id="selectedWorkout"
                  value={selectedWorkout}
                  onChange={(event) => setSelectedWorkout(event.target.value)}
                  style={{ width: "100%", borderRadius: "18px", border: "1px solid #cbd5e1", padding: "12px 14px", fontSize: "14px", color: "#0f172a" }}
                >
                  <option value="">Choose a workout</option>
                  {availableWorkouts.map((workout) => (
                    <option key={workout} value={workout}>
                      {workout}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: "24px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: 700, color: "#0f172a" }}>
                Sets
                <input
                  type="number"
                  min="1"
                  value={sets}
                  onChange={(event) => setSets(event.target.value)}
                  style={{ borderRadius: "18px", border: "1px solid #a39893", padding: "12px 14px", fontSize: "14px" }}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: 700, color: "#0f172a" }}>
                Reps
                <input
                  type="number"
                  min="1"
                  value={reps}
                  onChange={(event) => setReps(event.target.value)}
                  style={{ borderRadius: "18px", border: "1px solid #a39893", padding: "12px 14px", fontSize: "14px" }}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: 700, color: "#0f172a" }}>
                Weight (Equipment)
                <input
                  type="text"
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                  disabled={equipmentType !== "equipment"}
                  placeholder={equipmentType === "equipment" ? "Enter weight" : "Bodyweight only"}
                  style={{ borderRadius: "18px", border: "1px solid #a39893", padding: "12px 14px", fontSize: "14px", background: equipmentType !== "equipment" ? "#f1f5f9" : "white" }}
                />
              </label>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setOpenWorkoutModal(null)}
                style={{ borderRadius: "18px", border: "1px solid #cbd5e1", background: "white", padding: "12px 20px", fontWeight: 700, color: "#0f172a", cursor: "pointer" }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmWorkout}
                style={{ borderRadius: "18px", background: "#0f172a", color: "white", padding: "12px 20px", fontWeight: 700, cursor: "pointer", border: "none" }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {openTasksModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            backgroundColor: "rgba(0, 0, 0, 0.75)",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "1000px",
              background: "white",
              border: "4px solid #d4c0b7",
              backgroundColor: "#e7d5cd",
              borderRadius: "24px",
              padding: "24px",
              boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
              minHeight: "400px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ margin: 0, fontSize: "28px", fontWeight: 700 }}>
                Workout Tasks ({tasks.length})
              </h2>
              <button
                type="button"
                onClick={() => setOpenTasksModal(false)}
                style={{
                  borderRadius: "999px",
                  background: "#e2e8f0",
                  padding: "10px 16px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#0f172a",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            {tasks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#475569" }}>
                <p style={{ fontSize: "16px" }}>No tasks logged yet. Start by confirming a workout!</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "16px" }}>
                {tasks.map((task) => {
                  const elapsedTime = getElapsedTime(task.timestamp);
                  const minimumTime = calculateMinimumTime(task);
                  const canConfirm = elapsedTime >= minimumTime && task.status === "pending";
                  //const canConfirm = task.status === "pending";//Testing without time constraint
                  const estimatedRewards = task.status === "pending" ? estimateTaskRewards(task) : null;

                  return (
                  <div
                    key={task.id}
                    style={{
                      borderRadius: "16px",
                      border: "2px solid #a39893",
                      background: "#f5f1ed",
                      padding: "16px",
                      display: "grid",
                      gridTemplateColumns: "1.5fr 1fr 1fr",
                      gap: "16px",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
                        {task.category === "upper" ? "UPPER BODY" : "LOWER BODY"}
                      </div>
                      <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 700 }}>
                        {task.workout}
                      </h3>
                      <div style={{ fontSize: "14px", color: "#475569", lineHeight: "1.6" }}>
                        <div>Sets: <span style={{ fontWeight: 700 }}>{task.sets}</span></div>
                        <div>Reps: <span style={{ fontWeight: 700 }}>{task.reps}</span></div>
                        <div>Weight: <span style={{ fontWeight: 700 }}>{task.weight}</span></div>
                        {task.status === "pending" ? (
                          <div style={{ marginTop: "12px", display: "grid", gap: "8px", background: "#ffffff", padding: "12px", borderRadius: "16px", border: "1px solid #cbd5e1" }}>
                            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                              <span>XP +{estimatedRewards?.xp}</span>
                              <span style={{ fontWeight: 600 }}>STR +{estimatedRewards?.strengthGain}</span>
                              <span style={{ fontWeight: 600 }}>END +{estimatedRewards?.enduranceGain}</span>
                            </div>
                            {estimatedRewards?.muscles.length ? (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", fontSize: "11px", color: "#0f172a" }}>
                                {estimatedRewards.muscles.map((muscle) => (
                                  <span key={muscle} style={{ padding: "4px 8px", borderRadius: "999px", background: "#f1f5f9" }}>
                                    {muscle}+
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div style={{ marginTop: "12px", display: "grid", gap: "6px", background: "#e0f2fe", padding: "12px", borderRadius: "16px", border: "1px solid #7dd3fc" }}>
                            <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>Completed Rewards</div>
                            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", fontSize: "13px", color: "#0f172a" }}>
                              <span>XP +{task.xpEarned ?? 0}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "8px" }}>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
                          STATUS
                        </div>
                        <div
                          style={{
                            display: "inline-block",
                            padding: "6px 12px",
                            borderRadius: "16px",
                            background: task.status === "completed" ? "#dcfce7" : "#fef3c7",
                            color: task.status === "completed" ? "#166534" : "#92400e",
                            fontSize: "12px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                          }}
                        >
                          {task.status}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
                          LOGGED
                        </div>
                        <div style={{ fontSize: "12px", color: "#475569" }}>
                          {new Date(task.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "8px" }}>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
                          TIME VALIDATION
                        </div>
                        <div style={{ fontSize: "13px", color: "#475569", marginBottom: "8px" }}>
                          <div>Min required: <span style={{ fontWeight: 700 }}>{minimumTime} min</span></div>
                          <div>Elapsed: <span style={{ fontWeight: 700, color: canConfirm ? "#16a34a" : "#dc2626" }}>{elapsedTime} min</span></div>
                        </div>
                        {!canConfirm && task.status === "pending" && (
                          <div style={{ fontSize: "11px", color: "#dc2626", background: "#fee2e2", padding: "6px 8px", borderRadius: "6px", marginBottom: "8px" }}>
                            ⏱️ Wait {minimumTime - elapsedTime} min{minimumTime - elapsedTime !== 1 ? "s" : ""} before confirming
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveTask(task.id)}
                          style={{
                            flex: 1,
                            borderRadius: "8px",
                            border: "1px solid #dc2626",
                            background: "#fee2e2",
                            color: "#991b1b",
                            padding: "10px 8px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmTask(task)}
                          disabled={!canConfirm}
                          style={{
                            flex: 1,
                            borderRadius: "8px",
                            border: "none",
                            background: canConfirm ? "#16a34a" : "#d1d5db",
                            color: canConfirm ? "white" : "#6b7280",
                            padding: "10px 8px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: canConfirm ? "pointer" : "not-allowed",
                          }}
                        >
                          {task.status === "completed" ? "✓ Done" : "Confirm"}
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {openStatsModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            backgroundColor: "rgba(0, 0, 0, 0.75)",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "900px",
              background: "white",
              border: "4px solid #d4c0b7",
              backgroundColor: "#e7d5cd",
              borderRadius: "24px",
              padding: "24px",
              boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
              minHeight: "320px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center", marginBottom: "24px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "28px", fontWeight: 700 }}>
                  Game Stats
                </h2>
                <p style={{ marginTop: "8px", color: "#475569" }}>
                  Track Strength, Endurance, and Discipline.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenStatsModal(false)}
                style={{
                  borderRadius: "999px",
                  background: "#e2e8f0",
                  padding: "10px 16px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#0f172a",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              {[
                { label: "Strength", value: gameStats.strength, description: "Heavy lifting power and resistance." },
                { label: "Endurance", value: gameStats.endurance, description: "Sustainability for longer sessions." },
                { label: "Discipline", value: gameStats.discipline, description: "Workout consistency and streak performance." },
              ].map((stat) => (
                <div key={stat.label} style={{ borderRadius: "20px", border: "1px solid #a39893", background: "#b4a8a3", padding: "20px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>{stat.label}</div>
                  <div style={{ fontSize: "36px", fontWeight: 700, color: "#0f172a" }}>{stat.value}</div>
                  <div style={{ height: "10px", width: "100%", background: "#e2e8f0", borderRadius: "999px", margin: "16px 0" }}>
                    <div style={{ width: `${Math.min(stat.value, 100)}%`, height: "100%", background: "#0f172a", borderRadius: "999px" }} />
                  </div>
                  <p style={{ margin: 0, color: "#475569", fontSize: "14px" }}>{stat.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Body Progression Modal */}
      {openBodyProgressionModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            backgroundColor: "rgba(0, 0, 0, 0.75)",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "1000px",
              background: "white",
              border: "4px solid #d4c0b7",
              backgroundColor: "#e7d5cd",
              borderRadius: "24px",
              padding: "24px",
              boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
              minHeight: "360px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center", marginBottom: "24px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "28px", fontWeight: 700 }}>
                  Body Progression
                </h2>
                <p style={{ marginTop: "8px", color: "#475569" }}>
                  See how workouts grow your muscle groups.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenBodyProgressionModal(false)}
                style={{
                  borderRadius: "999px",
                  background: "#e2e8f0",
                  padding: "10px 16px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#0f172a",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              {Object.entries(bodyProgression).map(([attribute, value]) => (
                <div key={attribute} style={{ borderRadius: "20px", border: "1px solid #a39893", background: "#f8f1e7", padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>{attribute}</span>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>{Math.round(value)}</span>
                  </div>
                  <div style={{ height: "10px", width: "100%", background: "#e2e8f0", borderRadius: "999px" }}>
                    <div style={{ width: `${Math.min(value, 100)}%`, height: "100%", background: "#0f172a", borderRadius: "999px" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-black/20 z-0" />

    </div>
  );
}
