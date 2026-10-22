/**
 * CategoriasScreen.jsx
 * Pantalla de categorías. Trae los productos y filtra por la categoría elegida
 * sin importar mayúsculas (igual que la web). Puede recibir la categoría por
 * navegación (route.params.slug), por ejemplo desde el Home o desde el
 * "Ver más" del detalle de un producto.
 */
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

import Logo from "../../components/Logo";
import CategoryChip from "../../components/CategoryChip";
import ProductCard from "../../components/ProductCard";
import Loader from "../../components/Loader";
import useProductos from "../../hooks/useProductos";
import { categorias, resolverSlug, perteneceACategoria } from "../../utils/categorias";
import { colors } from "../../theme/colors";

const CategoriasScreen = ({ route, navigation }) => {
  // Categoría activa. Si viene una por navegación se usa; si no, la primera.
  const [slug, setSlug] = useState(resolverSlug(route?.params?.slug));

  // Si el cliente llega desde el Home tocando OTRA categoría, se actualiza aquí.
  useEffect(() => {
    if (route?.params?.slug) setSlug(resolverSlug(route.params.slug));
  }, [route?.params?.slug]);

  // Se traen todos los productos y se filtran en la app por categoría.
  const { productos: todos, cargando, error } = useProductos({});
  const productos = todos.filter((p) => perteneceACategoria(p, slug));
  const categoriaActual = categorias.find((c) => c.slug === slug);

  return (
    <View style={styles.pantalla}>
      {/* Logo */}
      <View style={styles.header}>
        <Logo size={22} />
      </View>

      <Text style={styles.titulo}>Categorías</Text>

      {/* Selector de categorías: la activa lleva una línea rosa debajo */}
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

      {/* Productos de la categoría: carga, error, vacío o cuadrícula */}
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
  // Los 4 chips repartidos de forma pareja a lo ancho
  chips: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  chipWrap: { borderRadius: 18, paddingBottom: 4 },
  // Línea rosa que marca la categoría seleccionada
  chipActivo: { borderBottomWidth: 2, borderBottomColor: colors.magenta },
  subtitulo: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textDark,
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 12,
  },
  // Cuadrícula de 2 columnas
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  vacio: { textAlign: "center", color: colors.textGray, paddingVertical: 30 },
});