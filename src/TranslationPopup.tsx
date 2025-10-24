import { Box, Paper, Typography, Button, Stack, Fade, CircularProgress, IconButton, Chip, ToggleButtonGroup, ToggleButton, Menu, MenuItem, ListItemIcon, ListItemText, TextField, Tooltip } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import SettingsIcon from "@mui/icons-material/Settings";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import KeyIcon from "@mui/icons-material/Key";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import { SettingsDialog } from "./SettingsDialog";
import { invoke } from "@tauri-apps/api/core";

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
  onClearAndStream: () => void;
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
  onClearAndStream,
}: PopupProps) {
  const contentEndRef = useRef<HTMLDivElement>(null);
  const enhanceInputRef = useRef<HTMLInputElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customInstruction, setCustomInstruction] = useState("");
  const [showEnhanceInput, setShowEnhanceInput] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isMod = event.metaKey || event.ctrlKey;

      if (event.key === "Escape") {
        onClose();
      } else if (isMod && event.key === "k") {
        event.preventDefault();
        if (!isStreaming && translation) {
          onCopy();
        }
      } else if (isMod && event.key === "l") {
        event.preventDefault();
        if (!isStreaming && translation) {
          onReplace();
        }
      } else if (isMod && event.key === "i") {
        event.preventDefault();
        if (mode === "enhance" && !isStreaming && translation) {
          setShowEnhanceInput(!showEnhanceInput);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, onCopy, onReplace, isStreaming, translation, mode, showEnhanceInput]);

  useEffect(() => {
    if (isStreaming && contentEndRef.current) {
      contentEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [translation, isStreaming]);

  useEffect(() => {
    if (mode === "translate") {
      setShowEnhanceInput(false);
    }
  }, [mode]);

  useEffect(() => {
    if (showEnhanceInput && enhanceInputRef.current) {
      enhanceInputRef.current.focus();
    }
  }, [showEnhanceInput]);

  useEffect(() => {
    if (!isStreaming && showEnhanceInput && enhanceInputRef.current) {
      enhanceInputRef.current.focus();
    }
  }, [isStreaming, showEnhanceInput]);

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
            userSelect: "none",
          }}
        >
          <Box
            data-tauri-drag-region
            sx={{
              borderBottom: "1px solid #333333",
              background: "#242424",
              flexShrink: 0,
              cursor: "move",
            }}
          >
            <Box
              data-tauri-drag-region
              sx={{
                display: "flex",
                alignItems: "center",
                padding: "8px 12px",
                gap: 2,
                minHeight: "44px",
                minWidth: 0,
                overflow: "hidden",
                cursor: "move",
              }}
            >
              <Box data-tauri-drag-region sx={{ width: 80, flexShrink: 0, cursor: "move" }} />

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  flex: 1,
                  justifyContent: "center",
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

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Chip
                    label={detectedLanguage === "de" ? "DE" : "EN"}
                    size="small"
                    sx={{
                      backgroundColor: mode === "translate" ? "#333333" : "#2a2a2a",
                      color: mode === "translate" ? "#e0e0e0" : "#666666",
                      fontWeight: 500,
                      fontSize: "0.7rem",
                      height: "26px",
                      minWidth: "36px",
                      opacity: mode === "translate" ? 1 : 0.5,
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={onLanguageSwitch}
                    disabled={isStreaming || mode === "enhance"}
                    sx={{
                      color: mode === "translate" ? "#64b5f6" : "#555555",
                      padding: "2px",
                      "&:hover": { backgroundColor: mode === "translate" ? "#333333" : "transparent" },
                      "&.Mui-disabled": { color: "#555555", cursor: "not-allowed" },
                      opacity: mode === "translate" ? 1 : 0.5,
                    }}
                  >
                    <SwapHorizIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  <Chip
                    label={detectedLanguage === "de" ? "EN" : "DE"}
                    size="small"
                    sx={{
                      backgroundColor: mode === "translate" ? "#333333" : "#2a2a2a",
                      color: mode === "translate" ? "#e0e0e0" : "#666666",
                      fontWeight: 500,
                      fontSize: "0.7rem",
                      height: "26px",
                      minWidth: "36px",
                      opacity: mode === "translate" ? 1 : 0.5,
                    }}
                  />
                </Box>
              </Box>

              <IconButton
                size="small"
                onClick={(e) => setMenuAnchorEl(e.currentTarget)}
                sx={{
                  color: "#999999",
                  padding: "4px",
                  flexShrink: 0,
                  "&:hover": { backgroundColor: "#333333" },
                }}
              >
                <SettingsIcon sx={{ fontSize: 16 }} />
              </IconButton>

              <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={() => setMenuAnchorEl(null)}
                PaperProps={{
                  sx: {
                    background: "#2a2a2a",
                    color: "#e0e0e0",
                    mt: 1,
                  }
                }}
              >
                <MenuItem
                  onClick={() => {
                    setMenuAnchorEl(null);
                    if (isLoggedIn) {
                      setIsLoggedIn(false);
                    } else {
                      window.open("https://langra.app/auth", "_blank");
                    }
                  }}
                  sx={{
                    "&:hover": { backgroundColor: "#333333" },
                  }}
                >
                  <ListItemIcon sx={{ color: "#64b5f6" }}>
                    {isLoggedIn ? <LogoutIcon fontSize="small" /> : <LoginIcon fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText>{isLoggedIn ? "Logout" : "Login"}</ListItemText>
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    setMenuAnchorEl(null);
                    setSettingsOpen(true);
                  }}
                  sx={{
                    "&:hover": { backgroundColor: "#333333" },
                  }}
                >
                  <ListItemIcon sx={{ color: "#64b5f6" }}>
                    <KeyIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>API Key Settings</ListItemText>
                </MenuItem>
              </Menu>
            </Box>

          </Box>
          <Box
            data-tauri-drag-region
            sx={{
              flex: 1,
              overflow: "auto",
              padding: 3,
              minHeight: 0,
              position: "relative",
              cursor: "move",
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
                data-tauri-drag-region
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 120,
                  color: "#b3b3b3",
                  cursor: "move",
                }}
              >
                <CircularProgress size={24} sx={{ marginRight: 2, color: "#64b5f6" }} />
                <Typography variant="body2">{mode === "enhance" ? "Fixing..." : "Translating..."}</Typography>
              </Box>
            ) : (
              <>
                <Typography
                  data-tauri-drag-region
                  variant="body1"
                  sx={{
                    fontSize: "1rem",
                    lineHeight: 1.6,
                    color: "#e0e0e0",
                    wordWrap: "break-word",
                    whiteSpace: "pre-wrap",
                    cursor: "move",
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

          <Box sx={{ flexShrink: 0 }}>
            {showEnhanceInput && mode === "enhance" && !isStreaming && translation && (
              <Box sx={{ padding: "12px 16px", backgroundColor: "#1f1f1f", borderTop: "1px solid #333333" }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="How would you like to enhance? (press Enter)"
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  inputRef={enhanceInputRef}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && customInstruction.trim()) {
                      e.preventDefault();
                      try {
                        onClearAndStream();
                        await invoke("enhance_text_with_instruction", {
                          text: translation,
                          language: detectedLanguage,
                          instruction: customInstruction.trim(),
                        });
                        setCustomInstruction("");
                        setTimeout(() => {
                          if (enhanceInputRef.current) {
                            enhanceInputRef.current.focus();
                          }
                        }, 100);
                      } catch (error) {
                        console.error("Enhancement failed:", error);
                      }
                    }
                  }}
                  InputProps={{
                    sx: {
                      fontSize: "0.875rem",
                      color: "#e0e0e0",
                      backgroundColor: "#1a1a1a",
                      "& fieldset": { borderColor: "#4a4a4a" },
                      "&:hover fieldset": { borderColor: "#64b5f6" },
                      "&.Mui-focused fieldset": { borderColor: "#64b5f6" },
                    },
                  }}
                  sx={{
                    "& .MuiInputBase-input::placeholder": {
                      color: "#808080",
                      opacity: 1,
                    },
                  }}
                />
              </Box>
            )}

            <Stack
              direction="row"
              spacing={1}
              sx={{
                padding: "12px 16px",
                backgroundColor: "#1f1f1f",
                borderTop: showEnhanceInput && mode === "enhance" && !isStreaming && translation ? "none" : "1px solid #333333",
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

              <Box data-tauri-drag-region sx={{ flex: 1, cursor: "move" }} />

              {mode === "enhance" && !isStreaming && translation && (
                <Tooltip title="AI Mode (⌘I)" placement="top" arrow>
                  <IconButton
                    size="small"
                    onClick={() => setShowEnhanceInput(!showEnhanceInput)}
                    sx={{
                      color: showEnhanceInput ? "#64b5f6" : "#b3b3b3",
                      padding: "6px",
                      "&:hover": {
                        backgroundColor: "#333333",
                      },
                    }}
                  >
                    <AutoFixHighIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              )}

              <Tooltip title="Copy (⌘K)" placement="top" arrow>
                <span>
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
                </span>
              </Tooltip>

              <Tooltip title="Replace (⌘L)" placement="top" arrow>
                <span>
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
                </span>
              </Tooltip>
            </Stack>
          </Box>

          <Box
            data-tauri-drag-region
            sx={{
              padding: "6px 16px",
              textAlign: "center",
              backgroundColor: "#1a1a1a",
              borderTop: "1px solid #2a2a2a",
              position: "relative",
              flexShrink: 0,
              cursor: "move",
            }}
          >
            <Typography
              data-tauri-drag-region
              variant="caption"
              sx={{
                fontSize: "0.65rem",
                color: "#808080",
                fontWeight: 400,
                cursor: "move",
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
