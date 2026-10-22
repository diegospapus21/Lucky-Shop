/**
 * categorias.js
 * Catálogo de categorías de la tienda. Cada una tiene:
 *  - label: el texto que ve el cliente.
 *  - slug:  identificador interno.
 *  - icon:  nombre de un icono de Ionicons.
 *  - match: valores de `idCategoria` (en minúscula y sin tildes) que pertenecen
 *           a esa categoría. Así funciona igual si en la base de datos el
 *           producto dice "Anillos" o "anillos", y sin importar si el admin
 *           de la web lo guardó como "aretes" o "pendientes".
 */

// Quita tildes y pasa a minúsculas para comparar sin errores.
const normalizar = (t) =>
  String(t || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const categorias = [
  { label: "Collares", slug: "collares", icon: "diamond-outline", match: ["collares"] },
  // "Aritos" junta aretes y pendientes porque en el admin existen las dos opciones
  { label: "Aritos", slug: "aretes", icon: "ear-outline", match: ["aretes", "pendientes", "aritos"] },
  { label: "Anillos", slug: "anillos", icon: "ellipse-outline", match: ["anillos"] },
  // "Brazaletes" incluye también los charms, igual que en la web
  { label: "Brazaletes", slug: "pulseras", icon: "watch-outline", match: ["pulseras", "charms"] },
];

// Convierte cualquier valor ("Anillos", "pendientes"...) en el slug de la lista.
// Si no lo encuentra, devuelve el de la primera categoría.
export const resolverSlug = (valor) => {
  const v = normalizar(valor);
  const cat = categorias.find((c) => c.slug === v || c.match.includes(v));
  return (cat || categorias[0]).slug;
};

// Dice si un producto pertenece a la categoría con ese slug.
export const perteneceACategoria = (producto, slug) => {
  const cat = categorias.find((c) => c.slug === slug);
  if (!cat) return false;
  return cat.match.includes(normalizar(producto?.idCategoria));
};

export default categorias;