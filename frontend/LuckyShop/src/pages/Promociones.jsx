// Promociones.jsx — página PÚBLICA: muestra los productos que traen promoción vigente.
// (La gestión de promociones —crear, editar, eliminar— vive en el panel privado.)

import { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BotonVolver from "../components/BotonVolver.jsx";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// ───── Estilos en línea (misma línea visual que la página de Contáctanos) ─────
const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#fff",
    display: "flex",
    flexDirection: "column",
  },
  volverWrapper: {
    padding: "24px 60px 0",
  },
  header: {
    padding: "20px 60px 10px",
  },
  headerTitle: {
    fontSize: "48px",
    fontWeight: "900",
    margin: 0,
    color: "#111",
    fontFamily: "'Inter', sans-serif",
    letterSpacing: "-1px",
    display: "inline-block",
    borderBottom: "10px solid #111",
    paddingBottom: "6px",
  },
  subtitulo: {
    fontSize: "18px",
    color: "#444",
    marginTop: "16px",
    maxWidth: "560px",
    lineHeight: "1.6",
  },
  contenido: {
    flex: 1,
    padding: "30px 60px 80px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
    gap: "28px",
  },
  card: {
    position: "relative",
    backgroundColor: "#fff",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(249,100,180,0.15)",
    display: "flex",
    flexDirection: "column",
  },
  imagenWrap: {
    width: "100%",
    aspectRatio: "1 / 1",
    backgroundColor: "#FDF2F8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  imagen: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  sinImagen: {
    color: "#9CA3AF",
    fontSize: "14px",
  },
  badgeDescuento: {
    position: "absolute",
    top: "12px",
    left: "12px",
    backgroundColor: "#F472B6",
    color: "#fff",
    fontWeight: "800",
    fontSize: "14px",
    padding: "6px 12px",
    borderRadius: "20px",
  },
  info: {
    padding: "16px 18px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  nombre: {
    fontSize: "17px",
    fontWeight: "800",
    color: "#111",
    margin: 0,
    fontFamily: "'Inter', sans-serif",
  },
  filaPrecios: {
    display: "flex",
    alignItems: "baseline",
    gap: "10px",
    flexWrap: "wrap",
  },
  precioFinal: {
    fontSize: "22px",
    fontWeight: "900",
    color: "#111",
  },
  precioOriginal: {
    fontSize: "15px",
    color: "#9CA3AF",
    textDecoration: "line-through",
  },
  vigencia: {
    fontSize: "12px",
    color: "#6B7280",
    marginTop: "2px",
  },
  mensaje: {
    textAlign: "center",
    color: "#444",
    fontSize: "18px",
    padding: "60px 0",
  },
  mensajeError: {
    textAlign: "center",
    color: "#991b1b",
    fontSize: "16px",
    padding: "40px 0",
  },
  btnReintentar: {
    marginTop: "12px",
    padding: "10px 28px",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "#F9A8D4",
    color: "#111",
    fontWeight: "700",
    cursor: "pointer",
  },
};

// ───── Helpers ─────

// Fecha corta sin desfase de zona horaria (ej. "15 jul 2026")
const formatoFecha = (f) =>
  f
    ? new Date(f).toLocaleDateString("es-SV", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "";

const esTextoValido = (v) => typeof v === "string" && v.trim() !== "";

// Imagen del producto: imagenPresentacion o la primera de imagenes[]
const obtenerImagen = (prod) => {
  if (!prod) return null;
  if (esTextoValido(prod.imagenPresentacion)) return prod.imagenPresentacion;
  if (Array.isArray(prod.imagenes)) {
    const primera = prod.imagenes.find(esTextoValido);
    if (primera) return primera;
  }
  return null;
};

const dinero = (n) => `$${Number(n || 0).toFixed(2)}`;

// ───── Tarjeta de un producto en promoción ─────
function TarjetaPromo({ promo }) {
  const prod = promo.idProducto;
  const imagen = obtenerImagen(prod);
  const precio = Number(prod?.precio ?? 0);
  const precioFinal = precio * (1 - Number(promo.descuento) / 100);

  return (
    <div style={styles.card}>
      <span style={styles.badgeDescuento}>-{promo.descuento}%</span>

      <div style={styles.imagenWrap}>
        {imagen ? (
          <img
            src={imagen}
            alt={prod?.nombre || "Producto en promoción"}
            style={styles.imagen}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span style={styles.sinImagen}>Sin imagen</span>
        )}
      </div>

      <div style={styles.info}>
        <h3 style={styles.nombre}>{prod?.nombre || "Producto"}</h3>
        <div style={styles.filaPrecios}>
          <span style={styles.precioFinal}>{dinero(precioFinal)}</span>
          <span style={styles.precioOriginal}>{dinero(precio)}</span>
        </div>
        <span style={styles.vigencia}>Hasta el {formatoFecha(promo.fechaFin)}</span>
      </div>
    </div>
  );
}

// ───── Página ─────
export default function Promociones() {
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Carga las promociones desde el backend
  const cargarPromociones = async () => {
    setLoading(true);
    setError("");
    try {
      // Ruta pública: devuelve solo las promociones vigentes (la misma que usa la app móvil)
      const res = await fetch(`${BASE_URL}/promociones/activas`);
      if (!res.ok) throw new Error("No se pudieron cargar las promociones");
      const data = await res.json();
      setPromociones(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("No se pudieron cargar las promociones. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPromociones();
  }, []);

  // El backend ya devuelve solo las vigentes; aquí se descartan las que perdieron su producto
  // y se ordena con la de mayor descuento primero
  const vigentes = useMemo(
    () =>
      promociones
        .filter((p) => p.idProducto)
        .sort((a, b) => Number(b.descuento) - Number(a.descuento)),
    [promociones]
  );

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.volverWrapper}>
        <BotonVolver />
      </div>

      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Promociones</h1>
        <p style={styles.subtitulo}>
          Aprovecha los descuentos vigentes en tus accesorios favoritos.
        </p>
      </div>

      <div style={styles.contenido}>
        {loading && <p style={styles.mensaje}>Cargando promociones...</p>}

        {!loading && error && (
          <div style={styles.mensajeError}>
            <p>{error}</p>
            <button style={styles.btnReintentar} onClick={cargarPromociones}>
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && vigentes.length === 0 && (
          <p style={styles.mensaje}>
            Por ahora no hay promociones vigentes. ¡Vuelve pronto!
          </p>
        )}

        {!loading && !error && vigentes.length > 0 && (
          <div style={styles.grid}>
            {vigentes.map((promo) => (
              <TarjetaPromo key={promo._id} promo={promo} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}