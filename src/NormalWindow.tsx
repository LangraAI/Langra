import { Box, Typography, TextField, Button, ToggleButtonGroup, ToggleButton, Stack, CircularProgress, IconButton } from "@mui/material";
import { useState, useEffect, useCallback } from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SettingsIcon from "@mui/icons-material/Settings";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { SettingsDialog } from "./SettingsDialog";

export function NormalWindow() {
  const [mode, setMode] = useState<"translate" | "enhance">("translate");
  const [sourceText, setSourceText] = useState("");
  const [resultText, setResultText] = useState("");
  const [sourceLang, setSourceLang] = useState("de");
  const [isProcessing, setIsProcessing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Debounced auto-processing
  useEffect(() => {
    if (!sourceText.trim()) {
      setResultText("");
      return;
    }

    const timeoutId = setTimeout(() => {
      handleProcess();
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [sourceText, mode, sourceLang, handleProcess]);

  useEffect(() => {
    const currentWindow = getCurrentWebviewWindow();
    const unlistenFns: (() => void)[] = [];

    const setupListeners = async () => {
      const unlistenPartial = await currentWindow.listen<string>(
        mode === "translate" ? "translation-partial" : "enhancement-partial",
        (event) => {
          setResultText(event.payload);
          setIsProcessing(true);
        }
      );
      unlistenFns.push(unlistenPartial);

      const unlistenComplete = await currentWindow.listen("translation-complete", () => {
        setIsProcessing(false);
      });
      unlistenFns.push(unlistenComplete);

      const unlistenError = await currentWindow.listen<string>("translation-error", (event) => {
        setResultText(`Error: ${event.payload}`);
        setIsProcessing(false);
      });
      unlistenFns.push(unlistenError);
    };

    setupListeners();

    return () => {
      unlistenFns.forEach(fn => fn());
    };
  }, [mode]);

  const handleProcess = useCallback(async () => {
    if (!sourceText.trim()) return;

    setIsProcessing(true);
    setResultText("");

    try {
      if (mode === "translate") {
        await invoke("retranslate", {
          text: sourceText,
          sourceLang: sourceLang,
        });
      } else {
        await invoke("enhance_text", {
          text: sourceText,
          language: sourceLang,
        });
      }
    } catch (error) {
      console.error("[NORMAL_WINDOW] Processing failed:", error);
      setResultText("Processing failed. Please try again.");
      setIsProcessing(false);
    }
  }, [sourceText, mode, sourceLang]);

  const handleCopy = async () => {
    if (!resultText) return;
    try {
      await invoke("copy_to_clipboard", { text: resultText });
    } catch (error) {
      console.error("[NORMAL_WINDOW] Copy failed:", error);
    }
  };

  const handleReplace = async () => {
    if (!resultText) return;
    try {
      await invoke("insert_translation_into_previous_input", { text: resultText });
    } catch (error) {
      console.error("[NORMAL_WINDOW] Replace failed:", error);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#1a1a1a",
        overflow: "hidden",
      }}
    >
      <Box
        data-tauri-drag-region
        sx={{
          height: "48px",
          backgroundColor: "#242424",
          borderBottom: "1px solid #333333",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "0 16px",
          flexShrink: 0,
          cursor: "move",
        }}
      >
        <IconButton
          size="small"
          onClick={() => setSettingsOpen(true)}
          sx={{
            color: "#999999",
            "&:hover": { backgroundColor: "#333333" },
          }}
        >
          <SettingsIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, newMode) => {
              if (newMode !== null) {
                setMode(newMode);
                setResultText("");
              }
            }}
            size="medium"
            sx={{
              "& .MuiToggleButton-root": {
                fontSize: "0.9375rem",
                padding: "8px 24px",
                color: "#b3b3b3",
                border: "1px solid #4a4a4a",
                textTransform: "none",
                fontWeight: 600,
                minWidth: "120px",
                "&.Mui-selected": {
                  backgroundColor: "#64b5f6",
                  color: "#000",
                  borderColor: "#64b5f6",
                  "&:hover": {
                    backgroundColor: "#42a5f5",
                  },
                },
                "&:hover": {
                  backgroundColor: "#333333",
                },
              },
            }}
          >
            <ToggleButton value="translate">Translate</ToggleButton>
            <ToggleButton value="enhance">Fix</ToggleButton>
          </ToggleButtonGroup>

          <ToggleButtonGroup
            value={sourceLang}
            exclusive
            onChange={(_, newLang) => {
              if (newLang !== null) {
                setSourceLang(newLang);
                setResultText("");
              }
            }}
            size="medium"
            sx={{
              "& .MuiToggleButton-root": {
                fontSize: "0.9375rem",
                padding: "8px 16px",
                color: "#b3b3b3",
                border: "1px solid #4a4a4a",
                textTransform: "none",
                fontWeight: 600,
                minWidth: "60px",
                "&.Mui-selected": {
                  backgroundColor: "#64b5f6",
                  color: "#000",
                  borderColor: "#64b5f6",
                  "&:hover": {
                    backgroundColor: "#42a5f5",
                  },
                },
                "&:hover": {
                  backgroundColor: "#333333",
                },
              },
            }}
          >
            <ToggleButton value="en">EN</ToggleButton>
            <ToggleButton value="de">DE</ToggleButton>
            <ToggleButton value="fr">FR</ToggleButton>
            <ToggleButton value="es">ES</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <TextField
          fullWidth
          multiline
          rows={12}
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          placeholder={mode === "translate" ? "Paste or type text to translate..." : "Paste or type text to fix..."}
          InputProps={{
            sx: {
              fontSize: "1rem",
              lineHeight: 1.7,
              color: "#e0e0e0",
              backgroundColor: "#1f1f1f",
              fontFamily: "system-ui, -apple-system, sans-serif",
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "#4a4a4a" },
              "&:hover fieldset": { borderColor: "#64b5f6" },
              "&.Mui-focused fieldset": { borderColor: "#64b5f6" },
            },
            "& .MuiInputBase-input::placeholder": {
              color: "#666666",
              opacity: 1,
            },
          }}
        />

        {isProcessing && (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1.5 }}>
            <CircularProgress size={20} sx={{ color: "#64b5f6" }} />
            <Typography sx={{ color: "#b3b3b3", fontSize: "0.875rem" }}>
              {mode === "translate" ? "Translating..." : "Fixing..."}
            </Typography>
          </Box>
        )}

        <TextField
          fullWidth
          multiline
          rows={12}
          value={resultText}
          onChange={(e) => setResultText(e.target.value)}
          placeholder="Result will appear here..."
          InputProps={{
            sx: {
              fontSize: "1rem",
              lineHeight: 1.7,
              color: "#e0e0e0",
              backgroundColor: "#1f1f1f",
              fontFamily: "system-ui, -apple-system, sans-serif",
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "#4a4a4a" },
              "&:hover fieldset": { borderColor: "#64b5f6" },
              "&.Mui-focused fieldset": { borderColor: "#64b5f6" },
            },
            "& .MuiInputBase-input::placeholder": {
              color: "#666666",
              opacity: 1,
            },
          }}
        />
      </Box>

      <Box
        sx={{
          padding: "12px 16px",
          borderTop: "1px solid #333333",
          backgroundColor: "#1f1f1f",
          flexShrink: 0,
        }}
      >
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            variant="text"
            size="small"
            onClick={handleCopy}
            disabled={!resultText}
            startIcon={<ContentCopyIcon sx={{ fontSize: 16 }} />}
            sx={{
              minWidth: 80,
              height: 36,
              fontSize: "0.875rem",
              fontWeight: 500,
              textTransform: "none",
              color: "#64b5f6",
              "&:hover": {
                backgroundColor: "#333333",
              },
              "&.Mui-disabled": {
                color: "#666666",
              },
            }}
          >
            Copy
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleReplace}
            disabled={!resultText}
            disableElevation
            sx={{
              minWidth: 80,
              height: 36,
              fontSize: "0.875rem",
              fontWeight: 500,
              textTransform: "none",
              backgroundColor: "#64b5f6",
              color: "#000000",
              "&:hover": {
                backgroundColor: "#42a5f5",
              },
              "&.Mui-disabled": {
                backgroundColor: "#333333",
                color: "#666666",
              },
            }}
          >
            Replace
          </Button>
        </Stack>
      </Box>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Box>
  );
}
