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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        Sign In to Langra
      </DialogTitle>
      <DialogContent>
        <form onSubmit={handleLogin}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Sign in with your Langra account
            </Typography>

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {info && (
              <Alert severity="info" onClose={() => setInfo(null)}>
                {info}
              </Alert>
            )}

            <Stack spacing={2}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<GoogleIcon />}
                onClick={handleGoogleAuth}
                disabled={loading}
                sx={{ textTransform: "none", py: 1.5 }}
              >
                Continue with Google
              </Button>

              <Button
                variant="outlined"
                fullWidth
                startIcon={<GitHubIcon />}
                onClick={handleGitHubAuth}
                disabled={loading}
                sx={{ textTransform: "none", py: 1.5 }}
              >
                Continue with GitHub
              </Button>
            </Stack>

            <Divider>
              <Typography variant="body2" color="text.secondary">
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
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button onClick={onClose} disabled={loading} sx={{ textTransform: "none" }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
                sx={{ textTransform: "none" }}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </Stack>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                textAlign: "center",
                cursor: "pointer",
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
