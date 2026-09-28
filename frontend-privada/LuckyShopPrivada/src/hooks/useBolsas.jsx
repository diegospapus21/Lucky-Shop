import { useState, useEffect, useCallback } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const BOLSAS_POR_PAGINA = 8;

/**
 * Hook central de la sección Bolsas de la suerte.
 * Trae el listado desde el backend, pagina los resultados y expone
 * el CRUD completo (con subida de imágenes) más el cambio de variante (6/10).
 */
export function useBolsas() {
  const [bolsas, setBolsas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  const fetchBolsas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (busqueda.trim()) params.set("search", busqueda.trim());
      const res = await fetch(`${BASE_URL}/bolsas?${params}`);
      if (!res.ok) throw new Error("Error al obtener bolsas");
      const data = await res.json();
      setBolsas(data);
      setPaginaActual(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [busqueda]);

  useEffect(() => {
    fetchBolsas();
  }, [fetchBolsas]);

  const guardarBolsa = useCallback(async ({ form, imageFile, bolsaId }) => {
    const esEditar = !!bolsaId;
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (imageFile) fd.append("imagenes", imageFile);

    const url = esEditar ? `${BASE_URL}/bolsas/${bolsaId}` : `${BASE_URL}/bolsas`;
    const method = esEditar ? "PUT" : "POST";
    const res = await fetch(url, { method, body: fd });
    if (!res.ok) throw new Error("Error en la operación");
    await fetchBolsas();
    return esEditar;
  }, [fetchBolsas]);

  const eliminarBolsa = useCallback(async (id) => {
    const res = await fetch(`${BASE_URL}/bolsas/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Error al eliminar");
    await fetchBolsas();
  }, [fetchBolsas]);

  // Cambia solo la variante (cantidadUnidades) de una bolsa, con actualización local optimista
  const actualizarVariante = useCallback(async (bolsa, cantidadUnidades) => {
    if (bolsa.cantidadUnidades === cantidadUnidades) return;
    const fd = new FormData();
    fd.append("nombre", bolsa.nombre || "");
    fd.append("precio", bolsa.precio ?? 0);
    fd.append("stock", bolsa.stock ?? 0);
    fd.append("descripcion", bolsa.descripcion || "");
    fd.append("categoria", bolsa.categoria || "");
    fd.append("estado", bolsa.estado || "activo");
    fd.append("cantidadUnidades", cantidadUnidades);

    const res = await fetch(`${BASE_URL}/bolsas/${bolsa._id}`, { method: "PUT", body: fd });
    if (!res.ok) throw new Error("Error al actualizar la variante");

    setBolsas((prev) => prev.map((b) => (b._id === bolsa._id ? { ...b, cantidadUnidades } : b)));
  }, []);

  const totalPaginas = Math.ceil(bolsas.length / BOLSAS_POR_PAGINA);
  const bolsasPagina = bolsas.slice(
    (paginaActual - 1) * BOLSAS_POR_PAGINA,
    paginaActual * BOLSAS_POR_PAGINA
  );

  return {
    bolsas: bolsasPagina,
    loading,
    error,
    busqueda,
    setBusqueda,
    paginaActual,
    setPaginaActual,
    totalPaginas,
    fetchBolsas,
    guardarBolsa,
    eliminarBolsa,
    actualizarVariante,
  };
}
