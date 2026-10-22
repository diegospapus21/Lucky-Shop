/**
 * HomeScreen.jsx
 * Pantalla principal. Orden: saludo, búsqueda, categorías, Bolsas de la suerte,
 * Destacados, tarjetas de Guía de regalo y Promociones, y sección Otros.
 * El buscador filtra por nombre, categoría y subcategoría (con sinónimos).
 * Todo viene de la misma base de datos que la web: lo que se agrega allá
 * aparece aquí.
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import Logo from "../../components/Logo";
import CategoryChip from "../../components/CategoryChip";
import ProductCard from "../../components/ProductCard";
import TarjetaSeccion from "../../components/TarjetasSeccion";
import Loader from "../../components/Loader";
import Icon from "../../components/Icon";
import useProductos from "../../hooks/useProductos";
import useBolsas from "../../hooks/useBolsas";
import { recargarFavoritos } from "../../hooks/useFavoritos";
import { useAuth } from "../../context/AuthContext";
import { categorias } from "../../utils/categorias";
import { colors } from "../../theme/colors";

// Quita tildes y pasa a minúsculas para comparar mejor.
const normalizar = (t) =>
  String(t || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

// Palabras extra por categoría: lo que el cliente podría escribir en el buscador.
// Ej: escribir "aritos" o "pendientes" también encuentra los aretes.
const SINONIMOS = {
  anillos: "anillos anillo",
  aretes: "aretes arete aritos arito pendientes pendiente",
  pendientes: "pendientes pendiente aretes arete aritos arito",
  collares: "collares collar",
  pulseras: "pulseras pulsera brazaletes brazalete",
  charms: "charms charm accesorios",
  set: "set sets",
  bolsas: "bolsas bolsa bolsas de la suerte",
  otros: "otros",
};

// ¿El producto coincide con lo escrito? Busca en nombre, categoría, subcategoría
// y sinónimos de la categoría.
const coincide = (p, consulta) => {
  const q = normalizar(consulta);
  if (!q) return true;
  const cat = normalizar(p.idCategoria);
  const texto = [p.nombre, p.idCategoria, p.subCategoria, SINONIMOS[cat] || ""]
    .map(normalizar)
    .join(" ");
  return texto.includes(q);
};

const HomeScreen = ({ navigation }) => {
  const { cliente } = useAuth();
  const [busqueda, setBusqueda] = useState("");

  // Datos reales del backend. Se traen todos los productos y se filtra aquí.
  const { productos: todos, cargando: cargandoProductos } = useProductos({});
  const { bolsas, cargando: cargandoBolsas } = useBolsas();

  // Al abrir el Home se leen los favoritos del usuario actual (para los corazones).
  useEffect(() => {
    recargarFavoritos();
  }, []);

  // Nombre real del usuario logueado para el saludo.
  const nombre = cliente?.name || "invitada";

  // Si hay texto en el buscador, se muestran solo los resultados.
  const buscando = busqueda.trim().length > 0;
  const resultados = todos.filter((p) => coincide(p, busqueda));

  // Sección "Otros": productos cuya categoría es "otros" (sin importar mayúsculas).
  const otros = todos.filter((p) => normalizar(p.idCategoria) === "otros");

  // Destacados: los marcados como "más vendido"; si no hay ninguno, los primeros 4.
  const marcados = todos.filter((p) => p.masVendido);
  const destacados = (marcados.length > 0 ? marcados : todos).slice(0, 4);

  // Abre el detalle de un producto.
  const verProducto = (p) => navigation.navigate("ProductoDetalle", { producto: p });
  // Abre el detalle de una bolsa (se marca como "Bolsas" para ocultar el corazón).
  const verBolsa = (b) =>
    navigation.navigate("ProductoDetalle", { producto: { ...b, idCategoria: "Bolsas" } });

  // Dibuja una lista de productos en cuadrícula de 2 columnas.
  const renderGrid = (lista) => (
    <View style={styles.grid}>
      {lista.map((p) => (
        <ProductCard key={p._id} producto={p} onPress={() => verProducto(p)} />
      ))}
    </View>
  );

  return (
    <ScrollView
      style={styles.pantalla}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled" // permite tocar un producto con el teclado abierto
    >
      {/* Encabezado con el logo */}
      <View style={styles.header}>
        <Logo size={22} />
      </View>

      {/* Saludo con el nombre real */}
      <Text style={styles.saludo}>Hola {nombre}!</Text>
      <Text style={styles.saludoSub}>Descubre tu próxima pieza de la suerte</Text>

      {/* Barra de búsqueda blanca con borde y brillo rosa */}
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

      {/* Categorías: cada una abre la pantalla de Categorías ya filtrada */}
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

      {buscando ? (
        /* ── Modo búsqueda: solo se muestran los resultados ── */
        <>
          <View style={styles.seccionHeader}>
            <Text style={styles.seccionTitulo}>Resultados</Text>
          </View>
          {cargandoProductos ? (
            <Loader texto="Buscando..." />
          ) : resultados.length === 0 ? (
            <Text style={styles.vacio}>No se encontraron productos.</Text>
          ) : (
            renderGrid(resultados)
          )}
        </>
      ) : (
        /* ── Modo normal: todas las secciones del inicio ── */
        <>
          {/* Bolsas de la suerte (carrusel horizontal, se pueden tocar) */}
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
                  <TouchableOpacity
                    key={bolsa._id}
                    style={styles.bolsaCard}
                    activeOpacity={0.9}
                    onPress={() => verBolsa(bolsa)}
                  >
                    {uri ? (
                      <Image source={{ uri }} style={styles.bolsaImg} />
                    ) : (
                      <View style={[styles.bolsaImg, { backgroundColor: colors.greenSoft }]} />
                    )}
                    <Text style={styles.bolsaNombre} numberOfLines={1}>
                      {bolsa.nombre}
                    </Text>
                    <Text style={styles.bolsaPrecio}>
                      ${Number(bolsa.precio || 0).toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Destacados */}
          <View style={styles.seccionHeader}>
            <Text style={styles.seccionTitulo}>Destacados</Text>
          </View>
          {cargandoProductos ? (
            <Loader texto="Cargando productos..." />
          ) : destacados.length === 0 ? (
            <Text style={styles.vacio}>No se encontraron productos.</Text>
          ) : (
            renderGrid(destacados)
          )}

          {/* Dos tarjetas de acceso: Guía de regalo y Promociones */}
          <View style={{ height: 8 }} />
          <TarjetaSeccion
            titulo="Guía de regalo"
            subtitulo="Encuentra el detalle ideal según su estilo"
            boton="Ver guía"
            onPress={() => navigation.navigate("GuiaRegalo")}
          />
          <TarjetaSeccion
            titulo="Promociones"
            subtitulo="Una joya es buena, dos son mejor"
            boton="Ver promos"
            onPress={() => navigation.navigate("Promociones")}
          />

          {/* Otros: solo aparece si hay productos de esa categoría */}
          {otros.length > 0 && (
            <>
              <View style={styles.seccionHeader}>
                <Text style={styles.seccionTitulo}>Otros</Text>
              </View>
              {renderGrid(otros.slice(0, 4))}
            </>
          )}
        </>
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
  // Barra de búsqueda: blanca, muy redondeada, borde rosa y brillo
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
    shadowColor: colors.magenta, // brillo rosa
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6, // equivalente de la sombra en Android
  },
  lupa: { fontSize: 15, marginRight: 8 },
  buscadorInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: colors.textDark },
  // Los 4 chips de categoría repartidos de forma pareja
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
  // Cuadrícula de 2 columnas
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  vacio: { textAlign: "center", color: colors.textGray, paddingVertical: 20, paddingHorizontal: 20 },
});