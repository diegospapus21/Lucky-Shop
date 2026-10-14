/**
 * App.js
 * Punto de entrada de la aplicación.
 * Controla el Splash Screen nativo, ejecuta la animación personalizada y
 * monta los proveedores globales y el navegador raíz.
 */
import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "./src/context/AuthContext";
import { CartProvider } from "./src/context/CartContext";
import AppNavigator from "./src/navigation/AppNavigator";
import AnimatedSplash from "./src/components/AnimatedSplash";

// Evita que el Splash Screen nativo se oculte automáticamente hasta que la app esté lista.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [listo, setListo] = useState(false);
  const [mostrarAnimacion, setMostrarAnimacion] = useState(true);

  useEffect(() => {
    const preparar = async () => {
      try {
        // Pequeña espera inicial antes de ocultar el splash nativo
        await new Promise((resolve) => setTimeout(resolve, 400));
      } finally {
        setListo(true);
        await SplashScreen.hideAsync().catch(() => {});
      }
    };
    preparar();
  }, []);

  if (!listo) return null; // El Splash nativo sigue visible.

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <CartProvider>
          <View style={styles.container}>
            {/* Si la animación está activa la muestra en overlay arriba del AppNavigator */}
            {mostrarAnimacion && (
              <AnimatedSplash onFinish={() => setMostrarAnimacion(false)} />
            )}
            <AppNavigator />
          </View>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ff3b8f",
  },
});