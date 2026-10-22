/**
 * ProductCard.jsx
 * Tarjeta reutilizable para mostrar un producto (Home, Categorías, Promociones,
 * Guía de regalo). Muestra imagen, categoría, nombre y precio, más un corazón
 * que agrega o quita el producto de la lista de deseos (favoritos), igual que
 * en la web.
 *
 * Props:
 *  - producto: objeto con { _id, nombre, precio, imagenPresentacion, idCategoria }
 *  - onPress:  acción al tocar la tarjeta (ver detalle)
 */
import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "./Icon";
import useFavoritos from "../hooks/useFavoritos";
import { colors } from "../theme/colors";

const ProductCard = ({ producto, onPress }) => {
  // Hook de favoritos: dice si el producto ya es favorito y permite alternarlo.
  const { esFavorito, toggleFavorito } = useFavoritos();
  const fav = esFavorito(producto?._id);

  // Imagen: la de presentación o la primera del arreglo; si no hay, queda un
  // fondo de color para no romper el diseño.
  const uri = producto?.imagenPresentacion || producto?.imagenes?.[0] || null;
  const precio = Number(producto?.precio || 0).toFixed(2);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imagenContenedor}>
        {uri ? (
          <Image source={{ uri }} style={styles.imagen} resizeMode="cover" />
        ) : (
          <View style={[styles.imagen, styles.imagenVacia]} />
        )}

        {/* Corazón de favoritos (esquina superior derecha de la imagen) */}
        <TouchableOpacity
          style={styles.favBtn}
          onPress={() => toggleFavorito(producto)}
          hitSlop={8}
        >
          <Icon
            name={fav ? "heart" : "heart-outline"}
            size={16}
            color={fav ? colors.magenta : colors.textGray}
          />
        </TouchableOpacity>
      </View>

      {/* Categoría, nombre y precio */}
      <Text style={styles.categoria}>
        {(producto?.idCategoria || "Producto").toUpperCase()}
      </Text>
      <Text style={styles.nombre} numberOfLines={1}>
        {producto?.nombre}
      </Text>
      <Text style={styles.precio}>${precio}</Text>
    </TouchableOpacity>
  );
};

export default ProductCard;

const styles = StyleSheet.create({
  // La tarjeta ocupa casi la mitad del ancho para formar una cuadrícula de 2 columnas
  card: { width: "48%", marginBottom: 18 },
  imagenContenedor: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.surface,
    position: "relative",
  },
  imagen: { width: "100%", height: 150 },
  imagenVacia: { backgroundColor: colors.pinkSoft },
  // Botón redondo blanco del corazón, sobre la imagen
  favBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: colors.white,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  categoria: {
    fontSize: 10,
    color: colors.textGray,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  nombre: { fontSize: 14, fontWeight: "700", color: colors.textDark, marginTop: 2 },
  precio: { fontSize: 14, fontWeight: "800", color: colors.greenLogo, marginTop: 2 },
});