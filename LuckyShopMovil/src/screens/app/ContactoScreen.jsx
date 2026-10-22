/**
 * ContactoScreen.jsx
 * Pantalla "¿Necesitas ayuda?" de la app móvil. Es el mismo formulario de
 * Contáctanos de la web (mismas validaciones y mismo envío a Formspree):
 * nombre, teléfono (opcional), correo y mensaje.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";

import Icon from "../../components/Icon";
import { colors } from "../../theme/colors";

// ───── Validaciones (iguales a las de la web) ─────
const MAX_NOMBRE = 60;
const MAX_CORREO = 100;
const TELEFONO_DIGITOS = 8; // teléfonos de El Salvador: 8 dígitos
const MIN_MENSAJE = 10;
const MAX_MENSAJE = 500;

// Endpoint de Formspree: servicio externo que recibe el formulario y lo reenvía por correo
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mvkpzygv";

// Nombre: solo letras (con tildes y ñ) y espacios
const limpiarNombre = (t) =>
  t.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, "").replace(/\s{2,}/g, " ").slice(0, MAX_NOMBRE);

// Teléfono: solo números
const limpiarTelefono = (t) => t.replace(/\D/g, "").slice(0, TELEFONO_DIGITOS);

// Correo: sin espacios
const limpiarCorreo = (t) => t.replace(/\s/g, "").slice(0, MAX_CORREO);

// Mensaje: se eliminan caracteres especiales peligrosos
const limpiarMensaje = (t) => t.replace(/[<>{}\[\]\\|^~`$]/g, "").slice(0, MAX_MENSAJE);

const LIMPIADORES = {
  nombre: limpiarNombre,
  telefono: limpiarTelefono,
  correo: limpiarCorreo,
  descripcion: limpiarMensaje,
};

// Revisa todos los campos y devuelve un objeto con el error de cada campo inválido
const validarFormulario = ({ nombre, correo, telefono, descripcion }) => {
  const errores = {};

  const nom = nombre.trim();
  if (!nom) errores.nombre = "Ingresa tu nombre.";
  else if (nom.length < 3) errores.nombre = "El nombre debe tener al menos 3 letras.";
  else if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(\s[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/.test(nom))
    errores.nombre = "El nombre solo puede contener letras.";

  // El teléfono es opcional, pero si lo escribe debe tener 8 números
  if (telefono && !new RegExp(`^\\d{${TELEFONO_DIGITOS}}$`).test(telefono))
    errores.telefono = `El teléfono debe tener ${TELEFONO_DIGITOS} números.`;

  if (!correo) errores.correo = "Ingresa tu correo.";
  else if (
    !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(correo) ||
    correo.includes("..")
  )
    errores.correo = "Ingresa un correo válido (ej. nombre@correo.com).";

  const msg = descripcion.trim();
  if (!msg) errores.descripcion = "Escribe tu mensaje.";
  else if (msg.length < MIN_MENSAJE)
    errores.descripcion = `El mensaje debe tener al menos ${MIN_MENSAJE} caracteres.`;
  else if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(msg))
    errores.descripcion = "El mensaje debe contener texto, no solo números o símbolos.";

  return errores;
};

const ContactoScreen = ({ navigation }) => {
  const [form, setForm] = useState({ nombre: "", correo: "", telefono: "", descripcion: "" });
  const [tocados, setTocados] = useState({}); // campos que el usuario ya tocó
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState({ texto: "", tipo: "" }); // éxito o error

  const errores = validarFormulario(form);
  const errorDe = (campo) => (tocados[campo] ? errores[campo] : "");
  const tocar = (campo) => setTocados((prev) => ({ ...prev, [campo]: true }));

  // Actualiza un campo "limpiando" lo que no está permitido
  const cambiar = (campo, valor) => {
    const limpiar = LIMPIADORES[campo] || ((t) => t);
    setForm((prev) => ({ ...prev, [campo]: limpiar(valor) }));
  };

  // Valida y envía el formulario a Formspree
  const enviar = async () => {
    if (Object.keys(errores).length > 0) {
      setTocados({ nombre: true, correo: true, telefono: true, descripcion: true });
      setAviso({ texto: "Revisa los campos marcados en rojo antes de enviar.", tipo: "error" });
      return;
    }

    setEnviando(true);
    setAviso({ texto: "", tipo: "" });

    try {
      const respuesta = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          Nombre: form.nombre.trim(),
          Email: form.correo.trim(),
          Telefono: form.telefono,
          Mensaje: form.descripcion.trim(),
        }),
      });

      if (!respuesta.ok) throw new Error("Error en la respuesta del servidor");

      setAviso({
        texto: "¡Tu mensaje ha sido enviado! Te responderemos muy pronto.",
        tipo: "exito",
      });
      setForm({ nombre: "", correo: "", telefono: "", descripcion: "" });
      setTocados({});
    } catch (e) {
      setAviso({ texto: "Ocurrió un error al enviar tu mensaje. Inténtalo de nuevo.", tipo: "error" });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.pantalla}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Barra superior: flecha para regresar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Icon name="arrow-back" size={24} color={colors.textDark} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.contenido}
      >
        <Text style={styles.titulo}>¿Necesitas ayuda o tienes una duda?</Text>
        <Text style={styles.subtitulo}>
          Escríbenos y te responderemos lo antes posible.
        </Text>

        {/* Aviso de éxito o error */}
        {aviso.texto ? (
          <View style={[styles.aviso, aviso.tipo === "exito" ? styles.avisoExito : styles.avisoError]}>
            <Text style={aviso.tipo === "exito" ? styles.avisoExitoTexto : styles.avisoErrorTexto}>
              {aviso.texto}
            </Text>
          </View>
        ) : null}

        {/* Nombre */}
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={[styles.input, errorDe("nombre") && styles.inputError]}
          placeholder="Alexia Reyes"
          placeholderTextColor={colors.textGray}
          value={form.nombre}
          onChangeText={(t) => cambiar("nombre", t)}
          onBlur={() => tocar("nombre")}
          maxLength={MAX_NOMBRE}
          autoComplete="name"
        />
        {errorDe("nombre") ? <Text style={styles.errorTexto}>{errorDe("nombre")}</Text> : null}

        {/* Teléfono */}
        <Text style={styles.label}>Teléfono (opcional)</Text>
        <TextInput
          style={[styles.input, errorDe("telefono") && styles.inputError]}
          placeholder="00000000"
          placeholderTextColor={colors.textGray}
          value={form.telefono}
          onChangeText={(t) => cambiar("telefono", t)}
          onBlur={() => tocar("telefono")}
          keyboardType="number-pad"
          maxLength={TELEFONO_DIGITOS}
          autoComplete="tel"
        />
        {errorDe("telefono") ? <Text style={styles.errorTexto}>{errorDe("telefono")}</Text> : null}

        {/* Correo */}
        <Text style={styles.label}>Correo</Text>
        <TextInput
          style={[styles.input, errorDe("correo") && styles.inputError]}
          placeholder="nombre@correo.com"
          placeholderTextColor={colors.textGray}
          value={form.correo}
          onChangeText={(t) => cambiar("correo", t)}
          onBlur={() => tocar("correo")}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={MAX_CORREO}
          autoComplete="email"
        />
        {errorDe("correo") ? <Text style={styles.errorTexto}>{errorDe("correo")}</Text> : null}

        {/* Mensaje */}
        <Text style={styles.label}>Mensaje</Text>
        <TextInput
          style={[styles.input, styles.textarea, errorDe("descripcion") && styles.inputError]}
          placeholder="Hola ..."
          placeholderTextColor={colors.textGray}
          value={form.descripcion}
          onChangeText={(t) => cambiar("descripcion", t)}
          onBlur={() => tocar("descripcion")}
          multiline
          textAlignVertical="top"
          maxLength={MAX_MENSAJE}
        />
        {errorDe("descripcion") ? (
          <Text style={styles.errorTexto}>{errorDe("descripcion")}</Text>
        ) : null}
        <Text style={styles.contador}>
          {form.descripcion.length}/{MAX_MENSAJE}
        </Text>

        {/* Botón enviar */}
        <TouchableOpacity
          style={[styles.boton, enviando && { opacity: 0.7 }]}
          onPress={enviar}
          disabled={enviando}
          activeOpacity={0.85}
        >
          {enviando ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.botonTexto}>Enviar</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ContactoScreen;

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
  titulo: { fontSize: 22, fontWeight: "800", color: colors.textDark, marginTop: 8 },
  subtitulo: { fontSize: 14, color: colors.textGray, marginTop: 6, marginBottom: 18 },
  label: { fontSize: 13, fontWeight: "700", color: colors.textDark, marginTop: 14, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textDark,
  },
  textarea: { minHeight: 120 },
  inputError: { borderColor: "#dc2626" },
  errorTexto: { color: "#b91c1c", fontSize: 12, fontWeight: "600", marginTop: 4 },
  contador: { fontSize: 11, color: colors.textGray, textAlign: "right", marginTop: 4 },
  aviso: { borderRadius: 12, padding: 12, marginBottom: 6 },
  avisoExito: { backgroundColor: "#d1fae5" },
  avisoError: { backgroundColor: "#fee2e2" },
  avisoExitoTexto: { color: "#065f46", fontSize: 14, textAlign: "center" },
  avisoErrorTexto: { color: "#991b1b", fontSize: 14, textAlign: "center" },
  boton: {
    backgroundColor: colors.magenta,
    borderRadius: 16,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  botonTexto: { color: colors.white, fontSize: 16, fontWeight: "800" },
});