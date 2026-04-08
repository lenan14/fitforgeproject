import {
    doc,
    setDoc,
    addDoc,
    getDoc,
    getDocs,
    collection,
    serverTimestamp,
    query,
    orderBy,
    increment,
  } from "firebase/firestore";
  import { db } from "@/lib/firebase";
  
  export type MuscleGroup =
    | "chest"
    | "back"
    | "shoulders"
    | "biceps"
    | "triceps"
    | "legs"
    | "core";
  
  export type Level = "beginner" | "intermediate" | "advanced";
  
  export type Tier = 1 | 2 | 3 | 4 | 5;
  
  export interface WorkoutExercise {
    exercise: string;       // e.g. "Bench Press"
    muscleGroup: MuscleGroup;
    sets: number;
    reps: number;
    weight: number;         // in lbs
  }
  
  export interface Workout {
    id?: string;
    date: string;           // ex. "2025-03-30"
    exercises: WorkoutExercise[];
    createdAt?: unknown;
  }
  
  export interface Goal {
    id?: string;
    text: string;
    createdAt?: unknown;
  }
  
  export interface MuscleProgress {
    xp: number;
    level: Level;
    lastUpdated?: unknown;
  }
  
  export interface UserProfile {
    name: string;
    email: string;
    totalXP: number;        // cumulative, never resets
    tier: Tier;             // 1 to 5
    tierXP: number;         // XP within current tier, resets on tier up
    tierCap: number;        // XP needed to reach next tier
    createdAt?: unknown;
  }

  //Tier XP caps for each tier level
  export const TIER_CAPS: Record<Tier, number> = {
    1: 200,
    2: 400,
    3: 700,
    4: 1100,
    5: 1600,
  };
  
  //Tier names for display purposes
  export const TIER_NAMES: Record<Tier, string> = {
    1: "Base Form",
    2: "Active",
    3: "Advanced",
    4: "Athletic",
    5: "Bodybuilder",
  };
  
  const XP_DIVISOR = 1000; // Scales down the raw volume to make XP realistic
  
  // Per muscle group thresholds
  const MUSCLE_THRESHOLDS = {
    intermediate: 100,
    advanced: 500,
  };
  
  export function calcXP(sets: number, reps: number, weight: number): number {
    return (sets * reps * weight) / XP_DIVISOR;
  }
  
  export function calcMuscleLevel(xp: number): Level {
    if (xp >= MUSCLE_THRESHOLDS.advanced) return "advanced";
    if (xp >= MUSCLE_THRESHOLDS.intermediate) return "intermediate";
    return "beginner";
  }
  
  /**
   * Given current tier, tierXP, and new XP gained,
   * returns the updated tier, tierXP, and tierCap.
   * Handles tier-ups automatically.
   */
  export function calcTierProgression(currentTier: Tier, currentTierXP: number, xpGained: number): { tier: Tier; tierXP: number; tierCap: number } {
    let tier = currentTier;
    let tierXP = currentTierXP + xpGained;
  
    // Keep checking if tierXP exceeds cap for current tier, and if so, tier up
    while (tier < 5 && tierXP >= TIER_CAPS[tier]) {
      tierXP -= TIER_CAPS[tier];
      tier = (tier + 1) as Tier;
    }
  
    // Cap at tier 5
    if (tier === 5 && tierXP > TIER_CAPS[5]) {
      tierXP = TIER_CAPS[5];
    }
  
    return { tier, tierXP, tierCap: TIER_CAPS[tier] };
  }
  
  /**
   * Creates or updates a user profile in Firestore.
   * Called after Google sign-in. merge:true prevents overwriting existing data.
   */
  export async function saveUserProfile(userId: string, profile: Pick<UserProfile, "name" | "email">): Promise<void> {
    const ref = doc(db, "users", userId);
    await setDoc(
      ref,
      {
        ...profile,
        totalXP: 0,
        tier: 1,
        tierXP: 0,
        tierCap: TIER_CAPS[1],
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
  
  /**
   * Fetches a user's profile from Firestore.
   */
  export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const ref = doc(db, "users", userId);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as UserProfile) : null;
  }
  
  
  /**
   * Saves a workout session to Firestore.
   * Automatically updates:
   *   - totalXP (cumulative, never resets)
   *   - tier, tierXP, tierCap (handles tier-ups)
   *   - per-muscle XP and level
   * Returns the new document ID.
   */
  export async function saveWorkout(userId: string,workout: Omit<Workout, "id" | "createdAt">): Promise<string> {
    // Save workout document
    const workoutsRef = collection(db, "users", userId, "workouts");
    const docRef = await addDoc(workoutsRef, {
      ...workout,
      createdAt: serverTimestamp(),
    });
  
    // Calculate XP per muscle group from this workout
    const muscleXP: Partial<Record<MuscleGroup, number>> = {};
    let totalSessionXP = 0;
  
    for (const exercise of workout.exercises) {
      const xp = calcXP(exercise.sets, exercise.reps, exercise.weight);
      muscleXP[exercise.muscleGroup] = (muscleXP[exercise.muscleGroup] ?? 0) + xp;
      totalSessionXP += xp;
    }
  
    // Fetch current user data for tier calculation
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data() as UserProfile;
  
    const { tier, tierXP, tierCap } = calcTierProgression(
      userData.tier ?? 1,
      userData.tierXP ?? 0,
      totalSessionXP
    );
  
    // Update user document
    await setDoc(
      userRef,
      {
        totalXP: increment(totalSessionXP),
        tier,
        tierXP,
        tierCap,
      },
      { merge: true }
    );
  
    // Update per-muscle XP and level
    for (const [muscle, xp] of Object.entries(muscleXP) as [MuscleGroup, number][]) {
      const muscleRef = doc(db, "users", userId, "muscleProgress", muscle);
      const muscleSnap = await getDoc(muscleRef);
      const currentMuscleXP = (muscleSnap.data()?.xp ?? 0) + xp;
      const newMuscleLevel = calcMuscleLevel(currentMuscleXP);
  
      await setDoc(
        muscleRef,
        {
          xp: increment(xp),
          level: newMuscleLevel,
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );
    }
  
    return docRef.id;
  }
  
  /**
   * Fetches all workouts for a user, ordered by date descending.
   */
  export async function getWorkouts(userId: string): Promise<Workout[]> {
    const ref = collection(db, "users", userId, "workouts");
    const q = query(ref, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Workout));
  }
  

  /**
   * Saves a goal to Firestore.
   * Returns the new document ID.
   */
  export async function saveGoal(userId: string, text: string): Promise<string> {
    const ref = collection(db, "users", userId, "goals");
    const docRef = await addDoc(ref, {
      text,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }
  
  /**
   * Fetches all goals for a user, ordered by date descending.
   */
  export async function getGoals(userId: string): Promise<Goal[]> {
    const ref = collection(db, "users", userId, "goals");
    const q = query(ref, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Goal));
  }
  
  
  /**
   * Fetches the XP and level for all muscle groups for a user.
   * Used by the frontend to color the avatar per muscle group.
   */
  export async function getMuscleProgress(
    userId: string
  ): Promise<Partial<Record<MuscleGroup, MuscleProgress>>> {
    const ref = collection(db, "users", userId, "muscleProgress");
    const snap = await getDocs(ref);
    const result: Partial<Record<MuscleGroup, MuscleProgress>> = {};
    snap.docs.forEach((d) => {
      result[d.id as MuscleGroup] = d.data() as MuscleProgress;
    });
    return result;
  }