/**
 * HomeScreen.jsx
 * Pantalla principal (Home). Muestra:
 *  - Un saludo de bienvenida con el NOMBRE REAL del usuario logueado (tomado del
 *    AuthContext).
 *  - Barra de búsqueda que filtra productos por texto.
 *  - Categorías (datos reales por slug).
 *  - Sección "Bolsas de la suerte" (datos reales del endpoint /api/bolsas).
 *  - Cuadrícula de productos destacados (datos reales de /api/productos).
 *
 * Todos los datos provienen de la misma base de datos que la app web.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
} from "react-native";

import Logo from "../../components/Logo";
import CategoryChip from "../../components/CategoryChip";
import ProductCard from "../../components/ProductCard";
import Loader from "../../components/Loader";
import Icon from "../../components/Icon";
import useProductos from "../../hooks/useProductos";
import useBolsas from "../../hooks/useBolsas";
import { useAuth } from "../../context/AuthContext";
import { categorias } from "../../utils/categorias";
import { colors } from "../../theme/colors";

const HomeScreen = ({ navigation }) => {
  const { cliente } = useAuth();
  const [busqueda, setBusqueda] = useState("");

  // Datos reales desde el backend.
  const { productos, cargando: cargandoProductos } = useProductos({ search: busqueda });
  const { bolsas, cargando: cargandoBolsas } = useBolsas();

  // Nombre real del usuario logueado (requisito de la pantalla de Home).
  const nombre = cliente?.name || "invitada";

  return (
    <ScrollView style={styles.pantalla} showsVerticalScrollIndicator={false}>
      {/* Encabezado */}
      <View style={styles.header}>
        <Logo size={22} />
      </View>

      {/* Saludo con nombre real */}
      <Text style={styles.saludo}>Hola, {nombre}</Text>
      <Text style={styles.saludoSub}>Descubre tu próxima pieza de la suerte</Text>

      {/* Búsqueda */}
      <View style={styles.buscador}>
        <Icon name="search" size={16} color={colors.textGray} style={styles.lupa} />
        <TextInput
          style={styles.buscadorInput}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar"
          placeholderTextColor={colors.textLight}
        />
      </View>

      {/* Categorías */}
      <View style={styles.categorias}>
        {categorias.map((cat, i) => (
          <CategoryChip
            key={cat.slug}
            label={cat.label}
            icon={cat.icon}
            index={i}
            onPress={() =>
              navigation.navigate("Categorias", {
                screen: "CategoriasHome",
                params: { slug: cat.slug, label: cat.label },
              })
            }
          />
        ))}
      </View>

      {/* Bolsas de la suerte */}
      <View style={styles.seccionHeader}>
        <Text style={styles.seccionTitulo}>Bolsas de la suerte</Text>
      </View>

      {cargandoBolsas ? (
        <ActivityIndicator color={colors.magenta} style={{ marginVertical: 16 }} />
      ) : bolsas.length === 0 ? (
        <Text style={styles.vacio}>Aún no hay bolsas disponibles.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bolsas}>
          {bolsas.map((bolsa) => {
            const uri = bolsa.imagenPresentacion || bolsa.imagenes?.[0];
            return (
              <View key={bolsa._id} style={styles.bolsaCard}>
                {uri ? (
                  <Image source={{ uri }} style={styles.bolsaImg} />
                ) : (
                  <View style={[styles.bolsaImg, { backgroundColor: colors.greenSoft }]} />
                )}
                <Text style={styles.bolsaNombre} numberOfLines={1}>
                  {bolsa.nombre}
                </Text>
                <Text style={styles.bolsaPrecio}>${Number(bolsa.precio || 0).toFixed(2)}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Productos destacados */}
      <View style={styles.seccionHeader}>
        <Text style={styles.seccionTitulo}>Destacados</Text>
      </View>

      {cargandoProductos ? (
        <Loader texto="Cargando productos..." />
      ) : productos.length === 0 ? (
        <Text style={styles.vacio}>No se encontraron productos.</Text>
      ) : (
        <View style={styles.grid}>
          {productos.map((p) => (
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
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.white },
  header: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 6 },
  saludo: { fontSize: 22, fontWeight: "800", color: colors.textDark, paddingHorizontal: 20, marginTop: 6 },
  saludoSub: { fontSize: 13, color: colors.textGray, paddingHorizontal: 20, marginTop: 2 },
  buscador: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 999,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: colors.magenta,
    // brillo rosa
    shadowColor: colors.magenta,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
  lupa: { fontSize: 15, marginRight: 8 },
  buscadorInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: colors.textDark },
  categorias: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  seccionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 12,
  },
  seccionTitulo: { fontSize: 17, fontWeight: "800", color: colors.textDark },
  bolsas: { paddingLeft: 20 },
  bolsaCard: { width: 150, marginRight: 14 },
  bolsaImg: { width: 150, height: 130, borderRadius: 16, backgroundColor: colors.surface },
  bolsaNombre: { fontSize: 13, fontWeight: "700", color: colors.textDark, marginTop: 6 },
  bolsaPrecio: { fontSize: 13, fontWeight: "800", color: colors.greenLogo, marginTop: 2 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  vacio: { textAlign: "center", color: colors.textGray, paddingVertical: 20, paddingHorizontal: 20 },
});