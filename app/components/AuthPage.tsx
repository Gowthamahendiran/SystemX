"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { FaArrowRightToBracket, FaEye, FaEyeSlash, FaRegUser } from "react-icons/fa6";
import { auth, db } from "../firebase";

type Mode = "login" | "signup";

type FormState = {
  name: string;
  email: string;
  age: string;
  password: string;
  confirmPassword: string;
};

const initialForm: FormState = {
  name: "",
  email: "",
  age: "",
  password: "",
  confirmPassword: "",
};

function authMessage(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

  if (code.includes("auth/invalid-credential") || code.includes("auth/wrong-password")) {
    return "Incorrect email or password.";
  }

  if (code.includes("auth/user-not-found")) {
    return "No account found with this email.";
  }

  if (code.includes("auth/email-already-in-use")) {
    return "An account already exists with this email.";
  }

  if (code.includes("auth/weak-password")) {
    return "Password should be at least 6 characters.";
  }

  return "Something went wrong. Please try again.";
}

export function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isSignup = mode === "signup";

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (isSignup && form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (isSignup) {
        const credential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(credential.user, { displayName: form.name });
        await setDoc(doc(db, "users", credential.user.uid), {
          uid: credential.user.uid,
          name: form.name,
          email: form.email,
          age: Number(form.age),
          createdAt: serverTimestamp(),
        });
        setForm(initialForm);
        return;
      }

      await signInWithEmailAndPassword(auth, form.email, form.password);
      setForm(initialForm);
    } catch (submitError) {
      setError(authMessage(submitError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box className="auth-screen">
      <Box className="auth-layout">
        <Box className="auth-form-panel">
          <Box className="auth-heading">
            <Typography component="h1">{isSignup ? "Create account!" : "Welcome back!"}</Typography>
            <Typography>
              {isSignup
                ? "Create your Daily Tracker account and start organizing your day."
                : "Simplify your workflow and boost your productivity with Daily Tracker."}
            </Typography>
          </Box>

          <Box component="form" className="auth-form" onSubmit={handleSubmit}>
            {error ? <Alert severity="error">{error}</Alert> : null}

            {isSignup ? (
              <>
                <TextField
                  placeholder="Name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  required
                  fullWidth
                />
                <TextField
                  placeholder="Age"
                  type="number"
                  value={form.age}
                  onChange={(event) => updateField("age", event.target.value)}
                  required
                  fullWidth
                  slotProps={{ htmlInput: { min: 1 } }}
                />
              </>
            ) : null}

            <TextField
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              required
              fullWidth
            />
            <TextField
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              required
              fullWidth
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((current) => !current)}
                        edge="end"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            {isSignup ? (
              <TextField
                placeholder="Confirm password"
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(event) => updateField("confirmPassword", event.target.value)}
                required
                fullWidth
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                          onClick={() => setShowConfirmPassword((current) => !current)}
                          edge="end"
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            ) : (
              <Button type="button" className="forgot-link">
                Forgot Password?
              </Button>
            )}

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={isSignup ? <FaRegUser /> : <FaArrowRightToBracket />}
            >
              {loading ? "Please wait..." : isSignup ? "Create Account" : "Login"}
            </Button>

            <Typography className="mode-switch">
              {isSignup ? "Already have an account?" : "Not a member?"}{" "}
              <Button type="button" onClick={() => changeMode(isSignup ? "login" : "signup")}>
                {isSignup ? "Login now" : "Register now"}
              </Button>
            </Typography>
          </Box>
        </Box>

        <Card className="auth-visual-card">
          <Box className="auth-visual-frame">
            <Image
              src={isSignup ? "/signup.png" : "/login.png"}
              alt={isSignup ? "Signup preview" : "Login preview"}
              width={1536}
              height={1024}
              priority
              className="auth-visual-image"
            />
          </Box>
          <Typography>
            Make your work easier and organized with <strong>Daily Tracker</strong>
          </Typography>
        </Card>
      </Box>
    </Box>
  );
}
