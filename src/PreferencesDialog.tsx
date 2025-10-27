import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from "@mui/material";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface PreferencesDialogProps {
  open: boolean;
  onClose: () => void;
}

interface Settings {
  style: "formal" | "friendly" | "casual";
}

export function PreferencesDialog({ open, onClose }: PreferencesDialogProps) {
  const [settings, setSettings] = useState<Settings>({
    style: "friendly",
  });

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
    try {
      await invoke("save_settings", { settings });
      onClose();
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
        Preferences
      </DialogTitle>

      <DialogContent sx={{ pt: "20px", pb: "16px", px: "16px" }}>
        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend" sx={{
            color: "#888",
            mb: "12px",
            fontSize: "11px",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}>
            Translation Style
          </FormLabel>
          <RadioGroup
            value={settings.style}
            onChange={(e) => setSettings({ ...settings, style: e.target.value as any })}
            row
            sx={{ gap: "12px" }}
          >
            <FormControlLabel
              value="formal"
              label="Formal"
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
              value="friendly"
              label="Friendly"
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
              value="casual"
              label="Casual"
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
      </DialogContent>

      <DialogActions sx={{ borderTop: "1px solid #333", padding: "12px 16px", gap: "12px" }}>
        <Button
          onClick={onClose}
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
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disableElevation
          sx={{
            backgroundColor: "#64b5f6",
            color: "#000",
            textTransform: "none",
            fontSize: "13px",
            fontWeight: 500,
            minWidth: "64px",
            height: "28px",
            padding: "4px 12px",
            "&:hover": { backgroundColor: "#5aa3e0" },
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
