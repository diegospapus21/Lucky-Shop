/**
 * VideosScreen.jsx
 * Pantalla de videos combo del cliente. Carga los videos desde el endpoint
 * GET /api/videosCombo/mios y permite reproducirlos en un modal nativo, y
 * responder Aceptar / Negar (PATCH /api/videosCombo/:id/status).
 * Basado fielmente en Videos.jsx de la app web.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Linking,
} from "react-native";

import Logo from "../../components/Logo";
import Icon from "../../components/Icon";
import CustomButton from "../../components/CustomButton";
import AlertModal from "../../components/AlertModal";
import { apiFetch } from "../../api/apiClient";
import { API_BASE_URL } from "../../api/apiConfig";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme/colors";

const BASE_VIDEOS = `${API_BASE_URL}/videosCombo`;

const formatFecha = (fecha) => {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const VideosScreen = ({ navigation }) => {
  const { cliente } = useAuth();

  const [videos,       setVideos]       = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [error,        setError]        = useState("");
  const [videoAbierto, setVideoAbierto] = useState(null); // combo cuyo video se reproduce
  const [procesando,   setProcesando]   = useState(null); // id del combo en acción
  const [alerta,       setAlerta]       = useState(null); // { tipo, titulo, mensaje }

  const cargarVideos = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const res  = await apiFetch(`${BASE_VIDEOS}/mios`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al obtener tus videos");
      setVideos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "No se pudieron cargar tus videos");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarVideos();
  }, [cargarVideos]);

  // Marca un combo como aceptado (true) o negado (false)
  const handleResponder = async (id, status) => {
    setProcesando(id);
    try {
      const res = await apiFetch(`${BASE_VIDEOS}/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo actualizar tu respuesta");
      setVideos((prev) => prev.map((v) => (v._id === id ? data : v)));
      setAlerta({
        tipo: "success",
        titulo: status ? "¡Combo aceptado!" : "Combo negado",
        mensaje: status
          ? "Tu respuesta fue registrada correctamente."
          : "Notificamos tu respuesta a la tienda.",
      });
    } catch (err) {
      setAlerta({ tipo: "error", titulo: "Error", mensaje: err.message });
    } finally {
      setProcesando(null);
    }
  };

  const renderItem = ({ item: combo }) => {
    const yaRespondio = combo.status === true || combo.status === false;

    return (
      <View style={styles.tarjeta}>
        {/* Miniatura / botón de reproducir */}
        <TouchableOpacity
          style={styles.videoThumb}
          onPress={() => setVideoAbierto(combo)}
          activeOpacity={0.85}
        >
          <View style={styles.playCircle}>
            <Icon name="play" size={28} color={colors.white} />
          </View>
          <Text style={styles.thumbTexto} numberOfLines={1}>
            {combo.mensaje
              ? combo.mensaje
              : `${cliente?.name || "Hola"}, tu combo está listo`}
          </Text>
        </TouchableOpacity>

        {/* Mensaje y fecha */}
        <View style={styles.info}>
          <Text style={styles.mensaje} numberOfLines={3}>
            {combo.mensaje ||
              `${cliente?.name || "Hola"} tu combo está listo, puedes ver que suerte te tocó hoy`}
          </Text>
          <Text style={styles.fecha}>{formatFecha(combo.createdAt)}</Text>
        </View>

        {/* Botones de respuesta */}
        <View style={styles.botones}>
          <TouchableOpacity
            style={[
              styles.btnRespuesta,
              combo.status === true ? styles.btnAceptadoActivo : styles.btnAceptado,
            ]}
            onPress={() => handleResponder(combo._id, true)}
            disabled={procesando === combo._id}
            activeOpacity={0.8}
          >
            <Icon
              name={combo.status === true ? "checkmark-circle" : "checkmark"}
              size={16}
              color={colors.white}
            />
            <Text style={styles.btnTexto}>
              {combo.status === true ? "Aceptado" : "Aceptar"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btnRespuesta,
              combo.status === false ? styles.btnNegadoActivo : styles.btnNegado,
            ]}
            onPress={() => handleResponder(combo._id, false)}
            disabled={procesando === combo._id}
            activeOpacity={0.8}
          >
            <Icon
              name={combo.status === false ? "close-circle" : "close"}
              size={16}
              color={colors.white}
            />
            <Text style={styles.btnTexto}>
              {combo.status === false ? "Negado" : "Negar"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Botón ver video */}
        <TouchableOpacity
          style={styles.btnVerVideo}
          onPress={() => setVideoAbierto(combo)}
          activeOpacity={0.8}
        >
          <Icon name="videocam-outline" size={16} color={colors.textDark} />
          <Text style={styles.btnVerVideoTexto}>Ver video</Text>
        </TouchableOpacity>
      </View>
    );
  };

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

      {/* Título */}
      <View style={styles.tituloRow}>
        <Icon name="videocam" size={22} color={colors.greenLogo} />
        <Text style={styles.titulo}>Videos</Text>
      </View>

      {/* Contenido */}
      {cargando ? (
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color={colors.greenLogo} />
        </View>
      ) : error ? (
        <View style={styles.centrado}>
          <Icon name="alert-circle-outline" size={40} color={colors.danger} />
          <Text style={styles.mensajeTexto}>{error}</Text>
          <TouchableOpacity onPress={cargarVideos} style={styles.reintentar}>
            <Text style={styles.reintentarTexto}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : videos.length === 0 ? (
        <View style={styles.centrado}>
          <Icon name="videocam-outline" size={52} color={colors.textLight} />
          <Text style={styles.mensajeTexto}>
            Todavía no tienes videos de combos.
          </Text>
          <Text style={styles.mensajeSubTexto}>
            Cuando la tienda te envíe uno, aparecerá aquí.
          </Text>
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.lista}
          renderItem={renderItem}
        />
      )}

      {/* Modal de reproducción del video */}
      <Modal
        visible={!!videoAbierto}
        transparent
        animationType="fade"
        onRequestClose={() => setVideoAbierto(null)}
      >
        <View style={styles.modalFondo}>
          <View style={styles.modalContenido}>
            <TouchableOpacity
              style={styles.modalCerrar}
              onPress={() => setVideoAbierto(null)}
            >
              <Icon name="close" size={22} color={colors.white} />
            </TouchableOpacity>

            {videoAbierto?.urlVideo ? (
              <View style={styles.abrirVideoWrap}>
                <Icon name="videocam-outline" size={48} color={colors.greenLogo} />
                <Text style={styles.abrirVideoTexto}>
                  Toca el botón para reproducir tu video combo
                </Text>
                <TouchableOpacity
                  style={styles.abrirVideoBtn}
                  onPress={() => {
                    Linking.openURL(videoAbierto.urlVideo);
                    setVideoAbierto(null);
                  }}
                >
                  <Icon name="play-circle" size={20} color={colors.white} />
                  <Text style={styles.abrirVideoBtnTexto}>Reproducir video</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.sinVideoWrap}>
                <Icon name="videocam-off-outline" size={40} color={colors.textLight} />
                <Text style={styles.sinVideoTexto}>Sin video disponible</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Alert de éxito / error al responder */}
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
  );
};

