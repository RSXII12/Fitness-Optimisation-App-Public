import { GOAL_MUSCLE_PRIORITIES, GOAL_REP_RANGES } from "./plannerConstants";

  export function matchesAvailableEquipment(exerciseEquipment, selectedEquipment) 
  {
      if (!selectedEquipment || selectedEquipment.length === 0) return true;
      if (!exerciseEquipment || exerciseEquipment.length === 0) return false;

      return exerciseEquipment.some((item) => selectedEquipment.includes(item));
  }

  export function classifyExercise(exercise) 
  {
      const muscles = (exercise.primaryMuscles || []).map((m) => m.toLowerCase());

      const hasAny = (targets) => targets.some((t) => muscles.includes(t));

      if (hasAny(["chest"])) return "chest";
      if (hasAny(["shoulders"])) return "shoulders";
      if (hasAny(["lats", "middle back", "traps"])) return "back";
      if (hasAny(["biceps", "triceps"])) return "arms";
      if (hasAny(["quadriceps"])) return "quads";
      if (hasAny(["hamstrings", "glutes", "adductors", "abductors"])) return "posterior";
      if (hasAny(["calves"])) return "calves";
      if (hasAny(["abdominals", "lower back"])) return "core";

      return "other";
  }

  export function buildSplit(daysAvailable, goal) 
  {
    const days = daysAvailable || 3;

    if (goal === "athletic_performance") {
      if (days <= 2) return ["full", "full"];
      if (days === 3) return ["lower", "upper", "full"];
      if (days === 4) return ["lower", "upper", "lower", "upper"];
      return ["lower", "upper", "lower", "upper", "full"];
    }

    if (goal === "fat_loss") {
      if (days <= 2) return ["full", "full"];
      if (days === 3) return ["full", "full", "full"];
      if (days === 4) return ["upper", "lower", "full", "full"];
      return ["full", "upper", "lower", "full", "full"];
    }

    if (goal === "maintenance") {
      if (days <= 2) return ["full", "full"];
      if (days === 3) return ["upper", "lower", "full"];
      if (days === 4) return ["upper", "lower", "upper", "lower"];
      return ["push", "pull", "lower", "upper", "lower"];
    }

    if (goal === "strength") {
      if (days <= 2) return ["full", "full"];
      if (days === 3) return ["push", "pull", "lower"];
      if (days === 4) return ["upper", "lower", "upper", "lower"];
      return ["push", "pull", "lower", "upper", "lower"];
    }

    if (goal === "hypertrophy") {
      if (days <= 2) return ["upper", "lower"];
      if (days === 3) return ["push", "pull", "lower"];
      if (days === 4) return ["upper", "lower", "upper", "lower"];
      return ["push", "pull", "lower", "upper", "lower"];
    }

    return ["full", "full", "full"];
  }

  export function scoreExerciseForGoal(exercise, goal) {
    const priorities =
      GOAL_MUSCLE_PRIORITIES[goal] || GOAL_MUSCLE_PRIORITIES.maintenance;

    const primaryMuscles = (exercise.primaryMuscles || []).map((m) =>
      m.toLowerCase()
    );

    let score = 0;

    for (const muscle of primaryMuscles) {
      score += priorities[muscle] || 0;
    }

    return score;
  }

  export function pickExercises(pool, count, usedIds = new Set()) {
    const chosen = [];

    for (const exercise of pool) {
      if (chosen.length >= count) break;
      if (usedIds.has(exercise.id)) continue;

      chosen.push(exercise);
      usedIds.add(exercise.id);
    }

    return chosen;
  }



  export function buildDraftPlan(candidates, planInput) {
    const split = buildSplit(planInput.daysAvailable, planInput.goal);

    const buckets = {
      chest: [],
      shoulders: [],
      back: [],
      arms: [],
      quads: [],
      posterior: [],
      calves: [],
      core: [],
      other: [],
    };

    for (const exercise of candidates) {
      const bucket = classifyExercise(exercise);
      buckets[bucket].push(exercise);
    }

    Object.keys(buckets).forEach((bucketName) => {
      buckets[bucketName].sort(
        (a, b) =>
          scoreExerciseForGoal(b, planInput.goal) -
          scoreExerciseForGoal(a, planInput.goal)
      );
    });

    const usedIds = new Set();

    const buildUpperDay = () => {
      let exercises = [
        ...pickExercises(buckets.chest, 1, usedIds),
        ...pickExercises(buckets.back, 1, usedIds),
        ...pickExercises(buckets.shoulders, 1, usedIds),
      ];

      if (planInput.goal === "hypertrophy") {
        exercises = [
          ...exercises,
          ...pickExercises(buckets.arms, 1, usedIds),
        ];
      } else {
        exercises = [
          ...exercises,
          ...pickExercises([...buckets.arms, ...buckets.core], 1, usedIds),
        ];
      }

      if (exercises.length < 4) {
        const fallbackPool = [
          ...buckets.chest,
          ...buckets.back,
          ...buckets.shoulders,
          ...buckets.arms,
          ...buckets.core,
          ...buckets.other,
        ].sort(
          (a, b) =>
            scoreExerciseForGoal(b, planInput.goal) -
            scoreExerciseForGoal(a, planInput.goal)
        );

        exercises = [
          ...exercises,
          ...pickExercises(fallbackPool, 4 - exercises.length, usedIds),
        ];
      }

      return exercises;
    };

    const buildLowerDay = () => {
      let exercises = [
        ...pickExercises(buckets.quads, 1, usedIds),
        ...pickExercises(buckets.posterior, 1, usedIds),
        ...pickExercises([...buckets.calves, ...buckets.posterior], 1, usedIds),
      ];

      if (planInput.goal === "athletic_performance") {
        exercises = [
          ...exercises,
          ...pickExercises(buckets.core, 1, usedIds),
        ];
      } else {
        exercises = [
          ...exercises,
          ...pickExercises([...buckets.core, ...buckets.calves], 1, usedIds),
        ];
      }

      if (exercises.length < 4) {
        const fallbackPool = [
          ...buckets.quads,
          ...buckets.posterior,
          ...buckets.calves,
          ...buckets.core,
          ...buckets.other,
        ].sort(
          (a, b) =>
            scoreExerciseForGoal(b, planInput.goal) -
            scoreExerciseForGoal(a, planInput.goal)
        );

        exercises = [
          ...exercises,
          ...pickExercises(fallbackPool, 4 - exercises.length, usedIds),
        ];
      }

      return exercises;
    };

    const buildPushDay = () => {
      let exercises = [
        ...pickExercises(buckets.chest, 1, usedIds),
        ...pickExercises(buckets.shoulders, 1, usedIds),
        ...pickExercises([...buckets.arms, ...buckets.chest], 1, usedIds),
        ...pickExercises(buckets.core, 1, usedIds),
      ];

      if (exercises.length < 4) {
        const fallbackPool = [
          ...buckets.chest,
          ...buckets.shoulders,
          ...buckets.arms,
          ...buckets.core,
          ...buckets.other,
        ].sort(
          (a, b) =>
            scoreExerciseForGoal(b, planInput.goal) -
            scoreExerciseForGoal(a, planInput.goal)
        );

        exercises = [
          ...exercises,
          ...pickExercises(fallbackPool, 4 - exercises.length, usedIds),
        ];
      }

      return exercises;
    };

    const buildPullDay = () => {
      let exercises = [
        ...pickExercises(buckets.back, 2, usedIds),
        ...pickExercises(buckets.arms, 1, usedIds),
        ...pickExercises(buckets.core, 1, usedIds),
      ];

      if (exercises.length < 4) {
        const fallbackPool = [
          ...buckets.back,
          ...buckets.arms,
          ...buckets.core,
          ...buckets.other,
        ].sort(
          (a, b) =>
            scoreExerciseForGoal(b, planInput.goal) -
            scoreExerciseForGoal(a, planInput.goal)
        );

        exercises = [
          ...exercises,
          ...pickExercises(fallbackPool, 4 - exercises.length, usedIds),
        ];
      }

      return exercises;
    };

    const buildFullDay = () => {
      let exercises = [
        ...pickExercises(buckets.quads, 1, usedIds),
        ...pickExercises(buckets.posterior, 1, usedIds),
        ...pickExercises(buckets.chest, 1, usedIds),
        ...pickExercises(buckets.back, 1, usedIds),
      ];

      if (planInput.goal === "hypertrophy") {
        exercises = [
          ...exercises,
          ...pickExercises([...buckets.shoulders, ...buckets.arms], 1, usedIds),
        ];
      } else {
        exercises = [
          ...exercises,
          ...pickExercises([...buckets.core, ...buckets.shoulders], 1, usedIds),
        ];
      }

      if (exercises.length < 5) {
        const fallbackPool = [
          ...buckets.chest,
          ...buckets.back,
          ...buckets.shoulders,
          ...buckets.arms,
          ...buckets.quads,
          ...buckets.posterior,
          ...buckets.core,
          ...buckets.other,
        ].sort(
          (a, b) =>
            scoreExerciseForGoal(b, planInput.goal) -
            scoreExerciseForGoal(a, planInput.goal)
        );

        exercises = [
          ...exercises,
          ...pickExercises(fallbackPool, 5 - exercises.length, usedIds),
        ];
      }

      return exercises;
    };

    const days = split.map((focus, index) => {
      let exercises = [];

      if (focus === "upper") exercises = buildUpperDay();
      else if (focus === "lower") exercises = buildLowerDay();
      else if (focus === "push") exercises = buildPushDay();
      else if (focus === "pull") exercises = buildPullDay();
      else if (focus === "full") exercises = buildFullDay();

      return {
        day: index + 1,
        focus,
        exercises: exercises.map((e) => ({
          id: e.id,
          name: e.name,
          primaryMuscles: e.primaryMuscles,
          equipment: e.equipment,
          score: scoreExerciseForGoal(e, planInput.goal),
        })),
      };
    });

    return {
      split,
      candidateCount: candidates.length,
      days,
    };
  }

  function getRecommendedRepRange(exerciseName, goal) {
    const name = exerciseName.toLowerCase();

    const isIsolation =
      name.includes("curl") ||
      name.includes("raise") ||
      name.includes("extension") ||
      name.includes("fly");

    const isBigCompound =
      name.includes("squat") ||
      name.includes("deadlift") ||
      name.includes("bench") ||
      name.includes("row") ||
      name.includes("press") ||
      name.includes("pull up") ||
      name.includes("pulldown");

    if (goal === "strength") {
      return isBigCompound ? [3, 6] : [6, 10];
    }

    if (goal === "hypertrophy") {
      return isIsolation ? [10, 15] : [6, 10];
    }

    if (goal === "athletic_performance") {
      return isBigCompound ? [3, 6] : [6, 10];
    }

    if (goal === "fat_loss") {
      return isIsolation ? [10, 15] : [8, 12];
    }

    if (goal === "maintenance") {
      return isIsolation ? [10, 15] : [6, 10];
    }

    return [6, 10];
  }

  function getProgressionIncrement(exerciseName) {
    const name = exerciseName.toLowerCase();

    const isBigCompound =
      name.includes("squat") ||
      name.includes("deadlift") ||
      name.includes("bench") ||
      name.includes("row") ||
      name.includes("press") ||
      name.includes("pull up") ||
      name.includes("pulldown");

    return isBigCompound ? 2.5 : 1.0;
  }

  function roundToNearest(value, step) {
    return Math.round(value / step) * step;
  }

  export function getRecommendedWeightFromSets(sets, goal, exerciseName) {
    if (!sets || sets.length === 0) return null;

    const [minReps, maxReps] = getRecommendedRepRange(exerciseName, goal);

    const sortedSets = [...sets].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    const relevantSet =
      sortedSets.find((set) => set.reps >= minReps && set.reps <= maxReps) ||
      sortedSets[0];

    if (!relevantSet || relevantSet.weight == null) return null;

    const increment = getProgressionIncrement(exerciseName);

    let recommendedWeight = relevantSet.weight;

    if (relevantSet.reps >= maxReps) {
      recommendedWeight += increment;
    }

    return roundToNearest(recommendedWeight, 0.5);
  }