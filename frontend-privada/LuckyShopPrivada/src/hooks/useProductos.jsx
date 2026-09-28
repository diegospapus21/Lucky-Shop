import { useState, useEffect, useCallback } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const PRODUCTOS_POR_PAGINA = 8;

/**
 * Hook central de la sección Productos.
 * Trae el catálogo desde el backend (con filtros de categoría/búsqueda),
 * pagina los resultados y expone el CRUD completo (con subida de imágenes).
 */
export function useProductos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [categoriaActiva, setCategoriaActiva] = useState("Todo");
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (categoriaActiva !== "Todo") params.set("categoria", categoriaActiva);
      if (busqueda.trim()) params.set("search", busqueda.trim());
      const res = await fetch(`${BASE_URL}/productos?${params}`);
      if (!res.ok) throw new Error("Error al obtener productos");
      const data = await res.json();
      setProductos(data);
      setPaginaActual(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [categoriaActiva, busqueda]);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  const guardarProducto = useCallback(async ({ form, imageFiles, imagenesExistentes, productoId }) => {
    const esEditar = !!productoId;
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    
    // Si hay imágenes nuevas, se agregan al FormData
    if (imageFiles && imageFiles.length > 0) {
      imageFiles.forEach(file => fd.append("imagenes", file));
    }
    
    // Si estamos editando y conservamos imágenes existentes
    if (esEditar && imagenesExistentes && imagenesExistentes.length > 0) {
      imagenesExistentes.forEach(url => fd.append("imagenesExistentes", url));
    }

    const url = esEditar ? `${BASE_URL}/productos/${productoId}` : `${BASE_URL}/productos`;
    const method = esEditar ? "PUT" : "POST";
    const res = await fetch(url, { method, body: fd });
    if (!res.ok) throw new Error("Error en la operación");
    await fetchProductos();
    return esEditar;
  }, [fetchProductos]);

  const eliminarProducto = useCallback(async (id) => {
    const res = await fetch(`${BASE_URL}/productos/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Error al eliminar");
    await fetchProductos();
  }, [fetchProductos]);

  const totalPaginas = Math.ceil(productos.length / PRODUCTOS_POR_PAGINA);
  const productosPagina = productos.slice(
    (paginaActual - 1) * PRODUCTOS_POR_PAGINA,
    paginaActual * PRODUCTOS_POR_PAGINA
  );

  return {
    productos: productosPagina,
    loading,
    error,
    categoriaActiva,
    setCategoriaActiva,
    busqueda,
    setBusqueda,
    paginaActual,
    setPaginaActual,
    totalPaginas,
    fetchProductos,
    guardarProducto,
    eliminarProducto,
  };
}
