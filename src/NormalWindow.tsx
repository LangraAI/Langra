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
  const [isManualLangSelection, setIsManualLangSelection] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleProcess = useCallback(async () => {
    if (!sourceText.trim()) return;

    setIsProcessing(true);
    setResultText("");

    try {
      let langToUse = detectedLang;

      // Only auto-detect if language wasn't manually selected
      if (!isManualLangSelection) {
        console.log("[NORMAL_WINDOW] Auto-detecting language...");
        try {
          const detected = await invoke<string>("detect_language", { text: sourceText });
          console.log("[NORMAL_WINDOW] Detected language:", detected);
          setDetectedLang(detected);
          langToUse = detected;
        } catch (error) {
          console.error("[NORMAL_WINDOW] Language detection failed:", error);
          langToUse = "en"; // fallback to English
        }
      } else {
        console.log("[NORMAL_WINDOW] Using manually selected language:", langToUse);
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
  }, [sourceText, mode, detectedLang, isManualLangSelection]);

  // Debounced auto-processing
  useEffect(() => {
    if (!sourceText.trim()) {
      setResultText("");
      // Reset to auto-detect when text is cleared
      setIsManualLangSelection(false);
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
    setIsManualLangSelection(true); // Mark as manual selection
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
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "center", gap: "12px", alignItems: "center" }}>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, newMode) => {
              if (newMode !== null) {
                setMode(newMode);
                setResultText("");
              }
            }}
            size="small"
            sx={{
              height: "28px",
              "& .MuiToggleButton-root": {
                fontSize: "13px",
                padding: "4px 14px",
                color: "#a0a0a0",
                border: "1px solid #333",
                textTransform: "none",
                fontWeight: 500,
                minWidth: "80px",
                height: "28px",
                "&.Mui-selected": {
                  backgroundColor: "#64b5f6",
                  color: "#000",
                  borderColor: "#64b5f6",
                  "&:hover": {
                    backgroundColor: "#5aa3e0",
                  },
                },
                "&:hover": {
                  backgroundColor: "#2a2a2a",
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
              gap: "6px",
            }}
          >
            <Chip
              label={detectedLang === "de" ? "DE" : "EN"}
              size="small"
              sx={{
                backgroundColor: mode === "translate" ? "#2a2a2a" : "#222",
                color: mode === "translate" ? "#ddd" : "#666",
                fontWeight: 500,
                fontSize: "11px",
                height: "28px",
                minWidth: "36px",
                opacity: mode === "translate" ? 1 : 0.4,
              }}
            />
            <IconButton
              size="small"
              onClick={handleLanguageSwitch}
              disabled={isProcessing || mode === "enhance"}
              sx={{
                color: mode === "translate" ? "#64b5f6" : "#555",
                padding: "3px",
                "&:hover": { backgroundColor: mode === "translate" ? "#2a2a2a" : "transparent" },
                "&.Mui-disabled": { color: "#555", cursor: "not-allowed" },
                opacity: mode === "translate" ? 1 : 0.4,
              }}
            >
              <SwapHorizIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <Chip
              label={detectedLang === "de" ? "EN" : "DE"}
              size="small"
              sx={{
                backgroundColor: mode === "translate" ? "#2a2a2a" : "#222",
                color: mode === "translate" ? "#ddd" : "#666",
                fontWeight: 500,
                fontSize: "11px",
                height: "28px",
                minWidth: "36px",
                opacity: mode === "translate" ? 1 : 0.4,
              }}
            />
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: "12px", flex: 1, minHeight: 0 }}>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            <Typography sx={{
              color: "#888",
              fontSize: "11px",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              {mode === "translate" ? "Source" : "Original"}
            </Typography>
            <TextField
              fullWidth
              multiline
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder={mode === "translate" ? "Paste or type text to translate..." : "Paste or type text to fix..."}
              slotProps={{
                input: {
                  sx: {
                    fontSize: "13px",
                    lineHeight: 1.5,
                    color: "#e0e0e0",
                    backgroundColor: "#1a1a1a",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    height: "100%",
                    alignItems: "flex-start",
                    padding: "12px",
                  },
                },
              }}
              sx={{
                flex: 1,
                "& .MuiOutlinedInput-root": {
                  height: "100%",
                  "& fieldset": { borderColor: "#2a2a2a" },
                  "&:hover fieldset": { borderColor: "#444" },
                  "&.Mui-focused fieldset": { borderColor: "#64b5f6", borderWidth: "1px" },
                },
                "& .MuiInputBase-input::placeholder": {
                  color: "#555",
                  opacity: 1,
                  fontSize: "13px",
                },
              }}
            />
          </Box>

          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            <Typography sx={{
              color: "#888",
              fontSize: "11px",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              {mode === "translate" ? "Translation" : "Fixed"}
            </Typography>
            <TextField
              fullWidth
              multiline
              value={resultText}
              onChange={(e) => setResultText(e.target.value)}
              placeholder={isProcessing ? (mode === "translate" ? "Translating..." : "Fixing...") : "Result will appear here..."}
              slotProps={{
                input: {
                  sx: {
                    fontSize: "13px",
                    lineHeight: 1.5,
                    color: "#e0e0e0",
                    backgroundColor: "#1a1a1a",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    height: "100%",
                    alignItems: "flex-start",
                    padding: "12px",
                  },
                },
              }}
              sx={{
                flex: 1,
                "& .MuiOutlinedInput-root": {
                  height: "100%",
                  "& fieldset": { borderColor: "#2a2a2a" },
                  "&:hover fieldset": { borderColor: "#444" },
                  "&.Mui-focused fieldset": { borderColor: "#64b5f6", borderWidth: "1px" },
                },
                "& .MuiInputBase-input::placeholder": {
                  color: "#555",
                  opacity: 1,
                  fontSize: "13px",
                },
              }}
            />
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          padding: "12px 20px",
          borderTop: "1px solid #222",
          backgroundColor: "#151515",
          flexShrink: 0,
        }}
      >
        <Stack direction="row" spacing="12px" justifyContent="space-between" alignItems="center">
          <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {isProcessing && (
              <>
                <CircularProgress size={12} sx={{ color: "#64b5f6" }} />
                <Typography sx={{
                  color: "#888",
                  fontSize: "11px",
                  fontWeight: 400,
                }}>
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
            startIcon={<ContentCopyIcon sx={{ fontSize: 14 }} />}
            sx={{
              minWidth: "100px",
              height: "28px",
              fontSize: "13px",
              fontWeight: 500,
              textTransform: "none",
              backgroundColor: "#64b5f6",
              color: "#000",
              padding: "4px 12px",
              borderRadius: "4px",
              "&:hover": {
                backgroundColor: "#5aa3e0",
              },
              "&.Mui-disabled": {
                backgroundColor: "#222",
                color: "#555",
              },
            }}
          >
            Copy
          </Button>
        </Stack>
      </Box>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Box>
  );
}
