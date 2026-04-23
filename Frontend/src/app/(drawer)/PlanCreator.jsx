import { useState, useCallback } from "react";
import { View , Text , ScrollView , Pressable , ActivityIndicator , Alert , StyleSheet } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { gql } from "graphql-request";
import { getRecommendedWeightFromSets } from "../planner/plannerHelpers";
import getClient from "../../utils/graphqlClient";

const GET_MY_PLANNER_PROFILE = gql`
  query GetMyPlannerProfile {
    myPlannerProfile {
      id
      height
      weight
      goal
      experienceLevel
      availableEquipment
      daysAvailable
      sessionMinutes
    }
  }
`;


const SETS_BY_EXERCISE_NAME_QUERY = gql`
  query SetsByExerciseName($exerciseName: String!) {
    sets(exerciseName: $exerciseName) {
      _id
      exerciseName
      reps
      weight
      date
    }
  }
`;


const GENERATE_OPTIMIZED_OUTPUT_QUERY = gql`
  query GenerateOptimizedOutput {
    generateOptimizedPlan {
      plan {
        day
        exercises {
          exerciseKey
          exerciseName
          sets
        }
      }
      summary {
        fatigue
        fatigue_excess
        min_shortfall
        target_deviation
      }
    }
    generateMacroPlan {
      calories
      protein
      carbs
      fat
      goal
      calorieTarget
      method
    }
  }
`;

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];


