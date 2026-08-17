export interface PayboxCustomer {
  fullName: string;
  cedula: string;
  email: string;
  phone: string;
  address: string;
}

export interface PayboxData {
  PayboxRuc: string;
  PayboxName: string;
  PayboxBase0: string;
  PayboxBase12: string;
  PayboxIva: string;
  PayboxDescription: string;
  PayboxRename: string;
  PayboxProduction: boolean;
  PayboxEnvironment: "sandbox";
  PayboxLanguage: "es";
  PayboxClientName: string;
  PayboxClientIdentification: string;
  PayboxClientEmail: string;
  PayboxClientPhone: string;
  PayboxDirection: string;
  PayboxRemail?: string;
  PayboxSendmail?: string;
  PayboxSendname?: string;
  PayboxMonto?: string;
  PayboxIdPedido?: string;
  PayboxDescripcion?: string;
  PayboxClientIdentity?: string;
  PayboxButtonchester?: string;
  PayboxIdElement?: string;
  PayboxOnSuccess: (data: unknown) => void;
  PayboxOnCancel: () => void;
  PayboxPagoPlux?: boolean;
}

declare global {
  interface Window {
    DataPaybox?: PayboxData;
    data?: Record<string, unknown>;
    __payboxLoaded?: boolean;
    __payboxPreloaded?: boolean;
    onAuthorize?: (response: unknown) => void;
    jQuery?: ((...args: unknown[]) => unknown) & { fn?: Record<string, unknown> };
  }
}

export {};
