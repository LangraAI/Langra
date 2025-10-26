import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Box, Typography, Alert } from "@mui/material";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface SettingsDialogProps {
  open: boolean;
  onClose: (credentialsSaved?: boolean) => void;
}

interface Settings {
  style: "formal" | "friendly" | "casual";
}

interface ApiKeySettings {
  provider: "openai" | "azure";
  openai_api_key: string;
  azure_endpoint: string;
  azure_api_key: string;
  azure_deployment: string;
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const [settings, setSettings] = useState<Settings>({
    style: "friendly",
  });
  const [apiSettings, setApiSettings] = useState<ApiKeySettings>({
    provider: "azure",
    openai_api_key: "",
    azure_endpoint: "",
    azure_api_key: "",
    azure_deployment: "gpt-4o-mini",
  });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [hasCredentials, setHasCredentials] = useState(false);
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);

  useEffect(() => {
    if (open) {
      loadSettings();
      setShowApiKeyForm(false);
    }
  }, [open]);

  const loadSettings = async () => {
    try {
      const loadedSettings = await invoke<Settings>("get_settings");
      setSettings(loadedSettings);

      try {
        const response = await fetch("http://localhost:3000/api/credentials/check", {
          headers: {
            "Authorization": `Bearer ${await invoke<string>("get_access_token")}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setHasCredentials(data.has_credentials);
        }
      } catch (err) {
        console.log("[SETTINGS] Could not check BYOK status:", err);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const handleSaveApiKeys = async () => {
    console.log("[SETTINGS] Saving API keys:", apiSettings);
    setSaveStatus("saving");
    setErrorMessage("");

    try {
      await invoke("save_api_keys", { apiSettings });
      console.log("[SETTINGS] API keys saved successfully to backend");
      setSaveStatus("idle");
      setShowApiKeyForm(false);
      setHasCredentials(true);
      onClose(true);
    } catch (error) {
      console.error("[SETTINGS] Save API keys failed:", error);
      setSaveStatus("error");
      setErrorMessage(String(error));
    }
  };

  const handleProviderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiSettings({ ...apiSettings, provider: event.target.value as "openai" | "azure" });
  };

  const handleDialogClose = () => {
    setShowApiKeyForm(false);
    onClose(false);
  };

  const handleDeleteCredentials = async () => {
    try {
      const token = await invoke<string>("get_access_token");
      const response = await fetch("http://localhost:3000/api/credentials", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log("[SETTINGS] Credentials deleted from backend");
        setHasCredentials(false);
        onClose(false);
        window.location.reload();
      } else {
        throw new Error("Failed to delete credentials");
      }
    } catch (error) {
      console.error("[SETTINGS] Failed to delete credentials:", error);
      setErrorMessage("Failed to delete credentials");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: "#242424",
          color: "#e0e0e0",
        }
      }}
    >
      <DialogTitle sx={{
        borderBottom: "1px solid #333333",
        padding: "16px 20px",
        fontSize: "0.95rem",
        fontWeight: 500,
      }}>
        Settings
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5, pb: 2, px: 2.5 }}>
        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
          <FormLabel component="legend" sx={{
            color: "#b3b3b3",
            mb: 1,
            fontSize: "0.8rem",
            fontWeight: 500,
          }}>
            Translation Style
          </FormLabel>
          <RadioGroup
            value={settings.style}
            onChange={(e) => setSettings({ ...settings, style: e.target.value as any })}
            row
            sx={{ gap: 1 }}
          >
            <FormControlLabel
              value="formal"
              label="Formal"
              control={<Radio size="small" sx={{ color: "#64b5f6", "&.Mui-checked": { color: "#64b5f6" } }} />}
              sx={{
                mr: 1,
                "& .MuiFormControlLabel-label": {
                  fontSize: "0.875rem",
                  fontWeight: 400,
                }
              }}
            />
            <FormControlLabel
              value="friendly"
              label="Friendly"
              control={<Radio size="small" sx={{ color: "#64b5f6", "&.Mui-checked": { color: "#64b5f6" } }} />}
              sx={{
                mr: 1,
                "& .MuiFormControlLabel-label": {
                  fontSize: "0.875rem",
                  fontWeight: 400,
                }
              }}
            />
            <FormControlLabel
              value="casual"
              label="Casual"
              control={<Radio size="small" sx={{ color: "#64b5f6", "&.Mui-checked": { color: "#64b5f6" } }} />}
              sx={{
                mr: 1,
                "& .MuiFormControlLabel-label": {
                  fontSize: "0.875rem",
                  fontWeight: 400,
                }
              }}
            />
          </RadioGroup>
        </FormControl>

        <Box sx={{ borderTop: "1px solid #333333", pt: 2.5 }}>
          <Typography variant="body2" sx={{ color: "#b3b3b3", mb: 1.5, fontSize: "0.8rem", fontWeight: 500 }}>
            API Keys (BYOK)
          </Typography>

          {hasCredentials && !showApiKeyForm ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Alert severity="success" sx={{
                backgroundColor: "#1e4620",
                padding: "8px 12px",
                "& .MuiAlert-icon": {
                  fontSize: "18px",
                }
              }}>
                <Typography variant="body2" sx={{ color: "#90ee90", fontSize: "0.8rem" }}>
                  Using your own API keys (unlimited usage)
                </Typography>
              </Alert>

              <Button
                variant="outlined"
                color="error"
                fullWidth
                size="small"
                onClick={handleDeleteCredentials}
                sx={{
                  borderColor: "#f44336",
                  color: "#f44336",
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  py: 0.75,
                  "&:hover": {
                    borderColor: "#d32f2f",
                    backgroundColor: "rgba(244, 67, 54, 0.08)",
                  },
                }}
              >
                Delete API Keys
              </Button>
            </Box>
          ) : !showApiKeyForm ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Alert severity="info" sx={{
                backgroundColor: "#1e3a5f",
                padding: "8px 12px",
                "& .MuiAlert-icon": {
                  fontSize: "18px",
                }
              }}>
                <Typography variant="body2" sx={{ color: "#90caf9", fontSize: "0.8rem" }}>
                  Currently using Langra's free tier
                </Typography>
              </Alert>

              <Button
                variant="outlined"
                fullWidth
                size="small"
                onClick={() => setShowApiKeyForm(true)}
                sx={{
                  borderColor: "#64b5f6",
                  color: "#64b5f6",
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  py: 0.75,
                  "&:hover": {
                    borderColor: "#42a5f5",
                    backgroundColor: "rgba(100, 181, 246, 0.08)",
                  },
                }}
              >
                Add Your Own API Keys
              </Button>

              <Typography variant="caption" sx={{ color: "#808080", textAlign: "center", fontSize: "0.7rem" }}>
                Get unlimited usage with your own OpenAI or Azure keys
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel component="legend" sx={{
                  color: "#b3b3b3",
                  mb: 1,
                  fontSize: "0.75rem",
                  fontWeight: 500,
                }}>
                  Provider
                </FormLabel>
                <RadioGroup
                  value={apiSettings.provider}
                  onChange={handleProviderChange}
                  sx={{ gap: 0.5 }}
                >
                  <FormControlLabel
                    value="azure"
                    label="Azure OpenAI"
                    control={<Radio size="small" sx={{ color: "#64b5f6", "&.Mui-checked": { color: "#64b5f6" } }} />}
                    sx={{
                      "& .MuiFormControlLabel-label": {
                        fontSize: "0.875rem",
                        fontWeight: 400,
                      }
                    }}
                  />
                  <FormControlLabel
                    value="openai"
                    label="OpenAI"
                    control={<Radio size="small" sx={{ color: "#64b5f6", "&.Mui-checked": { color: "#64b5f6" } }} />}
                    sx={{
                      "& .MuiFormControlLabel-label": {
                        fontSize: "0.875rem",
                        fontWeight: 400,
                      }
                    }}
                  />
                </RadioGroup>
              </FormControl>

              {apiSettings.provider === "azure" ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <TextField
                    label="Endpoint"
                    value={apiSettings.azure_endpoint}
                    onChange={(e) => setApiSettings({ ...apiSettings, azure_endpoint: e.target.value })}
                    placeholder="https://your-resource.openai.azure.com"
                    fullWidth
                    size="small"
                    InputLabelProps={{ sx: {
                      color: "#b3b3b3",
                      fontSize: "0.875rem",
                    }}}
                    InputProps={{
                      sx: {
                        fontSize: "0.875rem",
                        color: "#e0e0e0",
                        backgroundColor: "#1a1a1a",
                        "& fieldset": { borderColor: "#4a4a4a" },
                        "&:hover fieldset": { borderColor: "#64b5f6" },
                        "&.Mui-focused fieldset": { borderColor: "#64b5f6" },
                      }
                    }}
                  />
                  <TextField
                    label="API Key"
                    value={apiSettings.azure_api_key}
                    onChange={(e) => setApiSettings({ ...apiSettings, azure_api_key: e.target.value })}
                    type="password"
                    placeholder="Your Azure API key"
                    fullWidth
                    size="small"
                    InputLabelProps={{ sx: {
                      color: "#b3b3b3",
                      fontSize: "0.875rem",
                    }}}
                    InputProps={{
                      sx: {
                        fontSize: "0.875rem",
                        color: "#e0e0e0",
                        backgroundColor: "#1a1a1a",
                        "& fieldset": { borderColor: "#4a4a4a" },
                        "&:hover fieldset": { borderColor: "#64b5f6" },
                        "&.Mui-focused fieldset": { borderColor: "#64b5f6" },
                      }
                    }}
                  />
                  <TextField
                    label="Deployment"
                    value={apiSettings.azure_deployment}
                    onChange={(e) => setApiSettings({ ...apiSettings, azure_deployment: e.target.value })}
                    placeholder="gpt-4o-mini"
                    fullWidth
                    size="small"
                    InputLabelProps={{ sx: {
                      color: "#b3b3b3",
                      fontSize: "0.875rem",
                    }}}
                    InputProps={{
                      sx: {
                        fontSize: "0.875rem",
                        color: "#e0e0e0",
                        backgroundColor: "#1a1a1a",
                        "& fieldset": { borderColor: "#4a4a4a" },
                        "&:hover fieldset": { borderColor: "#64b5f6" },
                        "&.Mui-focused fieldset": { borderColor: "#64b5f6" },
                      }
                    }}
                  />
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <TextField
                    label="API Key"
                    value={apiSettings.openai_api_key}
                    onChange={(e) => setApiSettings({ ...apiSettings, openai_api_key: e.target.value })}
                    type="password"
                    placeholder="sk-..."
                    fullWidth
                    size="small"
                    InputLabelProps={{ sx: {
                      color: "#b3b3b3",
                      fontSize: "0.875rem",
                    }}}
                    InputProps={{
                      sx: {
                        fontSize: "0.875rem",
                        color: "#e0e0e0",
                        backgroundColor: "#1a1a1a",
                        "& fieldset": { borderColor: "#4a4a4a" },
                        "&:hover fieldset": { borderColor: "#64b5f6" },
                        "&.Mui-focused fieldset": { borderColor: "#64b5f6" },
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ color: "#808080", fontSize: "0.7rem", mt: -0.5 }}>
                    Get your key from platform.openai.com
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>

        {saveStatus === "error" && (
          <Alert severity="error" sx={{
            mt: 2,
            padding: "8px 12px",
            fontSize: "0.8rem",
            "& .MuiAlert-icon": {
              fontSize: "18px",
            }
          }}>
            {errorMessage || "Failed to save settings"}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ borderTop: "1px solid #333333", padding: "12px 16px" }}>
        <Button
          onClick={handleDialogClose}
          size="small"
          sx={{
            color: "#b3b3b3",
            textTransform: "none",
            fontSize: "0.875rem",
            fontWeight: 500,
            minWidth: 64,
            height: 36,
            "&:hover": {
              backgroundColor: "#333333",
            },
          }}
        >
          {showApiKeyForm ? "Cancel" : "Close"}
        </Button>
        {showApiKeyForm && (
          <Button
            onClick={handleSaveApiKeys}
            variant="contained"
            size="small"
            disabled={saveStatus === "saving"}
            disableElevation
            sx={{
              backgroundColor: "#64b5f6",
              color: "#000",
              textTransform: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
              minWidth: 64,
              height: 36,
              "&:hover": { backgroundColor: "#42a5f5" }
            }}
          >
            {saveStatus === "saving" ? "Saving..." : "Save API Keys"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
