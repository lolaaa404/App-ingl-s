import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Persistencia en archivos JSON dentro de la carpeta de datos.
 *
 * Se eligió el disco local en lugar de una base de datos porque la aplicación
 * está pensada para el trabajo de una traductora en su propia máquina: los
 * glosarios y la memoria quedan en archivos que puede copiar, versionar o
 * respaldar. La capa está aislada para poder cambiarla por Postgres sin tocar
 * el resto del código.
 */

/**
 * Raíz de los datos. Se resuelve contra el directorio de trabajo en lugar de
 * con una ruta libre para que el empaquetador no tenga que rastrear todo el
 * proyecto; una ruta absoluta en DATOS_DIR se respeta tal cual.
 */
function raizDatos(): string {
  const configurada = process.env.DATOS_DIR?.trim();
  if (!configurada) return path.join(process.cwd(), 'datos');
  // La carpeta la elige quien despliega, así que el empaquetador no puede
  // conocerla de antemano: se le indica que no rastree esta ruta.
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), configurada);
}

const RAIZ = raizDatos();

export function rutaDatos(...partes: string[]): string {
  // Los nombres de archivo se forman en tiempo de ejecución (un archivo por
  // proyecto), de modo que el rastreo estático no puede resolverlos.
  return path.join(/*turbopackIgnore: true*/ RAIZ, ...partes);
}

async function asegurarCarpeta(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

/** Serializa las escrituras por archivo para que no se pisen entre sí. */
const colas = new Map<string, Promise<unknown>>();

function enCola<T>(clave: string, tarea: () => Promise<T>): Promise<T> {
  const previa = colas.get(clave) ?? Promise.resolve();
  const siguiente = previa.then(tarea, tarea);
  colas.set(
    clave,
    siguiente.catch(() => undefined),
  );
  return siguiente;
}

export async function leerJSON<T>(relativa: string, porDefecto: T): Promise<T> {
  const ruta = rutaDatos(relativa);
  try {
    const crudo = await fs.readFile(ruta, 'utf8');
    return JSON.parse(crudo) as T;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') return porDefecto;
    throw new Error(`No se pudo leer ${relativa}: ${err.message}`);
  }
}

/** Escritura atómica: archivo temporal y renombrado. */
export async function escribirJSON(relativa: string, datos: unknown): Promise<void> {
  const ruta = rutaDatos(relativa);
  return enCola(ruta, async () => {
    await asegurarCarpeta(path.dirname(ruta));
    const temporal = `${ruta}.${process.pid}.tmp`;
    await fs.writeFile(temporal, JSON.stringify(datos, null, 2), 'utf8');
    await fs.rename(temporal, ruta);
  });
}

export async function borrarArchivo(relativa: string): Promise<void> {
  try {
    await fs.unlink(rutaDatos(relativa));
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== 'ENOENT') throw err;
  }
}

export async function listarArchivos(relativa: string): Promise<string[]> {
  try {
    return await fs.readdir(rutaDatos(relativa));
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

/** Lee, transforma y vuelve a escribir sin que se solapen dos llamadas. */
export async function actualizarJSON<T>(
  relativa: string,
  porDefecto: T,
  transformar: (actual: T) => T | Promise<T>,
): Promise<T> {
  const ruta = rutaDatos(relativa);
  return enCola(`mutacion:${ruta}`, async () => {
    const actual = await leerJSON<T>(relativa, porDefecto);
    const nuevo = await transformar(actual);
    await escribirJSON(relativa, nuevo);
    return nuevo;
  });
}
