import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { esSupabaseConfigurado, obtenerClienteSupabase } from './supabase';

/**
 * Persistencia en base de datos Supabase (PostgreSQL en la nube) o archivos JSON locales.
 *
 * Si están configuradas las variables SUPABASE_URL y SUPABASE_ANON_KEY (o SERVICE_ROLE_KEY),
 * se usa la base de datos en la nube. De lo contrario, se usa el disco local en la carpeta `datos`.
 */

/**
 * Raíz de los datos locales.
 */
function raizDatos(): string {
  const configurada = process.env.DATOS_DIR?.trim();
  if (configurada) {
    return path.resolve(/* turbopackIgnore: true */ process.cwd(), configurada);
  }
  if (
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    process.cwd().startsWith('/var/task')
  ) {
    return path.join(os.tmpdir(), 'datos');
  }
  return path.join(process.cwd(), 'datos');
}

const RAIZ = raizDatos();

export function rutaDatos(...partes: string[]): string {
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
  if (esSupabaseConfigurado()) {
    const supabase = obtenerClienteSupabase()!;
    const { data, error } = await supabase
      .from('almacen_datos')
      .select('datos')
      .eq('clave', relativa)
      .maybeSingle();

    if (error) {
      console.error(`[Supabase] Error al leer ${relativa}:`, error.message);
      return porDefecto;
    }
    return (data?.datos as T) ?? porDefecto;
  }

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

/** Escritura atómica / upsert en Supabase o disco local. */
export async function escribirJSON(relativa: string, datos: unknown): Promise<void> {
  if (esSupabaseConfigurado()) {
    const supabase = obtenerClienteSupabase()!;
    const { error } = await supabase.from('almacen_datos').upsert(
      {
        clave: relativa,
        datos,
        actualizado: new Date().toISOString(),
      },
      { onConflict: 'clave' },
    );

    if (error) {
      console.error(`[Supabase] Error al escribir en ${relativa}:`, error.message);
      throw new Error(`Error en Supabase al guardar ${relativa}: ${error.message}`);
    }
    return;
  }

  const ruta = rutaDatos(relativa);
  return enCola(ruta, async () => {
    await asegurarCarpeta(path.dirname(ruta));
    const temporal = `${ruta}.${process.pid}.tmp`;
    await fs.writeFile(temporal, JSON.stringify(datos, null, 2), 'utf8');
    await fs.rename(temporal, ruta);
  });
}

export async function borrarArchivo(relativa: string): Promise<void> {
  if (esSupabaseConfigurado()) {
    const supabase = obtenerClienteSupabase()!;
    const { error } = await supabase.from('almacen_datos').delete().eq('clave', relativa);
    if (error) {
      console.error(`[Supabase] Error al borrar ${relativa}:`, error.message);
    }
    return;
  }

  try {
    await fs.unlink(rutaDatos(relativa));
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== 'ENOENT') throw err;
  }
}

export async function listarArchivos(relativa: string): Promise<string[]> {
  if (esSupabaseConfigurado()) {
    const supabase = obtenerClienteSupabase()!;
    const prefijo = relativa.endsWith('/') ? relativa : `${relativa}/`;
    const { data, error } = await supabase
      .from('almacen_datos')
      .select('clave')
      .like('clave', `${prefijo}%`);

    if (error || !data) {
      if (error) console.error(`[Supabase] Error al listar ${relativa}:`, error.message);
      return [];
    }
    return data.map((d) => d.clave.slice(prefijo.length));
  }

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
  if (esSupabaseConfigurado()) {
    const actual = await leerJSON<T>(relativa, porDefecto);
    const nuevo = await transformar(actual);
    await escribirJSON(relativa, nuevo);
    return nuevo;
  }

  const ruta = rutaDatos(relativa);
  return enCola(`mutacion:${ruta}`, async () => {
    const actual = await leerJSON<T>(relativa, porDefecto);
    const nuevo = await transformar(actual);
    await escribirJSON(relativa, nuevo);
    return nuevo;
  });
}
