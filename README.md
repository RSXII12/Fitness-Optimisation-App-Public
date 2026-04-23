App Repo (Frontend)
Overview
Mobile fitness app for logging workouts and generating personalised training plans based on user goals, experience, and constraints.

Features
Workout tracking (sets, reps, weight)
Exercise database with detailed info
Personalised plan generation
Planner profile (goal, equipment, availability)
Calendar view for training history
Tech Stack
React Native (Expo + Expo Router)
GraphQL (Apollo Client)
Node.js backend (separate service)
MongoDB

Architecture
This repo contains the frontend/mobile app.

It connects to:
Backend service (GraphQL API)
Optimisation service (plan generation)

Backend & optimisation:
[](https://github.com/RSXII12/Backend-and-Python-Optimiser-Public)

Setup
npm install
npx expo start
Notes
Backend is deployed via railway, server does not need to be run locally
Environment variables are required to run locally (not included)
