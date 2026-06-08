"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { User } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  FaBookOpen,
  FaBrain,
  FaDumbbell,
  FaHeartPulse,
  FaPlus,
  FaShoePrints,
  FaXmark,
} from "react-icons/fa6";
import { db } from "../firebase";

type QuestCategory = "fitness" | "health" | "mind" | "other";

type QuestDoc = {
  id: string;
  name: string;
  target?: string;
  category: QuestCategory;
  checks?: Record<string, boolean>;
};

type DailyQuestPanelProps = {
  user: User;
};

const categories = [
  { key: "fitness", label: "Fitness", icon: FaDumbbell },
  { key: "health", label: "Health", icon: FaHeartPulse },
  { key: "mind", label: "Mind", icon: FaBrain },
  { key: "other", label: "Other", icon: FaBookOpen },
] satisfies Array<{ key: QuestCategory; label: string; icon: React.ElementType }>;

function getDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCategoryMeta(category: QuestCategory) {
  return categories.find((item) => item.key === category) || categories[3];
}

export function DailyQuestPanel({ user }: DailyQuestPanelProps) {
  const [quests, setQuests] = useState<QuestDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [questName, setQuestName] = useState("");
  const [category, setCategory] = useState<QuestCategory>("fitness");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const todayKey = useMemo(() => getDateKey(), []);
  const questsRef = useMemo(() => collection(db, "daily_quest", user.uid, "quests"), [user.uid]);

  const completedCount = quests.filter((quest) => quest.checks?.[todayKey]).length;
  const progress = quests.length ? Math.round((completedCount / quests.length) * 100) : 0;

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(questsRef, orderBy("createdAt", "asc")),
      (snapshot) => {
        setQuests(
          snapshot.docs.map((questDoc) => {
            const data = questDoc.data();

            return {
              id: questDoc.id,
              name: String(data.name || ""),
              target: data.target ? String(data.target) : "",
              category: (data.category || "other") as QuestCategory,
              checks: data.checks as Record<string, boolean> | undefined,
            };
          }),
        );
        setError("");
        setIsLoading(false);
      },
      () => {
        setError("Daily Quest needs Firestore permission for your user account.");
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [questsRef]);

  function resetForm() {
    setQuestName("");
    setCategory("fitness");
  }

  function closeModal() {
    setIsAdding(false);
    resetForm();
  }

  async function handleCreateQuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = questName.trim();

    if (!name) {
      return;
    }

    try {
      setSavingId("new");
      await addDoc(questsRef, {
        name,
        category,
        checks: {
          [todayKey]: false,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      closeModal();
      setError("");
    } catch {
      setError("Could not create quest. Check your Firestore rules.");
    } finally {
      setSavingId(null);
    }
  }

  async function toggleQuest(quest: QuestDoc, checked: boolean) {
    try {
      setSavingId(quest.id);
      await updateDoc(doc(db, "daily_quest", user.uid, "quests", quest.id), {
        [`checks.${todayKey}`]: checked,
        updatedAt: serverTimestamp(),
      });
      setError("");
    } catch {
      setError("Could not update quest. Check your Firestore rules.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Box className="daily-quest-page">
      {isLoading ? (
        <Card className="daily-quest-list-card single">
          <Box className="daily-quest-loading">
            <CircularProgress size={26} />
          </Box>
        </Card>
      ) : quests.length === 0 ? (
        <Box className="daily-quest-empty-card">
          {error ? <Typography className="daily-quest-error">{error}</Typography> : null}
          <Box className="daily-quest-empty-visual">
            <Image src="/noquest.png" alt="No daily quests" width={360} height={360} priority />
          </Box>
          <Box className="daily-quest-empty-copy">
            <Typography component="h3">No Daily Quests Yet</Typography>
            <Typography>
              You don&apos;t have any daily quests yet. Create your first quest and start building your streak!
            </Typography>
            <Button variant="contained" startIcon={<FaPlus />} onClick={() => setIsAdding(true)}>
              Create New Quest
            </Button>
          </Box>
        </Box>
      ) : (
        <Card className="daily-quest-list-card">
          <Stack direction="row" className="daily-quest-progress-head">
            <Typography>Progress</Typography>
            <span>
              {completedCount} / {quests.length} Done
            </span>
            <strong>{progress}%</strong>
          </Stack>
          <Box className="daily-quest-progress-track">
            <span style={{ width: `${progress}%` }} />
          </Box>

          {error ? <Typography className="daily-quest-error">{error}</Typography> : null}

          <Stack className="daily-quest-list" spacing={1.2}>
            {quests.map((quest) => {
              const checked = Boolean(quest.checks?.[todayKey]);
              const meta = getCategoryMeta(quest.category);
              const Icon = meta.icon;
              const fallbackIcon = quest.name.toLowerCase().includes("step") ? FaShoePrints : Icon;
              const QuestIcon = fallbackIcon;

              return (
                <Box
                  className={`daily-quest-item ${quest.category} ${checked ? "checked" : ""}`}
                  key={quest.id}
                >
                  <Box className="daily-quest-icon">
                    <QuestIcon />
                  </Box>
                  <Box className="daily-quest-copy">
                    <Typography>{quest.name}</Typography>
                    {quest.target ? <span>{quest.target}</span> : null}
                  </Box>
                  <Checkbox
                    checked={checked}
                    disabled={savingId === quest.id}
                    onChange={(event) => toggleQuest(quest, event.target.checked)}
                  />
                </Box>
              );
            })}
          </Stack>

          <Button className="daily-quest-add-inline" startIcon={<FaPlus />} onClick={() => setIsAdding(true)}>
            New Quest
          </Button>
        </Card>
      )}

      <Dialog
        open={isAdding}
        onClose={closeModal}
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: { className: "quest-dialog" } }}
      >
        <DialogTitle>
          Create New Quest
          <IconButton aria-label="Close create quest" onClick={closeModal}>
            <FaXmark />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box component="form" className="quest-dialog-form" onSubmit={handleCreateQuest}>
            <Typography>Quest Name</Typography>
            <TextField
              placeholder="e.g. 100 Pushups, 10,000 Steps"
              value={questName}
              onChange={(event) => setQuestName(event.target.value)}
              fullWidth
              autoFocus
            />

            <Typography>Category</Typography>
            <Box className="quest-category-grid">
              {categories.map((item) => {
                const Icon = item.icon;

                return (
                  <Button
                    type="button"
                    key={item.key}
                    className={category === item.key ? "selected" : ""}
                    startIcon={<Icon />}
                    onClick={() => setCategory(item.key)}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>

            <Stack direction="row" className="quest-dialog-actions">
              <Button type="button" variant="outlined" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={savingId === "new"}>
                Create Quest
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
