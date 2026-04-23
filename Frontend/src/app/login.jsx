import { useState, useContext } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { gql } from "graphql-request";
import { useRouter } from "expo-router";
import getClient from "../utils/graphqlClient";
import { AuthContext } from "../context/AuthContext";

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        _id
        email
      }
    }
  }
`;

export default function LoginScreen() {
  const router = useRouter();
  const { login : authLogin } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const client = await getClient();
      const result = await client.request(LOGIN_MUTATION, { email, password });

      const { token, user } = result.login;

      if (!token || !user) {
        setErrorMsg("Invalid response from server.");
        setLoading(false);
        return;
      }

      // Use AuthContext login() instead of SecureStore
      await authLogin(token, user);

      router.replace("/");
    } catch (err) {
      console.log("❌ Login error:", err);
      setErrorMsg(err.response?.errors?.[0]?.message || "Login failed");
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log In</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

      <Button title={loading ? "Logging in..." : "Log In"} onPress={onLogin} />

      <Text style={styles.link} onPress={() => router.push("/signup")}>
        Don’t have an account? Sign up
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
  },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  input: {
    backgroundColor: "white",
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  error: { color: "red", marginBottom: 10, textAlign: "center" },
  link: { marginTop: 20, textAlign: "center", color: "#3b82f6", fontWeight: "500" },
});
