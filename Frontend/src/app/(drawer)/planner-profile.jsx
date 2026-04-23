import { useEffect, useState } from "react";
import { View , Text , TextInput , ScrollView , Pressable , ActivityIndicator , Alert , StyleSheet } from "react-native";
import { gql } from "graphql-request";
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

const SAVE_PLANNER_PROFILE = gql`
  mutation SavePlannerProfile($input: PlannerProfileInput!) {
    savePlannerProfile(input: $input) {
      id
      userId
      height
      weight
      goal
      experienceLevel
      availableEquipment
      daysAvailable
      sessionMinutes
      updatedAt
    }
  }
`;

const GOALS = [
  "strength",
  "hypertrophy",
  "fat_loss",
  "maintenance",
  "athletic_performance",
];

const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced"];

const EQUIPMENT_OPTIONS = [
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

const MIN_SESSION_MINUTES = 20;
const MAX_SESSION_MINUTES = 150;

const MIN_DAYS = 2;
const MAX_DAYS = 7;

export default function PlannerProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [daysAvailable, setDaysAvailable] = useState("");
  const [sessionMinutes, setSessionMinutes] = useState("");
  const [availableEquipment, setAvailableEquipment] = useState([]);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const client = await getClient();
      const data = await client.request(GET_MY_PLANNER_PROFILE);

      const profile = data?.myPlannerProfile;
      if (!profile) return;

      setHeight(profile.height != null ? String(profile.height) : "");
      setWeight(profile.weight != null ? String(profile.weight) : "");
      setGoal(profile.goal ?? "");
      setExperienceLevel(profile.experienceLevel ?? "");
      setDaysAvailable(profile.daysAvailable != null ? String(profile.daysAvailable) : "");
      setSessionMinutes(
        profile.sessionMinutes != null
          ? String(Math.min(profile.sessionMinutes, MAX_SESSION_MINUTES))
          : ""
      );
      setAvailableEquipment(profile.availableEquipment ?? []);
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }

  function toggleEquipment(item) {
    setAvailableEquipment((prev) =>
      prev.includes(item)
        ? prev.filter((eq) => eq !== item)
        : [...prev, item]
    );
  }

  async function handleSave() {
    try {
      setSaving(true);

      const client = await getClient();

      const parsedSessionMinutes = sessionMinutes ? parseInt(sessionMinutes, 10) : null;

      if (
        parsedSessionMinutes != null &&
        (parsedSessionMinutes > MAX_SESSION_MINUTES || parsedSessionMinutes < MIN_SESSION_MINUTES)
      ) {
        Alert.alert("Invalid Input", `Session minutes must be between ${MIN_SESSION_MINUTES} and ${MAX_SESSION_MINUTES}.`);
        setSaving(false);
        return;
      }

      const parsedDays = daysAvailable ? parseInt(daysAvailable, 10) : null;
      if (parsedDays != null && (parsedDays < MIN_DAYS || parsedDays > MAX_DAYS)) {
        Alert.alert("Invalid Input", `Days available must be between ${MIN_DAYS} and ${MAX_DAYS}.`);
        setSaving(false);
        return;
      }

      const variables = {
        input: {
          height: height ? parseFloat(height) : null,
          weight: weight ? parseFloat(weight) : null,
          goal: goal || null,
          experienceLevel: experienceLevel || null,
          availableEquipment,
          daysAvailable: daysAvailable ? parseInt(daysAvailable, 10) : null,
          sessionMinutes:
            parsedSessionMinutes != null
              ? Math.min(parsedSessionMinutes, MAX_SESSION_MINUTES)
              : null,
        },
      };

      await client.request(SAVE_PLANNER_PROFILE, variables);
      Alert.alert("Success", "Profile saved successfully.");
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Planner Profile</Text>
      <Text style={styles.subtitle}>
        Save your default planning inputs for workouts and nutrition.
      </Text>

      <Text style={styles.label}>Height (cm)</Text>
      <TextInput
        style={styles.input}
        value={height}
        onChangeText={setHeight}
        keyboardType="numeric"
        placeholder="e.g. 183"
      />

      <Text style={styles.label}>Weight (kg)</Text>
      <TextInput
        style={styles.input}
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
        placeholder="e.g. 80"
      />

      <Text style={styles.label}>Goal</Text>
      <View style={styles.optionsRow}>
        {GOALS.map((item) => (
          <Pressable
            key={item}
            style={[
              styles.optionButton,
              goal === item && styles.optionButtonSelected,
            ]}
            onPress={() => setGoal(item)}
          >
            <Text
              style={[
                styles.optionText,
                goal === item && styles.optionTextSelected,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Experience Level</Text>
      <View style={styles.optionsRow}>
        {EXPERIENCE_LEVELS.map((item) => (
          <Pressable
            key={item}
            style={[
              styles.optionButton,
              experienceLevel === item && styles.optionButtonSelected,
            ]}
            onPress={() => setExperienceLevel(item)}
          >
            <Text
              style={[
                styles.optionText,
                experienceLevel === item && styles.optionTextSelected,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Available Equipment</Text>
      <View style={styles.optionsRow}>
        {EQUIPMENT_OPTIONS.map((item) => {
          const selected = availableEquipment.includes(item);
          return (
            <Pressable
              key={item}
              style={[
                styles.optionButton,
                selected && styles.optionButtonSelected,
              ]}
              onPress={() => toggleEquipment(item)}
            >
              <Text
                style={[
                  styles.optionText,
                  selected && styles.optionTextSelected,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Days Available Per Week ({MIN_DAYS} - {MAX_DAYS})</Text>
      <TextInput
        style={styles.input}
        value={daysAvailable}
        onChangeText={(text) => {
          const digitsOnly = text.replace(/[^0-9]/g, "");
          if (!digitsOnly) {
            setDaysAvailable("");
            return;
          }
          const val = parseInt(digitsOnly, 10);
          setDaysAvailable(String(Math.min(val, MAX_DAYS)));
        }}
        keyboardType="numeric"
        placeholder="e.g. 4"
      />

      <Text style={styles.label}>Minutes per session (Max 150)</Text>
      <TextInput
        style={styles.input}
        value={sessionMinutes}
        onChangeText={(text) => {
          const digitsOnly = text.replace(/[^0-9]/g, "");
          if (!digitsOnly) {
            setSessionMinutes("");
            return;
          }
          const val = parseInt(digitsOnly, 10);
          setSessionMinutes(String(Math.min(val, MAX_SESSION_MINUTES)));
        }}
        keyboardType="numeric"
        placeholder="e.g. 75"
      />

      <Pressable
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? "Saving..." : "Save Profile"}
        </Text>
      </Pressable>
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
    fontSize: 15,
    color: "#555",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#bbb",
    backgroundColor: "#fff",
  },
  optionButtonSelected: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  optionText: {
    color: "#111",
  },
  optionTextSelected: {
    color: "#fff",
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: "#111",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingText: {
    marginTop: 10,
  },
});