export default VideosScreen;

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

  tituloRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 12,
  },
  titulo: { fontSize: 20, fontWeight: "800", color: colors.textDark },

  centrado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 32,
  },
  mensajeTexto: {
    fontSize: 15,
    color: colors.textGray,
    textAlign: "center",
    fontWeight: "600",
  },
  mensajeSubTexto: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: "center",
  },
  reintentar: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.greenSoft,
    borderRadius: 20,
  },
  reintentarTexto: { color: colors.greenLogo, fontWeight: "700", fontSize: 14 },

  lista: { paddingHorizontal: 20, paddingBottom: 30, gap: 16, paddingTop: 4 },

  tarjeta: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
    gap: 10,
    backgroundColor: colors.white,
  },

  videoThumb: {
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.darkGreen,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
  },
  playCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbTexto: {
    flex: 1,
    color: colors.white,
    fontWeight: "700",
    fontSize: 14,
  },

  info: { gap: 4 },
  mensaje: { fontSize: 14, color: colors.textDark, lineHeight: 20 },
  fecha:   { fontSize: 12, color: colors.textLight },

  botones: { flexDirection: "row", gap: 10 },
  btnRespuesta: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  btnAceptado:      { backgroundColor: colors.greenLogo },
  btnAceptadoActivo:{ backgroundColor: "#166534" },
  btnNegado:        { backgroundColor: colors.danger },
  btnNegadoActivo:  { backgroundColor: "#991b1b" },
  btnTexto: { color: colors.white, fontWeight: "700", fontSize: 13 },

  btnVerVideo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnVerVideoTexto: { fontWeight: "700", fontSize: 13, color: colors.textDark },

  // Modal de reproducción
  modalFondo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.82)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalContenido: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: colors.textDark,
  },
  modalCerrar: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  videoPlayer: { width: "100%", height: 320 },
  sinVideoWrap: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 20,
  },
  sinVideoTexto: { color: colors.textLight, fontSize: 14 },

  // Bloque para abrir el video con Linking
  abrirVideoWrap: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  abrirVideoTexto: {
    color: colors.white,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  abrirVideoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.greenLogo,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  abrirVideoBtnTexto: { color: colors.white, fontWeight: "700", fontSize: 15 },
});
