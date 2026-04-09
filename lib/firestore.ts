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
  
  export type BodyAttribute =
    | "Chest"
    | "Shoulders"
    | "Arms"
    | "Back"
    | "Quads"
    | "Hamstrings"
    | "Glutes"
    | "Calves"
    | "Core"
    | "Abs";
  
  export type Level = "beginner" | "intermediate" | "advanced";
  
  export type Tier = 1 | 2 | 3 | 4 | 5;
  
  export interface WorkoutExercise {
    exercise: string;                         // e.g. "Bench Press"
    category: "upper" | "lower";
    equipmentType: "noEquipment" | "equipment";
    sets: number;
    reps: number;
    weight: number | "Bodyweight";            // lbs or "Bodyweight"
  }
  
  export interface Workout {
    id?: string;
    date: string;                             // ISO string e.g. "2025-03-30"
    exercises: WorkoutExercise[];
    streakAtTime: number;                     // streak when workout was logged
    xpEarned: number;                         // total XP earned from this workout
    createdAt?: unknown;
  }
  
  export interface Goal {
    id?: string;
    text: string;
    createdAt?: unknown;
  }
  
  export interface BodyAttributeProgress {
    value: number;                            // 0–100
    lastUpdated?: unknown;
  }
  
  export interface UserProfile {
    name: string;
    email: string;
    totalXP: number;                          // cumulative, never resets
    tier: Tier;                               // 1 to 5
    tierXP: number;                           // XP within current tier
    tierCap: number;                          // XP cap for current tier
    streak: number;                           // current streak in days
    lastCompletionDate: string | null;        // ISO string of last workout completion
    createdAt?: unknown;
  }
  
  export const TIER_THRESHOLDS: Record<Tier, number> = {
    1: 1000,
    2: 3000,
    3: 7500,
    4: 15000,
    5: 30000,
  };
  
  export const TIER_NAMES: Record<Tier, string> = {
    1: "Base Form",
    2: "Active Form",
    3: "Advanced Form",
    4: "Athletic Form",
    5: "Bodybuilder Form",
  };
  
  export const WORKOUT_XP_CONFIG: Record<string, { baseMultiplier: number; weightMultiplier?: number }> = {
    "Push-Ups":              { baseMultiplier: 2 },
    "Diamond Push-Ups":      { baseMultiplier: 2.2 },
    "Pike Push-Ups":         { baseMultiplier: 2 },
    "Plank Shoulder Taps":   { baseMultiplier: 1.8 },
    "Pull-Ups":              { baseMultiplier: 2.5 },
    "Bench Press":           { baseMultiplier: 1, weightMultiplier: 0.05 },
    "One-Arm Dumbbell Row":  { baseMultiplier: 1, weightMultiplier: 0.05 },
    "Shoulder Press":        { baseMultiplier: 1, weightMultiplier: 0.05 },
    "Bicep Curls":           { baseMultiplier: 1, weightMultiplier: 0.05 },
    "Tricep Dips":           { baseMultiplier: 1.2, weightMultiplier: 0.03 },
    "Squats":                { baseMultiplier: 2 },
    "Lunges":                { baseMultiplier: 2 },
    "Jump Squats":           { baseMultiplier: 2.4 },
    "Wall Sit":              { baseMultiplier: 1.5 },
    "Calf Raises":           { baseMultiplier: 1.6 },
    "Barbell Squat":         { baseMultiplier: 1, weightMultiplier: 0.05 },
    "Deadlift":              { baseMultiplier: 1, weightMultiplier: 0.06 },
    "Leg Press":             { baseMultiplier: 1, weightMultiplier: 0.05 },
    "Romanian Deadlift":     { baseMultiplier: 1, weightMultiplier: 0.05 },
    "Weighted Lunges":       { baseMultiplier: 1, weightMultiplier: 0.05 },
  };
  
  /**
   * Calculates XP for a single exercise, matching the frontend formula.
   * Includes streak bonus (capped at 25%).
   */
  export function calcXP(
    exercise: string,
    sets: number,
    reps: number,
    weight: number | "Bodyweight",
    streak: number
  ): number {
    const config = WORKOUT_XP_CONFIG[exercise] ?? { baseMultiplier: 2 };
    const weightValue = typeof weight === "number" ? weight : 1;
    const streakBonus = Math.min(streak * 0.05, 0.25);
  
    const baseXP = config.weightMultiplier
      ? sets * reps * weightValue * config.weightMultiplier
      : sets * reps * config.baseMultiplier;
  
    return Math.round(baseXP * (1 + streakBonus));
  }
  
  /**
   * Determines tier from total cumulative XP.
   * Matches the getTierFromXP function in the frontend.
   */
  export function calcTier(totalXP: number): Tier {
    if (totalXP >= 15000) return 5;
    if (totalXP >= 7500)  return 4;
    if (totalXP >= 3000)  return 3;
    if (totalXP >= 1000)  return 2;
    return 1;
  }
  
  /**
   * Calculates tierXP (XP within the current tier) from total XP.
   */
  export function calcTierXP(totalXP: number): number {
    const tier = calcTier(totalXP);
    const thresholds = [0, 1000, 3000, 7500, 15000, 30000];
    return totalXP - thresholds[tier - 1];
  }
  
  /**
   * Calculates the muscle level based on body attribute progress value (0–100).
   */
  export function calcMuscleLevel(value: number): Level {
    if (value >= 70) return "advanced";
    if (value >= 40) return "intermediate";
    return "beginner";
  }
  
  /**
   * Creates or updates a user profile in Firestore.
   * Called after Google sign-in. merge:true prevents overwriting existing data.
   */
  export async function saveUserProfile(
    userId: string,
    profile: Pick<UserProfile, "name" | "email">
  ): Promise<void> {
    const ref = doc(db, "users", userId);
    await setDoc(
      ref,
      {
        ...profile,
        totalXP: 0,
        tier: 1,
        tierXP: 0,
        tierCap: TIER_THRESHOLDS[1],
        streak: 0,
        lastCompletionDate: null,
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
   * Saves a completed workout to Firestore.
   * Updates totalXP, tier, tierXP, tierCap, streak, and lastCompletionDate.
   * Returns the new document ID.
   */
  export async function saveWorkout(
    userId: string,
    workout: Omit<Workout, "id" | "createdAt">
  ): Promise<string> {
    // Save workout document
    const workoutsRef = collection(db, "users", userId, "workouts");
    const docRef = await addDoc(workoutsRef, {
      ...workout,
      createdAt: serverTimestamp(),
    });
    // Update user XP, tier, streak
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data() as UserProfile;
  
    const newTotalXP = (userData.totalXP ?? 0) + workout.xpEarned;
    const newTier = calcTier(newTotalXP);
    const newTierXP = calcTierXP(newTotalXP);
    const newTierCap = TIER_THRESHOLDS[newTier];
  
    await setDoc(
      userRef,
      {
        totalXP: increment(workout.xpEarned),
        tier: newTier,
        tierXP: newTierXP,
        tierCap: newTierCap,
        streak: workout.streakAtTime,
        lastCompletionDate: workout.date,
      },
      { merge: true }
    );
  
    return docRef.id;
  }
  
  /**
   * Fetches all workouts for a user, ordered by most recent first.
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
   * Fetches all goals for a user, ordered by most recent first.
   */
  export async function getGoals(userId: string): Promise<Goal[]> {
    const ref = collection(db, "users", userId, "goals");
    const q = query(ref, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Goal));
  }
  
  /**
   * Saves updated body attribute progression to Firestore.
   * Called after a workout is confirmed.
   * Each attribute is a value from 0–100.
   */
  export async function saveBodyProgression(
    userId: string,
    progression: Partial<Record<BodyAttribute, number>>
  ): Promise<void> {
    for (const [attribute, value] of Object.entries(progression) as [BodyAttribute, number][]) {
      const ref = doc(db, "users", userId, "bodyProgression", attribute);
      await setDoc(
        ref,
        { value, level: calcMuscleLevel(value), lastUpdated: serverTimestamp() },
        { merge: true }
      );
    }
  }
  
  /**
   * Fetches body attribute progression for a user.
   * Used by the frontend to display the Body Progression modal.
   */
  export async function getBodyProgression(
    userId: string
  ): Promise<Partial<Record<BodyAttribute, number>>> {
    const ref = collection(db, "users", userId, "bodyProgression");
    const snap = await getDocs(ref);
    const result: Partial<Record<BodyAttribute, number>> = {};
    snap.docs.forEach((d) => {
      result[d.id as BodyAttribute] = (d.data() as BodyAttributeProgress).value;
    });
    return result;
  }