declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

/**
 * Memuat skrip Midtrans Snap secara dinamis hanya saat dibutuhkan (on-demand).
 */
export function loadSnapScript(clientKey?: string, isProduction?: boolean): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);

    // Mode ditentukan dari backend (MIDTRANS_IS_PRODUCTION di .env, default: false / Sandbox)
    const isProd = isProduction === true;
    const snapUrl = isProd
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";

    if (window.snap) return resolve(true);

    const existing = document.getElementById("midtrans-snap-script") as HTMLScriptElement | null;
    if (existing) {
      if (window.snap) return resolve(true);
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.id = "midtrans-snap-script";
    script.src = snapUrl;
    if (clientKey) {
      script.setAttribute("data-client-key", clientKey);
    }
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn("Gagal memuat skrip Midtrans Snap");
      resolve(false);
    };
    document.body.appendChild(script);
  });
}
