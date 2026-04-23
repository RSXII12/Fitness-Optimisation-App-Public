export const GOALS = [
  "strength",
  "hypertrophy",
  "fat_loss",
  "maintenance",
  "athletic_performance",
];

export const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced"];

export const GOAL_REP_RANGES = {
  strength: { min: 1, max: 5 },
  hypertrophy: { min: 6, max: 12 },
  fat_loss: { min: 8, max: 15 },
  maintenance: { min: 5, max: 12 },
  athletic_performance: { min: 3, max: 8 },
};

export const EQUIPMENT_OPTIONS = [
  "barbell",
  "dumbbell",
  "rack",
  "bench",
  "cable",
  "machine",
  "bodyweight",
  "bands",
  "kettlebell",
];

//need to rank priorites so we aren't just filling the plan with exercises in order of the database dump.
export const GOAL_MUSCLE_PRIORITIES = {
    athletic_performance: {
      quadriceps: 3,
      hamstrings: 3,
      glutes: 3,
      calves: 2,
      abdominals: 2,
      "lower back": 2,
      shoulders: 2,
      lats: 2,
      "middle back": 2,
      chest: 1,
      biceps: 1,
      triceps: 1,
    },

    strength: {
      quadriceps: 3,
      hamstrings: 3,
      glutes: 3,
      chest: 3,
      lats: 3,
      "middle back": 2,
      shoulders: 2,
      triceps: 2,
      abdominals: 1,
      "lower back": 2,
      biceps: 1,
      calves: 1,
    },

    hypertrophy: {
      quadriceps: 2,
      hamstrings: 2,
      glutes: 2,
      calves: 1,
      chest: 3,
      shoulders: 3,
      lats: 3,
      "middle back": 2,
      biceps: 3,
      triceps: 3,
      abdominals: 1,
      "lower back": 1,
    },

    fat_loss: {
      quadriceps: 3,
      hamstrings: 3,
      glutes: 3,
      calves: 1,
      chest: 2,
      shoulders: 2,
      lats: 2,
      "middle back": 2,
      abdominals: 3,
      "lower back": 2,
      biceps: 1,
      triceps: 1,
    },

    maintenance: {
      quadriceps: 2,
      hamstrings: 2,
      glutes: 2,
      calves: 1,
      chest: 2,
      shoulders: 2,
      lats: 2,
      "middle back": 2,
      abdominals: 1,
      "lower back": 1,
      biceps: 1,
      triceps: 1,
    },
  };