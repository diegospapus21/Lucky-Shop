/**
 * GuiaRegaloScreen.jsx
 * Ideas de regalo: muestra los primeros 8 productos, igual que GuiaRegalo.jsx
 * de la web. La flecha de la esquina regresa al Home.
 */
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";

import ProductCard from "../../components/ProductCard";
import Loader from "../../components/Loader";
import Icon from "../../components/Icon";
import useProductos from "../../hooks/useProductos";
import { colors } from "../../theme/colors";

const GuiaRegaloScreen = ({ navigation }) => {
  // Se traen los productos y se usan solo los primeros 8 como ideas de regalo.
  const { productos, cargando } = useProductos({});
  const ideas = productos.slice(0, 8);

  return (
    <View style={styles.pantalla}>
      {/* Flecha para regresar + título, juntos en una sola línea */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.volver} onPress={() => navigation.goBack()} hitSlop={12}>
          <Icon name="chevron-back" size={24} color={colors.textDark} />
          <Text style={styles.volverTexto}>Guía de regalo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Frase motivadora e introducción (mismo texto que la web) */}
        <Text style={styles.frase}>
          ¡Sorprende a quien amas con un detalle que brille tanto como ella!
        </Text>
        <Text style={styles.sub}>
          Encuentra el detalle perfecto para sorprender a esa persona especial.
        </Text>

        {/* Carga, vacío o cuadrícula de productos */}
        {cargando ? (
          <Loader texto="Cargando ideas..." />
        ) : ideas.length === 0 ? (
          <Text style={styles.vacio}>No hay productos disponibles por ahora.</Text>
        ) : (
          <View style={styles.grid}>
            {ideas.map((p) => (
              <ProductCard
                key={p._id}
                producto={p}
                onPress={() => navigation.navigate("ProductoDetalle", { producto: p })}
              />
            ))}
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

export default GuiaRegaloScreen;

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.white },
  header: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  volver: { flexDirection: "row", alignItems: "center", gap: 6 },
  volverTexto: { fontSize: 22, fontWeight: "800", color: colors.textDark },
  frase: { fontSize: 15, fontStyle: "italic", color: colors.textDark, paddingHorizontal: 20, marginTop: 10 },
  sub: { fontSize: 13, color: colors.textGray, paddingHorizontal: 20, marginTop: 6, marginBottom: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: 20 },
  vacio: { textAlign: "center", color: colors.textGray, paddingVertical: 30 },
});