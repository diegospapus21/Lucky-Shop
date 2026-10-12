import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import Sidebar from "../components/SideBar";
import Nav from "../components/Nav";
import NotificacionesModal from "../components/NotificationsModal";
import { useFinanzas } from "../hooks/useFinanzas";
import ModalRegistrarGasto from "../components/ModalRegistrarGasto";
import ModalExito from "../components/ModalExito";
import ConfirmModal from "../components/ConfirmModal";
import "../AdminShell.css";
import "./Finanzas.css";

const POR_PAGINA = 5;

const formatoMoneda = (n) => `$${Number(n).toFixed(2)}`;

export default function Finanzas() {
  const {
    cargando,
    error,
    tendencia,
    resumen,
    movimientos,
    filtroTipo,
    setFiltroTipo,
    registrarGasto,
    actualizarGasto,
    eliminarGasto,
    ultimoGastoGuardado,
    limpiarUltimoGasto,
  } = useFinanzas();

  const [modalGastoAbierto, setModalGastoAbierto] = useState(false);
  const [gastoEditando, setGastoEditando] = useState(null); // null = crear, objeto = editar
  const [modalExitoAbierto, setModalExitoAbierto] = useState(false);
  const [filaAbierta, setFilaAbierta] = useState(null);
  const [errorGasto, setErrorGasto] = useState(null);
  const [notifAbierta, setNotifAbierta] = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState(null); // { id, mensaje }
  const [paginaActual, setPaginaActual] = useState(1);

  // Al cambiar entre ganancias y gastos, vuelve a la primera página
  useEffect(() => {
    setPaginaActual(1);
    setFilaAbierta(null);
  }, [filtroTipo]);

  // Paginación de la tabla de movimientos
  const totalPaginas = Math.max(1, Math.ceil(movimientos.length / POR_PAGINA));
  const inicio = (paginaActual - 1) * POR_PAGINA;
  const movimientosPagina = movimientos.slice(inicio, inicio + POR_PAGINA);

  // Si al eliminar queda vacía la página actual, retrocede a la última disponible
  useEffect(() => {
    if (paginaActual > totalPaginas) setPaginaActual(totalPaginas);
  }, [totalPaginas, paginaActual]);

  const cambiarPagina = (nueva) => {
    setPaginaActual(nueva);
    setFilaAbierta(null);
  };

  // Abre el modal en modo "crear" (sin gasto precargado)
  const abrirNuevoGasto = () => {
    setGastoEditando(null);
    setModalGastoAbierto(true);
  };

  // Abre el modal en modo "editar", precargado con los datos del gasto seleccionado
  const abrirEditarGasto = (movimiento) => {
    setGastoEditando(movimiento.original);
    setModalGastoAbierto(true);
  };

  // Guarda el gasto (crea uno nuevo o actualiza el existente según el modo)
  const manejarGuardarGasto = async (datosGasto) => {
    try {
      setErrorGasto(null);
      if (gastoEditando) {
        await actualizarGasto(gastoEditando._id, datosGasto);
      } else {
        await registrarGasto(datosGasto);
      }
      setModalGastoAbierto(false);
      setModalExitoAbierto(true);
    } catch (err) {
      setErrorGasto(err.message);
    }
  };

  // Cierra el modal de éxito y limpia el estado relacionado al gasto recién guardado
  const cerrarModalExito = () => {
    setModalExitoAbierto(false);
    limpiarUltimoGasto();
    setGastoEditando(null);
  };

  // Abre el modal de confirmación antes de eliminar un gasto
  const pedirEliminar = (movimiento) => {
    setConfirmEliminar({
      id: movimiento.id,
      mensaje: "¿Estás segura que deseas eliminar este gasto?",
    });
  };

  // Elimina el gasto tras la confirmación del usuario
  const confirmarEliminar = async () => {
    if (!confirmEliminar) return;
    try {
      await eliminarGasto(confirmEliminar.id);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setConfirmEliminar(null);
    }
  };

  return (
    <div className="admin-shell">
      <Sidebar />
      <main className="admin-main">
        <Nav openNotifications={() => setNotifAbierta(true)} />
        <div className="finanzas-pagina">
          <h1 className="finanzas-titulo">Finanzas</h1>

          {error && <p className="finanzas-estado-error">No se pudo cargar la información financiera: {error}</p>}

          {cargando ? (
            <p className="finanzas-estado">Cargando información financiera…</p>
          ) : (
            <>
              <div className="finanzas-cuerpo-superior">
                {/* Tarjeta con la gráfica de tendencia de ingresos/gastos */}
                <div className="finanzas-tarjeta">
                  <p className="finanzas-tarjeta-titulo">Tendencia de ingresos mensuales</p>
                  <div className="finanzas-grafica">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={tendencia}>
                        <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(valor) => formatoMoneda(valor)} />
                        <Line type="monotone" dataKey="ingresos" stroke="#5aa06c" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="gastos" stroke="#e19bb0" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <button className="finanzas-boton-gasto" onClick={abrirNuevoGasto}>
                    Registrar gasto
                  </button>
                </div>

                {/* Tarjeta con el resumen numérico del período (ingresos, pérdidas, balance) */}
                <div className="finanzas-tarjeta">
                  <p className="finanzas-tarjeta-titulo" style={{ borderLeft: "none", paddingLeft: 0 }}>
                    Resumen del periodo
                  </p>
                  <div className="finanzas-resumen-linea">
                    <div>
                      <p className="finanzas-resumen-etiqueta">Ingresos totales</p>
                      <p className="finanzas-resumen-valor verde">{formatoMoneda(resumen.ingresosTotales)}</p>
                    </div>
                    <div>
                      <p className="finanzas-resumen-etiqueta">Pérdidas totales</p>
                      <p className="finanzas-resumen-valor rojo">{formatoMoneda(resumen.perdidasTotales)}</p>
                    </div>
                    <div>
                      <p className="finanzas-resumen-etiqueta">Balance total</p>
                      <p className="finanzas-resumen-valor verde">{formatoMoneda(resumen.balanceTotal)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla de movimientos (ganancias o gastos, según la pestaña) */}
              <div className="finanzas-tabla-wrap">
                <div className="finanzas-tabla-encabezado">
                  <div className="finanzas-tabs">
                    <button
                      className={`finanzas-tab ${filtroTipo === "ganancia" ? "active" : ""}`}
                      onClick={() => setFiltroTipo("ganancia")}
                    >
                      Ganancias
                    </button>
                    <button
                      className={`finanzas-tab ${filtroTipo === "gasto" ? "active" : ""}`}
                      onClick={() => setFiltroTipo("gasto")}
                    >
                      Gastos
                    </button>
                  </div>

                  {movimientos.length > 0 && (
                    <span className="finanzas-contador">
                      Mostrando {inicio + 1}–{Math.min(inicio + POR_PAGINA, movimientos.length)} de {movimientos.length}
                    </span>
                  )}
                </div>

                <table className="finanzas-tabla">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Producto</th>
                      <th>Monto</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "24px" }}>
                          No hay {filtroTipo === "gasto" ? "gastos" : "ganancias"} registrados
                        </td>
                      </tr>
                    ) : (
                      movimientosPagina.map((mov) => (
                        <FilaMovimiento
                          key={mov.id}
                          movimiento={mov}
                          abierta={filaAbierta === mov.id}
                          onToggle={() => setFilaAbierta(filaAbierta === mov.id ? null : mov.id)}
                          onEditar={() => abrirEditarGasto(mov)}
                          onEliminar={() => pedirEliminar(mov)}
                        />
                      ))
                    )}
                  </tbody>
                </table>

                {/* PAGINACIÓN */}
                {totalPaginas > 1 && (
                  <div className="finanzas-paginacion">
                    <button
                      className="finanzas-pagina-btn"
                      disabled={paginaActual === 1}
                      onClick={() => cambiarPagina(paginaActual - 1)}
                    >
                      ‹
                    </button>
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        className={`finanzas-pagina-btn ${paginaActual === n ? "active" : ""}`}
                        onClick={() => cambiarPagina(n)}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      className="finanzas-pagina-btn"
                      disabled={paginaActual === totalPaginas}
                      onClick={() => cambiarPagina(paginaActual + 1)}
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Modal para crear/editar un gasto */}
          <ModalRegistrarGasto
            abierto={modalGastoAbierto}
            gasto={gastoEditando}
            onCerrar={() => setModalGastoAbierto(false)}
            onGuardar={manejarGuardarGasto}
            error={errorGasto}
          />
          {/* Modal de confirmación tras guardar/actualizar un gasto exitosamente */}
          <ModalExito
            abierto={modalExitoAbierto}
            mensaje={
              gastoEditando
                ? "Gasto actualizado satisfactoriamente"
                : ultimoGastoGuardado
                ? `Gasto de ${formatoMoneda(ultimoGastoGuardado.cantidadGasto)} registrado satisfactoriamente`
                : "Gasto registrado satisfactoriamente"
            }
            onCerrar={cerrarModalExito}
          />
          {/* Modal de confirmación antes de eliminar un gasto */}
          <ConfirmModal
            isOpen={!!confirmEliminar}
            title="Confirmación"
            message={confirmEliminar?.mensaje}
            onConfirm={confirmarEliminar}
            onCancel={() => setConfirmEliminar(null)}
          />
        </div>
      </main>
      <NotificacionesModal abierto={notifAbierta} onCerrar={() => setNotifAbierta(false)} />
    </div>
  );
}

