/**
 * CheckoutScreen.jsx
 * Pantalla de pago. Usa las mismas formas de pago que la web (Pago.jsx):
 *  - Pago en efectivo     → el pedido queda registrado como pendiente de pago.
 *  - Pago en Transacción  → el pedido queda registrado como pagado.
 *  - Tarjeta de crédito o débito → se procesa con Wompi (mismos endpoints que la web).
 * Para cualquier método se registran el carrito y la venta en el backend, igual que en la web.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import Logo from "../../components/Logo";
import CustomButton from "../../components/CustomButton";
import Notificacion from "../../components/Notificacion";
import Icon from "../../components/Icon";
import useNotificacion from "../../hooks/useNotificacion";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../api/apiClient";
import { endpoints } from "../../api/apiConfig";
import { colors } from "../../theme/colors";

// Mismas opciones y textos que la página de pago de la web
const METODOS = [
  { id: "efectivo", label: "Pago en efectivo" },
  { id: "transaccion", label: "Pago en Transacción" },
  { id: "tarjeta", label: "Tarjeta de crédito o débito" },
];

const CheckoutScreen = ({ route, navigation }) => {
  const { items, subtotal, vaciar } = useCart();
  const { cliente } = useAuth();
  const { notificacion, mostrar, ocultar } = useNotificacion();

  const total = Number(route?.params?.total ?? subtotal) || 0;

  const [metodo, setMetodo] = useState("tarjeta"); // "efectivo" | "transaccion" | "tarjeta"
  const [direccion, setDireccion] = useState(cliente?.direccion || "");
  const [cargando, setCargando] = useState(false);

  // Datos de la tarjeta (solo se usan con el método "tarjeta")
  const [numero, setNumero] = useState("");
  const [titular, setTitular] = useState("");
  const [caducidad, setCaducidad] = useState("");
  const [cvv, setCvv] = useState("");

  // Número de tarjeta en grupos de 4 dígitos
  const formatearNumero = (texto) => {
    const digitos = texto.replace(/\D/g, "").slice(0, 16);
    const grupos = digitos.match(/.{1,4}/g);
    setNumero(grupos ? grupos.join(" ") : "");
  };

  // Fecha de expiración con formato MM/AA (agrega la barra sola)
  const formatearCaducidad = (texto) => {
    const digitos = texto.replace(/\D/g, "").slice(0, 4);
    setCaducidad(digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos);
  };

  // Valida los datos antes de pagar. Devuelve un mensaje de error o null si todo está bien.
  const validar = () => {
    if (items.length === 0) return "Tu carrito está vacío";
    if (!direccion.trim()) return "Ingresa una dirección de envío";
    if (metodo === "tarjeta") {
      const digitos = numero.replace(/\D/g, "");
      if (!titular.trim()) return "Ingresa el nombre que aparece en la tarjeta";
      if (digitos.length < 13) return "El número de tarjeta no es válido";
      const mes = Number(caducidad.slice(0, 2));
      if (!/^\d{2}\/\d{2}$/.test(caducidad) || mes < 1 || mes > 12) return "La fecha de expiración no es válida (MM/AA)";
      if (cvv.length < 3) return "El CVV no es válido";
    }
    return null;
  };

  // Registra el carrito y la venta en el backend (mismo flujo que la web)
  const registrarPedido = async () => {
    const carritoRes = await apiFetch(endpoints.carrito, {
      method: "POST",
      body: JSON.stringify({
        idCliente: cliente?._id,
        productos: items.map((it) => ({
          idProducto: it.producto._id,
          cantidad: it.cantidad,
          subtotal: Number(it.producto.precio || 0) * it.cantidad,
        })),
        total,
        estado: "activo",
      }),
    });
    if (!carritoRes.ok) throw new Error("No se pudo registrar el carrito");
    const carrito = await carritoRes.json();

    const ventaRes = await apiFetch(endpoints.venta, {
      method: "POST",
      body: JSON.stringify({
        IdCarrito: carrito._id,
        direcion: direccion.trim(),
        metodoPago: metodo,
        statusPago: metodo !== "efectivo", // en efectivo se paga al recibir
        status: true,
        fecha: new Date(),
      }),
    });
    if (!ventaRes.ok) throw new Error("No se pudo registrar la venta");
    return ventaRes.json();
  };

  // Cobra la tarjeta con Wompi (mismos endpoints y datos que la web)
  const cobrarConTarjeta = async () => {
    const tokenRes = await apiFetch(endpoints.wompiToken, { method: "POST" });
    if (!tokenRes.ok) throw new Error("Error de conexión con el procesador de pagos");
    const { access_token } = await tokenRes.json();

    const payRes = await apiFetch(endpoints.wompiPayment, {
      method: "POST",
      body: JSON.stringify({
        token: access_token,
        formData: {
          tarjeta: numero.replace(/\D/g, ""),
          nombre: titular.trim(),
          vencimiento: caducidad,
          cvv,
          monto: total,
        },
      }),
    });
    if (!payRes.ok) throw new Error("Pago declinado por el procesador");
  };

  const manejarPago = async () => {
    const problema = validar();
    if (problema) {
      mostrar(problema, "error");
      return;
    }

    setCargando(true);
    try {
      if (metodo === "tarjeta") await cobrarConTarjeta();
      const venta = await registrarPedido();

      const pedido = {
        numeroPedido: `LK-${String(venta?._id || Date.now()).slice(-6).toUpperCase()}`,
        total,
        productos: items,
      };
      vaciar();
      navigation.navigate("PagoExitoso", pedido);
    } catch (e) {
      mostrar(e.message || "Ocurrió un error al procesar el pago", "error");
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.pantalla}>
      <Notificacion {...notificacion} onHide={ocultar} />

      {/* Encabezado */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Icon name="arrow-back" size={22} color={colors.greenLogo} />
        </TouchableOpacity>
        <Logo size={20} mostrarSubtitulo={false} />
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contenido}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.titulo}>Pago</Text>

          {/* Método de pago */}
          <Text style={styles.seccion}>Método de pago</Text>
          {METODOS.map((op) => {
            const activo = metodo === op.id;
            return (
              <TouchableOpacity
                key={op.id}
                style={[styles.opcion, activo && styles.opcionActiva]}
                onPress={() => setMetodo(op.id)}
                disabled={cargando}
                activeOpacity={0.8}
              >
                <View style={[styles.radio, activo && styles.radioActivo]}>
                  {activo && <View style={styles.radioPunto} />}
                </View>
                <Text style={[styles.opcionTexto, activo && styles.opcionTextoActivo]}>{op.label}</Text>
              </TouchableOpacity>
            );
          })}

          {/* Datos de la tarjeta */}
          {metodo === "tarjeta" && (
            <View style={styles.tarjetaCaja}>
              <Text style={styles.label}>Número de tarjeta</Text>
              <TextInput
                style={styles.input}
                value={numero}
                onChangeText={formatearNumero}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={colors.textLight}
                keyboardType="number-pad"
              />

              <Text style={styles.label}>Nombre en la tarjeta</Text>
              <TextInput
                style={styles.input}
                value={titular}
                onChangeText={setTitular}
                placeholder="John Doe"
                placeholderTextColor={colors.textLight}
                autoCapitalize="words"
              />

              <View style={styles.fila}>
                <View style={styles.mitad}>
                  <Text style={styles.label}>Fecha de expiración</Text>
                  <TextInput
                    style={styles.input}
                    value={caducidad}
                    onChangeText={formatearCaducidad}
                    placeholder="05/27"
                    placeholderTextColor={colors.textLight}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
                <View style={styles.mitad}>
                  <Text style={styles.label}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    value={cvv}
                    onChangeText={(t) => setCvv(t.replace(/\D/g, "").slice(0, 4))}
                    placeholder="123"
                    placeholderTextColor={colors.textLight}
                    keyboardType="number-pad"
                    secureTextEntry
                  />
                </View>
              </View>
            </View>
          )}

          {metodo === "efectivo" && (
            <Text style={styles.nota}>Pagarás en efectivo cuando recibas tu pedido.</Text>
          )}
          {metodo === "transaccion" && (
            <Text style={styles.nota}>Tu pedido se registrará como pagado por transacción.</Text>
          )}

          {/* Dirección de envío */}
          <Text style={[styles.seccion, { marginTop: 24 }]}>Dirección de envío</Text>
          <TextInput
            style={[styles.input, styles.inputDireccion]}
            value={direccion}
            onChangeText={setDireccion}
            placeholder="Calle, colonia, ciudad"
            placeholderTextColor={colors.textLight}
            multiline
          />

          {/* Resumen */}
          <View style={styles.resumen}>
            <Text style={styles.resumenLabel}>Total a pagar</Text>
            <Text style={styles.resumenMonto}>${total.toFixed(2)}</Text>
          </View>

          <CustomButton
            title={`Pagar ahora $${total.toFixed(2)}`}
            icon="arrow-forward"
            onPress={manejarPago}
            loading={cargando}
          />
          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default CheckoutScreen;

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.white },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  contenido: { paddingHorizontal: 20 },
  titulo: { fontSize: 26, fontWeight: "800", color: colors.textDark, marginTop: 6, marginBottom: 14 },
  seccion: { fontSize: 16, fontWeight: "700", color: colors.textDark, marginBottom: 10 },

  opcion: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 10,
    backgroundColor: colors.white,
  },
  opcionActiva: { borderColor: colors.magenta, backgroundColor: colors.pinkTint },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioActivo: { borderColor: colors.magenta },
  radioPunto: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.magenta },
  opcionTexto: { fontSize: 15, color: colors.textDark, fontWeight: "600" },
  opcionTextoActivo: { color: colors.textDark },

  tarjetaCaja: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginTop: 2,
  },
  label: { fontSize: 12, fontWeight: "700", color: colors.textGray, marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.textDark,
  },
  inputDireccion: { minHeight: 60, textAlignVertical: "top" },
  fila: { flexDirection: "row", justifyContent: "space-between" },
  mitad: { width: "48%" },
  nota: { fontSize: 13, color: colors.textGray, marginTop: 4 },

  resumen: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 24,
    marginBottom: 16,
    paddingTop: 16,
  },
  resumenLabel: { fontSize: 18, fontWeight: "800", color: colors.textDark },
  resumenMonto: { fontSize: 22, fontWeight: "800", color: colors.textDark },
});
