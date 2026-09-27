/**
 * CheckoutScreen.jsx
 * Pasarela de pago. Permite elegir entre:
 *  - Tarjeta: simulación de front-end (no procesa un pago real).
 *  - PayPal:  pago real (sandbox) a través del backend. El backend crea la orden,
 *             el cliente la aprueba en un WebView y luego el backend la cobra.
 *             Al completarse se registran el carrito y la venta, igual que en la web.
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
  ActivityIndicator,
} from "react-native";

import Logo from "../../components/Logo";
import CustomButton from "../../components/CustomButton";
import Notificacion from "../../components/Notificacion";
import Icon from "../../components/Icon";
import PayPalWebView from "../../components/PayPalWebView";
import useNotificacion from "../../hooks/useNotificacion";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../api/apiClient";
import { endpoints } from "../../api/apiConfig";
import { colors } from "../../theme/colors";

const CheckoutScreen = ({ route, navigation }) => {
  const { items, subtotal, vaciar } = useCart();
  const { cliente } = useAuth();
  const { notificacion, mostrar, ocultar } = useNotificacion();

  const [metodo, setMetodo] = useState("tarjeta"); // "tarjeta" | "paypal"
  const [cargando, setCargando] = useState(false);
  // Datos de la orden de PayPal en curso: { orderId, url, returnUrl, cancelUrl }
  const [ordenPayPal, setOrdenPayPal] = useState(null);

  const total = route?.params?.total ?? subtotal;

  const [titular, setTitular] = useState("");
  const [numero, setNumero] = useState("");
  const [caducidad, setCaducidad] = useState("");
  const [cvv, setCvv] = useState("");

  // Formatea el número de tarjeta en grupos de 4 dígitos.
  const formatearNumero = (texto) => {
    const soloDigitos = texto.replace(/\D/g, "").slice(0, 16);
    const grupos = soloDigitos.match(/.{1,4}/g);
    setNumero(grupos ? grupos.join(" ") : "");
  };

  // Muestra los últimos 4 dígitos en la vista previa de la tarjeta.
  const ultimos4 = numero.replace(/\D/g, "").slice(-4).padStart(4, "•");

  const manejarPago = () => {
    if (!titular || numero.replace(/\D/g, "").length < 16 || !caducidad || !cvv) {
      mostrar("Completa todos los datos de la tarjeta", "error");
      return;
    }
    // Simulación de pago exitoso.
    const pedido = {
      numeroPedido: `LK-${Math.floor(100000 + Math.random() * 900000)}`,
      total,
      productos: items,
    };
    vaciar();
    navigation.navigate("PagoExitoso", pedido);
  };

  // Lee el JSON de la respuesta sin romper si el backend devuelve texto
  const leerJson = async (res) => {
    try {
      return await res.json();
    } catch {
      return {};
    }
  };

  // PayPal paso 1: el backend crea la orden (calcula el total con los precios de la BD)
  const iniciarPayPal = async () => {
    setCargando(true);
    try {
      const res = await apiFetch(endpoints.paypalCreateOrder, {
        method: "POST",
        body: JSON.stringify({
          productos: items.map((it) => ({ idProducto: it.producto._id, cantidad: it.cantidad })),
          incluirEnvio: false, // en la app el envío es gratis
          plataforma: "movil",
        }),
      });
      const data = await leerJson(res);
      if (!res.ok || !data.approveUrl) {
        throw new Error(data.message || "No se pudo iniciar el pago con PayPal");
      }
      setOrdenPayPal({
        orderId: data.id,
        url: data.approveUrl,
        returnUrl: data.returnUrl,
        cancelUrl: data.cancelUrl,
      });
    } catch (e) {
      mostrar(e.message, "error");
    } finally {
      setCargando(false);
    }
  };

  // Registra el carrito y la venta en el backend (mismo flujo que la web)
  const registrarPedido = async (captura) => {
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
    if (!carritoRes.ok) throw new Error("El pago se hizo, pero no se pudo registrar el carrito");
    const carrito = await carritoRes.json();

    const ventaRes = await apiFetch(endpoints.venta, {
      method: "POST",
      body: JSON.stringify({
        IdCarrito: carrito._id,
        direcion: cliente?.direccion || "",
        metodoPago: "paypal",
        statusPago: true,
        status: true,
        fecha: new Date(),
        idTransaccion: captura.captureID,
        idOrdenPayPal: captura.orderID,
      }),
    });
    if (!ventaRes.ok) throw new Error("El pago se hizo, pero no se pudo registrar la venta");
  };

  // PayPal paso 2: el cliente aprobó en el WebView, ahora cobramos la orden
  const capturarPayPal = async () => {
    const orderId = ordenPayPal?.orderId;
    setOrdenPayPal(null);
    setCargando(true);
    try {
      const res = await apiFetch(endpoints.paypalCaptureOrder, {
        method: "POST",
        body: JSON.stringify({ orderID: orderId }),
      });
      const data = await leerJson(res);
      if (!res.ok || data.status !== "COMPLETED") {
        throw new Error(data.message || "PayPal no completó el pago");
      }

      const pedido = {
        numeroPedido: data.captureID || data.orderID,
        total,
        productos: items,
      };
      await registrarPedido(data);
      vaciar();
      navigation.navigate("PagoExitoso", pedido);
    } catch (e) {
      mostrar(e.message, "error");
    } finally {
      setCargando(false);
    }
  };

  const cancelarPayPal = () => {
    setOrdenPayPal(null);
    mostrar("Cancelaste el pago con PayPal", "info");
  };

  return (
    <View style={styles.pantalla}>
      <Notificacion {...notificacion} onHide={ocultar} />

      <PayPalWebView
        visible={!!ordenPayPal}
        url={ordenPayPal?.url}
        returnUrl={ordenPayPal?.returnUrl}
        cancelUrl={ordenPayPal?.cancelUrl}
        onAprobado={capturarPayPal}
        onCancelado={cancelarPayPal}
      />

      {/* Encabezado */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Icon name="arrow-back" size={22} color={colors.greenLogo} />
        </TouchableOpacity>
        <Logo size={20} mostrarSubtitulo={false} />
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contenido}>
          <Text style={styles.titulo}>Pasarela de pago segura</Text>
          <Text style={styles.subtitulo}>
            {metodo === "paypal" ? "Pago con PayPal" : "Pago con tarjeta de crédito"}
          </Text>

          <Text style={styles.totalLabel}>Total a pagar:</Text>
          <Text style={styles.totalMonto}>${total.toFixed(2)}</Text>

          {/* Selector de método de pago */}
          <View style={styles.selector}>
            {[
              { id: "tarjeta", label: "Tarjeta", icon: "card-outline" },
              { id: "paypal", label: "PayPal", icon: "logo-paypal" },
            ].map((op) => (
              <TouchableOpacity
                key={op.id}
                style={[styles.opcion, metodo === op.id && styles.opcionActiva]}
                onPress={() => setMetodo(op.id)}
                disabled={cargando}
              >
                <Icon
                  name={op.icon}
                  size={18}
                  color={metodo === op.id ? colors.white : colors.textDark}
                />
                <Text style={[styles.opcionTexto, metodo === op.id && styles.opcionTextoActivo]}>
                  {op.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {metodo === "tarjeta" ? (
          <>
          {/* Formulario */}
          <View style={styles.form}>
            <Text style={styles.label}>Nombre del titular</Text>
            <TextInput
              style={styles.input}
              value={titular}
              onChangeText={setTitular}
              placeholder="Ej. Ana García"
              placeholderTextColor={colors.textLight}
            />

            <Text style={styles.label}>Número de tarjeta</Text>
            <TextInput
              style={styles.input}
              value={numero}
              onChangeText={formatearNumero}
              placeholder="0000 0000 0000 0000"
              placeholderTextColor={colors.textLight}
              keyboardType="number-pad"
            />

            <View style={styles.fila}>
              <View style={styles.mitad}>
                <Text style={styles.label}>Fecha de caducidad</Text>
                <TextInput
                  style={styles.input}
                  value={caducidad}
                  onChangeText={setCaducidad}
                  placeholder="MM/AA"
                  placeholderTextColor={colors.textLight}
                  maxLength={5}
                />
              </View>
              <View style={styles.mitad}>
                <Text style={styles.label}>CVV/CVC</Text>
                <TextInput
                  style={styles.input}
                  value={cvv}
                  onChangeText={(t) => setCvv(t.replace(/\D/g, "").slice(0, 4))}
                  placeholder="•••"
                  placeholderTextColor={colors.textLight}
                  keyboardType="number-pad"
                  secureTextEntry
                />
              </View>
            </View>

            {/* Vista previa de la tarjeta */}
            <View style={styles.tarjeta}>
              <Text style={styles.tarjetaMarca}>Lucky tarjeta</Text>
              <Text style={styles.tarjetaNumero}>•••• •••• •••• {ultimos4}</Text>
              <Text style={styles.tarjetaFecha}>{caducidad || "MM/AA"}</Text>
            </View>
          </View>

          <CustomButton
            title={`Pagar $${total.toFixed(2)}`}
            icon="arrow-forward"
            onPress={manejarPago}
          />
          </>
          ) : (
            <View style={styles.paypalCaja}>
              <Text style={styles.paypalTexto}>
                Te llevaremos a PayPal para que inicies sesión y confirmes el pago.
                Al terminar volverás automáticamente a LuckyShop.
              </Text>
              <TouchableOpacity
                style={[styles.botonPayPal, cargando && { opacity: 0.6 }]}
                onPress={iniciarPayPal}
                disabled={cargando || items.length === 0}
                activeOpacity={0.85}
              >
                {cargando ? (
                  <ActivityIndicator color="#003087" />
                ) : (
                  <Text style={styles.botonPayPalTexto}>
                    Pagar ${total.toFixed(2)} con <Text style={{ fontStyle: "italic" }}>PayPal</Text>
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.seguro}>Tu pago es 100% seguro</Text>
          <View style={{ height: 20 }} />
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
  titulo: { fontSize: 22, fontWeight: "800", color: colors.textDark, textAlign: "center", marginTop: 6 },
  subtitulo: { fontSize: 14, color: colors.textGray, textAlign: "center", marginTop: 4 },
  totalLabel: { fontSize: 18, fontWeight: "800", color: colors.textDark, textAlign: "center", marginTop: 16 },
  totalMonto: { fontSize: 36, fontWeight: "800", color: colors.textDark, textAlign: "center", marginTop: 4 },
  form: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  label: { fontSize: 13, fontWeight: "700", color: colors.textDark, marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textDark,
  },
  fila: { flexDirection: "row", justifyContent: "space-between" },
  mitad: { width: "48%" },
  tarjeta: {
    backgroundColor: colors.darkGreen,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    height: 120,
    justifyContent: "space-between",
  },
  tarjetaMarca: { color: colors.white, fontSize: 14, fontWeight: "700" },
  tarjetaNumero: { color: colors.white, fontSize: 18, letterSpacing: 2, fontWeight: "600" },
  tarjetaFecha: { color: colors.white, fontSize: 12, alignSelf: "flex-end" },
  selector: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  opcion: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  opcionActiva: { backgroundColor: colors.darkGreen },
  opcionTexto: { fontSize: 14, fontWeight: "700", color: colors.textDark },
  opcionTextoActivo: { color: colors.white },
  paypalCaja: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    marginTop: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  paypalTexto: { fontSize: 13, color: colors.textGray, textAlign: "center", marginBottom: 16 },
  botonPayPal: {
    backgroundColor: "#FFC439", // amarillo oficial del botón de PayPal
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
  },
  botonPayPalTexto: { fontSize: 16, fontWeight: "800", color: "#003087" },
  seguro: { textAlign: "center", color: colors.greenLogo, fontSize: 12, marginTop: 12, fontWeight: "600" },
});
