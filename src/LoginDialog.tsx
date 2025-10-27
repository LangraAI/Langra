import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import GitHubIcon from "@mui/icons-material/GitHub";
import { invoke } from "@tauri-apps/api/core";

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export function LoginDialog({ open, onClose, onLoginSuccess }: LoginDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await invoke<{ success: boolean; error?: string }>("login_and_get_token", {
        email: email.trim(),
        password: password.trim(),
      });

      if (result.success) {
        onLoginSuccess();
        onClose();
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      await invoke<{ success: boolean; error?: string }>("oauth_login", {
        provider: "google",
      });

      setInfo("Browser opened. Complete sign-in there and this dialog will close automatically.");
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to open browser");
      setLoading(false);
    }
  };

  const handleGitHubAuth = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      await invoke<{ success: boolean; error?: string }>("oauth_login", {
        provider: "github",
      });

      setInfo("Browser opened. Complete sign-in there and this dialog will close automatically.");
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to open browser");
      setLoading(false);
    }
  };

  const handleSignupClick = async () => {
    try {
      await invoke("open_url", { url: "https://white-bush-0ea25dc03.3.azurestaticapps.net/signup" });
    } catch (error) {
      console.error("Failed to open signup page:", error);
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
        Sign In to Langra
      </DialogTitle>
      <DialogContent sx={{ pt: "20px", pb: "16px", px: "16px" }}>
        <form onSubmit={handleLogin}>
          <Stack spacing="16px">
            <Typography sx={{ fontSize: "13px", color: "#888", fontWeight: 400 }}>
              Sign in with your Langra account
            </Typography>

            {error && (
              <Alert
                severity="error"
                onClose={() => setError(null)}
                sx={{
                  fontSize: "11px",
                  padding: "8px 12px",
                  "& .MuiAlert-icon": { fontSize: "16px" },
                }}
              >
                {error}
              </Alert>
            )}

            {info && (
              <Alert
                severity="info"
                onClose={() => setInfo(null)}
                sx={{
                  fontSize: "11px",
                  padding: "8px 12px",
                  "& .MuiAlert-icon": { fontSize: "16px" },
                }}
              >
                {info}
              </Alert>
            )}

            <Stack spacing="12px">
              <Button
                variant="outlined"
                fullWidth
                startIcon={<GoogleIcon sx={{ fontSize: 16 }} />}
                onClick={handleGoogleAuth}
                disabled={loading}
                sx={{
                  textTransform: "none",
                  height: "36px",
                  fontSize: "13px",
                  fontWeight: 500,
                  borderColor: "#64b5f6",
                  color: "#64b5f6",
                  "&:hover": {
                    borderColor: "#5aa3e0",
                    backgroundColor: "rgba(100, 181, 246, 0.08)",
                  },
                  "&.Mui-disabled": {
                    borderColor: "#333",
                    color: "#555",
                  },
                }}
              >
                Continue with Google
              </Button>

              <Button
                variant="outlined"
                fullWidth
                startIcon={<GitHubIcon sx={{ fontSize: 16 }} />}
                onClick={handleGitHubAuth}
                disabled={loading}
                sx={{
                  textTransform: "none",
                  height: "36px",
                  fontSize: "13px",
                  fontWeight: 500,
                  borderColor: "#64b5f6",
                  color: "#64b5f6",
                  "&:hover": {
                    borderColor: "#5aa3e0",
                    backgroundColor: "rgba(100, 181, 246, 0.08)",
                  },
                  "&.Mui-disabled": {
                    borderColor: "#333",
                    color: "#555",
                  },
                }}
              >
                Continue with GitHub
              </Button>
            </Stack>

            <Divider sx={{ borderColor: "#333" }}>
              <Typography sx={{ fontSize: "11px", color: "#666", fontWeight: 400 }}>
                or
              </Typography>
            </Divider>

            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
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
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
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

            <Stack direction="row" spacing="12px" justifyContent="flex-end">
              <Button
                onClick={onClose}
                disabled={loading}
                sx={{
                  textTransform: "none",
                  fontSize: "13px",
                  fontWeight: 500,
                  height: "28px",
                  padding: "4px 12px",
                  color: "#888",
                  "&:hover": {
                    backgroundColor: "#2a2a2a",
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                disableElevation
                startIcon={loading ? <CircularProgress size={14} sx={{ color: "#000" }} /> : null}
                sx={{
                  textTransform: "none",
                  fontSize: "13px",
                  fontWeight: 500,
                  height: "28px",
                  padding: "4px 12px",
                  minWidth: "100px",
                  backgroundColor: "#64b5f6",
                  color: "#000",
                  "&:hover": {
                    backgroundColor: "#5aa3e0",
                  },
                  "&.Mui-disabled": {
                    backgroundColor: "#222",
                    color: "#555",
                  },
                }}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </Stack>

            <Typography
              sx={{
                textAlign: "center",
                cursor: "pointer",
                fontSize: "11px",
                color: "#666",
                fontWeight: 400,
                "&:hover": { textDecoration: "underline" }
              }}
              onClick={handleSignupClick}
            >
              Don't have an account? Sign up at langra.de
            </Typography>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
