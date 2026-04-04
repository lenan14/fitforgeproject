'use client';
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function MainPage() {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<"workouts" | "avatar" |null>(null);

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


  // [handleTasksPopUp]
  const handleTasksPopUp = async () => {
    /*
      Purpose: Displays all logged workout tasks (pending or completed)

      - Each Tasks should include:
        - Workout Name
        - Type (Upper Body / Lower Body)
        - Sets, Reps, Weight
        - Timestampt (when it was created)
        - Status:
          - Pending
          - Completed
        
      - Notes:
        - Tasks acts as a "Log System" for workouts
        - A Validation System should:
          - Checks if the completion time is realistic
          - Prevents impossible activity (e.g., 100 push-ups in 10 seconds)
          - Prevent overlapping tasks in unrealistic timeframes
        
      - Example Constraints:
        - Minimum time per rep (e.g., 1-2 seconds)
        - Rest time between sets
        - Cannot complete multiple intense tasks simultaneously
    */
  }

    // [handleUpperPopUp]
  const handleUpperPopUp = async () => {
    /* 
      Purpose: Opens a Form/Modal for Loggin an upper Body Workout
      UI should include:
        - Section Title: "Upper Body"
        - Workout type Selection:
          - No Equipment
          - With Equipment
      
      - Workout Selection (based on Type):
        - No Equipment Options:
          1. Push-Ups (chest+, shoulders+, triceps+) (XP based on reps)
          2. Diamond Push-Ups (triceps+, chest+) (higher XP)
          3. Pike Push-Ups (shoulders+) (moderate XP)
          4. Plank Shoulder Taps (core+, shoulders+) (time-based XP)
          5. Pull-Ups (back+, biceps+) (high XP)
        - With Equipment Options:
          1. Bench Press (chest+, triceps+, shoulders+) (XP based on weight × reps)
          2. One-Arm Dumbbell Row (back+, biceps+) (XP based on weight × reps)
          3. Shoulder Press (shoulders+, triceps+) (XP based on weight × reps)
          4. Bicep Curls (biceps+) (XP based on weight × reps)
          5. Tricep Dips (triceps+) (bodyweight or weighted)

      - Inputs:
        - Sets (required)
        - Reps (required)
        - Weight (ONLY if the Equipment is selected)

      - Buttons:
        - [Back]    → returns to [Workouts] Menu
        - [Confirm] → sends Workout Data to [Tasks]

      - Notes:
        - XP is calculated after confirmation using the EXP Formula
        - Constributes to both Game Stats and Body Progression Stats
    */
  }

    // [handleLowerPopUp]
  const handleLowerPopUp = async () => {
    /*
      Purpose: Opens a Form/Modal for Loggin an upper Body Workout

      - UI should include:
        - Section Title: "Lower Body"
        - Workout type Selection:
          - No Equipment
          - With Equipment
      
      - Workout Selection (based on Type):
        - No Equipment Options:
            1. Squats (quads+, glutes+) (XP based on reps)
            2. Lunges (quads+, glutes+, balance+) (moderate XP)
            3. Jump Squats (explosiveness+, legs+) (higher XP)
            4. Wall Sit (endurance+, quads+) (time-based XP)
            5. Calf Raises (calves+) (XP based on reps)
        - With Equipment Options:
            1. Barbell Squat (quads+, glutes+, core+) (XP based on weight × reps)
            2. Deadlift (glutes+, hamstrings+, back+) (high XP)
            3. Leg Press (quads+, glutes+) (XP based on weight × reps)
            4. Romanian Deadlift (hamstrings+, glutes+) (moderate-high XP)
            5. Weighted Lunges (quads+, glutes+) (XP based on weight × reps)

      - Inputs:
        - Sets (required)
        - Reps (required)
        - Weight (ONLY if the Equipment is selected)

      - Buttons:
        - [Back]    → returns to [Workouts] Menu
        - [Confirm] → sends Workout Data to [Tasks]

      - Notes:
        - XP is calculated after confirmation using the EXP Formula
        - Constributes to both Game Stats and Body Progression Stats
    */
  }

  // [handleStatsPopUp]
  const handleStatsPopUp = async () => {
    /*
      Purpose: Displays the User's Game Stats.

      = Stats:
        - Strength: Increased by high-weight and resistance workouts.
        - Endurance: Increased by high-rep, bodyweight, or time-based workouts.
        - Dicipline: Based on workout consistency (streak system)
          - Higher Streak = Bonus EXP Multiplier

      - Ui should show:
        - Each stats with a value (e.g., Strength: 25)
        - Progress Bars for each Stat
      
      - Notes:
        - Stats influences XP gain (Dicipline Multiplier) and Performance Scaling.
        - These are "game mechanics", NOT visual body attributes.
    */
  }

  // [handleBodyProgressionPopUp]
  const handleBodyProgression = async () => {
    /* 
      Purpose: Displays BODY ATTRIBUTES progression.
      
      - These stats represent actual muscle development:
        - Upper Body:
          - Chest
          - Shoulders
          - Arms (Biceps / Triceps)
          - Back
        - Lower Body:
          - Quads
          - Hamstrings
          - Glutes
          - Calves
        - Core:
          - Abs
        
        - UI should show:
          - Attribute levels (e.g., Chest: 12+)
          - A Visual Indicator (bars or avatar highlights)
        
        - Notes:
          - These stats are increased directly by workouts
          - Used to determine the User's Muscle Growth
          - Just shows the parts of the User's Body affected from the workouts

        - IMPORTANT:
          - This is DIFFERENT from Game Stats
    */
  }

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/login");
    });
  }, [router]);

  const toggle = (menu: "workouts" | "avatar") => {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };


  return (
    <div className="relative min-h-screen w-full overflow-hidden">

      {/* Background */}
      <img
        src="/background.svg"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dropdown menus + logout */}
      <div className="absolute top-6 left-6 z-20 flex gap-4 items-center">

        {/* Avatar */}
        <div className="relative">
          <button
            onClick={() => toggle("avatar")}
            className="flex items-center gap-2 rounded-lg bg-white/90 px-5 py-2 font-semibold text-black shadow-md hover:bg-white"
          >
            Profile/Avatar
            <span className="text-xs">{openMenu === "avatar" ? "▲" : "▼"}</span>
          </button>
          {openMenu === "avatar" && (
            <div className="absolute left-0 mt-2 w-52 rounded-lg bg-white shadow-lg">
              <button 
                onClick={handleStatsPopUp} 
                className="flex items-center gap-2 rounded-lg bg-white/90 px-5 py-2 font-semibold text-black shadow-md hover:bg-white"
                >
                Stats
              </button>
              
              <button 
                onClick={handleTasksPopUp} 
                className="flex items-center gap-2 rounded-lg bg-white/90 px-5 py-2 font-semibold text-black shadow-md hover:bg-white"
                >
                Tasks
              </button>

              <button 
                onClick={handleBodyProgression} 
                className="flex items-center gap-2 rounded-lg bg-white/90 px-5 py-2 font-semibold text-black shadow-md hover:bg-white"
                >
                Body Progression
              </button>

              {/* Logout */}
              <button
                onClick={handleSignOut}
                className="rounded-lg bg-rose-500 px-5 py-2 font-semibold text-white shadow-md hover:bg-rose-600"
              >
                Log out
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
                onClick={handleUpperPopUp} 
                className="flex items-center gap-2 rounded-lg bg-white/90 px-5 py-2 font-semibold text-black shadow-md hover:bg-white"
                >
                Upper Body
              </button>

              <button 
                onClick={handleLowerPopUp} 
                className="flex items-center gap-2 rounded-lg bg-white/90 px-5 py-2 font-semibold text-black shadow-md hover:bg-white"
                >
                Lower Body
              </button>
            </div>
          )}
        </div>

        {/* Tier Level */}
        {/* FIXME */}
        <div style={{width: 300}}>
          <p> Tier Level: 1 (0 / 1,000) </p>
        </div>

      </div>

      {/* Center avatar */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
        {/* IMPORTANT: Avatar changes based on the User's Tier */}
        <img
          src="/AvatarT1.png" //  --> Tier 1 
          // src="/AvatarT2.png"  --> Tier 2
          // src="/AvatarT3.png"  --> Tier 3
          // src="/AvatarT4.png"  --> Tier 4
          // src="/AvatarT5.png"  --> Tier 5
          alt="User avatar"
          className="w-[300px] scale-[3] max-w-none rounded-full object-cover translate-y-80"
        />
      </div>

      {/* Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-black/20" />

    </div>
  );
}
