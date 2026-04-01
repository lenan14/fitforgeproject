import { NextRequest, NextResponse } from "next/server";
import type { WorkoutExercise, MuscleGroup, Level } from "@/lib/firestore";

const THRESHOLDS: Record<MuscleGroup, { intermediate: number; advanced: number }> = {
  chest:     { intermediate: 10000, advanced: 50000 },
  back:      { intermediate: 12000, advanced: 60000 },
  shoulders: { intermediate: 8000,  advanced: 40000 },
  biceps:    { intermediate: 6000,  advanced: 30000 },
  triceps:   { intermediate: 6000,  advanced: 30000 },
  legs:      { intermediate: 20000, advanced: 100000 },
  core:      { intermediate: 5000,  advanced: 25000 },
};

/**
 * Calculates the total volume for a single exercise entry.
 * Volume = sets × reps × weight(lbs)
 */
function calcVolume(exercise: WorkoutExercise): number {
  return exercise.sets * exercise.reps * exercise.weight;
}

/**
 * Determines the level for a muscle group based on cumulative volume.
 */
function calcLevel(muscleGroup: MuscleGroup, totalVolume: number): Level {
  const { intermediate, advanced } = THRESHOLDS[muscleGroup];
  if (totalVolume >= advanced) return "advanced";
  if (totalVolume >= intermediate) return "intermediate";
  return "beginner";
}

// ─────────────────────────────────────────────
// POST /api/levels
//
// Body: {
//   exercises: WorkoutExercise[],         ← from the current workout
//   existingVolume: Record<MuscleGroup, number>  ← from Firestore
// }
//
// Returns: {
//   updatedVolume: Record<MuscleGroup, number>,
//   levels: Record<MuscleGroup, Level>
// }
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const exercises: WorkoutExercise[] = body.exercises ?? [];
    const existingVolume: Partial<Record<MuscleGroup, number>> = body.existingVolume ?? {};

    // Start with existing volume totals
    const updatedVolume: Record<MuscleGroup, number> = {
      chest:     existingVolume.chest     ?? 0,
      back:      existingVolume.back      ?? 0,
      shoulders: existingVolume.shoulders ?? 0,
      biceps:    existingVolume.biceps    ?? 0,
      triceps:   existingVolume.triceps   ?? 0,
      legs:      existingVolume.legs      ?? 0,
      core:      existingVolume.core      ?? 0,
    };

    // Add volume from this workout session
    for (const exercise of exercises) {
      const volume = calcVolume(exercise);
      updatedVolume[exercise.muscleGroup] += volume;
    }

    // Calculate levels based on updated totals
    const levels = {} as Record<MuscleGroup, Level>;
    for (const muscle of Object.keys(updatedVolume) as MuscleGroup[]) {
      levels[muscle] = calcLevel(muscle, updatedVolume[muscle]);
    }

    return NextResponse.json({ updatedVolume, levels });
  } catch (err) {
    console.error("Level calculation error:", err);
    return NextResponse.json({ error: "Failed to calculate levels" }, { status: 500 });
  }
}