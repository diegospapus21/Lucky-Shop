//Pagina de Contactanos- Donde el cliente podra comunicarse con nosotros ante cualquier situacion o duda

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BotonVolver from "../components/BotonVolver.jsx";
import { useAuth } from "../context/AuthContext.jsx";

// Estilos en línea (objeto de estilos) usados en toda la página de Contáctanos
const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#fff",
    display: "flex",
    flexDirection: "column",
  },
  // Contenedor del botón para regresar al inicio
  volverWrapper: {
    padding: "24px 60px 0",
  },
  header: {
    padding: "40px 60px 10px",
    borderBottom: "10px solid #111",
    marginRight: "1000px",
    display: "inline-block",
  },
  headerTitle: {
    fontSize: "48px",
    fontWeight: "900",
    margin: 0,
    color: "#111",
    fontFamily: "'Inter', sans-serif",
    letterSpacing: "-1px",
  },
  // Línea decorativa que acompaña al encabezado, del lado derecho
  topDecorLine: {
    padding: "40px 60px 10px",
    borderBottom: "10px solid #111",
    marginLeft: "1000px",
    display: "inline-block",
  },

  contenedor: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "40px",
    padding: "60px 60px 80px",
    flex: 1,
  },
  infoSection: {
    flex: 1,
    minWidth: "280px",
    maxWidth: "400px",
  },
  mainTagline: {
    fontSize: "48px",
    fontWeight: "900",
    lineHeight: "1.2",
    color: "#111",
    marginBottom: "20px",
    fontFamily: "'Inter', sans-serif",
  },
  pinkText: {
    color: "#F472B6",
  },
  description: {
    fontSize: "20px",
    color: "#444",
    lineHeight: "1.7",
    maxWidth: "360px",
  },
  // Tarjeta rosada que contiene el formulario de contacto
  formCard: {
    flex: 1,
    minWidth: "320px",
    maxWidth: "780px",
    backgroundColor: "#F9A8D4",
    borderRadius: "24px",
    padding: "40px 36px",
    boxShadow: "0 8px 32px rgba(249,100,180,0.15)",
  },
  formTitle: {
    textAlign: "center",
    fontWeight: "800",
    fontSize: "22px",
    color: "#111",
    marginBottom: "24px",
    fontFamily: "'Inter', sans-serif",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#111",
    marginBottom: "4px",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#fff",
    fontSize: "14px",
    color: "#555",
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#fff",
    fontSize: "14px",
    color: "#444",
    outline: "none",
    boxSizing: "border-box",
    cursor: "pointer",
  },
  // Fila para colocar dos inputs lado a lado (país y teléfono)
  inputRow: {
    display: "flex",
    gap: "14px",
  },
  inputGroup: {
    marginBottom: "16px",
    flex: 1,
  },
  textarea: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#fff",
    fontSize: "14px",
    color: "#555",
    outline: "none",
    resize: "vertical",
    minHeight: "100px",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  btnWrapper: {
    display: "flex",
    justifyContent: "center",
    marginTop: "20px",
  },
  btn: {
    padding: "12px 50px",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "#fff",
    color: "#111",
    fontWeight: "700",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background 0.2s, transform 0.1s",
    boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
  },
  // Borde rojo cuando un campo tiene un error
  inputError: {
    boxShadow: "0 0 0 2px #dc2626",
  },
  // Texto de error debajo de cada campo
  errorTexto: {
    color: "#7f1d1d",
    fontSize: "12px",
    fontWeight: "600",
    marginTop: "4px",
  },
  // Contador de caracteres del mensaje
  contador: {
    fontSize: "11px",
    color: "#555",
    textAlign: "right",
    marginTop: "2px",
  },
  // Aviso verde: mensaje enviado correctamente
  alertSuccess: {
    background: "#d1fae5",
    color: "#065f46",
    borderRadius: "10px",
    padding: "10px 16px",
    marginBottom: "14px",
    fontSize: "14px",
    textAlign: "center",
  },
  // Aviso rojo: error al enviar el mensaje
  alertDanger: {
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "10px",
    padding: "10px 16px",
    marginBottom: "14px",
    fontSize: "14px",
    textAlign: "center",
  },
};

