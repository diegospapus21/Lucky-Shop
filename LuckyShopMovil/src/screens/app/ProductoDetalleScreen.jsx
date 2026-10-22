/**
 * ProductoDetalleScreen.jsx
 * Pantalla de detalle de un producto. Recibe el producto por parámetros de
 * navegación (route.params.producto). Muestra imagen, nombre, estado,
 * descripción, detalles, precio, selector de cantidad y el botón "Añadir al
 * carrito" con el corazón de favoritos al lado. Al final, una sección de
 * productos relacionados ("También te puede interesar").
 * El carrito vive solo en el menú de abajo (ya no hay carrito arriba).
 */
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";

import CustomButton from "../../components/CustomButton";
import ProductCard from "../../components/ProductCard";
import Notificacion from "../../components/Notificacion";
import Icon from "../../components/Icon";
import useProductos from "../../hooks/useProductos";
import useFavoritos from "../../hooks/useFavoritos";
import useNotificacion from "../../hooks/useNotificacion";
import { useCart } from "../../context/CartContext";
import { colors } from "../../theme/colors";

const ProductoDetalleScreen = ({ route, navigation }) => {
  const { producto } = route.params;
  const { agregar } = useCart();
  const { esFavorito, toggleFavorito } = useFavoritos();
  const { notificacion, mostrar, ocultar } = useNotificacion();

  // Cantidad que el cliente quiere agregar al carrito.
  const [cantidad, setCantidad] = useState(1);

  // Las bolsas de la suerte no son "productos" para el backend de favoritos,
  // así que a ellas no se les muestra el corazón.
  const esBolsa = String(producto?.idCategoria || "").toLowerCase() === "bolsas";
  const fav = esFavorito(producto?._id);

  // Productos relacionados: misma categoría, excluyendo el actual (máximo 4).
  const { productos: relacionados } = useProductos({ categoria: producto?.idCategoria });
  // Respaldo: si la categoría no tiene otros productos (ej. bolsas), se muestran
  // productos de cualquier categoría para que la sección no desaparezca.
  const { productos: todos } = useProductos({});

  const mismaCategoria = relacionados.filter((p) => p._id !== producto._id);
  const sugerencias = (
    mismaCategoria.length > 0
      ? mismaCategoria
      : todos.filter((p) => p._id !== producto._id)
  ).slice(0, 4);

  const uri = producto?.imagenPresentacion || producto?.imagenes?.[0] || null;
  const precio = Number(producto?.precio || 0).toFixed(2);

  // Agrega el producto al carrito con la cantidad elegida y avisa con un mensaje.
  const manejarAgregar = () => {
    agregar(producto, cantidad);
    mostrar(`Se agregó ${cantidad} al carrito`, "success");
  };

  // Marca o quita el producto de la lista de deseos y avisa el resultado.
  const manejarFavorito = async () => {
    const eraFav = fav;
    const ok = await toggleFavorito(producto);
    if (!ok) mostrar("No se pudo actualizar la lista de deseos", "error");
    else mostrar(eraFav ? "Quitado de la lista de deseos" : "Agregado a la lista de deseos", "success");
  };

  return (
    <View style={styles.pantalla}>
      {/* Mensaje flotante (éxito / error) */}
      <Notificacion {...notificacion} onHide={ocultar} />

      {/* Barra superior: solo la flecha para regresar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Icon name="arrow-back" size={24} color={colors.textDark} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contenido}>
        {/* Imagen destacada */}
        <View style={styles.imagenWrap}>
          {uri ? (
            <Image source={{ uri }} style={styles.imagen} resizeMode="cover" />
          ) : (
            <View style={[styles.imagen, styles.imagenVacia]} />
          )}
        </View>

        {/* Nombre */}
        <Text style={styles.nombre}>{producto?.nombre}</Text>

        {/* Etiqueta de estado: "Más vendido" o "Disponible" */}
        {producto?.masVendido || producto?.estado === "activo" ? (
          <View style={styles.badgeEstado}>
            <Text style={styles.badgeEstadoTexto}>
              {producto?.masVendido ? "Más vendido" : "Disponible"}
            </Text>
          </View>
        ) : null}

        {/* Descripción y detalles opcionales (solo se muestran si existen) */}
        {producto?.descripcion ? (
          <Text style={styles.descripcion}>{producto.descripcion}</Text>
        ) : null}
        {producto?.material ? (
          <Text style={styles.detalle}>Material: {producto.material}</Text>
        ) : null}
        {producto?.longitud ? (
          <Text style={styles.detalle}>Longitud: {producto.longitud}</Text>
        ) : null}
        {producto?.subCategoria ? (
          <Text style={styles.detalle}>Categoría: {producto.subCategoria}</Text>
        ) : null}

        {/* Precio + selector de cantidad (− 1 +) */}
        <View style={styles.filaPrecio}>
          <Text style={styles.precio}>${precio}</Text>

          <View style={styles.selector}>
            <TouchableOpacity
              style={styles.selectorBtn}
              onPress={() => setCantidad((c) => Math.max(1, c - 1))} // nunca baja de 1
            >
              <Icon name="remove" size={18} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.selectorCantidad}>{cantidad}</Text>
            <TouchableOpacity
              style={styles.selectorBtn}
              onPress={() => setCantidad((c) => c + 1)}
            >
              <Icon name="add" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Fila de acciones: "Añadir al carrito" + corazón de favoritos al lado */}
        <View style={styles.filaAcciones}>
          <View style={{ flex: 1 }}>
            <CustomButton title="Añadir al carrito" onPress={manejarAgregar} />
          </View>
          {!esBolsa && (
            <TouchableOpacity style={styles.favDetalle} onPress={manejarFavorito} activeOpacity={0.8}>
              <Icon
                name={fav ? "heart" : "heart-outline"}
                size={22}
                color={fav ? colors.magenta : colors.textDark}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Productos relacionados */}
        {sugerencias.length > 0 && (
          <>
            <View style={styles.seccionHeader}>
              <Text style={styles.seccionTitulo}>También te puede interesar</Text>
              {/* "Ver más" lleva a la pantalla de Categorías con esta categoría */}
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("Categorias", {
                    screen: "CategoriasHome",
                    params: { slug: producto.idCategoria },
                  })
                }
              >
                <View style={styles.verMasWrap}>
                  <Text style={styles.verMas}>Ver más</Text>
                  <Icon name="chevron-forward" size={14} color={colors.magenta} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.grid}>
              {sugerencias.map((p) => (
                <ProductCard
                  key={p._id}
                  producto={p}
                  // push permite abrir otro detalle encima de este
                  onPress={() => navigation.push("ProductoDetalle", { producto: p })}
                />
              ))}
            </View>
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

export default ProductoDetalleScreen;

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.white },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 8,
  },
  contenido: { paddingHorizontal: 20, paddingBottom: 20 },
  imagenWrap: { borderRadius: 20, overflow: "hidden", backgroundColor: colors.surface },
  imagen: { width: "100%", height: 260 },
  imagenVacia: { backgroundColor: colors.pinkSoft },
  nombre: { fontSize: 22, fontWeight: "800", color: colors.textDark, marginTop: 16 },
  badgeEstado: {
    alignSelf: "flex-start",
    backgroundColor: colors.pinkSoft,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 10,
  },
  badgeEstadoTexto: { color: colors.magenta, fontSize: 12, fontWeight: "700" },
  descripcion: { fontSize: 14, color: colors.textGray, lineHeight: 20, marginTop: 14 },
  detalle: { fontSize: 14, color: colors.textDark, marginTop: 6 },
  filaPrecio: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 16,
  },
  precio: { fontSize: 24, fontWeight: "800", color: colors.greenLogo },
  selector: { flexDirection: "row", alignItems: "center" },
  selectorBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.darkGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  selectorCantidad: {
    minWidth: 40,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
    color: colors.textDark,
  },
  // Fila con el botón de carrito (ocupa el espacio libre) y el corazón (cuadro fijo)
  filaAcciones: { flexDirection: "row", alignItems: "center", gap: 10 },
  favDetalle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  seccionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 28,
    marginBottom: 14,
  },
  seccionTitulo: { fontSize: 17, fontWeight: "800", color: colors.textDark },
  verMas: { fontSize: 13, color: colors.magenta, fontWeight: "700" },
  verMasWrap: { flexDirection: "row", alignItems: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
});