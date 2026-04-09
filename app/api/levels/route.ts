import { NextRequest, NextResponse } from "next/server";
import {
  calcXP,
  calcTier,
  calcTierXP,
  calcMuscleLevel,
  TIER_THRESHOLDS,
  TIER_NAMES,
} from "@/lib/firestore";
import type { WorkoutExercise, Tier, BodyAttribute } from "@/lib/firestore";


const WORKOUT_STAT_IMPACT: Record<string, { strength: number; endurance: number; muscles: BodyAttribute[] }> = {
  "Push-Ups":              { strength: 1.8, endurance: 1.3, muscles: ["Chest", "Shoulders", "Arms"] },
  "Diamond Push-Ups":      { strength: 2.0, endurance: 1.2, muscles: ["Chest", "Arms"] },
  "Pike Push-Ups":         { strength: 1.6, endurance: 1.2, muscles: ["Shoulders", "Core"] },
  "Plank Shoulder Taps":   { strength: 1.0, endurance: 1.7, muscles: ["Shoulders", "Core", "Abs"] },
  "Pull-Ups":              { strength: 2.2, endurance: 1.0, muscles: ["Back", "Arms"] },
  "Bench Press":           { strength: 2.5, endurance: 0.9, muscles: ["Chest", "Shoulders", "Arms"] },
  "One-Arm Dumbbell Row":  { strength: 2.3, endurance: 0.8, muscles: ["Back", "Arms"] },
  "Shoulder Press":        { strength: 2.4, endurance: 0.8, muscles: ["Shoulders", "Arms"] },
  "Bicep Curls":           { strength: 2.0, endurance: 0.7, muscles: ["Arms"] },
  "Tricep Dips":           { strength: 2.0, endurance: 0.8, muscles: ["Arms"] },
  "Squats":                { strength: 2.3, endurance: 1.0, muscles: ["Quads", "Glutes"] },
  "Lunges":                { strength: 2.1, endurance: 1.1, muscles: ["Quads", "Glutes"] },
  "Jump Squats":           { strength: 2.2, endurance: 1.2, muscles: ["Quads", "Glutes"] },
  "Wall Sit":              { strength: 1.0, endurance: 1.8, muscles: ["Quads", "Glutes"] },
  "Calf Raises":           { strength: 1.7, endurance: 1.0, muscles: ["Calves"] },
  "Barbell Squat":         { strength: 2.6, endurance: 0.9, muscles: ["Quads", "Glutes", "Core"] },
  "Deadlift":              { strength: 2.8, endurance: 0.9, muscles: ["Glutes", "Hamstrings", "Back"] },
  "Leg Press":             { strength: 2.4, endurance: 0.9, muscles: ["Quads", "Glutes"] },
  "Romanian Deadlift":     { strength: 2.5, endurance: 0.9, muscles: ["Hamstrings", "Glutes"] },
  "Weighted Lunges":       { strength: 2.3, endurance: 1.0, muscles: ["Quads", "Glutes"] },
};


// POST /api/levels
//
// Body: {
//   exercises: WorkoutExercise[],
//   streak: number,
//   currentTotalXP: number,
//   currentBodyProgression: Partial<Record<BodyAttribute, number>>
// }
//
// Returns: {
//   sessionXP: number,
//   totalXP: number,
//   tier: Tier,
//   tierXP: number,
//   tierCap: number,
//   tierName: string,
//   tieredUp: boolean,
//   bodyProgression: Partial<Record<BodyAttribute, number>>,
//   muscleLevels: Partial<Record<BodyAttribute, Level>>
// }


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const exercises: WorkoutExercise[] = body.exercises ?? [];
    const streak: number = body.streak ?? 0;
    const currentTotalXP: number = body.currentTotalXP ?? 0;
    const currentBodyProgression: Partial<Record<BodyAttribute, number>> = body.currentBodyProgression ?? {};

    // Calculate total XP earned this session
    let sessionXP = 0;
    for (const exercise of exercises) {
      sessionXP += calcXP(
        exercise.exercise,
        exercise.sets,
        exercise.reps,
        exercise.weight,
        streak
      );
    }

    // Calculate new tier
    const previousTier = calcTier(currentTotalXP);
    const newTotalXP = currentTotalXP + sessionXP;
    const newTier = calcTier(newTotalXP);
    const newTierXP = calcTierXP(newTotalXP);
    const newTierCap = TIER_THRESHOLDS[newTier];
    const tieredUp = newTier > previousTier;

    // Update body progression
    const updatedBodyProgression: Partial<Record<BodyAttribute, number>> = { ...currentBodyProgression };
    for (const exercise of exercises) {
      const impact = WORKOUT_STAT_IMPACT[exercise.exercise];
      if (!impact) continue;
      const effort = Math.sqrt(exercise.sets * exercise.reps);
      impact.muscles.forEach((muscle) => {
        const current = updatedBodyProgression[muscle] ?? 10;
        updatedBodyProgression[muscle] = Math.min(
          100,
          current + (impact.strength + impact.endurance) * effort * 0.15
        );
      });
    }

    // Calculate muscle levels
    const muscleLevels: Partial<Record<BodyAttribute, ReturnType<typeof calcMuscleLevel>>> = {};
    for (const [muscle, value] of Object.entries(updatedBodyProgression) as [BodyAttribute, number][]) {
      muscleLevels[muscle] = calcMuscleLevel(value);
    }

    return NextResponse.json({
      sessionXP,
      totalXP: newTotalXP,
      tier: newTier as Tier,
      tierXP: newTierXP,
      tierCap: newTierCap,
      tierName: TIER_NAMES[newTier as Tier],
      tieredUp,
      bodyProgression: updatedBodyProgression,
      muscleLevels,
    });
  } catch (err) {
    console.error("Level calculation error:", err);
    return NextResponse.json({ error: "Failed to calculate levels" }, { status: 500 });
  }
}