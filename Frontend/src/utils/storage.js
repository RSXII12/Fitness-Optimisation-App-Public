// utils/storage.js
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const storage = {
  getItem: async (key) => {
    try {
      if (Platform.OS === "android" || Platform.OS === "ios") {
        return await SecureStore.getItemAsync(key);
      } else {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.log("Storage getItem error:", e);
      return null;
    }
  },

  setItem: async (key, value) => {
    try {
      if (Platform.OS === "android" || Platform.OS === "ios") {
        await SecureStore.setItemAsync(key, value);
      } else {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.log("Storage setItem error:", e);
    }
  },

  removeItem: async (key) => {
    try {
      if (Platform.OS === "android" || Platform.OS === "ios") {
        await SecureStore.deleteItemAsync(key);
      } else {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.log("Storage removeItem error:", e);
    }
  },
};
