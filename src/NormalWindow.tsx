import { Box, Typography, TextField, Button, ToggleButtonGroup, ToggleButton, Stack, CircularProgress, IconButton, Chip } from "@mui/material";
import { useState, useEffect, useCallback } from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SettingsIcon from "@mui/icons-material/Settings";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { SettingsDialog } from "./SettingsDialog";

export function NormalWindow() {
  const [mode, setMode] = useState<"translate" | "enhance">("translate");
  const [sourceText, setSourceText] = useState("");
  const [resultText, setResultText] = useState("");
  const [detectedLang, setDetectedLang] = useState<string>("en");
  const [isProcessing, setIsProcessing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleProcess = useCallback(async () => {
    if (!sourceText.trim()) return;

    setIsProcessing(true);
    setResultText("");

    try {
      // Auto-detect the language
      console.log("[NORMAL_WINDOW] Auto-detecting language...");
      let langToUse = detectedLang;
      try {
        const detected = await invoke<string>("detect_language", { text: sourceText });
        console.log("[NORMAL_WINDOW] Detected language:", detected);
        setDetectedLang(detected);
        langToUse = detected;
      } catch (error) {
        console.error("[NORMAL_WINDOW] Language detection failed:", error);
        langToUse = "en"; // fallback to English
      }

      if (mode === "translate") {
        await invoke("retranslate", {
          text: sourceText,
          sourceLang: langToUse,
        });
      } else {
        await invoke("enhance_text", {
          text: sourceText,
          language: langToUse,
        });
      }
    } catch (error) {
      console.error("[NORMAL_WINDOW] Processing failed:", error);
      setResultText("Processing failed. Please try again.");
      setIsProcessing(false);
    }
  }, [sourceText, mode, detectedLang]);

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
  }, [sourceText, mode, handleProcess]);

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

  const handleCopy = async () => {
    if (!resultText) return;
    try {
      await invoke("copy_to_clipboard", { text: resultText });
    } catch (error) {
      console.error("[NORMAL_WINDOW] Copy failed:", error);
    }
  };

  const handleLanguageSwitch = () => {
    const newLang = detectedLang === "de" ? "en" : "de";
    setDetectedLang(newLang);
    setResultText("");

    // Only trigger translation if there's text to translate
    if (sourceText.trim()) {
      setIsProcessing(true);
      invoke("retranslate", {
        text: sourceText,
        sourceLang: newLang,
      });
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
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
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

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Chip
              label={detectedLang === "de" ? "DE" : "EN"}
              size="medium"
              sx={{
                backgroundColor: mode === "translate" ? "#333333" : "#2a2a2a",
                color: mode === "translate" ? "#e0e0e0" : "#666666",
                fontWeight: 600,
                fontSize: "0.875rem",
                height: "36px",
                minWidth: "48px",
                opacity: mode === "translate" ? 1 : 0.5,
              }}
            />
            <IconButton
              size="small"
              onClick={handleLanguageSwitch}
              disabled={isProcessing || mode === "enhance"}
              sx={{
                color: mode === "translate" ? "#64b5f6" : "#555555",
                padding: "6px",
                "&:hover": { backgroundColor: mode === "translate" ? "#333333" : "transparent" },
                "&.Mui-disabled": { color: "#555555", cursor: "not-allowed" },
                opacity: mode === "translate" ? 1 : 0.5,
              }}
            >
              <SwapHorizIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <Chip
              label={detectedLang === "de" ? "EN" : "DE"}
              size="medium"
              sx={{
                backgroundColor: mode === "translate" ? "#333333" : "#2a2a2a",
                color: mode === "translate" ? "#e0e0e0" : "#666666",
                fontWeight: 600,
                fontSize: "0.875rem",
                height: "36px",
                minWidth: "48px",
                opacity: mode === "translate" ? 1 : 0.5,
              }}
            />
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 3, flex: 1, minHeight: 0 }}>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography sx={{ color: "#b3b3b3", fontSize: "0.875rem", fontWeight: 500 }}>
              {mode === "translate" ? "Source" : "Original"}
            </Typography>
            <TextField
              fullWidth
              multiline
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
                  height: "100%",
                  alignItems: "flex-start",
                },
              }}
              sx={{
                flex: 1,
                "& .MuiOutlinedInput-root": {
                  height: "100%",
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

          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography sx={{ color: "#b3b3b3", fontSize: "0.875rem", fontWeight: 500 }}>
              {mode === "translate" ? "Translation" : "Fixed"}
            </Typography>
            <TextField
              fullWidth
              multiline
              value={resultText}
              onChange={(e) => setResultText(e.target.value)}
              placeholder={isProcessing ? (mode === "translate" ? "Translating..." : "Fixing...") : "Result will appear here..."}
              InputProps={{
                sx: {
                  fontSize: "1rem",
                  lineHeight: 1.7,
                  color: "#e0e0e0",
                  backgroundColor: "#1f1f1f",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  height: "100%",
                  alignItems: "flex-start",
                },
              }}
              sx={{
                flex: 1,
                "& .MuiOutlinedInput-root": {
                  height: "100%",
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
        </Box>
      </Box>

      <Box
        sx={{
          padding: "12px 16px",
          borderTop: "1px solid #333333",
          backgroundColor: "#1f1f1f",
          flexShrink: 0,
        }}
      >
        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {isProcessing && (
              <>
                <CircularProgress size={16} sx={{ color: "#64b5f6" }} />
                <Typography sx={{ color: "#b3b3b3", fontSize: "0.75rem" }}>
                  {mode === "translate" ? "Translating..." : "Fixing..."}
                </Typography>
              </>
            )}
          </Box>
          <Button
            variant="contained"
            size="small"
            onClick={handleCopy}
            disabled={!resultText || isProcessing}
            disableElevation
            startIcon={<ContentCopyIcon sx={{ fontSize: 16 }} />}
            sx={{
              minWidth: 140,
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
            Copy Translation
          </Button>
        </Stack>
      </Box>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Box>
  );
}