// Fila individual de la tabla de movimientos: si es un gasto, se puede expandir
// para mostrar acciones de editar/eliminar (las ganancias no se editan aquí)
function FilaMovimiento({ movimiento, abierta, onToggle, onEditar, onEliminar }) {
  const esGasto = movimiento.tipo === "gasto";

  return (
    <>
      <tr>
        <td>{movimiento.cliente}</td>
        <td>{movimiento.producto}</td>
        <td className={esGasto ? "finanzas-monto-gasto" : ""}>
          {esGasto ? "-" : ""}
          {formatoMoneda(movimiento.monto)}
        </td>
        <td>
          <span className="finanzas-badge">{movimiento.estado}</span>
        </td>
        <td>{movimiento.fecha ? new Date(movimiento.fecha).toLocaleDateString("es-SV") : "—"}</td>
        <td style={{ textAlign: "right" }}>
          {/* El botón de expandir solo aparece en gastos (las ganancias no tienen acciones aquí) */}
          {esGasto && (
            <button className="finanzas-boton-expandir" onClick={onToggle} aria-label="Ver más detalles">
              <IconoChevron abierta={abierta} />
            </button>
          )}
        </td>
      </tr>
      {/* Fila expandida con las acciones de editar/eliminar, solo para gastos */}
      {esGasto && abierta && (
        <tr className="finanzas-fila-detalle">
          <td colSpan={6}>
            <div className="finanzas-fila-acciones">
              <button className="finanzas-icono-accion" onClick={onEditar} aria-label="Editar gasto">
                <IconoLapiz />
                Editar gasto
              </button>
              <button className="finanzas-icono-accion eliminar" onClick={onEliminar} aria-label="Eliminar">
                <IconoBasura />
                Eliminar
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// Ícono de flecha (chevron), rota 180° cuando la fila está expandida
function IconoChevron({ abierta }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: abierta ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

// Ícono de lápiz (editar)
function IconoLapiz() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

// Ícono de basura (eliminar)
function IconoBasura() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}