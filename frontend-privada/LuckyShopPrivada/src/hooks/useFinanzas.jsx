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

// Fecha de una ganancia: las creadas desde una venta guardan "fecha" (o solo createdAt),
// las registradas a mano guardan "fechaMes". Se acepta cualquiera para no perder datos.
const fechaDeGanancia = (g) => g.fechaMes || g.fecha || g.ventas?.[0]?.idVenta?.fecha || g.createdAt;

// Convierte una fecha en un número de mes (año * 12 + mes) o null si no es válida
const indiceMes = (fecha) => {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return null;
  return d.getFullYear() * 12 + d.getMonth();
};

/**
 * Hook central de la sección Finanzas.
 * Trae ganancias y gastos desde el backend, calcula la tendencia mensual y
 * los totales del periodo, y expone editar/eliminar tanto para gastos como
 * para ganancias, más un filtro para ver solo un tipo de movimiento.
 * La paginación de la tabla se hace en la página (Finanzas.jsx).
 */
export function useFinanzas() {
  const [ganancias, setGanancias] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
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

  // Agrupa ganancias y gastos por mes para la gráfica de tendencia.
  // Muestra siempre los últimos meses completos (los meses sin movimientos quedan en $0),
  // así la gráfica no se ve vacía cuando solo hay datos de un mes.
  const tendencia = useMemo(() => {
    const totales = new Map(); // "YYYY-MM" -> { ingresos, gastos }

    const registrar = (fecha, campo, monto) => {
      const idx = indiceMes(fecha);
      if (idx === null) return;
      if (!totales.has(idx)) totales.set(idx, { ingresos: 0, gastos: 0 });
      totales.get(idx)[campo] += Number(monto) || 0;
    };

    ganancias.forEach((g) => registrar(fechaDeGanancia(g), "ingresos", g.totalGanancias));
    gastos.forEach((g) => registrar(g.fechaGasto || g.createdAt, "gastos", g.cantidadGasto));

    // Rango de meses: desde el más antiguo con datos (máx. 12 meses) hasta el mes actual
    const hoy = new Date();
    const mesActual = hoy.getFullYear() * 12 + hoy.getMonth();
    const conDatos = Array.from(totales.keys());
    const finRango = Math.max(mesActual, ...conDatos);
    const inicioRango = Math.max(finRango - 11, Math.min(finRango - 5, ...conDatos));

    const resultado = [];
    for (let idx = inicioRango; idx <= finRango; idx++) {
      const anio = Math.floor(idx / 12);
      const mes = idx % 12;
      const datos = totales.get(idx) || { ingresos: 0, gastos: 0 };
      resultado.push({
        clave: `${anio}-${String(mes + 1).padStart(2, "0")}`,
        mes: NOMBRES_MES[mes],
        etiqueta: `${NOMBRES_MES[mes]} ${anio}`,
        ingresos: Number(datos.ingresos.toFixed(2)),
        gastos: Number(datos.gastos.toFixed(2)),
      });
    }
    return resultado;
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

        const fechaReal = primeraVenta?.fecha || fechaDeGanancia(g);

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

  // Solo los movimientos del tipo elegido (ganancias o gastos); la página los pagina
  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((m) => m.tipo === filtroTipo);
  }, [movimientos, filtroTipo]);

  return {
    cargando,
    error,
    tendencia,
    resumen,
    movimientos: movimientosFiltrados,
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