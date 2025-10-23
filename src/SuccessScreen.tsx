import { Box, Typography, Button, Paper, Chip } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

interface SuccessScreenProps {
  onClose: () => void;
}

export function SuccessScreen({ onClose }: SuccessScreenProps) {
  const handleGotIt = async () => {
    onClose();
    await invoke("hide_translator_window");
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
      <Paper
        elevation={0}
        sx={{
          maxWidth: 440,
          width: "100%",
          padding: 4,
          background: "#242424",
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mb: 2,
          }}
        >
          <CheckCircleOutlineIcon
            sx={{
              fontSize: 64,
              color: "#4caf50",
            }}
          />
        </Box>

        <Typography
          variant="h5"
          sx={{
            color: "#e0e0e0",
            fontWeight: 500,
            mb: 3,
          }}
        >
          Settings saved successfully!
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: "#b3b3b3",
            mb: 1,
            lineHeight: 1.6,
          }}
        >
          Highlight any text and press
        </Typography>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 1,
            mb: 4,
          }}
        >
          <Chip
            label="Cmd+C+C"
            size="small"
            sx={{
              backgroundColor: "#333333",
              color: "#64b5f6",
              fontFamily: "monospace",
              fontWeight: 500,
              fontSize: "0.85rem",
            }}
          />
          <Typography variant="body2" sx={{ color: "#b3b3b3" }}>
            or
          </Typography>
          <Chip
            label="Ctrl+C+C"
            size="small"
            sx={{
              backgroundColor: "#333333",
              color: "#64b5f6",
              fontFamily: "monospace",
              fontWeight: 500,
              fontSize: "0.85rem",
            }}
          />
        </Box>

        <Button
          variant="contained"
          fullWidth
          onClick={handleGotIt}
          disableElevation
          sx={{
            backgroundColor: "#64b5f6",
            color: "#000",
            textTransform: "none",
            fontWeight: 500,
            py: 1.5,
            "&:hover": {
              backgroundColor: "#42a5f5",
            },
          }}
        >
          Got it!
        </Button>
      </Paper>
    </Box>
  );
}
