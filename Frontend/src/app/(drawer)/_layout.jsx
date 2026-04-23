import { Drawer } from "expo-router/drawer";
import { DrawerToggleButton } from "@react-navigation/drawer";

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        headerLeft: () => <DrawerToggleButton />,
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />

      <Drawer.Screen
        name="workout-calendar"
        options={{
          title: "Workout Calendar",
        }}
      />

      <Drawer.Screen
        name="PlanCreator"
        options={{
          title: "Workout & Nutrition Planning",
        }}
      />

      <Drawer.Screen
        name="planner-profile"
        options={{
          title: "Profile",
          drawerLabel: "Profile",
        }}
      />

      <Drawer.Screen
        name="exercise/[id]"
        options={{
          title: "Exercise",
          drawerItemStyle: { display: "none" },
          headerLeft: () => null,
        }}
      />
    </Drawer>
  );
}