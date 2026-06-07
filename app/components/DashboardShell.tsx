"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { signOut, User } from "firebase/auth";
import {
  FaBookOpen,
  FaCircleQuestion,
  FaGaugeHigh,
  FaListCheck,
  FaRightFromBracket,
  FaUser,
} from "react-icons/fa6";
import { IoChevronBack, IoChevronForward, IoSettingsSharp } from "react-icons/io5";
import { RiSwordFill } from "react-icons/ri";
import { auth } from "../firebase";
import { DailyQuestPanel } from "./DailyQuestPanel";

type RouteKey = "dashboard" | "daily-quest" | "daily-missions" | "skills" | "settings" | "help-support";

type DashboardShellProps = {
  active: RouteKey;
  pageTitle?: string;
  user: User;
};

const mainNav = [
  { key: "dashboard", label: "Dashboard", href: "/", icon: FaGaugeHigh },
  { key: "daily-quest", label: "Daily Quest", href: "/daily-quest", icon: FaBookOpen },
  { key: "daily-missions", label: "Daily Missions", href: "/daily-missions", icon: FaListCheck },
  { key: "skills", label: "Skills", href: "/skills", icon: RiSwordFill },
] satisfies Array<{ key: RouteKey; label: string; href: string; icon: React.ElementType }>;

const bottomNav = [
  { key: "settings", label: "Settings", href: "/settings", icon: IoSettingsSharp },
  { key: "help-support", label: "Help & Support", href: "/help-support", icon: FaCircleQuestion },
] satisfies Array<{ key: RouteKey; label: string; href: string; icon: React.ElementType }>;

const SIDEBAR_STORAGE_KEY = "daily-tracker-sidebar-collapsed";

function getGreeting() {
  const hour = new Date().getHours();

  if (hour >= 0 && hour <= 11) {
    return "Good Morning";
  }

  if (hour >= 12 && hour <= 15) {
    return "Good Afternoon";
  }

  return "Good Evening";
}

function getDisplayName(user: User) {
  return user.displayName || user.email?.split("@")[0] || "User";
}

export function DashboardShell({ active, pageTitle, user }: DashboardShellProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  });

  const displayName = getDisplayName(user);
  const greeting = useMemo(() => getGreeting(), []);
  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    [],
  );

  const isDashboard = active === "dashboard";

  function toggleSidebar() {
    setIsSidebarCollapsed((currentValue) => {
      const nextValue = !currentValue;
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextValue));
      return nextValue;
    });
  }

  function renderNav(items: typeof mainNav | typeof bottomNav) {
    return items.map((item) => {
      const Icon = item.icon;

      return (
        <Tooltip
          key={item.key}
          title={isSidebarCollapsed ? item.label : ""}
          placement="right"
          arrow
          disableInteractive
        >
          <Button
            component={Link}
            href={item.href}
            className={active === item.key ? "dashboard-nav-item active" : "dashboard-nav-item"}
            startIcon={<Icon />}
            fullWidth
            aria-label={item.label}
          >
            <span className="dashboard-nav-label">{item.label}</span>
          </Button>
        </Tooltip>
      );
    });
  }

  return (
    <Box className={isSidebarCollapsed ? "dashboard-app sidebar-collapsed" : "dashboard-app"}>
      <Box component="aside" className="dashboard-sidebar">
        <Box className="dashboard-sidebar-header">
          <Typography className="dashboard-brand">{isSidebarCollapsed ? "DT" : "Daily Tracker"}</Typography>
          <IconButton
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? <IoChevronForward /> : <IoChevronBack />}
          </IconButton>
        </Box>

        <Stack component="nav" spacing={0.8} className="dashboard-nav">
          {renderNav(mainNav)}
        </Stack>

        <Stack component="nav" spacing={0.8} className="dashboard-bottom-nav">
          {renderNav(bottomNav)}
        </Stack>
      </Box>

      <Box className="dashboard-main">
        <Box component="header" className={active === "daily-quest" ? "dashboard-topbar with-page-title" : "dashboard-topbar"}>
          {active === "daily-quest" ? (
            <Box className="topbar-page-title">
              <Typography component="h1">Daily Quest</Typography>
            </Box>
          ) : (
            <Box />
          )}
          <IconButton className="user-avatar-button" onClick={(event) => setAnchorEl(event.currentTarget)}>
            <Avatar src={user.photoURL || undefined}>{displayName.charAt(0).toUpperCase()}</Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <Box className="user-menu-details">
              <Avatar src={user.photoURL || undefined}>{displayName.charAt(0).toUpperCase()}</Avatar>
              <Box>
                <Typography>{displayName}</Typography>
                <span>{user.email}</span>
              </Box>
            </Box>
            <Divider />
            <MenuItem disabled>
              <ListItemIcon>
                <FaUser />
              </ListItemIcon>
              User details
            </MenuItem>
            <MenuItem onClick={() => signOut(auth)}>
              <ListItemIcon>
                <FaRightFromBracket />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Box>

        <Box component="main" className="dashboard-content">
          {isDashboard ? (
            <Box className="dashboard-greeting">
              <Typography className="dashboard-date">{dateLabel}</Typography>
              <Typography component="h1">
                {greeting}! {displayName},
              </Typography>
            </Box>
          ) : active === "daily-quest" ? (
            <DailyQuestPanel user={user} />
          ) : (
            <Box className="dashboard-greeting">
              <Typography className="dashboard-date">{dateLabel}</Typography>
              <Typography component="h1">{pageTitle}</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
