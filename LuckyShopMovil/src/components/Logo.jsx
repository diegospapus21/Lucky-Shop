/**
 * Logo.jsx
 * Logotipo de LuckyShop (versión negra con "BY LESLY" incluido en la imagen).
 * `size` controla el tamaño: el ancho es size * 6 y el alto se calcula
 * según la proporción real de la imagen, para que no se deforme.
 */
import React from "react";
import { View, Image, StyleSheet } from "react-native";

const PROPORCION = 820 / 300; // ancho / alto de la imagen

const Logo = ({ size = 26 }) => {
  const ancho = size * 6;
  const alto = ancho / PROPORCION;

  return (
    <View style={styles.contenedor}>
      <Image
        source={require("../../assets/LogoNegro-removebg-preview.png")}
        style={{ width: ancho, height: alto }}
        resizeMode="contain"
      />
    </View>
  );
};

export default Logo;

const styles = StyleSheet.create({
  contenedor: { alignItems: "center" },
});