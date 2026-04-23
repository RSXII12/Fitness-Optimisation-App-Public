import { StatusBar } from "expo-status-bar";
import React, { useContext, useEffect } from "react";
import { StyleSheet , Text , View , FlatList , Pressable , ActivityIndicator , TextInput } from "react-native";
import ExerciseListItem from "../../components/ExerciseListItem";
import { useQuery } from "@tanstack/react-query";
import { gql } from "graphql-request";
import getClient from "../../utils/graphqlClient";
import { useRouter } from "expo-router";
import { AuthContext } from "../../context/AuthContext";
import { Picker } from "@react-native-picker/picker";


const exercisesQuery = gql`
  query exercises(
    $muscle: String
    $q: String
    $equipment: String
    $limit: Int
    $offset: Int
  ) {
    exercises(
      muscle: $muscle
      q: $q
      equipment: $equipment
      limit: $limit
      offset: $offset
    ) {
      id
      name
      primaryMuscles
      equipment
    }
  }
`;

export default function ExercisesScreen() {
  const { token, loading, logout } = useContext(AuthContext);
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [muscle, setMuscle] = React.useState("");
  


  useEffect(() => {
    if (!loading && !token) {
      router.replace("/login");
    }
  }, [loading, token, router]);

  const { data, isFetching, error } = useQuery({
    queryKey: ["exercises", token, search, muscle],
    queryFn: async () => {
      const client = await getClient();
      return client.request(exercisesQuery, {
        muscle: muscle || null,
        q: search || null,
        equipment: null,
        limit: 30,
        offset: 0,
      });
    },
    enabled: !!token && !loading,
    keepPreviousData: true,
  });



  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (loading && !data) {
    return <ActivityIndicator />;
  }



  if (!token) return null;

  if (error) {
    return <Text>Something went wrong: {error.message}</Text>;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Exercises</Text>

        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search exercises..."
          placeholderTextColor="#9ca3af"
          style={styles.searchInput}
        />

        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Text style={styles.clearIcon}>✕</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.filterContainer}>
        <Picker
          selectedValue={muscle}
          onValueChange={(itemValue) => setMuscle(itemValue)}
          style={styles.picker}
          dropdownIconColor="#6b7280"
        >
          <Picker.Item label="All Muscles" value="" />
          <Picker.Item label="Upper Body" value="upper" />
          <Picker.Item label="Lower Body" value="lower" />
          <Picker.Item label="Core" value="core" />
          <Picker.Item label="Pull Muscles" value="pull" />
          <Picker.Item label="Push Muscles" value="push" />
        </Picker>
      </View>



      {/* Small Loading Indicator */}
      {isFetching && (
        <ActivityIndicator size="small" style={{ marginBottom: 8 }} />
      )}

      {/* Exercise List */}
      <FlatList
        data={data?.exercises || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <ExerciseListItem item={item} />}
        showsVerticalScrollIndicator={false}
      />

      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 16,
    paddingTop: 50,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },

  logoutButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },

  logoutText: {
    color: "white",
    fontWeight: "600",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },

  searchIcon: {
    marginRight: 8,
    fontSize: 16,
  },

  clearIcon: {
    marginLeft: 8,
    fontSize: 16,
    color: "#9ca3af",
  },

  listContent: {
    paddingBottom: 30,
    gap: 8,
  },

  filterContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  picker: {
    height: 50,
    width: "100%",
  },

});