// ───── Validaciones del formulario ─────
const MAX_NOMBRE = 60;
const MAX_CORREO = 100;
const MIN_MENSAJE = 10;
const MAX_MENSAJE = 500;

// Lista de países disponibles con sus códigos de llamada y banderas
const PAISES = [
  { nombre: "El Salvador", codigo: "+503", bandera: "🇸🇻" },
  { nombre: "Guatemala", codigo: "+502", bandera: "🇬🇹" },
  { nombre: "Honduras", codigo: "+504", bandera: "🇭🇳" },
  { nombre: "Nicaragua", codigo: "+505", bandera: "🇳🇮" },
  { nombre: "Costa Rica", codigo: "+506", bandera: "🇨🇷" },
  { nombre: "Panamá", codigo: "+507", bandera: "🇵🇦" },
  { nombre: "México", codigo: "+52", bandera: "🇲🇽" },
  { nombre: "Estados Unidos", codigo: "+1", bandera: "🇺🇸" },
  { nombre: "Colombia", codigo: "+57", bandera: "🇨🇴" },
  { nombre: "Argentina", codigo: "+54", bandera: "🇦🇷" },
  { nombre: "Chile", codigo: "+56", bandera: "🇨🇱" },
  { nombre: "Perú", codigo: "+51", bandera: "🇵🇪" },
  { nombre: "Ecuador", codigo: "+593", bandera: "🇪🇨" },
  { nombre: "República Dominicana", codigo: "+1", bandera: "🇩🇴" },
  { nombre: "España", codigo: "+34", bandera: "🇪🇸" },
  { nombre: "Canadá", codigo: "+1", bandera: "🇨🇦" },
];

// Nombre: solo letras (con tildes y ñ) y espacios — se eliminan números y símbolos al escribir
const limpiarNombre = (t) =>
  t.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, "").replace(/\s{2,}/g, " ").slice(0, MAX_NOMBRE);

// Teléfono: permite +, dígitos, espacios y guiones
const limpiarTelefono = (t) => t.replace(/[^\d+\s-]/g, "").slice(0, 25);

// Correo: sin espacios
const limpiarCorreo = (t) => t.replace(/\s/g, "").slice(0, MAX_CORREO);

