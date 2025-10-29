import { useState, useEffect } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { invoke } from "@tauri-apps/api/core";
import { TranslationPopup } from "./TranslationPopup";
import { NormalWindow } from "./NormalWindow";
import { WelcomeScreen } from "./WelcomeScreen";
import { SuccessScreen } from "./SuccessScreen";
import { SettingsDialog } from "./SettingsDialog";
import { PermissionModal } from "./PermissionModal";

function App() {
  const [viewMode, setViewMode] = useState<"popup" | "normal">("popup");
  const [popup, setPopup] = useState({
    isOpen: false,
    text: "",
    isStreaming: false,
    detectedLanguage: "en",
    originalText: "",
    progress: 0,
  });
  const [mode, setMode] = useState<"translate" | "enhance">("translate");
  const [showWelcome, setShowWelcome] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  useEffect(() => {
    const loadMode = async () => {
      try {
        const savedMode = await invoke<string>("get_mode");
        if (savedMode === "enhance" || savedMode === "translate") {
          setMode(savedMode as "translate" | "enhance");
          console.log("[FRONTEND] Loaded saved mode:", savedMode);
        }
      } catch (error) {
        console.error("[FRONTEND] Failed to load mode:", error);
      }
    };
    loadMode();

    const checkPermissions = async () => {
      try {
        console.log("[FRONTEND] Checking Input Monitoring permission...");
        const hasPermission = await invoke<boolean>("check_input_monitoring_permission");

        if (!hasPermission) {
          console.log("[FRONTEND] No Input Monitoring permission, showing permission modal");
          await invoke("show_window");
          await invoke("set_always_on_top", { onTop: true });
          setShowPermissionModal(true);
          return false;
        }

        console.log("[FRONTEND] Input Monitoring permission granted");
        return true;
      } catch (error) {
        console.error("[FRONTEND] Failed to check permission:", error);
        return false;
      }
    };

    const checkCredentials = async () => {
      try {
        console.log("[FRONTEND] Checking if user is logged in...");

        const hasPermission = await checkPermissions();
        if (!hasPermission) {
          return; 
        }

        try {
          await invoke<string>("get_access_token");
          console.log("[FRONTEND] User is logged in, app ready");
        } catch (err) {
          console.log("[FRONTEND] No access token found, showing welcome screen");
          setShowWelcome(true);
        }
      } catch (error) {
        console.error("[FRONTEND] Failed to check credentials:", error);
        setShowWelcome(true);
      }
    };
    checkCredentials();
  }, []);

  useEffect(() => {
    invoke("set_always_on_top", { onTop: showWelcome || showPermissionModal });
  }, [showWelcome, showPermissionModal]);

  useEffect(() => {
    console.log("[FRONTEND] App mounted, setting up event listeners...");
    const unlistenFns: (() => void)[] = [];

    const setupListeners = async () => {
      try {
        const currentWindow = getCurrentWebviewWindow();

        const unlistenStart = await currentWindow.listen<{detected_language: string, original_text: string}>("translation-start", async (event) => {
          console.log("[FRONTEND] Translation started - opening popup");
          await invoke("resize_window_to_popup");
          setViewMode("popup");
          setPopup({
            isOpen: true,
            text: "",
            isStreaming: true,
            detectedLanguage: event.payload.detected_language,
            originalText: event.payload.original_text,
            progress: 0,
          });
        });
        unlistenFns.push(unlistenStart);

        const unlistenProgress = await currentWindow.listen<number>("translation-progress", (event) => {
          console.log("[FRONTEND] Progress:", event.payload + "%");
          setPopup((prev) => ({
            ...prev,
            progress: event.payload,
          }));
        });
        unlistenFns.push(unlistenProgress);

        const unlistenPartial = await currentWindow.listen<string>("translation-partial", (event) => {
          console.log("[FRONTEND] Received partial text:", event.payload.substring(0, 50) + "...");
          setPopup((prev) => {
            console.log("[FRONTEND] Updating popup state with partial text");
            // Calculate progress based on text length
            // Assume translation will be ~1.2x the original text length
            const estimatedLength = prev.originalText.length * 1.2;
            const currentLength = event.payload.length;
            const calculatedProgress = Math.min(95, Math.floor((currentLength / estimatedLength) * 100));

            return {
              ...prev,
              text: event.payload,
              isStreaming: true,
              progress: calculatedProgress,
            };
          });
        });
        unlistenFns.push(unlistenPartial);

        const unlistenEnhancementPartial = await currentWindow.listen<string>("enhancement-partial", (event) => {
          console.log("[FRONTEND] Received enhancement partial text:", event.payload.substring(0, 50) + "...");
          setPopup((prev) => {
            console.log("[FRONTEND] Updating popup state with enhancement partial text");
            // Calculate progress based on text length
            const estimatedLength = prev.originalText.length * 1.2;
            const currentLength = event.payload.length;
            const calculatedProgress = Math.min(95, Math.floor((currentLength / estimatedLength) * 100));

            return {
              ...prev,
              text: event.payload,
              isStreaming: true,
              progress: calculatedProgress,
            };
          });
        });
        unlistenFns.push(unlistenEnhancementPartial);

        const unlistenChunk = await currentWindow.listen<string>("translation-chunk", (event) => {
          console.log("[FRONTEND] Received chunk");
          setPopup((prev) => ({
            ...prev,
            text: event.payload,
            isStreaming: true,
          }));
        });
        unlistenFns.push(unlistenChunk);

        const unlistenComplete = await currentWindow.listen("translation-complete", () => {
          console.log("[FRONTEND] Translation complete");
          setPopup((prev) => ({ ...prev, isStreaming: false, progress: 100 }));
        });
        unlistenFns.push(unlistenComplete);

        const unlistenError = await currentWindow.listen<string>("translation-error", (event) => {
          console.error("[FRONTEND] Translation error:", event.payload);
          setPopup((prev) => ({ ...prev, isOpen: false, text: "", isStreaming: false }));
        });
        unlistenFns.push(unlistenError);

        const unlistenCredentialsMissing = await currentWindow.listen("credentials-missing", () => {
          console.log("[FRONTEND] Credentials missing, showing welcome screen");
          setShowWelcome(true);
          setPopup({
            isOpen: false,
            text: "",
            isStreaming: false,
            detectedLanguage: "en",
            originalText: "",
            progress: 0,
          });
        });
        unlistenFns.push(unlistenCredentialsMissing);

        const unlistenAuthSuccess = await currentWindow.listen("auth-success", () => {
          console.log("[FRONTEND] Authentication successful, hiding welcome screen");
          setShowWelcome(false);
          setShowSuccess(true);
        });
        unlistenFns.push(unlistenAuthSuccess);

        console.log("[FRONTEND] All event listeners registered");
      } catch (error) {
        console.error("[FRONTEND] Error setting up listeners:", error);
      }
    };

    setupListeners();

    return () => {
      unlistenFns.forEach((fn) => fn());
    };
  }, []);

  const handleCopy = async () => {
    try {
      const textToCopy = popup.text;
      await invoke("copy_to_clipboard", { text: textToCopy });
      setPopup({ isOpen: false, text: "", isStreaming: false, detectedLanguage: "en", originalText: "", progress: 0 });
      await invoke("hide_translator_window");
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const handleReplace = async () => {
    try {
      const textToInsert = popup.text;
      console.log("[FRONTEND] Replace clicked, text to insert:", textToInsert);
      setPopup({ isOpen: false, text: "", isStreaming: false, detectedLanguage: "en", originalText: "", progress: 0 });
      console.log("[FRONTEND] Hiding window...");
      await invoke("hide_translator_window");
      console.log("[FRONTEND] Calling insert_translation_into_previous_input...");
      await invoke("insert_translation_into_previous_input", { text: textToInsert });
      console.log("[FRONTEND] Replace complete!");
    } catch (error) {
      console.error("[FRONTEND] Replace failed:", error);
    }
  };

  const handleClose = async () => {
    setPopup((prev) => ({ ...prev, isOpen: false, text: "", isStreaming: false }));
    await invoke("hide_translator_window");
  };

  const handleLanguageSwitch = () => {
    const newLang = popup.detectedLanguage === "de" ? "en" : "de";
    setPopup((prev) => ({ ...prev, detectedLanguage: newLang, text: "", isStreaming: true }));
    invoke("retranslate", {
      text: popup.originalText,
      sourceLang: newLang,
    });
  };


  const handleClearAndStream = () => {
    setPopup((prev) => ({
      ...prev,
      text: "",
      isStreaming: true,
    }));
  };

  const handleModeChange = (newMode: "translate" | "enhance") => {
    console.log("[FRONTEND] Mode changed to:", newMode);
    setMode(newMode);

    invoke("set_mode", { mode: newMode });

    setPopup((prev) => ({ ...prev, text: "", isStreaming: true }));

    if (newMode === "enhance") {
      invoke("enhance_text", {
        text: popup.originalText,
        language: popup.detectedLanguage,
      });
    } else {
      invoke("retranslate", {
        text: popup.originalText,
        sourceLang: popup.detectedLanguage,
      });
    }
  };

  const handleCloseSettings = async (credentialsSaved?: boolean) => {
    console.log("[FRONTEND] Settings closed, credentials saved:", credentialsSaved);
    setSettingsOpen(false);
    if (credentialsSaved === true) {
      setShowWelcome(false);
      setShowSuccess(true);
    }
  };

  const handleSuccessClose = async () => {
    setShowSuccess(false);

    try {
      await invoke<string>("get_access_token");
      console.log("[FRONTEND] Access token verified, staying logged in");
      await invoke("hide_translator_window");
    } catch (err) {
      console.log("[FRONTEND] No access token found after success, showing welcome");
      setShowWelcome(true);
    }
  };

  const handleLoginSuccess = () => {
    console.log("[FRONTEND] Login successful, hiding welcome screen");
    setShowWelcome(false);
    setShowSuccess(true);
  };

  const handleExpandToNormal = async () => {
    console.log("[APP] Expanding to normal mode");
    await invoke("resize_window_to_normal");
    setViewMode("normal");
    setPopup((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    const currentWindow = getCurrentWebviewWindow();

    const setupViewModeListener = async () => {
      const unlisten = await currentWindow.listen<string>("switch-to-normal", async () => {
        console.log("[FRONTEND] Switching to normal view");
        await invoke("resize_window_to_normal");
        setViewMode("normal");
        setPopup({ isOpen: false, text: "", isStreaming: false, detectedLanguage: "en", originalText: "", progress: 0 });
      });
      return unlisten;
    };

    setupViewModeListener();
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh", background: "#1a1a1a" }}>
      {showPermissionModal ? (
        <PermissionModal />
      ) : showSuccess ? (
        <SuccessScreen onClose={handleSuccessClose} />
      ) : showWelcome ? (
        <WelcomeScreen
          onLoginSuccess={handleLoginSuccess}
        />
      ) : viewMode === "popup" ? (
        <TranslationPopup
          translation={popup.text}
          isOpen={popup.isOpen}
          isStreaming={popup.isStreaming}
          detectedLanguage={popup.detectedLanguage}
          mode={mode}
          progress={popup.progress}
          originalText={popup.originalText}
          onCopy={handleCopy}
          onReplace={handleReplace}
          onClose={handleClose}
          onLanguageSwitch={handleLanguageSwitch}
          onModeChange={handleModeChange}
          onClearAndStream={handleClearAndStream}
          onExpandToNormal={handleExpandToNormal}
        />
      ) : (
        <NormalWindow />
      )}

      <SettingsDialog open={settingsOpen} onClose={handleCloseSettings} />
    </div>
  );
}

export default App;
