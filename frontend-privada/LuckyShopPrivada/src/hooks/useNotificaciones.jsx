import { useState, useEffect, useMemo, useCallback } from "react";

const BASE_URL = import.meta.env.VITE_API_URL + '';
const UMBRAL_STOCK_BAJO = 5;
const HORAS_RETRASO = 48;
const STORAGE_KEY = "notif-leidas-conteo";

// Lee los conteos leídos desde localStorage
// Formato: { "ventas-completadas": 4, "videos-aceptados": 2, ... }
function obtenerConteos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function guardarConteos(conteos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conteos));
  } catch { /* ignore */ }
}

async function obtener(path) {
  const res = await fetch(`${BASE_URL}${path}`, { method: "GET", credentials: "include" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Error al consultar ${path}`);
  return Array.isArray(data) ? data : data.data ?? data;
}

/**
 * Hook de notificaciones del Panel de control.
 * Al marcar como "leída", guarda cuántos ítems había en ese momento.
 * La próxima vez, solo muestra la diferencia (los nuevos).
 */
export function useNotificaciones(activo = true) {
  const [productos, setProductos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [videosCombo, setVideosCombo] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [conteosLeidos, setConteosLeidos] = useState(obtenerConteos);

  useEffect(() => {
    if (!activo) return;

    let vivo = true;

    async function cargar() {
      // Solo mostrar spinner en la primera carga
      if (productos.length === 0 && ventas.length === 0 && videosCombo.length === 0) {
        setCargando(true);
      }
      setError(null);
      try {
        const [dataProductos, dataVentas, dataVideos] = await Promise.all([
          obtener("/productos"),
          obtener("/venta"),
          obtener("/videosCombo"),
        ]);
        if (!vivo) return;
        setProductos(dataProductos);
        setVentas(dataVentas);
        setVideosCombo(dataVideos);
      } catch (err) {
        if (vivo) setError(err.message);
      } finally {
        if (vivo) setCargando(false);
      }
    }

    cargar();

    // Polling: re-consulta cada 10 segundos para detectar respuestas en tiempo casi real
    const intervalo = setInterval(cargar, 10000);

    return () => {
      vivo = false;
      clearInterval(intervalo);
    };
  }, [activo]);

  // Marca como leída: guarda el conteo actual para ese tipo
  const marcarLeida = useCallback((clave, conteoActual) => {
    setConteosLeidos((prev) => {
      const nuevos = { ...prev, [clave]: conteoActual };
      guardarConteos(nuevos);
      return nuevos;
    });
  }, []);

  const notificaciones = useMemo(() => {
    const lista = [];
    const ahora = Date.now();

    // Helper: calcula cuántos son nuevos desde la última lectura
    const nuevos = (clave, totalActual) => {
      let leidos = conteosLeidos[clave];
      if (leidos === undefined || leidos > totalActual) {
        leidos = 0; // Si no existe o si los leídos superan al total actual (localStorage viejo), resetea a 0
      }
      return Math.max(0, totalActual - leidos);
    };

    // ─── 1. VENTAS COMPLETADAS ─────────────────────────────────────────────
    const ventasCompletadas = ventas.filter((v) => v.estado === "Completado");
    const nuevasCompletadas = nuevos("ventas-completadas", ventasCompletadas.length);

    if (nuevasCompletadas > 0) {
      lista.push({
        id: `ventas-completadas-${ventasCompletadas.length}`,
        tipo: "exito",
        icono: "",
        titulo: "¡Venta realizada!",
        descripcion:
          nuevasCompletadas === 1
            ? `Se completó 1 nueva venta.`
            : `${nuevasCompletadas} nuevas ventas completadas. ¡Buen trabajo!`,
        enlace: "/ventas",
        _clave: "ventas-completadas",
        _conteoActual: ventasCompletadas.length,
      });
    }

    // ─── 1b. VENTAS CANCELADAS ──────────────────────────────────────────────
    const ventasCanceladas = ventas.filter((v) => v.estado === "Cancelado");
    const nuevasCanceladas = nuevos("ventas-canceladas", ventasCanceladas.length);

    if (nuevasCanceladas > 0) {
      lista.push({
        id: `ventas-canceladas-${ventasCanceladas.length}`,
        tipo: "critico",
        icono: "",
        titulo: "Venta cancelada",
        descripcion:
          nuevasCanceladas === 1
            ? `1 nueva venta fue cancelada. Revisa los detalles.`
            : `${nuevasCanceladas} nuevas ventas fueron canceladas. Revisa los detalles.`,
        enlace: "/ventas",
        _clave: "ventas-canceladas",
        _conteoActual: ventasCanceladas.length,
      });
    }

    // ─── 2. VIDEOS ACEPTADOS ───────────────────────────────────────────────────
    const videosAceptados = videosCombo.filter((c) => c.status === true || c.status === "true");
    const nuevosAceptados = nuevos("videos-aceptados", videosAceptados.length);

    if (nuevosAceptados > 0) {
      lista.push({
        id: `videos-aceptados-${videosAceptados.length}`,
        tipo: "exito",
        icono: "",
        titulo: "¡Video aceptado!",
        descripcion:
          nuevosAceptados === 1
            ? `Un nuevo cliente aceptó el video de su bolsa de la suerte.`
            : `${nuevosAceptados} nuevos clientes aceptaron el video de su bolsa de la suerte.`,
        enlace: "/videosCombos",
        _clave: "videos-aceptados",
        _conteoActual: videosAceptados.length,
      });
    }

    // ─── 3. VIDEOS RECHAZADOS ──────────────────────────────────────────────────
    const videosRechazados = videosCombo.filter((c) => c.status === false || c.status === "false");
    const nuevosRechazados = nuevos("videos-rechazados", videosRechazados.length);

    if (nuevosRechazados > 0) {
      lista.push({
        id: `videos-rechazados-${videosRechazados.length}`,
        tipo: "critico",
        icono: "",
        titulo: "Video rechazado",
        descripcion:
          nuevosRechazados === 1
            ? `Un nuevo cliente rechazó el video de su bolsa de la suerte. Revisa los detalles.`
            : `${nuevosRechazados} nuevos clientes rechazaron el video de su bolsa de la suerte. Revisa los detalles.`,
        enlace: "/videosCombos",
        _clave: "videos-rechazados",
        _conteoActual: videosRechazados.length,
      });
    }

    // ─── 4. VIDEOS PENDIENTES ──────────────────────────────────────────────────
    const videosPendientes = videosCombo.filter(
      (c) => c.status === null || c.status === undefined || c.status === "null" || c.status === "undefined"
    );
    const nuevosPendientes = nuevos("videos-pendientes", videosPendientes.length);

    if (nuevosPendientes > 0) {
      lista.push({
        id: `videos-pendientes-${videosPendientes.length}`,
        tipo: "advertencia",
        icono: "",
        titulo: "Videos pendientes de respuesta",
        descripcion:
          nuevosPendientes === 1
            ? `1 nuevo video está esperando la respuesta del cliente.`
            : `${nuevosPendientes} nuevos videos están esperando la respuesta de los clientes.`,
        enlace: "/videosCombos",
        _clave: "videos-pendientes",
        _conteoActual: videosPendientes.length,
      });
    }

    // ─── 5. PEDIDOS PENDIENTES ─────────────────────────────────────────────────
    const pedidosPendientes = ventas.filter((v) => v.estado === "Pendiente");
    const nuevosPedidos = nuevos("pedidos", pedidosPendientes.length);

    if (nuevosPedidos > 0) {
      lista.push({
        id: `pedidos-${pedidosPendientes.length}`,
        tipo: "advertencia",
        icono: "",
        titulo: "Pedidos pendientes",
        descripcion: `Tienes ${nuevosPedidos} nuevo${nuevosPedidos === 1 ? "" : "s"
          } pedido${nuevosPedidos === 1 ? "" : "s"
          } pendiente${nuevosPedidos === 1 ? "" : "s"
          } de despachar.`,
        enlace: "/ventas",
        _clave: "pedidos",
        _conteoActual: pedidosPendientes.length,
      });
    }

    // ─── 6. PEDIDO RETRASADO (más de 48 h sin despachar) ──────────────────────
    const pedidosRetrasados = pedidosPendientes.filter(
      (v) => v.fecha && ahora - new Date(v.fecha).getTime() > HORAS_RETRASO * 60 * 60 * 1000
    );
    if (pedidosRetrasados.length > 0) {
      const retrasadosCount = pedidosRetrasados.length;
      const nuevosRetrasados = nuevos("retraso", retrasadosCount);

      if (nuevosRetrasados > 0) {
        lista.push({
          id: `retraso-${retrasadosCount}`,
          tipo: "critico",
          icono: "",
          titulo: "Pedido con retraso",
          descripcion: `Un pedido lleva más de ${HORAS_RETRASO} horas sin ser despachado. Revisa el panel de ventas.`,
          enlace: "/ventas",
          _clave: "retraso",
          _conteoActual: retrasadosCount,
        });
      }
    }

    // ─── 7. STOCK BAJO ────────────────────────────────────────────────────────
    const productosStockBajo = productos.filter(
      (p) => Number(p.stock ?? Infinity) <= UMBRAL_STOCK_BAJO
    );
    const nuevosStockBajo = nuevos("inventario", productosStockBajo.length);

    if (nuevosStockBajo > 0) {
      lista.push({
        id: `inventario-${productosStockBajo.length}`,
        tipo: "advertencia",
        icono: "",
        titulo: "Stock bajo",
        descripcion:
          nuevosStockBajo === 1
            ? `Un nuevo accesorio está por agotarse. Revisa el inventario.`
            : `${nuevosStockBajo} nuevos accesorios están por agotarse. Revisa el inventario.`,
        enlace: "/productos",
        _clave: "inventario",
        _conteoActual: productosStockBajo.length,
      });
    }

    // ─── 8. FELICITACIÓN (todo en orden) ──────────────────────────────────────
    if (
      !cargando &&
      lista.length === 0 &&
      (ventas.length > 0 || videosCombo.length > 0)
    ) {
      lista.push({
        id: "exito-total",
        tipo: "exito",
        icono: "",
        titulo: "¡Todo al día!",
        descripcion: "No tienes pedidos pendientes ni alertas de inventario. ¡Excelente trabajo!",
      });
    }

    return lista;
  }, [productos, ventas, videosCombo, cargando, conteosLeidos]);

  return { notificaciones, cargando, error, marcarLeida };
}