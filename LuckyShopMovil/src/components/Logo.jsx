/**
 * Logo.jsx
 * Componente reutilizable con el logotipo de LuckyShop.
 * Muestra el icono del trébol (LogoLucky.jpg).
 * El `size` controla la altura y ancho del icono.
 */
import React from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

const Logo = ({ size = 26, mostrarSubtitulo = true }) => {
  // Para un icono cuadrado, usamos el 'size' directamente para ancho y alto.
  // Añadimos un pequeño factor de escala si es necesario, pero size * 1 es más directo.
  const dimensionIcono = size * 1.15;

  return (
    <View style={styles.contenedor}>
      <Image
        // CORRECCIÓN: Ruta y extensión correctas al archivo real
        source={require("../../assets/LogoLucky.jpg")}
        style={{
          width: dimensionIcono,
          height: dimensionIcono,
          resizeMode: "contain",
          // Opcional: si el JPG tiene bordes blancos y quieres redondearlo un poco
          borderRadius: dimensionIcono * 0.2, 
        }}
      />
      {mostrarSubtitulo && <Text style={styles.subtitulo}>BY LESLIE</Text>}
    </View>
  );
};

export default Logo;

const styles = StyleSheet.create({
  contenedor: { alignItems: "center" },
  subtitulo: {
    fontSize: 8,
    letterSpacing: 3,
    color: colors.textGray,
    marginTop: 2, // Ajustado ligeramente para el icono cuadrado
    fontWeight: "600",
  },
});