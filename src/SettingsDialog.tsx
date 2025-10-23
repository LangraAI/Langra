import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Box, Typography, Alert } from "@mui/material";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

interface Settings {
  provider: "openai" | "azure";
  openai_api_key: string;
  azure_endpoint: string;
  azure_api_key: string;
  azure_deployment: string;
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const [settings, setSettings] = useState<Settings>({
    provider: "azure",
    openai_api_key: "",
    azure_endpoint: "",
    azure_api_key: "",
    azure_deployment: "gpt-4o-mini",
  });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    try {
      const loadedSettings = await invoke<Settings>("get_settings");
      setSettings(loadedSettings);
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    setErrorMessage("");

    try {
      await invoke("save_settings", { settings });
      setSaveStatus("success");
      setTimeout(() => {
        setSaveStatus("idle");
        onClose();
      }, 1500);
    } catch (error) {
      setSaveStatus("error");
      setErrorMessage(error as string);
    }
  };

  const handleProviderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, provider: event.target.value as "openai" | "azure" });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: "#2a2a2a",
          color: "#e0e0e0",
        }
      }}
    >
      <DialogTitle sx={{ borderBottom: "1px solid #3a3a3a" }}>
        Settings
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
          <FormLabel component="legend" sx={{ color: "#b3b3b3", mb: 1 }}>
            AI Provider
          </FormLabel>
          <RadioGroup
            value={settings.provider}
            onChange={handleProviderChange}
          >
            <FormControlLabel
              value="azure"
              label="Azure OpenAI"
              control={<Radio sx={{ color: "#64b5f6", "&.Mui-checked": { color: "#64b5f6" } }} />}
            />
            <FormControlLabel
              value="openai"
              label="OpenAI"
              control={<Radio sx={{ color: "#64b5f6", "&.Mui-checked": { color: "#64b5f6" } }} />}
            />
          </RadioGroup>
        </FormControl>

        {settings.provider === "azure" ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Azure Endpoint"
              value={settings.azure_endpoint}
              onChange={(e) => setSettings({ ...settings, azure_endpoint: e.target.value })}
              placeholder="https://your-resource.openai.azure.com"
              fullWidth
              size="small"
              InputLabelProps={{ sx: { color: "#b3b3b3" } }}
              InputProps={{
                sx: {
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
              value={settings.azure_api_key}
              onChange={(e) => setSettings({ ...settings, azure_api_key: e.target.value })}
              type="password"
              placeholder="Your Azure OpenAI API key"
              fullWidth
              size="small"
              InputLabelProps={{ sx: { color: "#b3b3b3" } }}
              InputProps={{
                sx: {
                  color: "#e0e0e0",
                  backgroundColor: "#1a1a1a",
                  "& fieldset": { borderColor: "#4a4a4a" },
                  "&:hover fieldset": { borderColor: "#64b5f6" },
                  "&.Mui-focused fieldset": { borderColor: "#64b5f6" },
                }
              }}
            />
            <TextField
              label="Deployment Name"
              value={settings.azure_deployment}
              onChange={(e) => setSettings({ ...settings, azure_deployment: e.target.value })}
              placeholder="gpt-4o-mini"
              fullWidth
              size="small"
              InputLabelProps={{ sx: { color: "#b3b3b3" } }}
              InputProps={{
                sx: {
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="OpenAI API Key"
              value={settings.openai_api_key}
              onChange={(e) => setSettings({ ...settings, openai_api_key: e.target.value })}
              type="password"
              placeholder="sk-..."
              fullWidth
              size="small"
              InputLabelProps={{ sx: { color: "#b3b3b3" } }}
              InputProps={{
                sx: {
                  color: "#e0e0e0",
                  backgroundColor: "#1a1a1a",
                  "& fieldset": { borderColor: "#4a4a4a" },
                  "&:hover fieldset": { borderColor: "#64b5f6" },
                  "&.Mui-focused fieldset": { borderColor: "#64b5f6" },
                }
              }}
            />
            <Typography variant="caption" sx={{ color: "#999", mt: -1 }}>
              Get your API key from platform.openai.com
            </Typography>
          </Box>
        )}

        {saveStatus === "success" && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Settings saved successfully!
          </Alert>
        )}

        {saveStatus === "error" && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errorMessage || "Failed to save settings"}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ borderTop: "1px solid #3a3a3a", p: 2 }}>
        <Button onClick={onClose} sx={{ color: "#b3b3b3" }}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saveStatus === "saving"}
          sx={{
            backgroundColor: "#64b5f6",
            color: "#000",
            "&:hover": { backgroundColor: "#42a5f5" }
          }}
        >
          {saveStatus === "saving" ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
