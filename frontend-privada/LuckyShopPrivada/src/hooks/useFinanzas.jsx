import { useState, useEffect, useMemo, useCallback } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const NOMBRES_MES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

async function solicitar(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: "include", // manda la cookie authCookie
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || `Error ${res.status} al consultar ${path}`);
  }

  return data;
}

/**
 * Hook central de la sección Finanzas.
 * Trae ganancias y gastos desde el backend, calcula la tendencia mensual y
 * los totales del periodo, y expone editar/eliminar tanto para gastos como
 * para ganancias, más un filtro para ver solo un tipo de movimiento.
 */
export function useFinanzas() {
  const [ganancias, setGanancias] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarTodo, setMostrarTodo] = useState(false);
  const [ultimoGastoGuardado, setUltimoGastoGuardado] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState("ganancia"); // "gasto" | "ganancia"

  // Carga inicial de ganancias y gastos desde el backend
  useEffect(() => {
    let activo = true;

    async function cargarDatos() {
      setCargando(true);
      setError(null);
      try {
        const [dataGanancias, dataGastos] = await Promise.all([solicitar("/ganancias"), solicitar("/gastos")]);
        if (!activo) return;
        setGanancias(Array.isArray(dataGanancias) ? dataGanancias : dataGanancias?.data || []);
        setGastos(Array.isArray(dataGastos) ? dataGastos : dataGastos?.data || []);
      } catch (err) {
        if (activo) setError(err.message);
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarDatos();
    return () => {
      activo = false;
    };
  }, []);

  // Recalcula los totales del periodo cada vez que cambian las ganancias o los gastos
  const resumen = useMemo(() => {
    const ingresosTotales = ganancias.reduce((acc, g) => acc + Number(g.totalGanancias ?? 0), 0);
    const perdidasTotales = gastos.reduce((acc, g) => acc + Number(g.cantidadGasto ?? 0), 0);
    return {
      ingresosTotales,
      perdidasTotales,
      balanceTotal: ingresosTotales - perdidasTotales,
    };
  }, [ganancias, gastos]);

  // Agrupa ganancias y gastos por mes para alimentar la gráfica de tendencia
  const tendencia = useMemo(() => {
    const mapa = new Map();

    const registrar = (fecha, campo, monto) => {
      if (!fecha) return;
      const mes = NOMBRES_MES[new Date(fecha).getMonth()];
      if (!mapa.has(mes)) mapa.set(mes, { mes, ingresos: 0, gastos: 0 });
      mapa.get(mes)[campo] += Number(monto) || 0;
    };

    ganancias.forEach((g) => registrar(g.fechaMes, "ingresos", g.totalGanancias));
    gastos.forEach((g) => registrar(g.fechaGasto, "gastos", g.cantidadGasto));

    return Array.from(mapa.values());
  }, [ganancias, gastos]);

  const registrarGasto = useCallback(async (datosGasto) => {
    const gastoCreado = await solicitar("/gastos", { method: "POST", body: datosGasto });
    setGastos((prev) => [gastoCreado, ...prev]);
    setUltimoGastoGuardado(gastoCreado);
    return gastoCreado;
  }, []);

  const actualizarGasto = useCallback(async (id, datosGasto) => {
    const gastoActualizado = await solicitar(`/gastos/${id}`, { method: "PUT", body: datosGasto });
    setGastos((prev) => prev.map((g) => (g._id === id ? gastoActualizado : g)));
    return gastoActualizado;
  }, []);

  const eliminarGasto = useCallback(async (id) => {
    await solicitar(`/gastos/${id}`, { method: "DELETE" });
    setGastos((prev) => prev.filter((g) => g._id !== id));
  }, []);

  const eliminarGanancia = useCallback(async (id) => {
    await solicitar(`/ganancias/${id}`, { method: "DELETE" });
    setGanancias((prev) => prev.filter((g) => g._id !== id));
  }, []);

  const limpiarUltimoGasto = useCallback(() => setUltimoGastoGuardado(null), []);

  // Combina ganancias y gastos en una sola lista de movimientos, ordenada por fecha
  const movimientos = useMemo(() => {
    const combinados = [
      ...ganancias.map((g) => {
  const primeraVenta = g.ventas?.[0]?.idVenta;
  const carrito = primeraVenta?.IdCarrito;
  const productos = carrito?.productos || [];
  const cliente = carrito?.idCliente;

  const nombreProducto =
    productos.length === 0
      ? "—"
      : productos.length === 1
      ? productos[0]?.idProducto?.nombre || "—"
      : `${productos[0]?.idProducto?.nombre || "Producto"} y ${productos.length - 1} más`;

  const fechaReal = primeraVenta?.fecha || g.fechaMes;

  return {
    id: g._id ?? g.id,
    cliente: cliente ? `${cliente.name || ""} ${cliente.lastName || ""}`.trim() : "Ganancia del mes",
    producto: nombreProducto,
    monto: Number(g.totalGanancias ?? 0),
    estado: "Completado",
    fecha: fechaReal,
    tipo: "ganancia",
    original: g,
  };
}),
      ...gastos.map((g) => ({
        id: g._id ?? g.id,
        cliente: g.descripcionGasto || "Gasto",
        producto: "Gasto",
        monto: Number(g.cantidadGasto ?? 0),
        estado: "Completado",
        fecha: g.fechaGasto,
        tipo: "gasto",
        original: g,
      })),
    ];
    return combinados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [ganancias, gastos]);

  // Filtra por tipo (ganancias o gastos) antes de limitar a 3
  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((m) => m.tipo === filtroTipo);
  }, [movimientos, filtroTipo]);

  const movimientosVisibles = mostrarTodo ? movimientosFiltrados : movimientosFiltrados.slice(0, 3);

  return {
    cargando,
    error,
    tendencia,
    resumen,
    movimientos: movimientosVisibles,
    hayMasMovimientos: movimientosFiltrados.length > 3,
    mostrarTodo,
    toggleMostrarTodo: () => setMostrarTodo((v) => !v),
    filtroTipo,
    setFiltroTipo,
    registrarGasto,
    actualizarGasto,
    eliminarGasto,
    eliminarGanancia,
    ultimoGastoGuardado,
    limpiarUltimoGasto,
  };
}