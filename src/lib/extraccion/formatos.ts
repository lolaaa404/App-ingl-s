/**
 * Constantes de formato compartidas entre el servidor y la interfaz.
 * Viven aparte de `documentos.ts` porque ese módulo es solo de servidor
 * (arrastra mammoth, unpdf y jszip) y el formulario de carga las necesita.
 */

export const EXTENSIONES_ADMITIDAS = [
  '.pdf',
  '.docx',
  '.pptx',
  '.txt',
  '.md',
  '.rtf',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
];

export const TIPOS_IMAGEN = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export function esImagen(nombre: string, tipo: string): boolean {
  return tipo.startsWith('image/') || /\.(png|jpe?g|webp|gif|tiff?|bmp)$/i.test(nombre);
}
