/**
 * CarritoScreen.jsx
 * Pantalla del carrito de compras (FUNCIONAL). Lista los productos agregados con
 * su cantidad, permite incrementar/decrementar/eliminar, aplicar un código de
 * promoción (visual) y muestra el resumen (subtotal, envío, total). El botón
 * "Proceder a la compra" lleva a la pasarela de pago.
 *
 * Los datos del carrito provienen del CartContext (global).
 */
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
} from "react-native";

import CustomButton from "../../components/CustomButton";
import Icon from "../../components/Icon";
import { useCart } from "../../context/CartContext";
import { colors } from "../../theme/colors";

const CarritoScreen = ({ navigation }) => {
  const { items, cambiarCantidad, eliminar, subtotal } = useCart();
  const [promo, setPromo] = useState("");

  // Envío gratis en este avance; el total es igual al subtotal.
  const envioGratis = true;
  const total = subtotal;

  // Estado vacío.
  if (items.length === 0) {
    return (
      <View style={styles.pantalla}>
        <View style={styles.header}>
          <Text style={styles.titulo}>Carrito</Text>
        </View>
        <View style={styles.centro}>
          <Icon name="cart-outline" size={54} color={colors.textLight} />
          <Text style={styles.vacioTitulo}>Tu carrito está vacío</Text>
          <Text style={styles.vacioTexto}>
            Explora la tienda y agrega tus piezas de la suerte favoritas.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.pantalla}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Icon name="arrow-back" size={22} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.titulo}>Carrito</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contenido}>
        {/* Lista de productos */}
        {items.map(({ producto, cantidad }) => {
          const uri = producto.imagenPresentacion || producto.imagenes?.[0];
          return (
            <View key={producto._id} style={styles.item}>
              {uri ? (
                <Image source={{ uri }} style={styles.itemImg} />
              ) : (
                <View style={[styles.itemImg, { backgroundColor: colors.pinkSoft }]} />
              )}

              <View style={styles.itemInfo}>
                <Text style={styles.itemNombre} numberOfLines={2}>{producto.nombre}</Text>
                {producto.subCategoria ? (
                  <Text style={styles.itemSub}>{producto.subCategoria}</Text>
                ) : null}
                <Text style={styles.itemPrecio}>${Number(producto.precio || 0).toFixed(2)}</Text>
              </View>

              <View style={styles.itemDerecha}>
                <TouchableOpacity onPress={() => eliminar(producto._id)} hitSlop={8}>
                  <Icon name="trash-outline" size={20} color={colors.danger} />
                </TouchableOpacity>

                <View style={styles.selector}>
                  <TouchableOpacity
                    style={styles.selectorBtn}
                    onPress={() => cambiarCantidad(producto._id, -1)}
                  >
                    <Icon name="remove" size={16} color={colors.textDark} />
                  </TouchableOpacity>
                  <Text style={styles.selectorCantidad}>{cantidad}</Text>
                  <TouchableOpacity
                    style={styles.selectorBtn}
                    onPress={() => cambiarCantidad(producto._id, 1)}
                  >
                    <Icon name="add" size={16} color={colors.textDark} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}


        {/* Resumen */}
        <View style={styles.resumen}>
          <View style={styles.resumenFila}>
            <Text style={styles.resumenLabel}>Subtotal</Text>
            <Text style={styles.resumenValor}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.resumenFila}>
            <Text style={styles.resumenLabel}>Envío</Text>
            <Text style={styles.resumenValor}>{envioGratis ? "Gratis" : "$0.00"}</Text>
          </View>
          <View style={styles.divisor} />
          <View style={styles.resumenFila}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValor}>${total.toFixed(2)}</Text>
          </View>
        </View>

        <CustomButton
          title="Proceder a la compra"
          icon="arrow-forward"
          onPress={() => navigation.navigate("Checkout", { total })}
        />

        <Text style={styles.seguro}>Devoluciones fáciles, pagos seguros</Text>
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

export default CarritoScreen;

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  titulo: { fontSize: 24, fontWeight: "800", color: colors.textDark },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 },
  vacioTitulo: { fontSize: 18, fontWeight: "800", color: colors.textDark, marginTop: 16, marginBottom: 8 },
  vacioTexto: { fontSize: 14, color: colors.textGray, textAlign: "center", lineHeight: 20 },
  contenido: { paddingHorizontal: 20 },
  item: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.greenSoft,
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
  },
  itemImg: { width: 64, height: 64, borderRadius: 12, backgroundColor: colors.surface },
  itemInfo: { flex: 1, marginLeft: 12, justifyContent: "center" },
  itemNombre: { fontSize: 14, fontWeight: "700", color: colors.textDark },
  itemSub: { fontSize: 12, color: colors.textGray, marginTop: 2 },
  itemPrecio: { fontSize: 14, fontWeight: "800", color: colors.greenLogo, marginTop: 4 },
  itemDerecha: { justifyContent: "space-between", alignItems: "flex-end" },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.greenSoft,
    borderRadius: 20,
    paddingHorizontal: 4,
  },
  selectorBtn: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  selectorCantidad: { minWidth: 22, textAlign: "center", fontSize: 14, fontWeight: "700", color: colors.textDark },
  promoFila: { flexDirection: "row", alignItems: "center", marginTop: 4, marginBottom: 18 },
  promoInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  promoTexto: { flex: 1, paddingVertical: 12, marginLeft: 8, fontSize: 13, color: colors.textDark },
  promoBtn: { backgroundColor: colors.coral, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 12 },
  promoBtnTexto: { color: colors.white, fontWeight: "700", fontSize: 14 },
  resumen: { backgroundColor: colors.pinkTint, borderRadius: 18, padding: 18, marginBottom: 18 },
  resumenFila: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  resumenLabel: { fontSize: 14, color: colors.textGray },
  resumenValor: { fontSize: 14, fontWeight: "700", color: colors.textDark },
  divisor: { height: 1, backgroundColor: colors.border, marginVertical: 6 },
  totalLabel: { fontSize: 18, fontWeight: "800", color: colors.textDark },
  totalValor: { fontSize: 20, fontWeight: "800", color: colors.magenta },
  seguro: { textAlign: "center", color: colors.magenta, fontSize: 12, marginTop: 12, fontWeight: "600" },
});
