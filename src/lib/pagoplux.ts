import type { CartTotals } from "@/types/cart";
import type { PayboxCustomer, PayboxData } from "@/types/pagoplux";

const JQUERY_ID = "pagoplux-jquery";
const JQUERY_SRC = "https://code.jquery.com/jquery-3.6.0.min.js";
const IS_PRODUCTION = process.env.NEXT_PUBLIC_PAGOPLUX_IS_PRODUCTION === "true";
const PAYBOX_HOST = IS_PRODUCTION
  ? "https://paybox.pagoplux.com"
  : "https://sandbox-paybox.pagoplux.com";
const CSS_ID = "pagoplux-css";
const CSS_SRC = `${PAYBOX_HOST}/css/Paybox.css`;
const PAYBOX_ID = "pagoplux-paybox-script";
const PAYBOX_SRC = `${PAYBOX_HOST}/paybox/index.js`;
let payboxPreloadPromise: Promise<void> | null = null;

function loadScript(id: string, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      reject(new Error(`No se pudo cargar: ${src}`));
    };
    document.head.appendChild(script);
  });
}

function loadCss(id: string, href: string): void {
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

// Mantiene disparador invisible sin crear una capa que recorte modal hijo.
function injectPayboxStyles(): void {
  const styleId = "pagoplux-custom-layer-style";
  if (document.getElementById(styleId)) return;
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    #ButtonPaybox {
      position: static !important;
      width: 1px !important;
      height: 1px !important;
      overflow: visible !important;
      pointer-events: auto !important;
    }

    /* Ocultar únicamente el botón por defecto; click() sigue funcionando. */
    #ButtonPaybox > a,
    #ButtonPaybox > button,
    #pay {
      position: absolute !important; 
      opacity: 0 !important; 
      pointer-events: none !important;
      width: 1px !important;
      height: 1px !important;
      top: 0 !important;
      left: 0 !important;
    }

    /* PagoPlux aplica display:none inline hasta agregar esta clase. */
    #paybox_modal.paybox_modal--active,
    .paybox_modal.paybox_modal--active {
      position: fixed !important;
      inset: 0 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 100vw !important;
      height: 100dvh !important;
      min-height: 100vh !important;
      visibility: visible !important;
      opacity: 1 !important;
      overflow-x: hidden !important;
      overflow-y: auto !important;
      z-index: 999999 !important;
    }

    #paybox_modal.paybox_modal--active #paybox_modal_content,
    #paybox_modal.paybox_modal--active .paybox_modal__content {
      position: relative !important;
      width: min(660px, calc(100vw - 1rem)) !important;
      max-width: calc(100vw - 1rem) !important;
      height: auto !important;
      max-height: calc(100dvh - 1rem) !important;
      margin: 0 auto !important;
    }

    #paybox_modal.paybox_modal--active #iframePaybox {
      display: block !important;
      position: relative !important;
      width: min(570px, calc(100vw - 2rem)) !important;
      max-width: calc(100vw - 2rem) !important;
      height: min(752px, calc(100dvh - 2rem)) !important;
      min-height: 0 !important;
      margin: 0 auto !important;
      opacity: 1 !important;
      visibility: visible !important;
      z-index: 1000000 !important;
    }
  `;
  document.head.appendChild(style);
}

async function preloadPayboxInternal(): Promise<void> {
  if (typeof window === "undefined" || window.__payboxPreloaded) return;

  try {
    loadCss(CSS_ID, CSS_SRC);
    injectPayboxStyles();

    if (typeof window.jQuery === "undefined") {
      await loadScript(JQUERY_ID, JQUERY_SRC);
    }

    let container = document.getElementById("ButtonPaybox");
    if (!container) {
      container = document.createElement("div");
      container.id = "ButtonPaybox";
      document.body.appendChild(container);
    }

    const merchantEmail = process.env.NEXT_PUBLIC_PAGOPLUX_MERCHANT_EMAIL?.trim() || "jaguas@plux.ec";
    window.data = {
      PayboxRuc: process.env.NEXT_PUBLIC_PAGOPLUX_RUC || "1790000000001",
      PayboxName: process.env.NEXT_PUBLIC_PAGOPLUX_STORE_NAME || "PAGOPLUX",
      PayboxRemail: merchantEmail,
      PayboxLanguage: "es",
      PayboxEnvironment: IS_PRODUCTION ? "prod" : "sandbox",
      PayboxProduction: IS_PRODUCTION,
      PayboxPagoInmediato: true,
    };
    window.onAuthorize = () => undefined;

    if (!window.__payboxLoaded || !document.getElementById(PAYBOX_ID)) {
      await loadScript(PAYBOX_ID, PAYBOX_SRC);
      window.__payboxLoaded = true;
    }
    window.dispatchEvent(new Event("load"));

    let initialized = false;
    await new Promise<void>((resolve) => {
      const started = Date.now();
      const check = window.setInterval(() => {
        const trigger = document.querySelector("#ButtonPaybox #pay, #ButtonPaybox a, #ButtonPaybox button");
        const iframe = document.getElementById("iframePaybox");
        if (trigger && iframe) {
          initialized = true;
          window.clearInterval(check);
          // PagoPlux binds #pay's click handler after its async environment load.
          // Replaying load now ensures the already-injected trigger receives it.
          window.dispatchEvent(new Event("load"));
          resolve();
        } else if (Date.now() - started >= 5000) {
          window.clearInterval(check);
          resolve();
        }
      }, 50);
    });
    if (initialized) window.__payboxPreloaded = true;
  } catch {
    // openPaybox retries initialization if preloading cannot complete.
  }
}

export function preloadPaybox(): Promise<void> {
  if (typeof window === "undefined" || window.__payboxPreloaded) return Promise.resolve();
  if (!payboxPreloadPromise) {
    payboxPreloadPromise = preloadPayboxInternal().finally(() => {
      payboxPreloadPromise = null;
    });
  }
  return payboxPreloadPromise;
}

export async function openPaybox(
  totals: CartTotals,
  customer: PayboxCustomer,
  onSuccess: (data: unknown) => void,
  onCancel: () => void,
  onStatus: (message: string) => void = () => undefined
): Promise<void> {
  try {
    if (!window.__payboxPreloaded) await preloadPaybox();
    onStatus("Cargando librerías de PagoPlux...");

    loadCss(CSS_ID, CSS_SRC);
    injectPayboxStyles();
    if (!window.__payboxPreloaded) {
      document.getElementById("paybox_modal")?.remove();
      document.getElementById("pay")?.remove();
    }

    if (typeof window.jQuery === "undefined") {
      await loadScript(JQUERY_ID, JQUERY_SRC);
    }

    // Contenedor neutro para el botón
    let container = document.getElementById("ButtonPaybox");
    if (!container) {
      container = document.createElement("div");
      container.id = "ButtonPaybox";
      document.body.appendChild(container);
    }

    const merchantEmail =
      process.env.NEXT_PUBLIC_PAGOPLUX_MERCHANT_EMAIL?.trim() || "jaguas@plux.ec";
    const orderId = `TEST-${Date.now()}`;
    const cleanCedula = customer.cedula.trim();
    const idType = cleanCedula.length === 13 ? "RUC" : "CEDULA";
    let callbackHandled = false;
    const handleSuccess = (response: unknown) => {
      if (callbackHandled) return;
      callbackHandled = true;
      onStatus("¡Pago aprobado por PagoPlux!");
      onSuccess(response);
    };
    const handleCancel = () => {
      if (callbackHandled) return;
      callbackHandled = true;
      onStatus("Pago cancelado por el usuario.");
      onCancel();
    };

    // 1. Objeto principal de datos
    const dataPaybox: PayboxData = {
      PayboxRuc: process.env.NEXT_PUBLIC_PAGOPLUX_RUC || "1790000000001",
      PayboxName: process.env.NEXT_PUBLIC_PAGOPLUX_STORE_NAME || "PAGOPLUX",
      PayboxBase0: totals.subtotalBase0.toFixed(2),
      PayboxBase12: totals.subtotalBase15.toFixed(2),
      PayboxIva: totals.ivaAmount.toFixed(2),
      PayboxMonto: totals.total.toFixed(2),
      PayboxDescription: "Compra en tienda web",
      PayboxRename: process.env.NEXT_PUBLIC_PAGOPLUX_STORE_NAME || "PAGOPLUX",
      PayboxProduction: IS_PRODUCTION,
      PayboxEnvironment: IS_PRODUCTION ? "prod" : "sandbox",
      PayboxLanguage: "es",
      PayboxClientName: customer.fullName.trim(),
      PayboxClientIdentification: cleanCedula,
      PayboxClientEmail: customer.email.trim(),
      PayboxClientPhone: customer.phone.trim(),
      PayboxDirection: customer.address.trim(),
      PayboxRemail: merchantEmail,
      PayboxSendmail: customer.email.trim(),
      PayboxSendname: customer.fullName.trim(),
      PayboxIdPedido: orderId,
      PayboxIdElemento: "ButtonPaybox",
      PayboxOnSuccess: handleSuccess,
      PayboxOnCancel: handleCancel,
    };

    // 2. Objeto legacy para la compatibilidad del bundle
    window.DataPaybox = dataPaybox;
    const serializableDataPaybox = Object.fromEntries(
      Object.entries(dataPaybox).filter(([, value]) => typeof value !== "function"),
    );
    window.data = {
      ...serializableDataPaybox,
      base0: dataPaybox.PayboxBase0,
      base12: dataPaybox.PayboxBase12,
      base15: dataPaybox.PayboxBase12,
      name: dataPaybox.PayboxName,
      establecimiento: dataPaybox.PayboxName,
      remail: merchantEmail,
      sendmail: customer.email.trim(),
      sendname: customer.fullName.trim(),
      PayboxAmountIva: dataPaybox.PayboxIva,
      PayboxDescripcion: "Compra en tienda web - Sandbox",
      PayBoxClientIdentification: cleanCedula,
      PayboxClientIdentity: cleanCedula,
      PayBoxClientPhone: customer.phone.trim(),
      PayBoxClientName: customer.fullName.trim(),
      PayboxTypeIdentification: idType,
      PayboxPagoInmediato: true,
      PayboxButtonchester: "true",
      PayboxRequired: false,
    };

    window.onAuthorize = (response) => {
      const status = response && typeof response === "object" && "status" in response
        ? String((response as { status?: unknown }).status).toLowerCase()
        : "";
      if (["approved", "aprobado", "success", "successful", "succeeded", "successed", "00"].includes(status)) {
        handleSuccess(response);
      } else {
        handleCancel();
      }
    };

    // 3. Cargar SDK si no está en el DOM
    if (!window.__payboxLoaded || !document.getElementById(PAYBOX_ID)) {
       onStatus(`Conectando con PagoPlux ${IS_PRODUCTION ? "Production" : "Sandbox"}...`);
      await loadScript(PAYBOX_ID, PAYBOX_SRC);
      window.__payboxLoaded = true;
    }

    // Re-evaluar evento de carga
    if (!window.__payboxPreloaded) window.dispatchEvent(new Event("load"));

    // 4. Disparar clic
    onStatus("Desplegando ventana de pago seguro...");
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        const trigger =
          document.getElementById("pay") ||
          (document.querySelector("#ButtonPaybox a, #ButtonPaybox button, .paybox_modal__trigger") as HTMLElement);

        if (trigger) {
          clearInterval(interval);
          onStatus("Consultando establecimiento sandbox de PagoPlux...");
           const jquery = window.jQuery as unknown as {
             ajax: (this: unknown, settings: Record<string, unknown>) => unknown;
           };
           const originalAjax = jquery.ajax;
           let restoreAjax = () => undefined;
           const patchedAjax = function (this: unknown, settings: Record<string, unknown>) {
             if (typeof settings.url === "string" && settings.url.includes("getEstablishmentByEmailPayboxResource")) {
               const success = settings.success;
               settings.success = (response: unknown, ...args: unknown[]) => {
                if (response && typeof response === "object" && "detail" in response) {
                  const detail = (response as { detail?: Record<string, unknown> }).detail;
                  const establishment = detail?.establishmentInfo;
                  if (establishment && !detail.infoEstablecimiento) {
                    detail.infoEstablecimiento = {
                      ...(establishment as Record<string, unknown>),
                      monto_minimo: (establishment as Record<string, unknown>).minimum_amount,
                      nombre_establecimiento: (establishment as Record<string, unknown>).establishment_name,
                   };
                 }
               }
               try {
                 if (typeof success === "function") success(response, ...args);
               } finally {
                 restoreAjax();
               }
             };
             const error = settings.error;
             settings.error = (...args: unknown[]) => {
               try {
                 if (typeof error === "function") error(...args);
               } finally {
                 restoreAjax();
               }
             };
           }
           return originalAjax.call(this, settings);
           };
           restoreAjax = () => {
             if (jquery.ajax === patchedAjax) jquery.ajax = originalAjax;
           };
           jquery.ajax = patchedAjax;
           let modalObserver: MutationObserver | undefined;
           let settled = false;
           const timeout = { id: 0 };
           const finish = (error?: Error) => {
             if (settled) return;
             settled = true;
             modalObserver?.disconnect();
             window.clearTimeout(timeout.id);
             restoreAjax();
             if (error) reject(error);
             else resolve();
           };
           const watchModal = (modal: HTMLElement) => {
             const opened = () => modal.classList.contains("paybox_modal--active");
             if (opened()) {
               onStatus("Modal abierto. Completa los datos de la tarjeta.");
               finish();
               return;
             }
             modalObserver?.disconnect();
             modalObserver = new MutationObserver(() => {
               if (!opened()) return;
               onStatus("Modal abierto. Completa los datos de la tarjeta.");
               finish();
             });
             modalObserver.observe(modal, { attributes: true, attributeFilter: ["class", "aria-hidden", "style"] });
           };
           timeout.id = window.setTimeout(() => {
             finish(new Error("PagoPlux no respondió al consultar el establecimiento sandbox. Revisa la solicitud apipre.pagoplux.com en Network."));
           }, 15000);
           modalObserver = new MutationObserver(() => {
             const modal = document.getElementById("paybox_modal");
             if (modal) watchModal(modal);
           });
           modalObserver.observe(document.body, { childList: true, subtree: true });
           const iframe = document.getElementById("iframePaybox") as HTMLIFrameElement | null;
           if (!iframe) {
             trigger.click();
           } else {
             let clicked = false;
             const clickWhenReady = () => {
               if (clicked) return;
               clicked = true;
               trigger.click();
             };
             // PagoPlux binds its iframe message handlers during iframe load.
             iframe.addEventListener("load", clickWhenReady, { once: true });
             // Avoid blocking checkout if browser has already completed the load event.
             window.setTimeout(clickWhenReady, 2000);
           }
           const modal = document.getElementById("paybox_modal");
           if (modal) watchModal(modal);
         } else if (attempts > 50) {
          clearInterval(interval);
          const msg = "No se pudo generar el disparador de PagoPlux.";
          reject(new Error(msg));
        }
      }, 100);
    });

  } catch (error) {
    throw error;
  }
}
