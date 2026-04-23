import { GraphQLClient } from "graphql-request";
import { storage } from "./storage";

console.log("graphqlClient loaded");

const API_URL = "https://distinguished-serenity-production.up.railway.app/graphql";

export default async function getClient() {
  const token = await storage.getItem("token");
  console.log("🔥 TOKEN:", token);

  return new GraphQLClient(API_URL, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
}
