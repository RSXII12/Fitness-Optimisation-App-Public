import React, { useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Pressable, Alert , Platform} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar } from "react-native-calendars";
import { gql } from "graphql-request";
import getClient from "../utils/graphqlClient";

const allWorkoutsQuery = gql`
  query {
    sets {
      _id
      exerciseName
      reps
      weight
      date
    }
  }
`;

const DELETE_WORKOUT_SET_MUTATION = gql`
  mutation DeleteWorkoutSet($setId: ID!) {
    deleteWorkoutSet(setId: $setId)
  }
`;

export default function WorkoutCalendar() {
  const [selectedDate, setSelectedDate] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["workouts"],
    queryFn: async () => {
      const client = await getClient();
      return client.request(allWorkoutsQuery);
    },
  });

  const deleteWorkoutSet = useMutation({
      mutationFn: async (setId) => {
        const client = await getClient();
        return client.request(DELETE_WORKOUT_SET_MUTATION, { setId });
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ["workouts"] });
      },
      onError: (err) => {
        console.log("Delete failed:", err?.message);
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

  if (isLoading) return <ActivityIndicator />;
  if (error) return <Text>Error loading workouts</Text>;

  const workouts = data?.sets || [];

  const sorted = [...workouts].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const markedDates = sorted.reduce((acc, w) => {
    const d = new Date(w.date).toISOString().split("T")[0];
    acc[d] = { ...(acc[d] || {}), marked: true, dotColor: "#3b82f6" };
    return acc;
  }, {});

  if (selectedDate) {
    markedDates[selectedDate] = {
      ...(markedDates[selectedDate] || {}),
      selected: true,
      selectedColor: "#3b82f6",
    };
  }

  const workoutsForDay = selectedDate
    ? sorted.filter(
        (w) => new Date(w.date).toISOString().split("T")[0] === selectedDate
      )
    : [];

  const grouped = workoutsForDay.reduce((acc, w) => {
    if (!acc[w.exerciseName]) acc[w.exerciseName] = [];
    acc[w.exerciseName].push(w);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
      />

      <Text style={styles.heading}>
        {selectedDate ? `Workouts on ${selectedDate}` : "Select a date"}
      </Text>

      <View style={styles.listContainer}>
        {selectedDate ? (
          workoutsForDay.length > 0 ? (
            <FlatList
              data={Object.keys(grouped)}
              keyExtractor={(name) => name}
              renderItem={({ item: exerciseName }) => (
                <View style={styles.card}>
                  <Text style={styles.exerciseName}>{exerciseName}</Text>

                  {grouped[exerciseName].map((set) => (
                    <View key={set._id} style={styles.setRow}>
                      <Text style={styles.setText}>
                        • {set.reps} reps × {set.weight}kg
                      </Text>

                      <Pressable
                        onPress={() => handleDeleteSet(set._id)}
                        style={styles.deleteButton}
                      >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            />
          ) : (
            <Text style={styles.noData}>No workouts logged on this day</Text>
          )
        ) : (
          <Text style={styles.noData}>Select a date to view workouts</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#f8f9fa" },
  heading: {
    textAlign: "center",
    fontWeight: "600",
    marginVertical: 10,
  },
  listContainer: { marginTop: 10, flex: 1 },
  card: {
    backgroundColor: "white",
    marginVertical: 5,
    padding: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  exerciseName: { fontWeight: "700", fontSize: 16, marginBottom: 5 },
  setText: { fontSize: 14 },
  dateText: { fontSize: 12, color: "gray", marginTop: 4 },
  noData: {
    textAlign: "center",
    color: "gray",
    marginTop: 20,
    fontSize: 14,
  },
  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: 12,
    marginTop: 6,
    gap: 10,
  },
  deleteButton: {
    backgroundColor: "#dc2626",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 12,
  },
});