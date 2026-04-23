import { useState, useContext } from "react";
import { View, TextInput, Button, Text, StyleSheet } from "react-native";
import { gql } from "graphql-request";
import { useRouter } from "expo-router";
import getClient from "../utils/graphqlClient";
import { AuthContext } from "../context/AuthContext";

const SIGNUP_MUTATION = gql`
  mutation Signup($email: String!, $password: String!) {
    signup(email: $email, password: $password) {
      token
      user {
        _id
        email
      }
    }
  }
`;

export default function SignupScreen() {
  const router = useRouter();
  const { login: authLogin } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const onSignup = async () => {
    setErrorMsg("");

    try {
      const client = await getClient();
      const result = await client.request(SIGNUP_MUTATION, { email, password });

      const { token, user } = result.signup;

      if (!token || !user) {
        setErrorMsg("Signup failed: No token returned");
        return;
      }

      // Use AuthContext login() (this stores token + user in storage)
      await authLogin(token, user);

      router.replace("/");
    } catch (err) {
      console.log("Signup error:", err);
      setErrorMsg(err.response?.errors?.[0]?.message || "Signup failed");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

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

      <Button title="Create Account" onPress={onSignup} />

      <Text style={styles.link} onPress={() => router.push("/login")}>
        Already have an account? Log in
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
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
