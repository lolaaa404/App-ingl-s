import 'server-only';

import { google } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';

/**
 * Selección de modelo. Se admiten dos formas de conexión y se elige según la
 * clave que esté configurada:
 *
 * 1. Gemini directo, con GOOGLE_GENERATIVE_AI_API_KEY.
 * 2. AI Gateway de Vercel, con AI_GATEWAY_API_KEY, que da acceso a modelos de
 *    varios proveedores con una sola clave.
 *
 * Si están las dos, manda Gemini. El modelo concreto se cambia con las
 * variables MODELO_* sin tocar el código.
 */

export type Tarea = 'traduccion' | 'analisis' | 'qa' | 'ocr';
export type Proveedor = 'gemini' | 'gateway';

/**
 * Los modelos «pro» de Gemini no están en el nivel gratuito y gemini-2.5-pro ya
 * no se sirve a cuentas nuevas, así que el valor por defecto es el flash más
 * reciente. `npm run probar-modelo` dice a cuáles llega cada clave.
 */
const POR_DEFECTO_GEMINI = 'gemini-3.5-flash';
const POR_DEFECTO_GATEWAY = 'anthropic/claude-sonnet-5';

export function proveedorActivo(): Proveedor | null {
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) return 'gemini';
  if (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN) return 'gateway';
  return null;
}

function nombreConfigurado(tarea: Tarea): string | undefined {
  switch (tarea) {
    case 'traduccion':
      return process.env.MODELO_TRADUCCION;
    case 'analisis':
      return process.env.MODELO_ANALISIS;
    case 'qa':
      return process.env.MODELO_QA;
    case 'ocr':
      return process.env.MODELO_OCR;
  }
}

/** Nombre del modelo que se va a usar, para mostrarlo en mensajes de error. */
export function nombreModelo(tarea: Tarea): string {
  const configurado = nombreConfigurado(tarea)?.trim();
  if (configurado) return configurado;
  return proveedorActivo() === 'gemini' ? POR_DEFECTO_GEMINI : POR_DEFECTO_GATEWAY;
}

export function modeloPara(tarea: Tarea): LanguageModel {
  const nombre = nombreModelo(tarea);

  if (proveedorActivo() === 'gemini') {
    // Una cadena con barra es un identificador del Gateway: con Gemini directo
    // se usa solo el nombre del modelo.
    return google(nombre.includes('/') ? POR_DEFECTO_GEMINI : nombre);
  }

  // Con el Gateway, la cadena «proveedor/modelo» se resuelve sola.
  return nombre;
}

export class FaltaClaveError extends Error {
  constructor() {
    super(
      'Falta la clave del modelo. Hay que crear .env.local y completar GOOGLE_GENERATIVE_AI_API_KEY (Gemini) o AI_GATEWAY_API_KEY (AI Gateway de Vercel).',
    );
    this.name = 'FaltaClaveError';
  }
}

export function exigirClave(): void {
  if (!proveedorActivo()) throw new FaltaClaveError();
}

/** Convierte un error del proveedor en un mensaje entendible. */
export function mensajeDeError(error: unknown): string {
  if (error instanceof FaltaClaveError) return error.message;
  const texto = error instanceof Error ? error.message : String(error);
  const proveedor = proveedorActivo();
  const variable =
    proveedor === 'gemini' ? 'GOOGLE_GENERATIVE_AI_API_KEY' : 'AI_GATEWAY_API_KEY';

  if (/api key|unauthorized|401|403|permission denied/i.test(texto)) {
    return `El proveedor rechazó la clave. Conviene revisar ${variable} en .env.local.`;
  }
  if (/rate limit|resource.?exhausted|quota exceeded|429/i.test(texto)) {
    return 'El proveedor está limitando las peticiones. Conviene reintentar en unos segundos o usar un modelo con más cuota.';
  }
  if (/not found|404|unsupported model|invalid model/i.test(texto)) {
    return `No se encontró el modelo «${nombreModelo('traduccion')}». Hay que revisar las variables MODELO_* en .env.local.`;
  }
  if (/credit|billing|402|payment/i.test(texto)) {
    return 'La cuenta del proveedor no tiene saldo disponible.';
  }
  if (/safety|blocked|recitation/i.test(texto)) {
    return 'El modelo bloqueó la respuesta por sus filtros de contenido. Con textos jurídicos delicados puede ayudar cambiar de modelo en MODELO_TRADUCCION.';
  }
  return texto;
}
