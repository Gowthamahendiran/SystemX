"use client";

import { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase";
import { AuthPage } from "./AuthPage";
import { DashboardShell } from "./DashboardShell";

type AppRouteProps = {
  active: "dashboard" | "daily-quest" | "daily-missions" | "skills" | "settings" | "help-support";
  pageTitle?: string;
};

export function AppRoute({ active, pageTitle }: AppRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingAuth(false);
    });
  }, []);

  if (checkingAuth) {
    return (
      <Box className="loading-screen">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <DashboardShell active={active} pageTitle={pageTitle} user={user} />;
}
