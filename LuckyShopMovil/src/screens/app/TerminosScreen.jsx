/**
 * TerminosScreen.jsx
 * Pantalla estática de Términos y Condiciones. Muestra el mismo contenido que
 * Politicas.jsx de la app web, adaptado a componentes nativos de React Native.
 */
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";

import Logo from "../../components/Logo";
import Icon from "../../components/Icon";
import { colors } from "../../theme/colors";

// Secciones extraídas de Politicas.jsx (web)
const SECCIONES = [
  {
    titulo: "1. Aceptación de los términos",
    texto:
      'El acceso y uso del sitio web de Luckyshop implica la aceptación plena y sin reservas de los presentes Términos y Condiciones. Estos regulan la relación comercial entre el cliente (en adelante, "el Usuario") y Luckyshop para la adquisición de piezas de joyería.',
  },
  {
    titulo: "2. Objeto",
    texto:
      "Luckyshop es una tienda en línea dedicada a la comercialización de joyería y accesorios. Nuestra plataforma permite a los usuarios visualizar, seleccionar y adquirir piezas exclusivas diseñadas y seleccionadas por nuestro emprendimiento.",
  },
  {
    titulo: "3. Registro de usuarios y privacidad",
    items: [
      "Para realizar compras, el usuario deberá proporcionar información veraz y actualizada (nombre, correo electrónico y dirección de entrega).",
      "El usuario es responsable de mantener la confidencialidad de su cuenta.",
      "Luckyshop se reserva el derecho de cancelar cuentas en caso de detectar actividades sospechosas o incumplimiento de estas normas.",
    ],
  },
  {
    titulo: "4. Características de los productos",
    items: [
      "Descripción: Nos esforzamos por mostrar los colores y detalles de nuestras joyas con la mayor precisión posible. Sin embargo, el producto final puede variar ligeramente según la pantalla.",
      "Cuidado de la Joya: Luckyshop no se hace responsable por el desgaste natural del uso, el oscurecimiento de metales por el pH de la piel o el daño por contacto con químicos (perfumes, cloro, etc.).",
    ],
  },
  {
    titulo: "5. Precios y pagos",
    items: [
      "Todos los precios están expresados en la moneda local e incluyen los impuestos correspondientes.",
      "Los pagos se procesarán a través de pasarelas seguras. Luckyshop no almacena datos de tarjetas.",
      "El pedido se procesará únicamente una vez confirmado el pago exitoso.",
    ],
  },
  {
    titulo: "6. Envíos y entregas",
    items: [
      "Tiempos: Los tiempos de entrega estimados se comunicarán al finalizar la compra y pueden variar según la ubicación.",
      "Responsabilidad: Luckyshop no se hace responsable por retrasos derivados de fuerza mayor o errores en la dirección proporcionada.",
      "Costo: El costo de envío se calculará de forma transparente antes de finalizar el pago.",
    ],
  },
  {
    titulo: "7. Devoluciones y cambios",
    items: [
      "Garantía: Se aceptarán cambios o devoluciones únicamente por defectos de fabricación comprobados dentro de los primeros días tras la recepción.",
      "Higiene y Personalización: Por razones de higiene, no se aceptan cambios ni devoluciones de pendientes/aretes ni piezas personalizadas.",
      "Estado del Producto: Para cualquier cambio, la pieza debe estar sin uso, en su empaque original y con comprobante de compra.",
    ],
  },
  {
    titulo: "8. Responsabilidad de la plataforma",
    items: [
      "Luckyshop trabaja para mantener el sitio libre de errores técnicos; sin embargo, no garantiza que el servicio sea ininterrumpido.",
      "No nos hacemos responsables por reacciones alérgicas a los materiales. El cliente debe leer la descripción de los componentes antes de la compra.",
    ],
  },
];

const TerminosScreen = ({ navigation }) => {
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
      >
        {/* Título */}
        <View style={styles.tituloRow}>
          <Icon name="card" size={22} color={colors.greenLogo} />
          <Text style={styles.titulo}>Términos y Condiciones</Text>
        </View>

        <Text style={styles.subtitulo}>LUCKYSHOP</Text>

        {/* Tarjeta de contenido */}
        <View style={styles.card}>
          {SECCIONES.map((sec, idx) => (
            <View key={idx} style={styles.seccion}>
              <Text style={styles.seccionTitulo}>{sec.titulo}</Text>

              {sec.texto ? (
                <Text style={styles.texto}>{sec.texto}</Text>
              ) : (
                sec.items.map((item, i) => (
                  <View key={i} style={styles.itemRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.itemTexto}>{item}</Text>
                  </View>
                ))
              )}
            </View>
          ))}

          {/* Decoración rosada al final */}
          <View style={styles.accentRosa} />
        </View>
      </ScrollView>
    </View>
  );
};

export default TerminosScreen;

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

  contenido: { paddingHorizontal: 16, paddingBottom: 40 },

  tituloRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    marginBottom: 2,
  },
  titulo: { fontSize: 18, fontWeight: "800", color: colors.textDark, flexShrink: 1 },
  subtitulo: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textGray,
    marginBottom: 14,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  card: {
    backgroundColor: "#D9D9D9",
    borderRadius: 18,
    padding: 20,
    position: "relative",
    overflow: "hidden",
  },

  seccion: { marginBottom: 18 },
  seccionTitulo: {
    fontSize: 13,
    fontWeight: "800",
    color: "#000",
    marginBottom: 6,
  },
  texto: {
    fontSize: 13,
    color: "#111",
    lineHeight: 20,
  },
  itemRow: {
    flexDirection: "row",
    marginBottom: 5,
    gap: 6,
  },
  bullet: { fontSize: 13, color: "#111", lineHeight: 20 },
  itemTexto: { flex: 1, fontSize: 13, color: "#111", lineHeight: 20 },

  accentRosa: {
    position: "absolute",
    bottom: 14,
    right: 14,
    width: 90,
    height: 24,
    backgroundColor: "#F9A8D4",
    borderRadius: 6,
  },
});
