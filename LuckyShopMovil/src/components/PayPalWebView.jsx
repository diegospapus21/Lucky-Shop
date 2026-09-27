/**
 * PayPalWebView.jsx
 * Abre la página de aprobación de PayPal dentro de un Modal con WebView.
 * Cuando PayPal redirige a la URL de retorno (pago aprobado) o de cancelación,
 * interceptamos esa navegación, cerramos el modal y avisamos a la pantalla.
 *
 * Props:
 *  - visible:     muestra u oculta el modal
 *  - url:         link de aprobación que devuelve el backend (approveUrl)
 *  - returnUrl:   URL a la que PayPal redirige al aprobar
 *  - cancelUrl:   URL a la que PayPal redirige al cancelar
 *  - onAprobado:  se llama cuando el cliente aprobó el pago
 *  - onCancelado: se llama cuando el cliente cancela o cierra el modal
 */
import React, { useRef, useEffect } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";

import Icon from "./Icon";
import { colors } from "../theme/colors";

const PayPalWebView = ({ visible, url, returnUrl, cancelUrl, onAprobado, onCancelado }) => {
  // Evita que el retorno se procese dos veces (Android puede disparar ambos eventos)
  const procesado = useRef(false);

  useEffect(() => {
    if (visible) procesado.current = false;
  }, [visible, url]);

  // Revisa cada URL a la que el WebView intenta navegar
  const revisarUrl = (destino) => {
    if (procesado.current || !destino) return true;

    if (destino.startsWith(returnUrl)) {
      procesado.current = true;
      onAprobado();
      return false; // no cargamos la página de retorno
    }
    if (destino.startsWith(cancelUrl)) {
      procesado.current = true;
      onCancelado();
      return false;
    }
    return true;
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancelado}>
      <View style={styles.pantalla}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onCancelado} hitSlop={12}>
            <Icon name="close" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.titulo}>Pagar con PayPal</Text>
          <View style={{ width: 24 }} />
        </View>

        {url ? (
          <WebView
            source={{ uri: url }}
            startInLoadingState
            renderLoading={() => (
              <ActivityIndicator style={styles.cargando} size="large" color={colors.greenLogo} />
            )}
            onShouldStartLoadWithRequest={(req) => revisarUrl(req.url)}
            onNavigationStateChange={(nav) => revisarUrl(nav.url)}
          />
        ) : null}
      </View>
    </Modal>
  );
};

export default PayPalWebView;

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.white },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titulo: { fontSize: 16, fontWeight: "700", color: colors.textDark },
  cargando: { position: "absolute", top: "45%", alignSelf: "center" },
});
