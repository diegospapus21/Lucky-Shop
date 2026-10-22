/**
 * TarjetasSeccion.jsx
 * Tarjeta grande de acceso (Guía de regalo, Promociones): fondo blanco, borde
 * rosado y letras en rosa fuerte. Se usa en el Home.
 *
 * Props:
 *  - titulo:   texto grande de la tarjeta
 *  - subtitulo: frase corta debajo del título
 *  - boton:    texto del botón rosa (por defecto "Ver más")
 *  - onPress:  acción al tocar la tarjeta
 */
import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

const TarjetaSeccion = ({ titulo, subtitulo, boton = "Ver más", onPress }) => (
  <TouchableOpacity style={styles.tarjeta} onPress={onPress} activeOpacity={0.85}>
    <Text style={styles.titulo}>{titulo}</Text>
    <Text style={styles.subtitulo}>{subtitulo}</Text>
    {/* Botón rosa con texto blanco (decorativo: toda la tarjeta es tocable) */}
    <View style={styles.boton}>
      <Text style={styles.botonTexto}>{boton}</Text>
    </View>
  </TouchableOpacity>
);

export default TarjetaSeccion;

const styles = StyleSheet.create({
  // Fondo blanco con borde rosado y esquinas muy redondeadas
  tarjeta: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.magenta,
    borderRadius: 24,
    padding: 22,
    marginHorizontal: 20,
    marginBottom: 14,
  },
  // Letras en rosa fuerte
  titulo: { fontSize: 26, fontWeight: "800", color: colors.pink },
  subtitulo: { fontSize: 15, color: colors.pink, marginTop: 4 },
  boton: {
    alignSelf: "flex-start",
    backgroundColor: colors.pink,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 10,
    marginTop: 16,
  },
  botonTexto: { color: colors.white, fontWeight: "800", fontSize: 14 },
});