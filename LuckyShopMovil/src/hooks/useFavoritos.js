/**
 * useFavoritos.js
 * Maneja los favoritos (lista de deseos) del cliente y los comparte entre todas
 * las pantallas SIN necesidad de un Provider: el estado vive fuera del hook y
 * cada componente que lo usa se "suscribe" para enterarse de los cambios.
 *
 * El backend usa UN solo endpoint que ALTERNA el favorito:
 *   POST /perfilCliente/favoritos/:id  ->  { esFavorito: true | false }
 * (si estaba en favoritos lo quita; si no estaba, lo agrega).
 *
 * Escribe en la consola mensajes que empiezan con "FAV" para poder ver qué
 * responde el servidor si algo falla.
 */
import { useState, useEffect } from "react";
import { apiFetch } from "../api/apiClient";
import { endpoints } from "../api/apiConfig";

// ── Estado compartido (fuera del hook, así lo ven todas las pantallas) ──
let ids = new Set();        // IDs de los productos que son favoritos
let cargado = false;        // Si ya se leyeron los favoritos del servidor
let cargando = false;       // Evita pedir los favoritos dos veces a la vez
const oyentes = new Set();  // Componentes que quieren enterarse de los cambios

// Avisa a todos los componentes suscritos que la lista cambió.
const avisar = () => oyentes.forEach((f) => f(new Set(ids)));

// Lee del servidor la lista de favoritos del cliente.
// `forzar` permite volver a leerla aunque ya se haya cargado antes.
const cargarFavoritos = async (forzar = false) => {
  if (cargando || (cargado && !forzar)) return;
  cargando = true;
  try {
    const res = await apiFetch(`${endpoints.perfil}/favoritos`);
    const data = await res.json();
    if (res.ok && Array.isArray(data)) {
      // Solo guardamos los IDs; es lo único que necesita el corazón.
      ids = new Set(data.map((p) => p._id));
      cargado = true;
      avisar();
    } else {
      console.log("FAV carga:", res.status);
    }
  } catch (e) {
    console.log("FAV carga error:", e.message);
  } finally {
    cargando = false;
  }
};

// Para volver a leer los favoritos desde fuera (por ejemplo al entrar al Home).
export const recargarFavoritos = () => cargarFavoritos(true);

const useFavoritos = () => {
  // Copia local de la lista; al cambiar, React vuelve a dibujar el corazón.
  const [lista, setLista] = useState(new Set(ids));

  useEffect(() => {
    // Nos suscribimos a los cambios y cargamos los favoritos la primera vez.
    oyentes.add(setLista);
    cargarFavoritos();
    // Al cerrar la pantalla nos quitamos de la lista de suscritos.
    return () => {
      oyentes.delete(setLista);
    };
  }, []);

  // Dice si un producto está marcado como favorito.
  const esFavorito = (id) => lista.has(id);

  // Marca o quita un producto. El corazón cambia AL INSTANTE y después se ajusta
  // con lo que responda el servidor; si la petición falla, se revierte.
  const toggleFavorito = async (producto) => {
    const id = producto?._id;
    if (!id) return false;
    const eraFav = ids.has(id);

    // 1) Cambio inmediato en pantalla (sin esperar al servidor).
    if (eraFav) ids.delete(id);
    else ids.add(id);
    avisar();

    try {
      // 2) Se le pide al servidor que alterne el favorito.
      const res = await apiFetch(`${endpoints.perfil}/favoritos/${id}`, { method: "POST" });
      const texto = await res.text();
      console.log("FAV respuesta:", res.status, texto);
      if (!res.ok) throw new Error("fallo " + res.status);

      // 3) El servidor dice cuál es el estado real y se respeta.
      const data = JSON.parse(texto);
      if (data.esFavorito) ids.add(id);
      else ids.delete(id);
      avisar();
      return true;
    } catch (e) {
      console.log("FAV error:", e.message);
      // 4) Si algo falló, se deja el corazón como estaba antes.
      if (eraFav) ids.add(id);
      else ids.delete(id);
      avisar();
      return false;
    }
  };

  return { esFavorito, toggleFavorito };
};

export default useFavoritos;