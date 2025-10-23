import { useState, useEffect } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { invoke } from "@tauri-apps/api/core";
import { TranslationPopup } from "./TranslationPopup";
import { WelcomeScreen } from "./WelcomeScreen";
import { SuccessScreen } from "./SuccessScreen";
import { SettingsDialog } from "./SettingsDialog";

function App() {
  const [popup, setPopup] = useState({
    isOpen: false,
    text: "",
    isStreaming: false,
    detectedLanguage: "en",
    originalText: "",
  });
  const [mode, setMode] = useState<"translate" | "enhance">("translate");
  const [showWelcome, setShowWelcome] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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

    const checkCredentials = async () => {
      try {
        const settings: any = await invoke("get_settings");
        console.log("[FRONTEND] Checking credentials on startup...");

        const hasCredentials = settings.provider === "azure"
          ? settings.azure_endpoint && settings.azure_api_key
          : settings.openai_api_key;

        if (!hasCredentials) {
          console.log("[FRONTEND] No credentials found, showing welcome screen");
          setShowWelcome(true);
        }
      } catch (error) {
        console.error("[FRONTEND] Failed to check credentials:", error);
      }
    };
    checkCredentials();
  }, []);

  useEffect(() => {
    console.log("[FRONTEND] App mounted, setting up event listeners...");
    const unlistenFns: (() => void)[] = [];

    const setupListeners = async () => {
      try {
        const currentWindow = getCurrentWebviewWindow();

        const unlistenPermission = await currentWindow.listen("check-input-monitoring-permission", () => {
          console.log("[FRONTEND] Checking Input Monitoring permission...");
          if (window.confirm(
            "Langra needs Input Monitoring permission to detect Cmd+C+C.\n\n" +
            "Click OK to open System Settings.\n\n" +
            "Then:\n" +
            "1. Click the lock and enter your password\n" +
            "2. Click the + button\n" +
            "3. Navigate to /Applications/Langra.app\n" +
            "4. Toggle it ON\n" +
            "5. Restart Langra"
          )) {
            invoke("open_input_monitoring_settings");
          }
        });
        unlistenFns.push(unlistenPermission);

        const unlistenStart = await currentWindow.listen<{detected_language: string, original_text: string}>("translation-start", (event) => {
          console.log("[FRONTEND] Translation started - opening popup");
          setPopup({
            isOpen: true,
            text: "",
            isStreaming: true,
            detectedLanguage: event.payload.detected_language,
            originalText: event.payload.original_text,
          });
        });
        unlistenFns.push(unlistenStart);

        const unlistenChunk = await currentWindow.listen<string>("translation-chunk", (event) => {
          const chunk = event.payload;
          console.log("[FRONTEND] Received chunk:", chunk);
          setPopup((prev) => ({
            ...prev,
            text: prev.text + chunk,
            isStreaming: true,
          }));
        });
        unlistenFns.push(unlistenChunk);

        const unlistenComplete = await currentWindow.listen("translation-complete", () => {
          console.log("[FRONTEND] Translation complete");
          setPopup((prev) => ({ ...prev, isStreaming: false }));
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
          });
        });
        unlistenFns.push(unlistenCredentialsMissing);

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
      setPopup({ isOpen: false, text: "", isStreaming: false, detectedLanguage: "en", originalText: "" });
      await invoke("hide_translator_window");
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const handleReplace = async () => {
    try {
      const textToInsert = popup.text;
      console.log("[FRONTEND] Replace clicked, text to insert:", textToInsert);
      setPopup({ isOpen: false, text: "", isStreaming: false, detectedLanguage: "en", originalText: "" });
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

  const handleOpenSettings = () => {
    setSettingsOpen(true);
  };

  const handleCloseSettings = async (credentialsSaved?: boolean) => {
    console.log("[FRONTEND] Settings closed, credentials saved:", credentialsSaved);
    setSettingsOpen(false);
    if (credentialsSaved === true) {
      setShowWelcome(false);
      setShowSuccess(true);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
  };

  return (
    <div className="w-full h-screen" style={{ background: "#1a1a1a" }}>
      {showSuccess ? (
        <SuccessScreen onClose={handleSuccessClose} />
      ) : showWelcome ? (
        <WelcomeScreen onOpenSettings={handleOpenSettings} />
      ) : (
        <TranslationPopup
          translation={popup.text}
          isOpen={popup.isOpen}
          isStreaming={popup.isStreaming}
          detectedLanguage={popup.detectedLanguage}
          mode={mode}
          onCopy={handleCopy}
          onReplace={handleReplace}
          onClose={handleClose}
          onLanguageSwitch={handleLanguageSwitch}
          onModeChange={handleModeChange}
          onClearAndStream={handleClearAndStream}
        />
      )}

      <SettingsDialog open={settingsOpen} onClose={handleCloseSettings} />
    </div>
  );
}

export default App;
