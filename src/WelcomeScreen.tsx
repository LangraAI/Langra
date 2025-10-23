import { Box, Typography, Button, Stack, Paper } from "@mui/material";
import KeyIcon from "@mui/icons-material/Key";
import LoginIcon from "@mui/icons-material/Login";

interface WelcomeScreenProps {
  onOpenSettings: () => void;
}

export function WelcomeScreen({ onOpenSettings }: WelcomeScreenProps) {
  const handleLoginRegister = () => {
    window.open("https://langra.app/auth", "_blank");
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1a1a1a",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 480,
          width: "90%",
          padding: 5,
          background: "#242424",
          textAlign: "center",
        }}
      >
        <Box
          component="img"
          src="/logo.png"
          alt="Langra Logo"
          sx={{
            width: 80,
            height: 80,
            mb: 2,
          }}
        />
        <Typography
          variant="h5"
          sx={{
            color: "#e0e0e0",
            fontWeight: 500,
            mb: 2,
          }}
        >
          Welcome to Langra
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "#b3b3b3",
            mb: 3,
            lineHeight: 1.6,
          }}
        >
          Choose how you want to get started
        </Typography>

        <Stack spacing={1.5}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<LoginIcon />}
            onClick={handleLoginRegister}
            disableElevation
            sx={{
              backgroundColor: "#64b5f6",
              color: "#000",
              textTransform: "none",
              fontWeight: 500,
              "&:hover": {
                backgroundColor: "#42a5f5",
              },
            }}
          >
            Login/Register
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
            mt: 3,
          }}
        >
          Your API keys are stored locally and never shared
        </Typography>
      </Paper>
    </Box>
  );
}
