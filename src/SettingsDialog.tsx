import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Box, Typography, Alert } from "@mui/material";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface SettingsDialogProps {
  open: boolean;
  onClose: (credentialsSaved?: boolean) => void;
}

interface ApiKeySettings {
  provider: "openai" | "azure";
  openai_api_key: string;
  azure_endpoint: string;
  azure_api_key: string;
  azure_deployment: string;
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
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
      const response = await fetch("https://white-bush-0ea25dc03.3.azurestaticapps.net/api/credentials/check", {
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
      const response = await fetch("https://white-bush-0ea25dc03.3.azurestaticapps.net/api/credentials", {
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
        borderBottom: "1px solid #333",
        padding: "12px 16px",
        fontSize: "18px",
        fontWeight: 500,
        color: "#e0e0e0",
      }}>
        API Keys
      </DialogTitle>

      <DialogContent sx={{ pt: "20px", pb: "16px", px: "16px" }}>
        <Typography sx={{
          color: "#888",
          mb: "12px",
          fontSize: "11px",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}>
          Bring Your Own Key (BYOK)
        </Typography>

        {hasCredentials && !showApiKeyForm ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Alert severity="success" sx={{
                backgroundColor: "#1e4620",
                padding: "8px 12px",
                "& .MuiAlert-icon": {
                  fontSize: "16px",
                }
              }}>
                <Typography sx={{ color: "#90ee90", fontSize: "11px", fontWeight: 400 }}>
                  Using your own API keys (unlimited usage)
                </Typography>
              </Alert>

              <Button
                variant="outlined"
                color="error"
                fullWidth
                onClick={handleDeleteCredentials}
                sx={{
                  borderColor: "#f44336",
                  color: "#f44336",
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: "13px",
                  height: "28px",
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
            <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Alert severity="info" sx={{
                backgroundColor: "#1e3a5f",
                padding: "8px 12px",
                "& .MuiAlert-icon": {
                  fontSize: "16px",
                }
              }}>
                <Typography sx={{ color: "#90caf9", fontSize: "11px", fontWeight: 400 }}>
                  Currently using Langra's free tier
                </Typography>
              </Alert>

              <Button
                variant="outlined"
                fullWidth
                onClick={() => setShowApiKeyForm(true)}
                sx={{
                  borderColor: "#64b5f6",
                  color: "#64b5f6",
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: "13px",
                  height: "28px",
                  "&:hover": {
                    borderColor: "#5aa3e0",
                    backgroundColor: "rgba(100, 181, 246, 0.08)",
                  },
                }}
              >
                Add Your Own API Keys
              </Button>

              <Typography sx={{ color: "#666", textAlign: "center", fontSize: "11px", fontWeight: 400 }}>
                Get unlimited usage with your own OpenAI or Azure keys
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel component="legend" sx={{
                  color: "#888",
                  mb: "12px",
                  fontSize: "11px",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}>
                  Provider
                </FormLabel>
                <RadioGroup
                  value={apiSettings.provider}
                  onChange={handleProviderChange}
                  sx={{ gap: "6px" }}
                >
                  <FormControlLabel
                    value="azure"
                    label="Azure OpenAI"
                    control={<Radio size="small" sx={{ color: "#64b5f6", "&.Mui-checked": { color: "#64b5f6" } }} />}
                    sx={{
                      "& .MuiFormControlLabel-label": {
                        fontSize: "13px",
                        fontWeight: 400,
                        color: "#e0e0e0",
                      }
                    }}
                  />
                  <FormControlLabel
                    value="openai"
                    label="OpenAI"
                    control={<Radio size="small" sx={{ color: "#64b5f6", "&.Mui-checked": { color: "#64b5f6" } }} />}
                    sx={{
                      "& .MuiFormControlLabel-label": {
                        fontSize: "13px",
                        fontWeight: 400,
                        color: "#e0e0e0",
                      }
                    }}
                  />
                </RadioGroup>
              </FormControl>

              {apiSettings.provider === "azure" ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <TextField
                    label="Endpoint"
                    value={apiSettings.azure_endpoint}
                    onChange={(e) => setApiSettings({ ...apiSettings, azure_endpoint: e.target.value })}
                    placeholder="https://your-resource.openai.azure.com"
                    fullWidth
                    size="small"
                    InputLabelProps={{ sx: {
                      color: "#888",
                      fontSize: "13px",
                    }}}
                    InputProps={{
                      sx: {
                        fontSize: "13px",
                        color: "#e0e0e0",
                        backgroundColor: "#1a1a1a",
                        "& fieldset": { borderColor: "#2a2a2a" },
                        "&:hover fieldset": { borderColor: "#444" },
                        "&.Mui-focused fieldset": { borderColor: "#64b5f6", borderWidth: "1px" },
                      }
                    }}
                    slotProps={{
                      inputLabel: { shrink: true }
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
                      color: "#888",
                      fontSize: "13px",
                    }}}
                    InputProps={{
                      sx: {
                        fontSize: "13px",
                        color: "#e0e0e0",
                        backgroundColor: "#1a1a1a",
                        "& fieldset": { borderColor: "#2a2a2a" },
                        "&:hover fieldset": { borderColor: "#444" },
                        "&.Mui-focused fieldset": { borderColor: "#64b5f6", borderWidth: "1px" },
                      }
                    }}
                    slotProps={{
                      inputLabel: { shrink: true }
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
                      color: "#888",
                      fontSize: "13px",
                    }}}
                    InputProps={{
                      sx: {
                        fontSize: "13px",
                        color: "#e0e0e0",
                        backgroundColor: "#1a1a1a",
                        "& fieldset": { borderColor: "#2a2a2a" },
                        "&:hover fieldset": { borderColor: "#444" },
                        "&.Mui-focused fieldset": { borderColor: "#64b5f6", borderWidth: "1px" },
                      }
                    }}
                    slotProps={{
                      inputLabel: { shrink: true }
                    }}
                  />
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <TextField
                    label="API Key"
                    value={apiSettings.openai_api_key}
                    onChange={(e) => setApiSettings({ ...apiSettings, openai_api_key: e.target.value })}
                    type="password"
                    placeholder="sk-..."
                    fullWidth
                    size="small"
                    InputLabelProps={{ sx: {
                      color: "#888",
                      fontSize: "13px",
                    }}}
                    InputProps={{
                      sx: {
                        fontSize: "13px",
                        color: "#e0e0e0",
                        backgroundColor: "#1a1a1a",
                        "& fieldset": { borderColor: "#2a2a2a" },
                        "&:hover fieldset": { borderColor: "#444" },
                        "&.Mui-focused fieldset": { borderColor: "#64b5f6", borderWidth: "1px" },
                      }
                    }}
                    slotProps={{
                      inputLabel: { shrink: true }
                    }}
                  />
                  <Typography sx={{ color: "#666", fontSize: "11px", fontWeight: 400 }}>
                    Get your key from platform.openai.com
                  </Typography>
                </Box>
              )}
            </Box>
          )}

        {saveStatus === "error" && (
          <Alert severity="error" sx={{
            mt: "16px",
            padding: "8px 12px",
            fontSize: "11px",
            "& .MuiAlert-icon": {
              fontSize: "16px",
            }
          }}>
            {errorMessage || "Failed to save settings"}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ borderTop: "1px solid #333", padding: "12px 16px", gap: "12px" }}>
        <Button
          onClick={handleDialogClose}
          sx={{
            color: "#888",
            textTransform: "none",
            fontSize: "13px",
            fontWeight: 500,
            minWidth: "64px",
            height: "28px",
            padding: "4px 12px",
            "&:hover": {
              backgroundColor: "#2a2a2a",
            },
          }}
        >
          {showApiKeyForm ? "Cancel" : "Close"}
        </Button>
        {showApiKeyForm && (
          <Button
            onClick={handleSaveApiKeys}
            variant="contained"
            disabled={saveStatus === "saving"}
            disableElevation
            sx={{
              backgroundColor: "#64b5f6",
              color: "#000",
              textTransform: "none",
              fontSize: "13px",
              fontWeight: 500,
              minWidth: "100px",
              height: "28px",
              padding: "4px 12px",
              "&:hover": { backgroundColor: "#5aa3e0" },
              "&.Mui-disabled": {
                backgroundColor: "#222",
                color: "#555",
              },
            }}
          >
            {saveStatus === "saving" ? "Saving..." : "Save API Keys"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
