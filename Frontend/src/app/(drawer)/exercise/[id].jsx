import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TextInput, Pressable, Alert , Platform} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gql } from "graphql-request";
import getClient from "@/utils/graphqlClient";


const exerciseQuery = gql`
  query exercise($id: ID!) {
    exercise(id: $id) {
      id
      name
      category
      difficulty
      equipment
      primaryMuscles
      secondaryMuscles
      instructions
    }
  }
`;

const setsQuery = gql`
  query sets($exerciseId: ID) {
    sets(exerciseId: $exerciseId) {
      _id
      reps
      weight
      date
      exerciseName
      exerciseId
    }
  }
`;

const addWorkoutMutation = gql`
  mutation addWorkout($exerciseId: ID!, $exerciseName: String!, $reps: Int!, $weight: Float!) {
    addWorkout(exerciseId: $exerciseId, exerciseName: $exerciseName, reps: $reps, weight: $weight) {
      _id
      reps
      weight
      date
      exerciseName
      exerciseId
    }
  }
`;



const DELETE_WORKOUT_SET_MUTATION = gql`
  mutation DeleteWorkoutSet($setId: ID!) {
    deleteWorkoutSet(setId: $setId)
  }
`;



export default function ExerciseDetailsScreen() {
  const { id } = useLocalSearchParams();
  const queryClient = useQueryClient();

  const [reps, setReps] = React.useState("");
  const [weight, setWeight] = React.useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["exercise", id],
    queryFn: async () => {
      const client = await getClient();
      return client.request(exerciseQuery, { id });
    },
    enabled: !!id,
  });

  const { data: setsData, isLoading: setsLoading } = useQuery({
    queryKey: ["sets", id],
    queryFn: async () => {
      const client = await getClient();
      return client.request(setsQuery, { exerciseId: id });
    },
    enabled: !!id,
  });

  const addWorkout = useMutation({
    mutationFn: async ({ exerciseId, exerciseName, reps, weight }) => {
      const client = await getClient();
      return client.request(addWorkoutMutation, {
        exerciseId,
        exerciseName,
        reps,
        weight,
      });
    },
    onSuccess: async () => {
      setReps("");
      setWeight("");
      await queryClient.invalidateQueries({ queryKey: ["sets", id] });
      await queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });

  const deleteWorkoutSet = useMutation({
    mutationFn: async (setId) => {
      const client = await getClient();
      return client.request(DELETE_WORKOUT_SET_MUTATION, { setId });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sets", id] });
      await queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });

  function handleDeleteSet(setId) {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to delete this set?");
      if (confirmed) {
        deleteWorkoutSet.mutate(setId);
      }
      return;
    }

    Alert.alert(
      "Delete set",
      "Are you sure you want to delete this set?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteWorkoutSet.mutate(setId),
        },
      ]
    );
  }


  if (isLoading) return <ActivityIndicator style={{ marginTop: 30 }} />;
  if (error) return <Text style={{ padding: 10 }}>Error: {error.message}</Text>;

  const ex = data?.exercise;
  if (!ex) return <Text style={{ padding: 10 }}>Exercise not found.</Text>;

  const onLogSet = () => {
    const r = parseInt(reps, 10);
    const w = parseFloat(weight);

    if (!Number.isFinite(r) || r <= 0) return;
    if (!Number.isFinite(w) || w < 0) return;

    addWorkout.mutate({
      exerciseId: ex.id,
      exerciseName: ex.name,
      reps: r,
      weight: w,
    });
  };

  const history = setsData?.sets ?? [];

    const headerBack = (
    <Stack.Screen
      options={{
        title: "Exercise",
        headerLeft: () => (
          <Pressable
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace("/(drawer)");
            }}
            style={{ paddingHorizontal: 12, paddingVertical: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </Pressable>
        ),
      }}
    />
  );


  return (

    <>
    {headerBack}
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{ex.name}</Text>

      <Text style={styles.meta}>
        {ex.primaryMuscles?.join(", ") || "-"}{"  "}•{"  "}
        {ex.equipment?.join(", ") || "-"}
      </Text>

      {!!ex.secondaryMuscles?.length && (
        <Text style={styles.section}>Secondary: {ex.secondaryMuscles.join(", ")}</Text>
      )}

      {!!ex.category && <Text style={styles.section}>Category: {ex.category}</Text>}
      {ex.difficulty != null && <Text style={styles.section}>Difficulty: {ex.difficulty}</Text>}

      <Text style={styles.h2}>Log a set</Text>
      <View style={styles.row}>
        <TextInput
          value={reps}
          onChangeText={setReps}
          placeholder="Reps"
          keyboardType="number-pad"
          style={styles.input}
        />
        <TextInput
          value={weight}
          onChangeText={setWeight}
          placeholder="Weight"
          keyboardType="decimal-pad"
          style={styles.input}
        />
        <Pressable
          onPress={onLogSet}
          style={[styles.button, addWorkout.isPending && { opacity: 0.6 }]}
          disabled={addWorkout.isPending}
        >
          <Text style={styles.buttonText}>{addWorkout.isPending ? "Saving..." : "Add"}</Text>
        </Pressable>
      </View>

      <Text style={styles.h2}>Instructions</Text>
      {(ex.instructions?.length ? ex.instructions : ["No instructions available."]).map((step, idx) => (
        <Text key={idx} style={styles.step}>
          {idx + 1}. {step}
        </Text>
      ))}

      <Text style={styles.h2}>History</Text>
      {setsLoading ? (
        <ActivityIndicator style={{ marginTop: 10 }} />
      ) : history.length === 0 ? (
        <Text style={{ color: "dimgray" }}>No sets logged yet.</Text>
      ) : (
        history.map((s) => (
          <View key={s._id} style={styles.setRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.setText}>
                {s.reps} reps @ {s.weight} kg
              </Text>
              <Text style={styles.setDate}>
                {new Date(s.date).toLocaleString()}
              </Text>
            </View>

            <Pressable
              onPress={() => handleDeleteSet(s._id)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </Pressable>
          </View>
        ))
      )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 14 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 6 },
  meta: { color: "dimgray", marginBottom: 12 },
  h2: { fontSize: 18, fontWeight: "700", marginTop: 16, marginBottom: 8 },
  section: { marginTop: 6 },
  step: { marginBottom: 8, lineHeight: 20 },

  row: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 6 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "white",
  },
  button: {
    backgroundColor: "#3b82f6",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  buttonText: { color: "white", fontWeight: "700" },

  setRow: {
    backgroundColor: "ghostwhite",
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  deleteButton: {
    backgroundColor: "#dc2626",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  deleteButtonText: {
    color: "white",
    fontWeight: "700",
  },
  setText: { fontWeight: "600" },
  setDate: { color: "dimgray", marginTop: 4, fontSize: 12 },
});