export default function PlanCreator() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [optimizedPlan, setOptimizedPlan] = useState(null);
  const [generatingOptimized, setGeneratingOptimized] = useState(false);
  const [macroPlan, setMacroPlan] = useState(null);

  const sortedOptimizedDays = optimizedPlan?.plan
    ? [...optimizedPlan.plan].sort(
        (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
      )
    : [];

  useFocusEffect(
    useCallback(() => {
      loadPlannerProfile();
    }, [])
  );

  async function loadPlannerProfile() {
    try {
      setLoading(true);
      const client = await getClient();
      const data = await client.request(GET_MY_PLANNER_PROFILE);
      setProfile(data?.myPlannerProfile ?? null);
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to load planner profile.");
    } finally {
      setLoading(false);
    }
  }

  function getMissingFields(profile) {
    if (!profile) {
      return [
        "goal",
        "experience level",
        "available equipment",
        "days available",
        "session minutes",
      ];
    }

    const missing = [];

    if (!profile.goal) missing.push("goal");
    if (!profile.experienceLevel) missing.push("experience level");
    if (!profile.weight) missing.push("weight");
    if (!profile.availableEquipment || profile.availableEquipment.length === 0) {
      missing.push("available equipment");
    }
    if (!profile.daysAvailable) missing.push("days available");
    if (!profile.sessionMinutes) missing.push("session minutes");

    return missing;
  }

  const missingFields = getMissingFields(profile);
  const profileComplete = missingFields.length === 0;


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
      if (isBigCompound) return "3-6 reps";
      return "6-10 reps";
    }
    

    if (goal === "hypertrophy") {
      if (isIsolation) return "10-15 reps";
      return "6-10 reps";
    }

    if (goal === "athletic_performance") {
      if (isBigCompound) return "3-6 reps";
      return "6-10 reps";
    }

    if (goal === "fat_loss") {
      if (isIsolation) return "10-15 reps";
      return "8-12 reps";
    }

    if (goal === "maintenance") {
      if (isIsolation) return "10-15 reps";
      return "6-10 reps";
    }

    return "6-10 reps";
  }

  async function addWeightRecommendationsToOptimizedPlan(optimizedPlan, goal) {
    const client = await getClient();

    const enrichedPlan = await Promise.all(
      optimizedPlan.plan.map(async (day) => {
        const enrichedExercises = await Promise.all(
          day.exercises.map(async (exercise) => {
            try {
              const data = await client.request(SETS_BY_EXERCISE_NAME_QUERY, {
                exerciseName: exercise.exerciseName,
              });

              const sets = data?.sets ?? [];
              const recommendedWeight = getRecommendedWeightFromSets(sets, goal, exercise.exerciseName);
              const recommendedReps = getRecommendedRepRange(exercise.exerciseName, goal);

              return {
                ...exercise,
                recommendedWeight,
                recommendedReps,
              };
            } catch (err) {
              console.error(`Failed to load history for ${exercise.exerciseName}:`, err);
              return {
                ...exercise,
                recommendedWeight: null,
              };
            }
          })
        );

        return {
          ...day,
          exercises: enrichedExercises,
        };
      })
    );

    return {
      ...optimizedPlan,
      plan: enrichedPlan,
    };
  }


  async function handleGenerateOptimizedPlan() {
    try {
      const missingFields = getMissingFields(profile);
      if (missingFields.length > 0) {
        Alert.alert(
          "Incomplete Profile",
          `Please complete your planner profile first: ${missingFields.join(", ")}`
        );
        return;
      }

      setGeneratingOptimized(true);

      const client = await getClient();
      const data = await client.request(GENERATE_OPTIMIZED_OUTPUT_QUERY);

      const workoutResult = data?.generateOptimizedPlan ?? null;
      const macroResult = data?.generateMacroPlan ?? null;

      const enrichedWorkoutResult = workoutResult ? await addWeightRecommendationsToOptimizedPlan(workoutResult, profile.goal) : null;

      setOptimizedPlan(enrichedWorkoutResult);
      setMacroPlan(macroResult);

      console.log("OPTIMIZED PLAN:", workoutResult);
      console.log("MACRO PLAN:", macroResult);

      Alert.alert("Optimized Plan Generated", "Your optimized workout and macro plan are ready.");

    } catch (err) {
      Alert.alert("Error", err.message || "Failed to generate optimized plan.");
    } finally {
      setGeneratingOptimized(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Loading planner profile...</Text>
      </View>
    );
  }


  if (!profileComplete) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Workout & Nutrition Planning</Text>
        <Text style={styles.subtitle}>
          Your planner profile is incomplete.
        </Text>
        <Text style={styles.missingText}>
          Missing: {missingFields.join(", ")}
        </Text>

        <Pressable
          style={styles.generateButton}
          onPress={() => router.push("/planner-profile")}
        >
          <Text style={styles.generateButtonText}>Complete Profile</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Workout & Nutrition Planning</Text>
      <Text style={styles.subtitle}>
        Your saved planner profile will be used to generate a workout plan and suggested macros.
      </Text>

      <View style={styles.dayCard}>
        <Text style={styles.dayTitle}>Current Profile</Text>
        <Text style={styles.exerciseText}>Goal: {profile.goal}</Text>
        <Text style={styles.exerciseText}>
          Experience: {profile.experienceLevel}
        </Text>
        <Text style={styles.exerciseText}>
          Days available: {profile.daysAvailable}
        </Text>
        <Text style={styles.exerciseText}>
          Session minutes: {profile.sessionMinutes}
        </Text>
        <Text style={styles.exerciseText}>
          Equipment: {profile.availableEquipment.join(", ")}
        </Text>
      </View>


      <Pressable
        style={styles.generateButton}
        onPress={handleGenerateOptimizedPlan}
      >
        <Text style={styles.generateButtonText}>
          {generatingOptimized ? "Generating Optimized Plan..." : "Generate Optimized Plan"}
        </Text>
      </Pressable>
      <Text style={styles.subtitle}>
        Generate your new recommendations every week if you
        are logging your workouts and weight for best results. You can edit your profile at any time to update your plan recommendations.
      </Text>

      {optimizedPlan && (
        <View style={styles.planPreview}>
          <Text style={styles.sectionTitle}>Optimized Plan</Text>
          {sortedOptimizedDays.map((dayEntry) => (
            <View key={dayEntry.day} style={styles.dayCard}>
              <Text style={styles.dayTitle}>{dayEntry.day}</Text>
              {dayEntry.exercises.length === 0 ? (
                <Text style={styles.exerciseText}>Rest / no assigned sets</Text>
              ) : (
                dayEntry.exercises.map((exercise, index) => (
                  <Text
                    key={`${dayEntry.day}-${exercise.exerciseKey}-${index}`}
                    style={styles.exerciseText}
                  >
                    • {exercise.exerciseName} - {exercise.sets} sets
                    {exercise.recommendedReps ? ` - ${exercise.recommendedReps}` : ""}
                    {exercise.recommendedWeight != null
                      ? ` - Recommended: ${exercise.recommendedWeight} kg`
                      : " - No history"}
                  </Text>
                ))
              )}
            </View>
          ))}
        </View>
      )}

      {macroPlan && (
        <View style={styles.planPreview}>
          <Text style={styles.sectionTitle}>Macro Plan</Text>

          <View style={styles.dayCard}>
            <Text style={styles.exerciseText}>Goal: {macroPlan.goal}</Text>
            <Text style={styles.exerciseText}>Calories: {macroPlan.calories}</Text>
            <Text style={styles.exerciseText}>Protein: {macroPlan.protein} g</Text>
            <Text style={styles.exerciseText}>Carbs: {macroPlan.carbs} g</Text>
            <Text style={styles.exerciseText}>Fat: {macroPlan.fat} g</Text>
          </View>
        </View>
      )}
    </ScrollView>
    
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 10,
    backgroundColor: "#fff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: "#1f1f1f",
    marginBottom: 16,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 6,
  },
  loadingText: {
    marginTop: 10,
  },
  generateButton: {
    marginTop: 24,
    backgroundColor: "#111",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  generateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  planPreview: {
    marginTop: 24,
  },
  dayCard: {
    marginTop: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    backgroundColor: "#fafafa",
  },
  dayTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },
  exerciseText: {
    fontSize: 15,
    marginBottom: 4,
  },
  missingText: {
    fontSize: 15,
    color: "#b00020",
    textAlign: "center",
  },
});
