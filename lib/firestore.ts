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
  
  export interface ExerciseSet {
    sets: number;
    reps: number;
    weight: number; // in lbs
  }
  
  export interface WorkoutExercise {
    exercise: string;       
    muscleGroup: MuscleGroup;
    sets: number;
    reps: number;
    weight: number;         // in lbs
  }
  
  export interface Workout {
    id?: string;
    date: string;           // example: "2025-03-30"
    exercises: WorkoutExercise[];
    createdAt?: unknown;
  }
  
  export interface Goal {
    id?: string;
    text: string;
    createdAt?: unknown;
  }
  
  export interface MuscleProgress {
    level: Level;
    totalVolume: number;    // sum of sets * reps * weight across all sessions
    lastUpdated?: unknown;
  }
  
  export interface UserProfile {
    name: string;
    email: string;
    bodyweight?: number;    // in lbs
    createdAt?: unknown;
  }
  
  //USER
  /**
   * Creates or updates a user profile in Firestore.
   * Called after Google sign-in. merge:true prevents overwriting existing data.
   */
  export async function saveUserProfile(userId: string, profile: Omit<UserProfile, "createdAt">): Promise<void> {
    const ref = doc(db, "users", userId);
    await setDoc(ref, { ...profile, createdAt: serverTimestamp() }, { merge: true });
  }
  
  /**
   * Fetches a user's profile from Firestore.
   */
  export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const ref = doc(db, "users", userId);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as UserProfile) : null;
  }
  
 
  //WORKOUTS  
  /**
   * Saves a workout session to Firestore.
   * Returns the new document ID.
   */
  export async function saveWorkout(userId: string, workout: Omit<Workout, "id" | "createdAt">): Promise<string> {
    const ref = collection(db, "users", userId, "workouts");
    const docRef = await addDoc(ref, {
      ...workout,
      createdAt: serverTimestamp(),
    });
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
  
  
  //GOALS
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
  

  //MUSCLE PROGRESS  
  /**
   * Fetches the progress for all muscle groups for a user.
   */
  export async function getMuscleProgress(userId: string): Promise<Record<MuscleGroup, MuscleProgress>> {
    const ref = collection(db, "users", userId, "muscleProgress");
    const snap = await getDocs(ref);
    const result = {} as Record<MuscleGroup, MuscleProgress>;
    snap.docs.forEach((d) => {
      result[d.id as MuscleGroup] = d.data() as MuscleProgress;
    });
    return result;
  }
  
  /**
   * Updates the progress for a single muscle group.
   * Called after the level calculation API returns a result.
   */
  export async function updateMuscleProgress(userId: string, muscleGroup: MuscleGroup, progress: Omit<MuscleProgress, "lastUpdated">): Promise<void> {
    const ref = doc(db, "users", userId, "muscleProgress", muscleGroup);
    await setDoc(ref, { ...progress, lastUpdated: serverTimestamp() }, { merge: true });
  }