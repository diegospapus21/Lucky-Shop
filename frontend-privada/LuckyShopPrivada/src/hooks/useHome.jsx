import { useState, useEffect, useMemo, useCallback } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const NOMBRES_MES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

async function obtener(path) {
  const res = await fetch(`${BASE_URL}${path}`, { method: "GET", credentials: "include" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Error al consultar ${path}`);
  return Array.isArray(data) ? data : data.data ?? data;
}

/**
 * Hook central del Panel de control (Home).
 * Trae ventas, clientes y productos, y calcula las tarjetas resumen
 * más la tendencia de ventas (mensual o semanal).
 */
export function useHome() {
  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [granularidad, setGranularidad] = useState("mensual"); // "mensual" | "semanal"

  useEffect(() => {
    let activo = true;

    async function cargarTodo() {
      setCargando(true);
      setError(null);
      try {
        const [dataVentas, dataClientes, dataProductos] = await Promise.all([
          obtener("/venta"),
          obtener("/clientes"),
          obtener("/productos"),
        ]);
        if (!activo) return;
        setVentas(dataVentas);
        setClientes(dataClientes);
        setProductos(dataProductos);
      } catch (err) {
        if (activo) setError(err.message);
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarTodo();
    return () => {
      activo = false;
    };
  }, []);

  // Tarjetas resumen: se recalculan cada vez que llega nueva data
  const resumen = useMemo(() => {
    const ventasTotales = ventas.reduce((acc, v) => acc + Number(v.monto ?? v.total ?? 0), 0);

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const clientesNuevosEsteMes = clientes.filter((c) => c.createdAt && new Date(c.createdAt) >= inicioMes).length;
    const productosNuevosEsteMes = productos.filter((p) => p.createdAt && new Date(p.createdAt) >= inicioMes).length;

    return {
      ventasTotales,
      clientesActivos: clientes.length,
      clientesNuevosEsteMes,
      productosNuevos: productosNuevosEsteMes,
    };
  }, [ventas, clientes, productos]);

  // Agrupa las ventas por mes o por semana según la granularidad elegida
  const tendencia = useMemo(() => {
    if (granularidad === "mensual") {
      const mapa = new Map();
      ventas.forEach((v) => {
        if (!v.fecha) return;
        const fecha = new Date(v.fecha);
        const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
        const etiqueta = NOMBRES_MES[fecha.getMonth()];
        if (!mapa.has(clave)) mapa.set(clave, { etiqueta, valor: 0, orden: fecha.getFullYear() * 12 + fecha.getMonth() });
        mapa.get(clave).valor += Number(v.monto ?? v.total ?? 0);
      });
      return Array.from(mapa.values())
        .sort((a, b) => a.orden - b.orden)
        .slice(-6);
    }

    // semanal: últimas 6 semanas
    const mapa = new Map();
    ventas.forEach((v) => {
      if (!v.fecha) return;
      const fecha = new Date(v.fecha);
      const inicioSemana = new Date(fecha);
      inicioSemana.setDate(fecha.getDate() - fecha.getDay());
      const clave = inicioSemana.toISOString().slice(0, 10);
      const etiqueta = `${inicioSemana.getDate()}/${inicioSemana.getMonth() + 1}`;
      if (!mapa.has(clave)) mapa.set(clave, { etiqueta, valor: 0, orden: inicioSemana.getTime() });
      mapa.get(clave).valor += Number(v.monto ?? v.total ?? 0);
    });
    return Array.from(mapa.values())
      .sort((a, b) => a.orden - b.orden)
      .slice(-6);
  }, [ventas, granularidad]);

  const cambiarGranularidad = useCallback((valor) => setGranularidad(valor), []);

  return {
    cargando,
    error,
    resumen,
    tendencia,
    granularidad,
    cambiarGranularidad,
  };
}