//Pagina de Politicas.jsx - Pagina donde se encuentran los terminos y condiciones 
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import BotonVolver from "../components/BotonVolver.jsx";
import Logo from "../assets/icons8-trébol-50.png"

// Estilos en línea usados en toda la página de Políticas
const styles = {
  pageWrapper: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#fff",
  },
  mainContainer: {
    flex: 1,
    padding: "40px 60px",
  },
  // Contenedor del botón para regresar al inicio
  volverWrapper: {
    marginBottom: "20px",
  },
  // Tarjeta gris que contiene todo el texto de los términos y condiciones
  card: {
    backgroundColor: "#D9D9D9",
    borderRadius: "16px",
    padding: "50px 60px",
    position: "relative",
  },
  headerWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "40px",
  },
  mainTitle: {
    fontSize: "42px",
    fontWeight: "500",
    color: "#000",
    margin: 0,
    fontFamily: "sans-serif",
  },
  cloverIcon: {
    width: "48px",
    height: "48px",
  },
  // Layout de dos columnas para repartir las secciones de texto
  twoCols: {
    display: "flex",
    gap: "60px",
    justifyContent: "space-between",
  },
  col: {
    flex: 1,
  },
  section: {
    marginBottom: "24px",
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#000",
    marginBottom: "6px",
    fontFamily: "sans-serif",
  },
  sectionText: {
    fontSize: "13px",
    color: "#111",
    lineHeight: "1.6",
    margin: 0,
    fontFamily: "sans-serif",
  },
  ul: {
    margin: 0,
    paddingLeft: "16px",
  },
  li: {
    fontSize: "13px",
    color: "#111",
    lineHeight: "1.6",
    marginBottom: "6px",
    fontFamily: "sans-serif",
  },
  // Decoración rosada en la esquina inferior derecha de la tarjeta
  pinkAccent: {
    position: "absolute",
    bottom: "40px",
    right: "60px",
    width: "108px",
    height: "30px",
    backgroundColor: "#F9A8D4",
  },
};

