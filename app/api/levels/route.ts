import { NextRequest, NextResponse } from "next/server";
import { calcXP, calcMuscleLevel, calcTierProgression, TIER_NAMES } from "@/lib/firestore";
import type { WorkoutExercise, MuscleGroup, Tier } from "@/lib/firestore";

// POST /api/levels
//
// Body: {
//   exercises: WorkoutExercise[],
//   currentTier: Tier,
//   currentTierXP: number,
//   existingMuscleXP: Partial<Record<MuscleGroup, number>>
// }
//
// Returns: {
//   sessionXP: number,
//   tier: Tier,
//   tierXP: number,
//   tierCap: number,
//   tierName: string,
//   tieredUp: boolean,
//   muscleXP: Partial<Record<MuscleGroup, number>>,
//   muscleLevels: Partial<Record<MuscleGroup, Level>>
// }


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const exercises: WorkoutExercise[] = body.exercises ?? [];
    const currentTier: Tier = body.currentTier ?? 1;
    const currentTierXP: number = body.currentTierXP ?? 0;
    const existingMuscleXP: Partial<Record<MuscleGroup, number>> = body.existingMuscleXP ?? {};

    // Calculate XP gained per muscle group this session
    const sessionMuscleXP: Partial<Record<MuscleGroup, number>> = {};
    let sessionXP = 0;

    for (const exercise of exercises) {
      const xp = calcXP(exercise.sets, exercise.reps, exercise.weight);
      sessionMuscleXP[exercise.muscleGroup] =
        (sessionMuscleXP[exercise.muscleGroup] ?? 0) + xp;
      sessionXP += xp;
    }

    // Calculate new tier progression
    const { tier, tierXP, tierCap } = calcTierProgression(
      currentTier,
      currentTierXP,
      sessionXP
    );

    const tieredUp = tier > currentTier;
    const tierName = TIER_NAMES[tier];

    // Update per-muscle XP and levels
    const updatedMuscleXP: Partial<Record<MuscleGroup, number>> = { ...existingMuscleXP };
    for (const [muscle, xp] of Object.entries(sessionMuscleXP) as [MuscleGroup, number][]) {
      updatedMuscleXP[muscle] = (updatedMuscleXP[muscle] ?? 0) + xp;
    }

    const muscleLevels: Partial<Record<MuscleGroup, ReturnType<typeof calcMuscleLevel>>> = {};
    for (const [muscle, xp] of Object.entries(updatedMuscleXP) as [MuscleGroup, number][]) {
      muscleLevels[muscle] = calcMuscleLevel(xp);
    }

    return NextResponse.json({
      sessionXP,
      tier,
      tierXP,
      tierCap,
      tierName,
      tieredUp,
      muscleXP: updatedMuscleXP,
      muscleLevels,
    });
  } catch (err) {
    console.error("Level calculation error:", err);
    return NextResponse.json({ error: "Failed to calculate levels" }, { status: 500 });
  }
}