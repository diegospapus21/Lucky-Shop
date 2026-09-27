import { useState, useEffect, useRef, useCallback } from "react";
import { useNotificaciones } from "../hooks/useNotificaciones";
import "./ToastNotificaciones.css";

const STORAGE_KEY_PUSH = "notif-push-mostradas";

function obtenerMostradas() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PUSH);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function guardarMostradas(ids) {
  try {
    localStorage.setItem(STORAGE_KEY_PUSH, JSON.stringify(ids));
  } catch { /* ignore */ }
}

// Contexto de audio singleton para manejar Autoplay policy de navegadores
let audioCtxSingleton = null;

function obtenerContextoAudio() {
  if (!audioCtxSingleton && typeof window !== "undefined") {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioCtxSingleton = new AudioCtx();
    }
  }
  if (audioCtxSingleton && audioCtxSingleton.state === "suspended") {
    audioCtxSingleton.resume().catch(() => {});
  }
  return audioCtxSingleton;
}

// Emite un sonido de notificación claro y fuerte (doble tono ding-dong)
function reproducirSonido() {
  try {
    const ctx = obtenerContextoAudio();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().then(() => emitirDingDong(ctx)).catch(() => {});
    } else {
      emitirDingDong(ctx);
    }
  } catch (err) {
    console.error("Error al reproducir audio:", err);
  }
}

function emitirDingDong(ctx) {
  const ahora = ctx.currentTime;

  // Tono 1 (Ding - 659.25 Hz)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(659.25, ahora);
  gain1.gain.setValueAtTime(1.0, ahora);
  gain1.gain.exponentialRampToValueAtTime(0.001, ahora + 0.3);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(ahora);
  osc1.stop(ahora + 0.3);

  // Tono 2 (Dong - 880 Hz)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(880, ahora + 0.15);
  gain2.gain.setValueAtTime(1.0, ahora + 0.15);
  gain2.gain.exponentialRampToValueAtTime(0.001, ahora + 0.6);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(ahora + 0.15);
  osc2.stop(ahora + 0.6);
}

// Envía una notificación nativa del sistema operativo (escritorio Windows/Mac)
function enviarNotificacionNativa(titulo, descripcion) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    try {
      const notif = new Notification(titulo, {
        body: descripcion,
        requireInteraction: true, // Mantiene la notificación visible en el escritorio de Windows
        renotify: true,
        tag: `luckyshop-${Date.now()}`,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (err) {
      console.error("Error al emitir notificación de escritorio:", err);
    }
  }
}

export default function ToastNotificaciones() {
  const { notificaciones } = useNotificaciones(true);
  const [toasts, setToasts] = useState([]);
  const [permisoEstado, setPermisoEstado] = useState(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "denied"
  );
  const mostradas = useRef(obtenerMostradas());
  const primeraVez = useRef(true);

  // Desbloquear contexto de audio en la primera interacción del usuario en la página (Autoplay policy)
  useEffect(() => {
    const desbloquear = () => {
      obtenerContextoAudio();
    };
    window.addEventListener("click", desbloquear);
    window.addEventListener("keydown", desbloquear);
    return () => {
      window.removeEventListener("click", desbloquear);
      window.removeEventListener("keydown", desbloquear);
    };
  }, []);

  // Solicitar permiso de notificaciones nativas al usuario
  const solicitarPermisoManual = async () => {
    // Activa y desbloquea el audio de inmediato al hacer clic en el botón
    obtenerContextoAudio();

    if (!("Notification" in window)) {
      alert("Tu navegador no soporta notificaciones de escritorio.");
      return;
    }
    try {
      const res = await Notification.requestPermission();
      setPermisoEstado(res);
      if (res === "granted") {
        enviarNotificacionNativa(
          "¡Notificaciones activadas!",
          "Recibirás alertas en el escritorio cuando caiga una venta o se responda un video."
        );
        reproducirSonido();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const probarSonidoManual = () => {
    obtenerContextoAudio();
    reproducirSonido();
  };

  // Escuchar y procesar notificaciones entrantes
  useEffect(() => {
    if (!notificaciones || notificaciones.length === 0) return;

    const notifsReales = notificaciones.filter((n) => n.id !== "exito-total");
    if (notifsReales.length === 0) return;

    // En la primera carga registramos las existentes para evitar spam masivo de popups
    if (primeraVez.current) {
      primeraVez.current = false;
      const idsActuales = notifsReales.map((n) => n.id);
      mostradas.current = idsActuales;
      guardarMostradas(idsActuales);
      return;
    }

    const nuevas = notifsReales.filter((n) => !mostradas.current.includes(n.id));
    if (nuevas.length === 0) return;

    // Registrar como mostradas
    const idsActuales = notifsReales.map((n) => n.id);
    mostradas.current = [...new Set([...idsActuales, ...nuevas.map((n) => n.id)])];
    guardarMostradas(mostradas.current);

    // Reproducir sonido
    reproducirSonido();

    // Agregar toasts dentro de la web
    const nuevosToasts = nuevas.map((n) => ({
      ...n,
      toastId: `${n.id}-${Date.now()}`,
    }));
    setToasts((prev) => [...prev, ...nuevosToasts]);

    // Enviar notificaciones nativas al escritorio del SO
    nuevas.forEach((n) => {
      enviarNotificacionNativa(n.titulo, n.descripcion);
    });
  }, [notificaciones]);

  // Cierre automático de toasts
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 6000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const cerrarToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  }, []);

  return (
    <div className="toast-contenedor">
      {/* Botón flotante para activar notificaciones de escritorio si aún no se han concedido */}
      {permisoEstado === "default" && (
        <div className="toast-permiso-box">
          <p className="toast-permiso-texto">
            Activa las notificaciones de escritorio para recibir alertas de Windows
          </p>
          <div className="toast-permiso-acciones">
            <button className="toast-permiso-btn" onClick={solicitarPermisoManual}>
              Activar notificaciones de escritorio
            </button>
            <button className="toast-probar-btn" onClick={probarSonidoManual} title="Probar sonido">
              🔊 Probar sonido
            </button>
          </div>
        </div>
      )}

      {/* Toasts visuales flotantes */}
      {toasts.map((t) => (
        <div key={t.toastId} className={`toast-item toast-${t.tipo}`}>
          <div className="toast-barra" />
          <div className="toast-cuerpo">
            <p className="toast-titulo">{t.titulo}</p>
            <p className="toast-desc">{t.descripcion}</p>
          </div>
          <button
            className="toast-cerrar"
            onClick={() => cerrarToast(t.toastId)}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
