/**
 * ListaDeseosScreen.jsx
 * Pantalla de favoritos del cliente. Carga los productos marcados como favoritos
 * desde el endpoint GET /api/perfilCliente/favoritos y los muestra en una grilla.
 * Permite filtrar por categoría (igual que en la web Favoritos.jsx).
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import Logo from "../../components/Logo";
import ProductCard from "../../components/ProductCard";
import Icon from "../../components/Icon";
import { apiFetch } from "../../api/apiClient";
import { endpoints } from "../../api/apiConfig";
import { colors } from "../../theme/colors";

const CATEGORIAS = [
  { id: "Todos",    label: "Todos" },
  { id: "Anillos",  label: "Anillos" },
  { id: "Aretes",   label: "Pendientes" },
  { id: "Collares", label: "Collares" },
  { id: "Pulseras", label: "Pulseras" },
];

const ListaDeseosScreen = ({ navigation }) => {
  const [favoritos,    setFavoritos]    = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [error,        setError]        = useState("");
  const [filtroActivo, setFiltroActivo] = useState("Todos");

  const cargarFavoritos = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const res  = await apiFetch(`${endpoints.perfil}/favoritos`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al cargar favoritos");
      setFavoritos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "No se pudieron cargar tus favoritos");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarFavoritos();
  }, [cargarFavoritos]);

  // Filtra por categoría (igual que en la web)
  const favoritosMostrados =
    filtroActivo === "Todos"
      ? favoritos
      : favoritos.filter(
          (p) =>
            p.idCategoria &&
            p.idCategoria.toLowerCase() === filtroActivo.toLowerCase()
        );

  // Conteo por categoría para los chips de filtro
  const conteo = (catId) =>
    catId === "Todos"
      ? favoritos.length
      : favoritos.filter(
          (p) =>
            p.idCategoria &&
            p.idCategoria.toLowerCase() === catId.toLowerCase()
        ).length;

  return (
    <View style={styles.pantalla}>
      {/* Encabezado */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={24} color={colors.textDark} />
        </TouchableOpacity>
        <Logo size={20} mostrarSubtitulo={false} />
        <View style={{ width: 32 }} />
      </View>

      {/* Título */}
      <View style={styles.tituloRow}>
        <Icon name="heart" size={22} color={colors.magenta} />
        <Text style={styles.titulo}>Lista de deseos</Text>
      </View>

      {/* Filtros de categoría */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtrosScroll}
        contentContainerStyle={styles.filtrosContenido}
      >
        {CATEGORIAS.map((cat) => {
          const activo = filtroActivo === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setFiltroActivo(cat.id)}
              style={[styles.chip, activo && styles.chipActivo]}
            >
              <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>
                {cat.label} ({conteo(cat.id)})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Contenido */}
      {cargando ? (
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color={colors.magenta} />
        </View>
      ) : error ? (
        <View style={styles.centrado}>
          <Icon name="alert-circle-outline" size={40} color={colors.danger} />
          <Text style={styles.mensajeTexto}>{error}</Text>
          <TouchableOpacity onPress={cargarFavoritos} style={styles.reintentar}>
            <Text style={styles.reintentarTexto}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : favoritos.length === 0 ? (
        <View style={styles.centrado}>
          <Icon name="heart-outline" size={52} color={colors.textLight} />
          <Text style={styles.mensajeTexto}>
            Aún no tienes productos favoritos.
          </Text>
          <Text style={styles.mensajeSubTexto}>
            Toca el ♡ en cualquier producto para guardarlo aquí.
          </Text>
        </View>
      ) : favoritosMostrados.length === 0 ? (
        <View style={styles.centrado}>
          <Text style={styles.mensajeTexto}>
            No tienes favoritos en esta categoría.
          </Text>
        </View>
      ) : (
        <FlatList
          data={favoritosMostrados}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.fila}
          renderItem={({ item }) => (
            <ProductCard
              producto={item}
              onPress={() =>
                navigation.navigate("Inicio", {
                  screen: "ProductoDetalle",
                  params: { producto: item },
                })
              }
            />
          )}
        />
      )}
    </View>
  );
};

export default ListaDeseosScreen;

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.white },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: { padding: 4 },

  tituloRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 12,
  },
  titulo: { fontSize: 20, fontWeight: "800", color: colors.textDark },

  filtrosScroll: { flexGrow: 0 },
  filtrosContenido: { paddingHorizontal: 20, gap: 8, paddingBottom: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActivo: {
    backgroundColor: colors.magenta,
    borderColor: colors.magenta,
  },
  chipTexto: { fontSize: 13, fontWeight: "600", color: colors.textGray },
  chipTextoActivo: { color: colors.white },

  centrado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 10,
  },
  mensajeTexto: {
    fontSize: 15,
    color: colors.textGray,
    textAlign: "center",
    fontWeight: "600",
  },
  mensajeSubTexto: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: "center",
  },
  reintentar: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.pinkSoft,
    borderRadius: 20,
  },
  reintentarTexto: { color: colors.magenta, fontWeight: "700", fontSize: 14 },

  grid: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  fila: { justifyContent: "space-between" },
});
