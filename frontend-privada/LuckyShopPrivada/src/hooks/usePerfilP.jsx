import { useState, useEffect, useCallback } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function normalizarAdmin(admin) {
  return {
    id: admin.id ?? admin._id,
    nombre: admin.name ?? "",
    apellido: admin.lastName ?? "",
    nombreCompleto: [admin.name, admin.lastName].filter(Boolean).join(" "),
    rol: "Administrador",
    correo: admin.email ?? "",
    telefono: admin.telefono ?? "",
  };
}

export function usePerfil() {
  const [perfil, setPerfil] = useState(null);
  const [borrador, setBorrador] = useState(null);
  const [editando, setEditando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let activo = true;

    async function cargarPerfil() {
      setCargando(true);
      setError(null);
      try {
        const res = await fetch(`${BASE_URL}/loginAdmin/checkSession`, {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "No se pudo cargar el perfil");
        }

        if (!activo) return;
        setPerfil(normalizarAdmin(data.admin));
      } catch (err) {
        if (activo) setError(err.message);
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarPerfil();
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (editando && perfil) setBorrador(perfil);
  }, [editando, perfil]);

  const iniciarEdicion = useCallback(() => setEditando(true), []);
  const cancelarEdicion = useCallback(() => setEditando(false), []);

  const actualizarCampo = useCallback((campo, valor) => {
    setBorrador((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  const guardarPerfil = useCallback(async () => {
    if (!borrador) return;
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/registerAdmin/${borrador.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: borrador.nombre,
          lastName: borrador.apellido,
          telefono: borrador.telefono,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "No se pudo guardar el perfil");
      }

      setPerfil(normalizarAdmin(data));
      setEditando(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }, [borrador]);

  return {
    perfil,
    borrador,
    editando,
    cargando,
    error,
    guardando,
    iniciarEdicion,
    cancelarEdicion,
    actualizarCampo,
    guardarPerfil,
  };
}