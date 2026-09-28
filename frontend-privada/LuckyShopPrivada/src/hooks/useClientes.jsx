import { useState, useEffect, useMemo } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Hook central de la sección Clientes.
 * Trae el listado de clientes y expone edición/eliminación con actualización local optimista.
 */
export function useClientes() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchClientes = async () => {
    try {
      const res = await fetch(`${BASE_URL}/clientes`);
      const data = await res.json();
      setClientes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al obtener clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const eliminarCliente = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/clientes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setClientes((prev) => prev.filter((c) => c._id !== id));
      }
      return res.ok;
    } catch (err) {
      console.error("Error al eliminar cliente:", err);
      return false;
    }
  };

  const actualizarCliente = async (id, datos) => {
    try {
      const res = await fetch(`${BASE_URL}/clientes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      if (res.ok) {
        setClientes((prev) => prev.map((c) => (c._id === id ? { ...c, ...datos } : c)));
      }
      return res.ok;
    } catch (err) {
      console.error("Error al actualizar cliente:", err);
      return false;
    }
  };

  const clientesFiltrados = useMemo(() => {
    return clientes.filter((c) => {
      const nombre = `${c.name || ""} ${c.lastName || ""}`.toLowerCase();
      const email = (c.email || "").toLowerCase();
      const busq = busqueda.toLowerCase();
      return nombre.includes(busq) || email.includes(busq);
    });
  }, [clientes, busqueda]);

  return {
    clientes: clientesFiltrados,
    busqueda,
    setBusqueda,
    loading,
    fetchClientes,
    actualizarCliente,
    eliminarCliente,
  };
}
