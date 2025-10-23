import { Box, Paper, Typography, Button, Stack, Fade, CircularProgress, IconButton, Chip, Divider, ToggleButtonGroup, ToggleButton } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import SettingsIcon from "@mui/icons-material/Settings";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { SettingsDialog } from "./SettingsDialog";

interface PopupProps {
  translation: string;
  isOpen: boolean;
  isStreaming: boolean;
  detectedLanguage: string;
  mode: "translate" | "enhance";
  onCopy: () => void;
  onReplace: () => void;
  onClose: () => void;
  onLanguageSwitch: () => void;
  onModeChange: (mode: "translate" | "enhance") => void;
}

export function TranslationPopup({
  translation,
  isOpen,
  isStreaming,
  detectedLanguage,
  mode,
  onCopy,
  onReplace,
  onClose,
  onLanguageSwitch,
  onModeChange,
}: PopupProps) {
  const contentEndRef = useRef<HTMLDivElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isStreaming && contentEndRef.current) {
      contentEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [translation, isStreaming]);

  if (!isOpen) {
    return null;
  }

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Fade in={isOpen} timeout={150}>
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            height: "100vh",
            maxHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            borderRadius: 0,
            overflow: "hidden",
            background: "#1a1a1a",
            boxShadow: "none",
            border: "none",
            position: "relative",
          }}
        >
          <Box
            sx={{
              borderBottom: "1px solid #333333",
              background: "#242424",
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                padding: "8px 12px",
                gap: 1,
                minHeight: "40px",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <IconButton
                size="small"
                onClick={() => setSettingsOpen(true)}
                sx={{
                  color: "#999999",
                  padding: "4px",
                  flexShrink: 0,
                  "&:hover": { backgroundColor: "#333333" },
                }}
              >
                <SettingsIcon sx={{ fontSize: 16 }} />
              </IconButton>

              <Box
                data-tauri-drag-region
                sx={{
                  flex: 1,
                  cursor: "move",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 0,
                  overflow: "hidden",
                }}
              >
                <ToggleButtonGroup
                  value={mode}
                  exclusive
                  onChange={(_, newMode) => {
                    if (newMode !== null) {
                      onModeChange(newMode);
                    }
                  }}
                  size="small"
                  sx={{
                    height: "26px",
                    flexShrink: 0,
                    "& .MuiToggleButton-root": {
                      fontSize: "0.7rem",
                      padding: "3px 10px",
                      color: "#b3b3b3",
                      border: "1px solid #4a4a4a",
                      textTransform: "none",
                      fontWeight: 500,
                      lineHeight: "1.2",
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
                  <ToggleButton value="translate">
                    Translate
                  </ToggleButton>
                  <ToggleButton value="enhance">
                    Fix
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Box sx={{ width: 20, flexShrink: 0 }} />
            </Box>

            {mode === "translate" && (
              <>
                <Divider sx={{ borderColor: "#333333" }} />
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px 12px",
                    gap: 1,
                    minHeight: "44px",
                    minWidth: 0,
                    overflow: "hidden",
                  }}
                >
                  <Chip
                    label={detectedLanguage === "de" ? "German" : "English"}
                    size="small"
                    sx={{
                      backgroundColor: "#333333",
                      color: "#e0e0e0",
                      fontWeight: 500,
                      fontSize: "0.75rem",
                      height: "26px",
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={onLanguageSwitch}
                    disabled={isStreaming}
                    sx={{
                      color: "#64b5f6",
                      padding: "4px",
                      "&:hover": { backgroundColor: "#333333" },
                      "&.Mui-disabled": { color: "#555555" },
                    }}
                  >
                    <SwapHorizIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <Chip
                    label={detectedLanguage === "de" ? "English" : "German"}
                    size="small"
                    sx={{
                      backgroundColor: "#333333",
                      color: "#e0e0e0",
                      fontWeight: 500,
                      fontSize: "0.75rem",
                      height: "26px",
                    }}
                  />
                </Box>
              </>
            )}

          </Box>
          <Box
            sx={{
              flex: 1,
              overflow: "auto",
              padding: 3,
              minHeight: 0,
              position: "relative",
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-track": {
                background: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "#4a4a4a",
                borderRadius: "3px",
                "&:hover": {
                  background: "#5a5a5a",
                },
              },
            }}
          >
            {!translation && isStreaming ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 120,
                  color: "#b3b3b3",
                }}
              >
                <CircularProgress size={24} sx={{ marginRight: 2, color: "#64b5f6" }} />
                <Typography variant="body2">{mode === "enhance" ? "Fixing..." : "Translating..."}</Typography>
              </Box>
            ) : (
              <>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: "1rem",
                    lineHeight: 1.6,
                    color: "#e0e0e0",
                    wordWrap: "break-word",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {translation}
                  {isStreaming && (
                    <Box
                      component="span"
                      sx={{
                        display: "inline-block",
                        width: "2px",
                        height: "1.2em",
                        backgroundColor: "#64b5f6",
                        marginLeft: "2px",
                        animation: "blink 1s infinite",
                        "@keyframes blink": {
                          "0%, 49%": { opacity: 1 },
                          "50%, 100%": { opacity: 0 },
                        },
                      }}
                    />
                  )}
                </Typography>
                <div ref={contentEndRef} />
              </>
            )}
          </Box>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              padding: "12px 16px",
              backgroundColor: "#1f1f1f",
              borderTop: "1px solid #333333",
              flexShrink: 0,
            }}
          >
            <Button
              variant="text"
              onClick={onClose}
              size="small"
              sx={{
                minWidth: 64,
                height: 36,
                fontSize: "0.875rem",
                fontWeight: 500,
                textTransform: "none",
                color: "#b3b3b3",
                "&:hover": {
                  backgroundColor: "#333333",
                },
              }}
            >
              Close
            </Button>

            <Box sx={{ flex: 1 }} />

            <Button
              variant="text"
              onClick={onCopy}
              size="small"
              disabled={isStreaming || !translation}
              sx={{
                minWidth: 64,
                height: 36,
                fontSize: "0.875rem",
                fontWeight: 500,
                textTransform: "none",
                color: "#64b5f6",
                "&:hover": {
                  backgroundColor: "#333333",
                },
              }}
            >
              Copy
            </Button>

            <Button
              variant="contained"
              onClick={onReplace}
              size="small"
              disabled={isStreaming || !translation}
              disableElevation
              sx={{
                minWidth: 64,
                height: 36,
                fontSize: "0.875rem",
                fontWeight: 500,
                textTransform: "none",
                backgroundColor: "#64b5f6",
                color: "#000000",
                "&:hover": {
                  backgroundColor: "#42a5f5",
                },
              }}
            >
              Replace
            </Button>
          </Stack>

          <Box
            sx={{
              padding: "6px 16px",
              textAlign: "center",
              backgroundColor: "#1a1a1a",
              borderTop: "1px solid #2a2a2a",
              position: "relative",
              flexShrink: 0,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.65rem",
                color: "#808080",
                fontWeight: 400,
              }}
            >
              Press ESC to close
            </Typography>
            <Box
              sx={{
                position: "absolute",
                bottom: "6px",
                right: "6px",
                width: "16px",
                height: "16px",
                opacity: 0.5,
                transition: "opacity 0.2s",
                pointerEvents: "none",
                "&:hover": {
                  opacity: 0.7,
                },
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="13" cy="13" r="2" fill="#999999"/>
                <circle cx="7" cy="13" r="2" fill="#999999"/>
                <circle cx="13" cy="7" r="2" fill="#999999"/>
              </svg>
            </Box>
          </Box>
        </Paper>
      </Fade>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Box>
  );
}