// Mensaje: se permiten letras, números y la puntuación normal;
// se eliminan caracteres especiales peligrosos como < > { } [ ] \ | ^ ~ ` $
const limpiarMensaje = (t) => t.replace(/[<>{}\[\]\\|^~`$]/g, "").slice(0, MAX_MENSAJE);

const LIMPIADORES = {
  nombre: limpiarNombre,
  telefono: limpiarTelefono,
  correo: limpiarCorreo,
  descripcion: limpiarMensaje,
};

// Revisa todos los campos y devuelve un objeto con el mensaje de error de cada campo inválido
const validarFormulario = ({ nombre, correo, telefono, descripcion }) => {
  const errores = {};

  const nom = nombre.trim();
  if (!nom) errores.nombre = "Ingresa tu nombre.";
  else if (nom.length < 3) errores.nombre = "El nombre debe tener al menos 3 letras.";
  else if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(\s[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/.test(nom))
    errores.nombre = "El nombre solo puede contener letras.";

  // El teléfono es opcional, pero si lo escribe debe tener al menos 7 dígitos válidos
  if (telefono && telefono.trim() !== "") {
    const soloDigitos = telefono.replace(/\D/g, "");
    const tieneSoloPrefijo = /^\+\d{1,4}\s*$/.test(telefono.trim());
    if (tieneSoloPrefijo) {
      errores.telefono = "Ingresa tu número de teléfono después del código de país.";
    } else if (soloDigitos.length < 7) {
      errores.telefono = "El teléfono debe tener un número válido.";
    }
  }

  if (!correo) errores.correo = "Ingresa tu correo.";
  else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(correo) || correo.includes(".."))
    errores.correo = "Ingresa un correo válido (ej. nombre@correo.com).";

  const msg = descripcion.trim();
  if (!msg) errores.descripcion = "Escribe tu mensaje.";
  else if (msg.length < MIN_MENSAJE)
    errores.descripcion = `El mensaje debe tener al menos ${MIN_MENSAJE} caracteres.`;
  else if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(msg))
    errores.descripcion = "El mensaje debe contener texto, no solo números o símbolos.";

  return errores;
};

// Formulario de contacto: envía los datos a Formspree (servicio externo de envío de correos)
function ContactForm() {
  const { cliente } = useAuth();
  const [paisSeleccionado, setPaisSeleccionado] = useState("El Salvador");

  // Datos escritos por el usuario en el formulario
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    telefono: "+503 ",
    descripcion: "",
  });

  // Autocompleta la información del cliente si ha iniciado sesión
  useEffect(() => {
    if (cliente) {
      const nombreCompleto = `${cliente.name || ""} ${cliente.lastName || ""}`.trim();
      let tel = (cliente.phone || "").trim();
      let paisDetectado = "El Salvador";

      if (tel) {
        if (tel.startsWith("+")) {
          const encontrado = PAISES.find((p) => tel.startsWith(p.codigo));
          if (encontrado) paisDetectado = encontrado.nombre;
        } else {
          tel = `+503 ${tel}`;
        }
      } else {
        tel = "+503 ";
      }

      setPaisSeleccionado(paisDetectado);
      setForm((prev) => ({
        ...prev,
        nombre: nombreCompleto || prev.nombre,
        correo: cliente.email || prev.correo,
        telefono: tel || prev.telefono,
      }));
    }
  }, [cliente]);

  const [tocados, setTocados] = useState({}); // Campos que el usuario ya tocó (para mostrar sus errores)
  const errores = validarFormulario(form);
  const errorDe = (campo) => (tocados[campo] ? errores[campo] : "");
  const tocar = (campo) => setTocados((prev) => ({ ...prev, [campo]: true }));

  const [enviando, setEnviando] = useState(false); // true mientras se envía el formulario
  const [mensajeEstado, setMensajeEstado] = useState({ texto: "", tipo: "" }); // Aviso de éxito o error

  // Obtiene el prefijo del país seleccionado (ej. "+503 ")
  const getPrefijoActual = () => {
    const paisObj = PAISES.find((p) => p.nombre === paisSeleccionado);
    return paisObj ? `${paisObj.codigo} ` : "+503 ";
  };

  // Maneja el cambio de país en el combo box y actualiza el prefijo del teléfono
  const handlePaisChange = (e) => {
    const nuevoPais = e.target.value;
    setPaisSeleccionado(nuevoPais);

    const paisObj = PAISES.find((p) => p.nombre === nuevoPais);
    if (paisObj) {
      const nuevoCodigo = `${paisObj.codigo} `;
      // Extrae la parte del número actual descartando el prefijo anterior
      let parteNumero = form.telefono;
      const matchPrefijo = parteNumero.match(/^\+\d{1,4}\s*/);
      if (matchPrefijo) {
        parteNumero = parteNumero.slice(matchPrefijo[0].length);
      }
      const nuevoTel = nuevoCodigo + parteNumero.replace(/[^\d\s-]/g, "").slice(0, 16);
      setForm((prev) => ({ ...prev, telefono: nuevoTel }));
    }
  };

  // Evita que el usuario borre el prefijo del país con Backspace o Delete
  const handleTelefonoKeyDown = (e) => {
    const prefijo = getPrefijoActual();
    const input = e.target;
    const { selectionStart, selectionEnd } = input;

    if (e.key === "Backspace") {
      if (selectionStart === selectionEnd && selectionStart <= prefijo.length) {
        e.preventDefault();
      } else if (selectionStart < prefijo.length) {
        e.preventDefault();
        input.setSelectionRange(prefijo.length, selectionEnd);
      }
    }

    if (e.key === "Delete") {
      if (selectionStart < prefijo.length) {
        e.preventDefault();
      }
    }
  };

  // Impide que el cursor se posicione antes del prefijo al hacer clic o focus
  const handleTelefonoFocusOrClick = (e) => {
    const prefijo = getPrefijoActual();
    if (e.target.selectionStart < prefijo.length) {
      e.target.setSelectionRange(prefijo.length, prefijo.length);
    }
  };

  // Controla la escritura del teléfono asegurando que el prefijo del país siempre se mantenga
  const handleTelefonoChange = (e) => {
    const prefijo = getPrefijoActual();
    const inputVal = e.target.value;

    let resto = "";
    if (inputVal.startsWith(prefijo)) {
      resto = inputVal.slice(prefijo.length);
    } else {
      const prefijoTrim = prefijo.trim();
      let limpio = inputVal;
      if (limpio.startsWith(prefijoTrim)) {
        limpio = limpio.slice(prefijoTrim.length);
      } else {
        limpio = limpio.replace(/^\+\d{1,4}\s*/, "");
      }
      resto = limpio;
    }

    // Permitir únicamente dígitos, espacios y guiones en el número
    const restoLimpio = resto.replace(/[^\d\s-]/g, "").slice(0, 16);

    setForm((prev) => ({
      ...prev,
      telefono: prefijo + restoLimpio,
    }));
  };

  // Actualiza los demás campos (nombre, correo, mensaje)
  const handleChange = (e) => {
    const { name, value } = e.target;
    const limpiar = LIMPIADORES[name] || ((t) => t);
    setForm({ ...form, [name]: limpiar(value) });
  };

  // Valida los campos obligatorios y envía el formulario a Formspree
  const handleSubmit = async (e) => {
    e.preventDefault();

    // No se envía nada si algún campo es inválido
    if (Object.keys(errores).length > 0) {
      setTocados({ nombre: true, correo: true, telefono: true, descripcion: true });
      setMensajeEstado({
        texto: "Revisa los campos marcados en rojo antes de enviar.",
        tipo: "danger",
      });
      return;
    }

    setEnviando(true);
    setMensajeEstado({ texto: "", tipo: "" });

    // Endpoint de Formspree: servicio externo que recibe el formulario y lo reenvía por correo
    const formspreeEndpoint = "https://formspree.io/f/mdeenrwz"; 

    try {
      const respuesta = await fetch(formspreeEndpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Nombre: form.nombre.trim(),
          Email: form.correo.trim(),
          Pais: paisSeleccionado || "No especificado",
          Telefono: form.telefono.trim(),
          Mensaje: form.descripcion.trim(),
        }),
      });

      if (respuesta.ok) {
        setMensajeEstado({
          texto: "¡Tu mensaje ha sido enviado! Te responderemos muy pronto.",
          tipo: "success",
        });
        // Restablece el formulario tras envío exitoso
        setForm({
          nombre: cliente ? `${cliente.name || ""} ${cliente.lastName || ""}`.trim() : "",
          correo: cliente ? cliente.email || "" : "",
          telefono: paisSeleccionado ? `${PAISES.find((p) => p.nombre === paisSeleccionado)?.codigo || "+503"} ` : "",
          descripcion: "",
        });
        setTocados({});
      } else {
        throw new Error("Error en la respuesta del servidor");
      }
    } catch (error) {
      console.error(error);
      setMensajeEstado({
        texto: "Ocurrió un error al enviar tu mensaje. Inténtalo de nuevo.",
        tipo: "danger",
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={styles.formCard}>
      <h2 style={styles.formTitle}>Formulario de contácto</h2>

      {/* Muestra el aviso de éxito o error, si hay uno */}
      {mensajeEstado.texto && (
        <div
          style={
            mensajeEstado.tipo === "success"
              ? styles.alertSuccess
              : styles.alertDanger
          }
        >
          {mensajeEstado.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Nombre */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Nombre</label>
          <input
            type="text"
            style={{ ...styles.input, ...(errorDe("nombre") ? styles.inputError : {}) }}
            name="nombre"
            placeholder="Alexia Reyes"
            value={form.nombre}
            onChange={handleChange}
            onBlur={() => tocar("nombre")}
            maxLength={MAX_NOMBRE}
            autoComplete="name"
          />
          {errorDe("nombre") && <p style={styles.errorTexto}>{errorDe("nombre")}</p>}
        </div>

        {/* Correo */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Correo</label>
          <input
            type="email"
            style={{ ...styles.input, ...(errorDe("correo") ? styles.inputError : {}) }}
            name="correo"
            placeholder="alexi8ye@gmail.com"
            value={form.correo}
            onChange={handleChange}
            onBlur={() => tocar("correo")}
            maxLength={MAX_CORREO}
            autoComplete="email"
          />
          {errorDe("correo") && <p style={styles.errorTexto}>{errorDe("correo")}</p>}
        </div>

        {/* Fila: País y Teléfono lado a lado */}
        <div style={styles.inputRow}>
          {/* País */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>País</label>
            <select
              style={styles.select}
              value={paisSeleccionado}
              onChange={handlePaisChange}
            >
              <option value="">Selecciona tu país</option>
              {PAISES.map((p) => (
                <option key={p.nombre} value={p.nombre}>
                  {p.bandera} {p.nombre} ({p.codigo})
                </option>
              ))}
            </select>
          </div>

          {/* Teléfono */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Teléfono</label>
            <input
              type="tel"
              inputMode="tel"
              style={{ ...styles.input, ...(errorDe("telefono") ? styles.inputError : {}) }}
              name="telefono"
              placeholder="+503 7687-0984"
              value={form.telefono}
              onChange={handleTelefonoChange}
              onKeyDown={handleTelefonoKeyDown}
              onClick={handleTelefonoFocusOrClick}
              onFocus={handleTelefonoFocusOrClick}
              onBlur={() => tocar("telefono")}
              maxLength={25}
              autoComplete="tel"
            />
            {errorDe("telefono") && <p style={styles.errorTexto}>{errorDe("telefono")}</p>}
          </div>
        </div>

        {/* Mensaje */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Mensaje</label>
          <textarea
            style={{ ...styles.textarea, ...(errorDe("descripcion") ? styles.inputError : {}) }}
            name="descripcion"
            placeholder="Hola ..."
            value={form.descripcion}
            onChange={handleChange}
            onBlur={() => tocar("descripcion")}
            maxLength={MAX_MENSAJE}
          />
          {errorDe("descripcion") && <p style={styles.errorTexto}>{errorDe("descripcion")}</p>}
          <div style={styles.contador}>{form.descripcion.length}/{MAX_MENSAJE}</div>
        </div>

        <div style={styles.btnWrapper}>
          <button
            type="submit"
            style={styles.btn}
            disabled={enviando}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#F9A8D4")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#fff")
            }
          >
            {enviando ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Página completa de "Contáctanos": encabezado, texto de presentación y el formulario
export default function ContactPage() {
  return (
    <div style={styles.page}>
      <Navbar />

      {/* Flecha para regresar al inicio */}
      <div style={styles.volverWrapper}>
        <BotonVolver />
      </div>

      {/* Encabezado con línea inferior */}
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>Contáctanos</h1>
        </div>

      {/* Línea decorativa superior derecha */}
      <div style={styles.topDecorLine}>
      </div>

      {/* Contenido principal: texto a la izquierda, formulario a la derecha */}
      <div style={styles.contenedor}>
        {/* Sección izquierda: texto de presentación */}
        <div style={styles.infoSection}>
          <h2 style={styles.mainTagline}>
            Somos tú{" "}
            <span style={styles.pinkText}>pagina de accesorios</span>{" "}
            de confianza
          </h2>
          <p style={styles.description}>
            No dudes en ponerte en contacto con nosotros para resolver cualquier
            duda, solicitar información adicional o hacernos llegar tus
            comentarios, ya que estaremos encantados de atenderte lo antes
            posible y brindarte la mejor atención personalizada.
          </p>
        </div>

        {/* Formulario de contacto */}
        <ContactForm />
      </div>

      <Footer />
    </div>
  );
}