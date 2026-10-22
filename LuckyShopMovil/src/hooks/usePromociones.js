/**
 * usePromociones.js
 * Trae las promociones vigentes del backend (GET /promociones/activas), las
 * mismas que usa la web. Cada promoción trae el producto completo dentro de
 * `idProducto`.
 *
 * Devuelve:
 *  - promociones: lista de promociones vigentes
 *  - cargando:    true mientras se piden los datos
 *  - error:       mensaje si algo falla
 *  - recargar:    función para volver a pedirlas
 */
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../api/apiClient";
import { endpoints } from "../api/apiConfig";

const usePromociones = () => {
  const [promociones, setPromociones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      // Solo las promociones activas y dentro de su rango de fechas.
      const res = await apiFetch(`${endpoints.promociones}/activas`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al cargar promociones");
      // Se ignoran las promociones cuyo producto fue eliminado.
      setPromociones(Array.isArray(data) ? data.filter((p) => p.idProducto) : []);
    } catch (e) {
      setError(e.message || "No se pudieron cargar las promociones");
    } finally {
      setCargando(false);
    }
  }, []);

  // Se cargan una vez al abrir la pantalla.
  useEffect(() => {
    cargar();
  }, [cargar]);

  return { promociones, cargando, error, recargar: cargar };
};

export default usePromociones;