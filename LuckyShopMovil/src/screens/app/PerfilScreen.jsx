/**
 * PerfilScreen.jsx
 * Pantalla de perfil / "Editar perfil". Muestra el avatar, el nombre y correo
 * REALES del usuario logueado (AuthContext) y una lista de accesos en tarjetas
 * (Términos, Lista de deseos, Ajustes, Videos). Abajo, el botón "Cerrar Sesión".
 */
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";

import Logo from "../../components/Logo";
import CustomButton from "../../components/CustomButton";
import AlertModal from "../../components/AlertModal";
import Icon from "../../components/Icon";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme/colors";

const PerfilScreen = ({ navigation }) => {
  const { cliente, cerrarSesion } = useAuth();
  const [confirmar, setConfirmar] = useState(false);

  const nombreCompleto = [cliente?.name, cliente?.lastName].filter(Boolean).join(" ") || "Cliente";
  const inicial = (cliente?.name || cliente?.email || "L").charAt(0).toUpperCase();

  // Opciones en tarjetas: cada una con su icono y nombre de pantalla destino.
  const opciones = [
    { icon: "card-outline",     label: "Términos y Condiciones", ruta: "Terminos"    },
    { icon: "heart-outline",    label: "Lista de deseos",        ruta: "ListaDeseos" },
    { icon: "create-outline",   label: "Ajustes de cuenta",      ruta: "Ajustes"     },
    { icon: "videocam-outline", label: "Videos",                 ruta: "Videos"      },
  ];

  return (
    <View style={styles.pantalla}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contenido}>
        <View style={styles.header}>
          <Logo size={22} mostrarSubtitulo={false} />
        </View>

        <Text style={styles.titulo}>Editar perfil</Text>

        {/* Avatar + datos */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>{inicial}</Text>
          </View>
        </View>
        <Text style={styles.nombre}>{nombreCompleto}</Text>
        <Text style={styles.correo}>{cliente?.email || "sin correo"}</Text>

        {/* Opciones en tarjetas */}
        <View style={styles.opciones}>
          {opciones.map((op) => (
            <TouchableOpacity
              key={op.label}
              style={styles.tarjeta}
              activeOpacity={0.8}
              onPress={() => op.ruta && navigation.navigate(op.ruta)}
            >
              <View style={styles.iconoCirculo}>
                <Icon name={op.icon} size={18} color={colors.greenLogo} />
              </View>
              <Text style={styles.opcionLabel}>{op.label}</Text>
              <Icon name="chevron-forward" size={20} color={colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Cerrar sesión (fijo abajo) */}
      <View style={styles.logoutWrap}>
        <CustomButton
          title="Cerrar Sesión"
          icon="log-out-outline"
          variant="darkGreen"
          onPress={() => setConfirmar(true)}
        />
      </View>

      {/* Confirmación de cierre de sesión */}
      <AlertModal
        visible={confirmar}
        tipo="info"
        titulo="¿Cerrar sesión?"
        mensaje="Tendrás que iniciar sesión de nuevo para acceder a tu cuenta."
        textoBoton="Sí, cerrar sesión"
        onAccion={() => {
          setConfirmar(false);
          cerrarSesion();
        }}
      />
    </View>
  );
};

export default PerfilScreen;

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.white },
  contenido: { paddingBottom: 20 },
  header: { alignItems: "center", paddingTop: 54, paddingBottom: 6 },
  titulo: { fontSize: 18, fontWeight: "800", color: colors.textDark, textAlign: "center", marginTop: 8 },
  avatarWrap: { alignItems: "center", marginTop: 18 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.pinkSoft,
    borderWidth: 2,
    borderColor: colors.greenSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTexto: { color: colors.magenta, fontSize: 40, fontWeight: "800" },
  nombre: { fontSize: 22, fontWeight: "800", color: colors.textDark, textAlign: "center", marginTop: 14 },
  correo: { fontSize: 14, color: colors.textGray, textAlign: "center", marginTop: 2 },
  opciones: { paddingHorizontal: 20, marginTop: 24 },
  tarjeta: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.greenSoft,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  iconoCirculo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.greenSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  opcionLabel: { flex: 1, fontSize: 15, color: colors.textDark, fontWeight: "600" },
  logoutWrap: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 6 },
});
