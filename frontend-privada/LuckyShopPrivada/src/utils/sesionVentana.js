// sesionVentana.js — la sesión vive solo mientras la ventana (o pestaña) esté abierta.
//
// Cómo funciona:
//  - Al iniciar sesión se guarda una marca en sessionStorage. sessionStorage se borra
//    solo cuando se CIERRA la ventana/pestaña (y se conserva si solo se recarga la página).
//  - Si se abre el sitio en una ventana nueva y no tiene la marca, la sesión que hubiera
//    quedado abierta en el servidor se cierra (el token se invalida).
//  - Si ya hay OTRA pestaña abierta con sesión, la nueva pestaña la hereda (se preguntan
//    entre sí con BroadcastChannel), para no cerrar la sesión de alguien que solo abrió
//    un segundo enlace del sitio.

const CLAVE = 'luckyshop_sesion_activa'
const CANAL = 'luckyshop_sesion'

// Guarda la marca de que ESTA ventana tiene una sesión iniciada
export const marcarSesionActiva = () => {
  try { sessionStorage.setItem(CLAVE, '1') } catch { /* almacenamiento bloqueado */ }
}

// Quita la marca (se usa al cerrar sesión)
export const limpiarMarcaSesion = () => {
  try { sessionStorage.removeItem(CLAVE) } catch { /* almacenamiento bloqueado */ }
}

// ¿Esta ventana tiene la marca de sesión?
export const hayMarcaSesion = () => {
  try { return sessionStorage.getItem(CLAVE) === '1' } catch { return false }
}

// Hace que esta ventana conteste cuando otra ventana NUEVA pregunta si hay sesión abierta.
// Devuelve una función para dejar de escuchar (úsala en el cleanup de useEffect).
export const responderOtrasVentanas = () => {
  if (typeof BroadcastChannel === 'undefined') return () => {}
  const canal = new BroadcastChannel(CANAL)
  canal.onmessage = (e) => {
    if (e.data === 'pedir' && hayMarcaSesion()) canal.postMessage('activa')
  }
  return () => canal.close()
}

// Pregunta si esta ventana puede conservar la sesión del servidor:
//  - true  si tiene la marca, o si otra ventana abierta tiene sesión (hereda la marca)
//  - false si es una ventana nueva sin ninguna otra ventana con sesión
export const sesionPermitida = () =>
  new Promise((resolve) => {
    if (hayMarcaSesion()) return resolve(true)
    if (typeof BroadcastChannel === 'undefined') return resolve(false)

    const canal = new BroadcastChannel(CANAL)
    const espera = setTimeout(() => {
      canal.close()
      resolve(false)
    }, 400)

    canal.onmessage = (e) => {
      if (e.data === 'activa') {
        clearTimeout(espera)
        marcarSesionActiva()
        canal.close()
        resolve(true)
      }
    }
    canal.postMessage('pedir')
  })
