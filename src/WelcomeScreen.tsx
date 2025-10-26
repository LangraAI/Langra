import { useState } from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import KeyIcon from "@mui/icons-material/Key";
import LoginIcon from "@mui/icons-material/Login";
import { LoginDialog } from "./LoginDialog";

interface WelcomeScreenProps {
  onOpenSettings: () => void;
  onLoginSuccess?: () => void;
}

export function WelcomeScreen({ onOpenSettings, onLoginSuccess }: WelcomeScreenProps) {
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
          maxWidth: 440,
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
            width: 120,
            height: 120,
            mb: 3,
            display: "block",
          }}
        />

        <Typography
          variant="h4"
          sx={{
            color: "#e0e0e0",
            fontWeight: 500,
            mb: 1.5,
          }}
        >
          Welcome to Langra
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: "#b3b3b3",
            mb: 4,
            lineHeight: 1.6,
          }}
        >
          Choose how you want to get started
        </Typography>

        <Stack spacing={2} sx={{ pointerEvents: "auto" }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<LoginIcon />}
            onClick={handleLoginClick}
            disableElevation
            sx={{
              backgroundColor: "#64b5f6",
              color: "#000",
              textTransform: "none",
              fontWeight: 500,
              py: 1.5,
              fontSize: "0.95rem",
              cursor: "pointer",
              "&:hover": {
                backgroundColor: "#42a5f5",
              },
            }}
          >
            Use Langra Account
          </Button>

          <Button
            variant="outlined"
            fullWidth
            startIcon={<KeyIcon />}
            onClick={onOpenSettings}
            sx={{
              borderColor: "#4a4a4a",
              color: "#e0e0e0",
              textTransform: "none",
              fontWeight: 500,
              py: 1.5,
              fontSize: "0.95rem",
              cursor: "pointer",
              "&:hover": {
                borderColor: "#64b5f6",
                backgroundColor: "#333333",
              },
            }}
          >
            Add your own API key
          </Button>
        </Stack>

        <Typography
          variant="caption"
          sx={{
            color: "#808080",
            display: "block",
            mt: 4,
            fontSize: "0.8rem",
          }}
        >
          Your API keys are stored locally and never shared
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
