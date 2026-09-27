/**
 * Comprueba que la clave funcione y muestra a qué modelos llega la cuenta.
 *
 *   npm run probar-modelo
 *   npm run probar-modelo -- gemini-2.5-flash gemini-3-pro-preview
 *
 * Hace una llamada mínima a cada modelo y, además de decir si responde, pide
 * una traducción corta con un falso amigo jurídico para ver qué calidad da.
 */

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

const CANDIDATOS = [
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-pro-latest',
  'gemini-flash-latest',
  'gemini-3-pro-preview',
];

const PRUEBA =
  'Traduce al español, sin explicaciones: "The court held that the evidence was inadmissible under the applicable statute."';

const clave = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!clave) {
  console.error('\n✗ No hay clave. Hay que completar GOOGLE_GENERATIVE_AI_API_KEY en .env.local.\n');
  process.exit(1);
}

console.log(`\nClave detectada: ${clave.slice(0, 6)}…${clave.slice(-4)} (${clave.length} caracteres)\n`);

const modelos = process.argv.slice(2).length ? process.argv.slice(2) : CANDIDATOS;
const funcionan = [];

for (const nombre of modelos) {
  process.stdout.write(`${nombre.padEnd(24)} `);
  const inicio = Date.now();

  try {
    const { text } = await generateText({
      model: google(nombre),
      prompt: PRUEBA,
      // Los modelos con razonamiento gastan parte del presupuesto en pensar:
      // con un tope bajo, la respuesta llega cortada.
      maxOutputTokens: 2000,
    });

    const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
    console.log(`✓ ${segundos} s`);
    console.log(`${' '.repeat(25)}${text.trim().replace(/\s+/g, ' ').slice(0, 160)}`);
    funcionan.push(nombre);
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    console.log(`✗ ${mensaje.replace(/\s+/g, ' ').slice(0, 130)}`);
  }
}

console.log('');

if (!funcionan.length) {
  console.error('Ningún modelo respondió. Si el error habla de la clave, conviene generar otra en aistudio.google.com/apikey.\n');
  process.exit(1);
}

console.log(`Modelos disponibles: ${funcionan.join(', ')}`);
console.log(`Sugerencia para .env.local: MODELO_TRADUCCION=${funcionan[0]}\n`);
