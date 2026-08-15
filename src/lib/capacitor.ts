import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Network } from "@capacitor/network";
import { Keyboard } from "@capacitor/keyboard";

export const isNativePlatform = Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform();

/**
 * Initialize Capacitor native features for Android / iOS
 */
export async function initCapacitorNativeApp(handlers?: {
  onBackButton?: () => boolean | void; // return true if handled internally
  onNetworkChange?: (isOnline: boolean) => void;
}) {
  if (!isNativePlatform) return;

  try {
    // Configure Status Bar
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#050816" });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (err) {
    console.warn("Capacitor StatusBar init warning:", err);
  }

  try {
    // Configure Keyboard behavior
    Keyboard.setAccessoryBarVisible({ isVisible: false }).catch(() => {});
  } catch (err) {
    console.warn("Capacitor Keyboard init warning:", err);
  }

  try {
    // Hide splash screen smoothly after app initialization
    setTimeout(async () => {
      await SplashScreen.hide().catch(() => {});
    }, 800);
  } catch (err) {
    console.warn("Capacitor SplashScreen hide warning:", err);
  }

  // Handle Hardware Back Button on Android
  try {
    App.addListener("backButton", ({ canGoBack }) => {
      if (handlers?.onBackButton) {
        const handled = handlers.onBackButton();
        if (handled) return;
      }

      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  } catch (err) {
    console.warn("Capacitor BackButton listener warning:", err);
  }

  // Handle Network connection status changes
  try {
    Network.addListener("networkStatusChange", (status) => {
      if (handlers?.onNetworkChange) {
        handlers.onNetworkChange(status.connected);
      }
    });
  } catch (err) {
    console.warn("Capacitor Network listener warning:", err);
  }
}

/**
 * Check current network status asynchronously
 */
export async function checkNetworkStatus(): Promise<boolean> {
  if (isNativePlatform) {
    try {
      const status = await Network.getStatus();
      return status.connected;
    } catch {
      return navigator.onLine;
    }
  }
  return navigator.onLine;
}
