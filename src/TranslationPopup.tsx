import { Box, Paper, Typography, Button, Stack, Fade, CircularProgress, IconButton, Chip, ToggleButtonGroup, ToggleButton, Menu, MenuItem, ListItemIcon, ListItemText, TextField, Tooltip } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import SettingsIcon from "@mui/icons-material/Settings";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import KeyIcon from "@mui/icons-material/Key";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import { SettingsDialog } from "./SettingsDialog";
import { invoke } from "@tauri-apps/api/core";
import { StreamingText } from "./StreamingText";

interface PopupProps {
  translation: string;
  isOpen: boolean;
  isStreaming: boolean;
  detectedLanguage: string;
  mode: "translate" | "enhance";
  progress: number;
  onCopy: () => void;
  onReplace: () => void;
  onClose: () => void;
  onLanguageSwitch: () => void;
  onModeChange: (mode: "translate" | "enhance") => void;
  onClearAndStream: () => void;
  onExpandToNormal: () => void;
}

export function TranslationPopup({
  translation,
  isOpen,
  isStreaming,
  detectedLanguage,
  mode,
  progress,
  onCopy,
  onReplace,
  onClose,
  onLanguageSwitch,
  onModeChange,
  onClearAndStream,
  onExpandToNormal,
}: PopupProps) {
  const enhanceInputRef = useRef<HTMLInputElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customInstruction, setCustomInstruction] = useState("");
  const [showEnhanceInput, setShowEnhanceInput] = useState(false);

  useEffect(() => {
    console.log("[POPUP] translation:", translation?.substring(0, 50), "isStreaming:", isStreaming);
  }, [translation, isStreaming]);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await invoke<string>("get_access_token");
        setIsLoggedIn(!!token);
        console.log("[POPUP] User is logged in:", !!token);
      } catch (err) {
        setIsLoggedIn(false);
        console.log("[POPUP] User is not logged in");
      }
    };
    checkLoginStatus();
  }, []);

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
              borderBottom: "1px solid #222",
              background: "#1a1a1a",
              flexShrink: 0,
              cursor: "move",
            }}
          >
            <Box
              data-tauri-drag-region
              sx={{
                display: "flex",
                alignItems: "center",
                padding: "6px 12px",
                gap: "12px",
                minHeight: "36px",
                minWidth: 0,
                overflow: "hidden",
                cursor: "move",
              }}
            >
              <Box data-tauri-drag-region sx={{ width: 60, flexShrink: 0, cursor: "move" }} />

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
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
                    height: "28px",
                    flexShrink: 0,
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
                    gap: "6px",
                  }}
                >
                  <Chip
                    label={detectedLanguage === "de" ? "DE" : "EN"}
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
                    onClick={onLanguageSwitch}
                    disabled={isStreaming || mode === "enhance"}
                    sx={{
                      color: mode === "translate" ? "#64b5f6" : "#555",
                      padding: "3px",
                      "&:hover": { backgroundColor: mode === "translate" ? "#2a2a2a" : "transparent" },
                      "&.Mui-disabled": { color: "#555", cursor: "not-allowed" },
                      opacity: mode === "translate" ? 1 : 0.4,
                    }}
                  >
                    <SwapHorizIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                  <Chip
                    label={detectedLanguage === "de" ? "EN" : "DE"}
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

              <IconButton
                size="small"
                onClick={(e) => setMenuAnchorEl(e.currentTarget)}
                sx={{
                  color: "#888",
                  padding: "3px",
                  flexShrink: 0,
                  "&:hover": { backgroundColor: "#2a2a2a" },
                }}
              >
                <SettingsIcon sx={{ fontSize: 14 }} />
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
                  onClick={async () => {
                    setMenuAnchorEl(null);
                    if (isLoggedIn) {
                      try {
                        await invoke("logout");
                        setIsLoggedIn(false);
                        console.log("[POPUP] Logged out successfully");
                        window.location.reload();
                      } catch (error) {
                        console.error("[POPUP] Logout failed:", error);
                      }
                    } else {
                      window.open("https://langra.de/auth", "_blank");
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
              padding: "16px",
              minHeight: 0,
              position: "relative",
              cursor: "move",
              "&::-webkit-scrollbar": {
                width: "4px",
              },
              "&::-webkit-scrollbar-track": {
                background: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "#333",
                borderRadius: "2px",
                "&:hover": {
                  background: "#444",
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
                  minHeight: 100,
                  color: "#888",
                  cursor: "move",
                }}
              >
                <CircularProgress size={18} sx={{ marginRight: 1.5, color: "#64b5f6" }} />
                <Typography sx={{ fontSize: "13px" }}>{mode === "enhance" ? "Fixing..." : "Translating..."}</Typography>
              </Box>
            ) : (
              <>
                <Typography
                  data-tauri-drag-region
                  variant="body1"
                  sx={{
                    fontSize: "13px",
                    lineHeight: 1.5,
                    color: "#e0e0e0",
                    wordWrap: "break-word",
                    whiteSpace: "pre-wrap",
                    cursor: "move",
                  }}
                >
                  <StreamingText text={translation} isStreaming={isStreaming} />
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
              </>
            )}
          </Box>

          <Box sx={{ flexShrink: 0 }}>
            {showEnhanceInput && mode === "enhance" && !isStreaming && translation && (
              <Box sx={{ padding: "10px 12px", backgroundColor: "#151515", borderTop: "1px solid #222" }}>
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
                  slotProps={{
                    input: {
                      sx: {
                        fontSize: "13px",
                        color: "#e0e0e0",
                        backgroundColor: "#1a1a1a",
                        height: "32px",
                        "& fieldset": { borderColor: "#2a2a2a" },
                        "&:hover fieldset": { borderColor: "#444" },
                        "&.Mui-focused fieldset": { borderColor: "#64b5f6" },
                      },
                    },
                  }}
                  sx={{
                    "& .MuiInputBase-input::placeholder": {
                      color: "#555",
                      opacity: 1,
                      fontSize: "13px",
                    },
                  }}
                />
              </Box>
            )}

            <Stack
              direction="row"
              spacing="8px"
              sx={{
                padding: "10px 12px",
                backgroundColor: "#151515",
                borderTop: showEnhanceInput && mode === "enhance" && !isStreaming && translation ? "none" : "1px solid #222",
                flexShrink: 0,
              }}
            >
              <Button
                variant="text"
                onClick={onClose}
                size="small"
                sx={{
                  minWidth: 50,
                  height: 28,
                  fontSize: "13px",
                  fontWeight: 500,
                  textTransform: "none",
                  color: "#888",
                  padding: "4px 10px",
                  "&:hover": {
                    backgroundColor: "#2a2a2a",
                  },
                }}
              >
                Close
              </Button>

              <Box
                data-tauri-drag-region
                sx={{
                  flex: 1,
                  cursor: "move",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isStreaming && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <CircularProgress size={12} sx={{ color: "#64b5f6" }} />
                    <Typography sx={{ color: "#888", fontSize: "11px", fontWeight: 400 }}>
                      {progress}%
                    </Typography>
                  </Box>
                )}
              </Box>

              {mode === "enhance" && !isStreaming && translation && (
                <Tooltip title="AI Mode (⌘I)" placement="top" arrow>
                  <IconButton
                    size="small"
                    onClick={() => setShowEnhanceInput(!showEnhanceInput)}
                    sx={{
                      color: showEnhanceInput ? "#64b5f6" : "#888",
                      padding: "4px",
                      "&:hover": {
                        backgroundColor: "#2a2a2a",
                      },
                    }}
                  >
                    <AutoFixHighIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}

              <Tooltip title="Expand to Edit Mode" placement="top" arrow>
                <IconButton
                  size="small"
                  onClick={onExpandToNormal}
                  sx={{
                    color: "#888",
                    padding: "4px",
                    "&:hover": {
                      backgroundColor: "#2a2a2a",
                      color: "#64b5f6",
                    },
                  }}
                >
                  <OpenInFullIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Copy (⌘K)" placement="top" arrow>
                <span>
                  <Button
                    variant="text"
                    onClick={onCopy}
                    size="small"
                    disabled={isStreaming || !translation}
                    sx={{
                      minWidth: 50,
                      height: 28,
                      fontSize: "13px",
                      fontWeight: 500,
                      textTransform: "none",
                      color: "#64b5f6",
                      padding: "4px 10px",
                      "&:hover": {
                        backgroundColor: "#2a2a2a",
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
                      minWidth: 60,
                      height: 28,
                  fontSize: "13px",
                  fontWeight: 500,
                  textTransform: "none",
                  backgroundColor: "#64b5f6",
                  color: "#000",
                  padding: "4px 12px",
                  "&:hover": {
                    backgroundColor: "#5aa3e0",
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
              padding: "5px 12px",
              textAlign: "center",
              backgroundColor: "#111",
              borderTop: "1px solid #1a1a1a",
              position: "relative",
              flexShrink: 0,
              cursor: "move",
            }}
          >
            <Typography
              data-tauri-drag-region
              variant="caption"
              sx={{
                fontSize: "10px",
                color: "#666",
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
