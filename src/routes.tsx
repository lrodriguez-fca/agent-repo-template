import { Navigate, type RouteObject } from "react-router";
import { PomodoroPage } from "./pages/PomodoroPage";

export const routes: RouteObject[] = [
  { path: "/", element: <PomodoroPage /> },
  { path: "*", element: <Navigate to="/" replace /> },
];