// Página de Términos y Condiciones, dividida en 8 secciones (aceptación, objeto,
// registro, productos, precios, envíos, devoluciones y responsabilidad)
export default function Politicas() {
  return (
    <div style={styles.pageWrapper}>
      <Navbar />

      <div style={styles.mainContainer}>
        {/* Flecha para regresar al inicio */}
        <div style={styles.volverWrapper}>
          <BotonVolver />
        </div>

        <div style={styles.card}>
          {/* Título principal con el ícono de trébol */}
          <div style={styles.headerWrapper}>
            <h1 style={styles.mainTitle}>Terminos y condiciones - LUCKYSHOP</h1>
            <img src={Logo} alt="" />
          </div>

          <div style={styles.twoCols}>
            {/* Columna Izquierda: secciones 1 a 4 */}
            <div style={styles.col}>
              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  1. Aceptación de los términos
                </div>
                <p style={styles.sectionText}>
                  El acceso y uso del sitio web de Luckyshop implica la
                  aceptación plena y sin reservas de los presentes Términos y
                  Condiciones. Estos regulan la relación comercial entre el
                  cliente (en adelante, "el Usuario") y Luckyshop para la
                  adquisición de piezas de joyería.
                </p>
              </div>

              <div style={styles.section}>
                <div style={styles.sectionTitle}>2. Objeto</div>
                <p style={styles.sectionText}>
                  Luckyshop es una tienda en línea dedicada a la
                  comercialización de joyería y accesorios. Nuestra plataforma
                  permite a los usuarios visualizar, seleccionar y adquirir piezas
                  exclusivas diseñadas y seleccionadas por nuestro
                  emprendimiento.
                </p>
              </div>

              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  3. Registro de usuarios y privacidad
                </div>
                <ul style={styles.ul}>
                  <li style={styles.li}>
                    Para realizar compras, el usuario deberá proporcionar
                    información veraz y actualizada (nombre, correo electrónico
                    y dirección de entrega).
                  </li>
                  <li style={styles.li}>
                    El usuario es responsable de mantener la confidencialidad de
                    su cuenta.
                  </li>
                  <li style={styles.li}>
                    Luckyshop se reserva el derecho de cancelar cuentas en caso
                    de detectar actividades sospechosas o incumplimiento de
                    estas normas.
                  </li>
                </ul>
              </div>

              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  4. Características de los productos
                </div>
                <ul style={styles.ul}>
                  <li style={styles.li}>
                    <strong>Descripción:</strong> Nos esforzamos por mostrar los
                    colores y detalles de nuestras joyas con la mayor precisión
                    posible. Sin embargo, debido a la naturaleza de los
                    materiales y la configuración de las pantallas, el producto
                    final puede variar ligeramente.
                  </li>
                  <li style={styles.li}>
                    <strong>Cuidado de la Joya:</strong> Luckyshop no se hace
                    responsable por el desgaste natural del uso, el
                    oscurecimiento de metales por el pH de la piel o el daño
                    por contacto con químicos (perfumes, cloro, etc.).
                  </li>
                </ul>
              </div>
            </div>

            {/* Columna Derecha: secciones 5 a 8 */}
            <div style={styles.col}>
              <div style={styles.section}>
                <div style={styles.sectionTitle}>5. Precios y pagos</div>
                <ul style={styles.ul}>
                  <li style={styles.li}>
                    Todos los precios están expresados en la moneda local e
                    incluyen los impuestos correspondientes.
                  </li>
                  <li style={styles.li}>
                    Los pagos se procesarán a través de pasarelas seguras.
                    Luckyshop no tiene acceso ni almacena datos de tarjetas de
                    crédito o débito de los usuarios.
                  </li>
                  <li style={styles.li}>
                    El pedido se procesará únicamente una vez confirmado el pago
                    exitoso.
                  </li>
                </ul>
              </div>

              <div style={styles.section}>
                <div style={styles.sectionTitle}>6. Envíos y entregas</div>
                <ul style={styles.ul}>
                  <li style={styles.li}>
                    <strong>Tiempos:</strong> Los tiempos de entrega estimados
                    se comunicarán al finalizar la compra. Estos pueden variar
                    según la ubicación y la logística de terceros.
                  </li>
                  <li style={styles.li}>
                    <strong>Responsabilidad:</strong> Luckyshop no se hace
                    responsable por retrasos derivados de eventos fortuitos,
                    fuerza mayor o errores en la dirección proporcionada por el
                    cliente.
                  </li>
                  <li style={styles.li}>
                    <strong>Costo:</strong> El costo de envío se calculará de
                    forma transparente antes de finalizar el pago.
                  </li>
                </ul>
              </div>

              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  7. Devoluciones y cambios
                </div>
                <ul style={styles.ul}>
                  <li style={styles.li}>
                    <strong>Garantía:</strong> Se aceptarán cambios o
                    devoluciones únicamente por defectos de fabricación
                    comprobados dentro de los primeros [X] días tras la
                    recepción (puedes definir el número de días, usualmente son
                    48h a 5 días).
                  </li>
                  <li style={styles.li}>
                    <strong>Higiene y Personalización:</strong> Por razones de
                    higiene, no se aceptan cambios ni devoluciones de
                    pendientes/aretes. Tampoco aplican devoluciones en piezas
                    personalizadas o grabadas, a menos que presenten un error
                    de fabricación.
                  </li>
                  <li style={styles.li}>
                    <strong>Estado del Producto:</strong> Para cualquier
                    cambio, la pieza debe estar sin uso, en su empaque
                    original y con su comprobante de compra.
                  </li>
                </ul>
              </div>

              <div style={styles.section}>
                <div style={styles.sectionTitle}>
                  8. Responsabilidad de la plataforma
                </div>
                <ul style={styles.ul}>
                  <li style={styles.li}>
                    Luckyshop trabaja para mantener el sitio libre de errores
                    técnicos; sin embargo, no garantiza que el servicio sea
                    ininterrumpido.
                  </li>
                  <li style={styles.li}>
                    No nos hacemos responsables por reacciones alérgicas a los
                    materiales. El cliente es responsable de leer la descripción
                    de los componentes (plata, acero, baño de oro, etc.) antes
                    de la compra.
                  </li>
                </ul>
              </div>
            </div>
          </div>

        
          
        </div>
      </div>

      <Footer />
    </div>
  );
}