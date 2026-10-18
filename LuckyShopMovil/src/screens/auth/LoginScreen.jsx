/**
 * LoginScreen.jsx
 * Pantalla de inicio de sesión (FUNCIONAL). Usa el custom hook useLogin, que a
 * su vez consume el AuthContext para autenticar contra el backend real. Al
 * autenticarse correctamente, el AuthContext actualiza el estado global y el
 * navegador raíz lleva automáticamente al usuario a la app.
 *
 * Diseño basado en el Figma: logo, saludo de bienvenida, campos de correo y
 * contraseña, enlace de recuperación, botón verde oscuro y enlace a registro.
 */
import React, { useState } from "react";
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
import Notificacion from "../../components/Notificacion";
import useLogin from "../../hooks/useLogin";
import useNotificacion from "../../hooks/useNotificacion";
import { colors } from "../../theme/colors";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, cargando } = useLogin();
  const { notificacion, mostrar, ocultar } = useNotificacion();

  // Maneja el envío del formulario de login.
  const manejarLogin = async () => {
    const resultado = await login(email, password);
    if (!resultado.ok) {
      mostrar(resultado.message, "error");
    }
    // Si es exitoso no navegamos manualmente: el AuthContext cambia el estado
    // global y el AppNavigator muestra la app automáticamente.
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
          <Logo size={26} />
        </View>

        <Text style={styles.titulo}>Bienvenido de nuevo</Text>
        <Text style={styles.subtitulo}>Accede a tu colección exclusiva</Text>

        <View style={styles.form}>
          <CustomInput
            label="Correo electrónico"
            icon=""
            value={email}
            onChangeText={setEmail}
            placeholder="nombre@ejemplo.com"
            keyboardType="email-address"
          />
          <CustomInput
            label="Contraseña"
            icon=""
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secure
          />

          <TouchableOpacity
            style={styles.olvidaste}
            onPress={() => navigation.navigate("RecoveryEmail")}
          >
            <Text style={styles.olvidasteTexto}>¿Olvidaste la contraseña?</Text>
          </TouchableOpacity>

          <CustomButton title="Iniciar sesión" onPress={manejarLogin} loading={cargando} />
        </View>

        <TouchableOpacity
          style={styles.registro}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={styles.registroTexto}>
            ¿No tienes cuenta? <Text style={styles.registroLink}>Regístrate</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  contenido: { padding: 24, paddingTop: 60, flexGrow: 1 },
  logoWrap: { alignItems: "center", marginBottom: 24 },
  titulo: { fontSize: 26, fontWeight: "800", color: colors.textDark, textAlign: "center" },
  subtitulo: {
    fontSize: 14,
    color: colors.textGray,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 24,
  },
  form: { marginTop: 8 },
  olvidaste: { alignSelf: "flex-end", marginBottom: 18 },
  olvidasteTexto: { color: colors.greenLogo, fontSize: 13, fontWeight: "700" },
  registro: { marginTop: 30, alignItems: "center" },
  registroTexto: { color: colors.textGray, fontSize: 14 },
  registroLink: { color: colors.greenLogo, fontWeight: "800" },
});
