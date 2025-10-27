import { useState } from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import { LoginDialog } from "./LoginDialog";

interface WelcomeScreenProps {
  onLoginSuccess?: () => void;
}

export function WelcomeScreen({ onLoginSuccess }: WelcomeScreenProps) {
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  const handleLoginClick = () => {
    setLoginDialogOpen(true);
  };

  return (
    <Box
      data-tauri-drag-region
      sx={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#1a1a1a",
        padding: 4,
        cursor: "move",
      }}
    >
      <Box
        sx={{
          textAlign: "center",
          maxWidth: 360,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pointerEvents: "auto",
        }}
      >
        <Box
          component="img"
          src="/logo.png"
          alt="Langra Logo"
          sx={{
            width: 80,
            height: 80,
            mb: 2.5,
            display: "block",
          }}
        />

        <Typography
          sx={{
            color: "#e0e0e0",
            fontWeight: 500,
            mb: 1,
            fontSize: "20px",
            letterSpacing: "-0.2px",
          }}
        >
          Welcome to Langra
        </Typography>

        <Typography
          sx={{
            color: "#888",
            mb: 3,
            lineHeight: 1.5,
            fontSize: "13px",
          }}
        >
          Sign in to get started with instant translations
        </Typography>

        <Stack spacing="12px" sx={{ pointerEvents: "auto", width: "100%" }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<LoginIcon sx={{ fontSize: 16 }} />}
            onClick={handleLoginClick}
            disableElevation
            sx={{
              backgroundColor: "#64b5f6",
              color: "#000",
              textTransform: "none",
              fontWeight: 500,
              height: "36px",
              fontSize: "13px",
              cursor: "pointer",
              borderRadius: "4px",
              "&:hover": {
                backgroundColor: "#5aa3e0",
              },
            }}
          >
            Sign In / Sign Up
          </Button>
        </Stack>

        <Typography
          sx={{
            color: "#666",
            display: "block",
            mt: 3,
            fontSize: "11px",
            lineHeight: 1.5,
          }}
        >
          Free tier with 10,000 characters/month
          <br />
          Or bring your own API key for unlimited usage
        </Typography>
      </Box>

      <LoginDialog
        open={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        onLoginSuccess={() => {
          setLoginDialogOpen(false);
          onLoginSuccess?.();
        }}
      />
    </Box>
  );
}
