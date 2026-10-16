/**
 * CategoryChip.jsx
 * Chip/tarjeta cuadrada de categoría que aparece en el Home y en Categorías.
 * Alterna colores rosa/gris (según el índice), muestra un ícono negro y la
 * etiqueta de la categoría.
 *
 * Props:
 *  - label:  nombre de la categoría (Collares, Aritos, Anillos, Brazaletes)
 *  - icon:   nombre de icono Ionicons representativo
 *  - index:  posición para alternar el color de fondo
 *  - onPress: acción al seleccionar la categoría
 */
import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import Icon from "./Icon";
import { colors } from "../theme/colors";

const CategoryChip = ({ label, icon, index = 0, onPress }) => {
  const fondoPar = index % 2 === 0;
  const colorFondo = fondoPar ? colors.coral : colors.greenChip;

  return (
    <TouchableOpacity style={styles.contenedor} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.cuadro, { backgroundColor: colorFondo }]}>
        <Icon name={icon} size={28} color={colors.textDark} />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default CategoryChip;

const styles = StyleSheet.create({
  contenedor: { alignItems: "center", width: 72 },
  cuadro: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 12, color: colors.textDark, marginTop: 6, fontWeight: "600" },
});