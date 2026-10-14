// Botón para regresar a la página de inicio (flecha + texto)
import { useState } from "react";
import { Link } from "react-router-dom";

export default function BotonVolver({ to = "/", texto = "Inicio" }) {
  const [hover, setHover] = useState(false);

  return (
    <Link
      to={to}
      aria-label="Volver al inicio"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 18px 8px 12px",
        borderRadius: "999px",
        border: "1.5px solid #111",
        backgroundColor: hover ? "#F9A8D4" : "#fff",
        color: "#111",
        fontFamily: "'Inter', sans-serif",
        fontSize: "14px",
        fontWeight: "700",
        textDecoration: "none",
        transition: "background-color 0.2s, transform 0.1s",
        transform: hover ? "translateX(-2px)" : "none",
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {texto}
    </Link>
  );
}