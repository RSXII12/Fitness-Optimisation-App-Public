import { StyleSheet, Text, Pressable } from "react-native";
import { Link } from "expo-router";

export default function ExerciseListItem({ item }) {
  return (
    <Link href={{ pathname: "/(drawer)/exercise/[id]", params: { id: item.id } }} asChild>
      <Pressable style={styles.exerciseContainer}>
        <Text style={styles.exerciseName}>{item.name}</Text>

        <Text style={styles.exerciseSubtitle}>
          <Text style={styles.subValue}>
            {(item.primaryMuscles?.[0] ?? "unknown").replaceAll("_", " ")}
          </Text>
          {" | "}
          <Text style={styles.subValue}>
            {(item.equipment?.[0] ?? "unknown").replaceAll("_", " ")}
          </Text>
        </Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  exerciseName: { fontSize: 20, fontWeight: "500" },
  exerciseSubtitle: { color: "dimgray" },
  exerciseContainer: {
    backgroundColor: "ghostwhite",
    padding: 10,
    borderRadius: 10,
    gap: 5,
    marginHorizontal: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 2,
  },
  subValue: { textTransform: "capitalize" },
});
