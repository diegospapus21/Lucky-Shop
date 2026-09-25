/**
 * AjustesScreen.jsx
 * Pantalla de "Ajustes de cuenta". Permite al cliente editar su información
 * personal (nombre, apellido, teléfono, correo) mediante el endpoint
 * PUT /api/perfilCliente. Replica la lógica del formulario de Perfil.jsx web.
 * Carga los datos actuales al montar y los pre-rellena en los campos.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import Logo from "../../components/Logo";
import CustomInput from "../../components/CustomInput";
import CustomButton from "../../components/CustomButton";
import AlertModal from "../../components/AlertModal";
import Icon from "../../components/Icon";
import { apiFetch } from "../../api/apiClient";
import { endpoints } from "../../api/apiConfig";
import { useAuth } from "../../context/AuthContext";
import { guardarUsuario } from "../../utils/storage";
import { colors } from "../../theme/colors";

const AjustesScreen = ({ navigation }) => {
  const { setCliente } = useAuth();

  const [nombre,    setNombre]    = useState("");
  const [apellido,  setApellido]  = useState("");
  const [telefono,  setTelefono]  = useState("");
  const [correo,    setCorreo]    = useState("");

  const [cargando,  setCargando]  = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [alerta,    setAlerta]    = useState(null); // { tipo, titulo, mensaje }

  // Carga el perfil actual y pre-rellena los campos (igual que Perfil.jsx web)
  const cargarPerfil = useCallback(async () => {
    setCargando(true);
    try {
      const res  = await apiFetch(endpoints.perfil);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo cargar el perfil");
      setNombre(data.name        || "");
      setApellido(data.lastName  || "");
      setTelefono(data.phone     || "");
      setCorreo(data.email       || "");
    } catch (err) {
      setAlerta({ tipo: "error", titulo: "Error", mensaje: err.message });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarPerfil();
  }, [cargarPerfil]);

  // Validaciones básicas del lado cliente (espejo del backend)
  const validar = () => {
    if (!nombre.trim()) {
      setAlerta({ tipo: "error", titulo: "Campo requerido", mensaje: "El nombre es obligatorio." });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (correo && !emailRegex.test(correo.trim())) {
      setAlerta({ tipo: "error", titulo: "Correo inválido", mensaje: "Ingresa un correo válido." });
      return false;
    }
    if (telefono && !/^[0-9+\-\s]{7,15}$/.test(telefono.trim())) {
      setAlerta({ tipo: "error", titulo: "Teléfono inválido", mensaje: "Ingresa un teléfono válido (7-15 dígitos)." });
      return false;
    }
    return true;
  };

  // Envía los datos actualizados al backend (PUT /api/perfilCliente)
  const guardarCambios = async () => {
    if (!validar()) return;
    setGuardando(true);
    try {
      const body = {
        name:     nombre.trim(),
        lastName: apellido.trim(),
        phone:    telefono.trim(),
        email:    correo.trim().toLowerCase(),
      };
      const res  = await apiFetch(endpoints.perfil, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo actualizar el perfil");

      // Actualiza el contexto y el caché local con los datos frescos
      if (data.cliente) {
        setCliente(data.cliente);
        await guardarUsuario(data.cliente);
      }
      setAlerta({
        tipo: "success",
        titulo: "¡Cambios guardados!",
        mensaje: "Tu información fue actualizada correctamente.",
      });
    } catch (err) {
      setAlerta({ tipo: "error", titulo: "Error", mensaje: err.message });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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
          keyboardShouldPersistTaps="handled"
        >
          {/* Título */}
          <View style={styles.tituloRow}>
            <Icon name="create" size={22} color={colors.greenLogo} />
            <Text style={styles.titulo}>Ajustes de cuenta</Text>
          </View>

          {cargando ? (
            <View style={styles.cargandoWrap}>
              <Text style={styles.cargandoTexto}>Cargando datos...</Text>
            </View>
          ) : (
            <>
              {/* Sección: Información personal */}
              <View style={styles.seccion}>
                <Text style={styles.seccionTitulo}>Información personal</Text>

                <CustomInput
                  label="Nombre *"
                  icon="person-outline"
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Tu nombre"
                  autoCapitalize="words"
                />
                <CustomInput
                  label="Apellido"
                  icon="person-outline"
                  value={apellido}
                  onChangeText={setApellido}
                  placeholder="Tu apellido"
                  autoCapitalize="words"
                />
                <CustomInput
                  label="Correo electrónico *"
                  icon="mail-outline"
                  value={correo}
                  onChangeText={setCorreo}
                  placeholder="tu@correo.com"
                  keyboardType="email-address"
                />
                <CustomInput
                  label="Teléfono"
                  icon="call-outline"
                  value={telefono}
                  onChangeText={setTelefono}
                  placeholder="+503 0000-0000"
                  keyboardType="phone-pad"
                />
              </View>

              {/* Botón guardar */}
              <View style={styles.botonWrap}>
                <CustomButton
                  title="Guardar cambios"
                  icon="checkmark-outline"
                  variant="darkGreen"
                  loading={guardando}
                  onPress={guardarCambios}
                />
              </View>
            </>
          )}
        </ScrollView>

        {/* AlertModal para éxito / error */}
        {alerta && (
          <AlertModal
            visible={!!alerta}
            tipo={alerta.tipo}
            titulo={alerta.titulo}
            mensaje={alerta.mensaje}
            textoBoton="Entendido"
            onAccion={() => setAlerta(null)}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default AjustesScreen;

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

  contenido: { paddingHorizontal: 20, paddingBottom: 40 },

  tituloRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    marginBottom: 20,
  },
  titulo: { fontSize: 20, fontWeight: "800", color: colors.textDark },

  cargandoWrap: { paddingVertical: 40, alignItems: "center" },
  cargandoTexto: { color: colors.textGray, fontSize: 14 },

  seccion: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
  },
  seccionTitulo: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textGray,
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  botonWrap: { marginTop: 4 },
});
