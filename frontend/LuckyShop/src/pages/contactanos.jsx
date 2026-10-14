//Pagina de Contactanos- Donde el cliente podra comunicarse con nosotros ante cualquier situacion o duda

import { useState } from "react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BotonVolver from "../components/BotonVolver.jsx";

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
  // Fila para colocar dos inputs lado a lado (teléfono y correo)
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

// Formulario de contacto: envía los datos a Formspree (servicio externo de envío de correos)
function ContactForm() {
  // Datos escritos por el usuario en el formulario
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    descripcion: "",
  });

  const [enviando, setEnviando] = useState(false) // true mientras se envía el formulario
  const [mensajeEstado, setMensajeEstado] = useState({ texto: "", tipo: "" }); // Aviso de éxito o error

  // Actualiza el campo correspondiente del formulario según lo que el usuario escribe
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Valida los campos obligatorios y envía el formulario a Formspree
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nombre || !form.correo || !form.descripcion) {
      setMensajeEstado({
        texto: "Por favor, completa todos los campos obligatorios.",
        tipo: "danger",
      });
      return;
    }

    setEnviando(true);
    setMensajeEstado({ texto: "", tipo: "" });

    // Endpoint de Formspree: servicio externo que recibe el formulario y lo reenvía por correo
    const formspreeEndpoint = "https://formspree.io/f/mvkpzygv"; 

    try {
      const respuesta = await fetch(formspreeEndpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Nombre: form.nombre,
          Email: form.correo,
          Telefono: form.telefono,
          Mensaje: form.descripcion,
        }),
      });

      if (respuesta.ok) {
        setMensajeEstado({
          texto: "¡Tu mensaje ha sido enviado! Te responderemos muy pronto.",
          tipo: "success",
        });
        // Limpia el formulario tras un envío exitoso
        setForm({ nombre: "", correo: "", telefono: "", descripcion: "" });
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

      <form onSubmit={handleSubmit}>
        {/* Nombre */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Nombre</label>
          <input
            type="text"
            style={styles.input}
            name="nombre"
            placeholder="Alexia Reyes"
            value={form.nombre}
            onChange={handleChange}
            required
          />
        </div>

        {/* Teléfono y Correo en la misma fila */}
        <div style={styles.inputRow}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Teléfono</label>
            <input
              type="tel"
              style={styles.input}
              name="telefono"
              placeholder="0000 - 0000"
              value={form.telefono}
              onChange={handleChange}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Correo</label>
            <input
              type="email"
              style={styles.input}
              name="correo"
              placeholder="alexi8ye@gmail.com"
              value={form.correo}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Mensaje */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Mensaje</label>
          <textarea
            style={styles.textarea}
            name="descripcion"
            placeholder="Hola ..."
            value={form.descripcion}
            onChange={handleChange}
            required
          />
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