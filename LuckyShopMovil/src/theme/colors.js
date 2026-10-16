/**
 * colors.js
 * Paleta central de LuckyShop. Todos los colores fueron extraídos directamente
 * de los diseños de Figma para que la app móvil sea idéntica a la marca.
 * Usar SIEMPRE estas constantes en lugar de escribir hexadecimales sueltos,
 * así se mantiene la coherencia visual en toda la aplicación.
 *
 * Nota: los tonos que antes eran verdes ahora son grises, para que la app combine
 * con la web (rosa + negro/gris). Se conservaron los nombres "green..." para no
 * tener que modificar las pantallas que ya los usan.
 */
export const colors = {
  // Marca
  magenta: "#FF63C1", 
  pink: "#EC4899", // rosa principal para enlaces y botones secundarios
  coral: "#ffc2e0f5" , // rosa coral de las tarjetas de categoría
  pinkSoft: "#FCDADF", // fondo suave (barra de búsqueda, chips)
  pinkTint: "#FFE0EF", // rosa muy claro para fondos

  greenLogo: "#4B5563", // gris oscuro 
  greenBrand: "#757575", // gris medio (antes verde marca general)
  darkGreen: "#f7249f", // gris carbón: botones oscuros de Registro / Iniciar sesión
  greenBg: "#6B7280", // gris de fondo de las pantallas de recuperación (el texto blanco se lee bien)
  greenSoft: "#c7bfbfcd", // gris muy claro (chips, tarjetas)
  greenChip: "#D1D5DB", // gris medio claro de algunos chips

  wine: "#9C3F53", // botones vino de las pantallas de recuperación

  // Neutros
  white: "#FFFFFF",
  background: "#FFFFFF",
  surface: "#F5F5F4", // gris claro de inputs
  border: "#E5E7EB",
  textDark: "#1C1B1B",
  textGray: "#6B7280",
  textLight: "#9CA3AF",
  danger: "#DC2626",
  success: "#16A34A", // se mantiene verde a propósito: es el color universal de "éxito"
};

export default colors;