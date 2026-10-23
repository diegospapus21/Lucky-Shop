import { useState, useEffect, useCallback, useMemo } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Hook central de la sección Ventas.
 * Trae el listado desde el backend (con filtros de estado/búsqueda), calcula
 * el total y la mini gráfica, y expone editar/eliminar.
 * La paginación de la tabla se hace en la página (Ventas.jsx).
 */
export function useVentas() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [paginaActual, setPaginaActual] = useState(1);

  const fetchVentas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (busqueda.trim()) params.set("search", busqueda.trim());
      if (filtroEstado !== "Todos") params.set("estado", filtroEstado);
      const res = await fetch(`${BASE_URL}/venta?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Error al obtener ventas");
      const data = await res.json();
      setVentas(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [busqueda, filtroEstado]);

  useEffect(() => {
    fetchVentas();
  }, [fetchVentas]);

  // Al cambiar el filtro o la búsqueda vuelve a la primera página
  // (al editar o eliminar una venta se queda en la página actual)
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroEstado]);

  /* ── Totales y mini gráfica ── */
  const ventasTotales = useMemo(
    () => ventas.reduce((acc, v) => acc + Number(v.monto || 0), 0),
    [ventas]
  );

  const datosGrafica = useMemo(() => {
    const mapa = new Map();
    ventas.forEach((v) => {
      if (!v.fecha) return;
      const fecha = new Date(v.fecha);
      const clave = fecha.toISOString().slice(0, 10);
      const etiqueta = `${fecha.getDate()}/${fecha.getMonth() + 1}`;
      if (!mapa.has(clave)) mapa.set(clave, { etiqueta, valor: 0, orden: fecha.getTime() });
      mapa.get(clave).valor += Number(v.monto || 0);
    });
    return Array.from(mapa.values()).sort((a, b) => a.orden - b.orden).slice(-7);
  }, [ventas]);

  const metodoMasUsado = useMemo(() => {
    const mapa = new Map();
    ventas.forEach((v) => {
      const metodo = v.metodoPago?.trim();
      if (!metodo) return;
      mapa.set(metodo, (mapa.get(metodo) || 0) + 1);
    });

    if (mapa.size === 0) return null;

    const [metodo, cantidad] = [...mapa.entries()].sort((a, b) => b[1] - a[1])[0];
    return { metodo, cantidad };
  }, [ventas]);

  const valorMaximoGrafica = Math.max(...datosGrafica.map((d) => d.valor), 1);

  /* ── CRUD ── */
  const actualizarVenta = useCallback(async (id, datos) => {
    const res = await fetch(`${BASE_URL}/venta/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(datos),
    });
    if (!res.ok) {
      // El backend explica el motivo (por ejemplo, un pedido enviado no se puede cancelar)
      const data = await res.json().catch(() => null);
      throw new Error(data?.message || "Error al actualizar la venta");
    }
    await fetchVentas();
  }, [fetchVentas]);

  // El admin acepta o rechaza un pedido ("aceptado" | "rechazado"). Solo se puede decidir una vez.
  const decidirPedido = useCallback(async (id, decision) => {
    const res = await fetch(`${BASE_URL}/venta/${id}/decision`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ decision }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message || "No se pudo registrar la decisión");
    }
    await fetchVentas();
  }, [fetchVentas]);

  const eliminarVenta = useCallback(async (id) => {
    const res = await fetch(`${BASE_URL}/venta/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Error al eliminar la venta");
    await fetchVentas();
  }, [fetchVentas]);

  return {
    ventas, // todas las ventas filtradas (la página las pagina)
    totalVentas: ventas.length,
    loading,
    error,
    busqueda,
    setBusqueda,
    filtroEstado,
    setFiltroEstado,
    paginaActual,
    setPaginaActual,
    ventasTotales,
    datosGrafica,
    metodoMasUsado,
    valorMaximoGrafica,
    fetchVentas,
    actualizarVenta,
    decidirPedido,
    eliminarVenta,
  };
}