/**
 * RegisterScreen.jsx
 * Pantalla de registro de clientes. Funciona en dos pasos manejados por el
 * custom hook useRegister:
 *   Paso 1 (formulario): nombre, correo y contraseña -> se envía el código.
 *   Paso 2 (modal PIN):   el usuario ingresa el código que llegó a su correo.
 * Al confirmar, se crea la cuenta en la base de datos y se regresa al login.
 *
 * Diseño basado en el Figma: logo, título, barra de progreso, campos, aceptación
 * de términos, botón verde oscuro y opciones sociales.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import Logo from "../../components/Logo";
import CustomInput from "../../components/CustomInput";
import CustomButton from "../../components/CustomButton";
import PinInput from "../../components/PinInput";
import Notificacion from "../../components/Notificacion";
import AlertModal from "../../components/AlertModal";
import useRegister from "../../hooks/useRegister";
import useNotificacion from "../../hooks/useNotificacion";
import { colors } from "../../theme/colors";

const RegisterScreen = ({ navigation }) => {
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  const [modalCodigo, setModalCodigo] = useState(false); // paso 2
  const [codigo, setCodigo] = useState("");
  const [exito, setExito] = useState(false);

  const { registrar, verificarCodigo, cargando } = useRegister();
  const { notificacion, mostrar, ocultar } = useNotificacion();

  // Paso 1: enviar datos y disparar el correo con el código.
  const manejarRegistro = async () => {
    if (!aceptaTerminos) {
      mostrar("Debes aceptar los términos y la política de privacidad", "error");
      return;
    }
    const resultado = await registrar({ nombreCompleto, email, password });
    if (resultado.ok) {
      setModalCodigo(true);
      mostrar("Te enviamos un código a tu correo", "success");
    } else {
      mostrar(resultado.message, "error");
    }
  };

  // Paso 2: verificar el código para crear la cuenta.
  const manejarVerificacion = async () => {
    const resultado = await verificarCodigo(codigo);
    if (resultado.ok) {
      setModalCodigo(false);
      setExito(true);
    } else {
      mostrar(resultado.message, "error");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Notificacion {...notificacion} onHide={ocultar} />

      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoWrap}>
          <Logo size={24} />
        </View>

        <Text style={styles.titulo}>Crea tu cuenta</Text>
        <Text style={styles.subtitulo}>
          Únete a la comunidad exclusiva de LuckyShop y comienza tu viaje curado.
        </Text>

        {/* Barra de progreso de 4 pasos (decorativa, como en el diseño) */}
        <View style={styles.progreso}>
          <View style={[styles.segmento, styles.segmentoActivo]} />
          <View style={styles.segmento} />
          <View style={styles.segmento} />
          <View style={styles.segmento} />
        </View>

        <View style={styles.form}>
          <CustomInput
            label="Nombre completo"
            icon=""
            value={nombreCompleto}
            onChangeText={setNombreCompleto}
            placeholder="Ej. Alex Fortune"
            autoCapitalize="words"
          />
          <CustomInput
            label="Correo electrónico"
            icon=""
            value={email}
            onChangeText={setEmail}
            placeholder="alex@ejemplo.com"
            keyboardType="email-address"
          />
          <CustomInput
            label="Contraseña"
            icon=""
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 8 caracteres"
            secure
          />

          {/* Aceptación de términos */}
          <TouchableOpacity
            style={styles.terminos}
            onPress={() => setAceptaTerminos((v) => !v)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, aceptaTerminos && styles.checkboxOn]}>
              {aceptaTerminos && <Text style={styles.check}>✓</Text>}
            </View>
            <Text style={styles.terminosTexto}>
              Acepto los <Text style={styles.link}>Términos de Servicio</Text> y la{" "}
              <Text style={styles.link}>Política de Privacidad</Text> de LuckyShop.
            </Text>
          </TouchableOpacity>

          <CustomButton
            title="Regístrate"
            icon="→"
            onPress={manejarRegistro}
            loading={cargando}
          />
        </View>

        <TouchableOpacity style={styles.login} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.loginTexto}>
            ¿Ya tienes una cuenta? <Text style={styles.link}>Inicia sesión</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Paso 2: modal para ingresar el código enviado por correo */}
      <Modal visible={modalCodigo} transparent animationType="slide">
        <View style={styles.modalFondo}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Verifica tu correo</Text>
            <Text style={styles.modalSub}>
              Ingresa el código de 6 caracteres que enviamos a {email}
            </Text>
            <PinInput value={codigo} onChange={setCodigo} />
            <View style={{ height: 12 }} />
            <CustomButton title="Confirmar" onPress={manejarVerificacion} loading={cargando} variant="pink" />
            <TouchableOpacity style={styles.cancelar} onPress={() => setModalCodigo(false)}>
              <Text style={styles.cancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Éxito: cuenta creada */}
      <AlertModal
        visible={exito}
        tipo="success"
        titulo="¡Cuenta creada!"
        mensaje="Tu cuenta fue registrada correctamente. Ahora puedes iniciar sesión."
        textoBoton="Ir a iniciar sesión"
        onAccion={() => {
          setExito(false);
          navigation.navigate("Login");
        }}
      />
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  contenido: { padding: 24, paddingTop: 50, flexGrow: 1 },
  logoWrap: { alignItems: "center", marginBottom: 14 },
  titulo: { fontSize: 26, fontWeight: "800", color: colors.textDark, textAlign: "center" },
  subtitulo: {
    fontSize: 13,
    color: colors.textGray,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 19,
    paddingHorizontal: 10,
  },
  progreso: { flexDirection: "row", marginVertical: 18 },
  segmento: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.pinkSoft,
    marginHorizontal: 3,
  },
  segmentoActivo: { backgroundColor: colors.magenta },
  form: { marginTop: 4 },
  terminos: { flexDirection: "row", alignItems: "flex-start", marginBottom: 18 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxOn: { backgroundColor: colors.magenta, borderColor: colors.magenta },
  check: { color: colors.white, fontSize: 12, fontWeight: "800" },
  terminosTexto: { flex: 1, fontSize: 12, color: colors.textGray, lineHeight: 18 },
  link: { color: colors.magenta, fontWeight: "700" },
  login: { marginTop: 24, alignItems: "center" },
  loginTexto: { color: colors.textGray, fontSize: 14 },
  // Modal PIN
  modalFondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  modalTitulo: { fontSize: 20, fontWeight: "800", color: colors.textDark, textAlign: "center" },
  modalSub: {
    fontSize: 13,
    color: colors.textGray,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 19,
  },
  cancelar: { alignItems: "center", marginTop: 14 },
  cancelarTexto: { color: colors.textGray, fontSize: 14, fontWeight: "600" },
});
