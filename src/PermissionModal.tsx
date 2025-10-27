import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./PermissionModal.css";

export function PermissionModal() {
  const [step, setStep] = useState<"intro" | "waiting" | "success">("intro");
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (step === "waiting") {
      const interval = setInterval(async () => {
        try {
          const granted = await invoke<boolean>("check_input_monitoring_permission");
          if (granted) {
            console.log("[PERMISSIONS] Permission granted!");
            setStep("success");
          }
        } catch (error) {
          console.error("[PERMISSIONS] Error checking permission:", error);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [step]);

  const handleGrantPermission = async () => {
    try {
      setIsChecking(true);
      console.log("[PERMISSIONS] Opening System Settings...");

      await invoke("open_input_monitoring_settings");

      setStep("waiting");
    } catch (error) {
      console.error("[PERMISSIONS] Error opening settings:", error);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="permission-overlay">
      <div className="permission-modal">
        {step === "intro" && (
          <>
            <div className="permission-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"
                  fill="currentColor"
                  fillOpacity="0.12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 12l2 2 4-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>

            <h2 className="permission-title">Input Monitoring Access Required</h2>

            <p className="permission-description">
              Langra needs Input Monitoring permission to detect when you press <kbd>⌘ Cmd+C</kbd> twice to activate translations.
            </p>

            <div className="permission-info-box">
              <div className="info-item">
                <div className="info-text">
                  <div className="info-title">Privacy First</div>
                  <div className="info-subtitle">We only monitor keyboard shortcuts, nothing else</div>
                </div>
              </div>
              <div className="info-item">
                <div className="info-text">
                  <div className="info-title">Fast & Local</div>
                  <div className="info-subtitle">All processing happens on your device</div>
                </div>
              </div>
            </div>

            <button
              className="permission-button-primary"
              onClick={handleGrantPermission}
              disabled={isChecking}
            >
              {isChecking ? "Opening Settings..." : "Grant Permission"}
            </button>

            <p className="permission-footer">
              You can revoke this permission anytime in System Settings
            </p>
          </>
        )}

        {step === "waiting" && (
          <>
            <div className="permission-icon pulsing">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                  fill="currentColor"
                  fillOpacity="0.12"
                />
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </div>

            <h2 className="permission-title">Almost There!</h2>

            <p className="permission-description">
              System Settings should now be open. Please follow these steps:
            </p>

            <div className="permission-steps">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-text">Find <strong>Langra</strong> in the list</div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-text">Toggle the switch to <strong>enable</strong> it</div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-text">Return to this window - we'll detect it automatically</div>
              </div>
            </div>

            <div className="checking-status">
              <div className="spinner"></div>
              <span>Waiting for permission...</span>
            </div>
          </>
        )}

        {step === "success" && (
          <>
            <div className="permission-icon success">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.12" />
                <path
                  d="M9 12l2 2 4-4"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>

            <h2 className="permission-title">Permission Granted!</h2>

            <p className="permission-description">
              Please restart Langra for the permission to take effect.
            </p>

            <button
              className="permission-button-primary"
              onClick={async () => {
                try {
                  await invoke("restart_app");
                } catch (error) {
                  console.error("[PERMISSIONS] Failed to restart:", error);
                  window.location.reload();
                }
              }}
            >
              Restart Now
            </button>

            <p className="permission-footer">
              You can also restart manually by quitting and reopening the app
            </p>
          </>
        )}
      </div>
    </div>
  );
}
