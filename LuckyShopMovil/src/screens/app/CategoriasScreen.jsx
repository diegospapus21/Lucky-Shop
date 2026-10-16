/**
 * CategoriasScreen.jsx
 * Pantalla de categorías. Permite elegir una categoría (Collares, Aritos,
 * Anillos, Brazaletes) y muestra los productos reales de esa categoría filtrados
 * desde el backend con el custom hook useProductos.
 *
 * Puede recibir por parámetros de navegación (route.params) el slug inicial,
 * por ejemplo cuando se llega desde una categoría del Home.
 */
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

import Logo from "../../components/Logo";
import CategoryChip from "../../components/CategoryChip";
import ProductCard from "../../components/ProductCard";
import Loader from "../../components/Loader";
import useProductos from "../../hooks/useProductos";
import { categorias } from "../../utils/categorias";
import { colors } from "../../theme/colors";

const CategoriasScreen = ({ route, navigation }) => {
  // Slug inicial: el que venga por navegación o la primera categoría.
  const slugInicial = route?.params?.slug || categorias[0].slug;
  const [slug, setSlug] = useState(slugInicial);

  const { productos, cargando, error } = useProductos({ categoria: slug });
  const categoriaActual = categorias.find((c) => c.slug === slug);

  return (
    <View style={styles.pantalla}>
      <View style={styles.header}>
        <Logo size={22} />
      </View>

      <Text style={styles.titulo}>Categorías</Text>

      {/* Selector de categorías */}
      <View style={styles.chips}>
        {categorias.map((cat, i) => (
          <View key={cat.slug} style={[styles.chipWrap, slug === cat.slug && styles.chipActivo]}>
            <CategoryChip
              label={cat.label}
              icon={cat.icon}
              index={i}
              onPress={() => setSlug(cat.slug)}
            />
          </View>
        ))}
      </View>

      <Text style={styles.subtitulo}>{categoriaActual?.label}</Text>

      {/* Productos de la categoría */}
      {cargando ? (
        <Loader texto="Cargando productos..." />
      ) : error ? (
        <Text style={styles.vacio}>{error}</Text>
      ) : productos.length === 0 ? (
        <Text style={styles.vacio}>No hay productos en esta categoría todavía.</Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {productos.map((p) => (
              <ProductCard
                key={p._id}
                producto={p}
                onPress={() => navigation.navigate("ProductoDetalle", { producto: p })}
              />
            ))}
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
};

export default CategoriasScreen;

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.white },
  header: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 6 },
  titulo: { fontSize: 24, fontWeight: "800", color: colors.textDark, paddingHorizontal: 20, marginTop: 6 },
  chips: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  chipWrap: { borderRadius: 18, paddingBottom: 4 },
  chipActivo: { borderBottomWidth: 2, borderBottomColor: colors.magenta },
  subtitulo: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textDark,
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  vacio: { textAlign: "center", color: colors.textGray, paddingVertical: 30 },
});