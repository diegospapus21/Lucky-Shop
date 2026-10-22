/**
 * AnimatedSplash.jsx
 * Splash animado: el trébol aparece al centro girando, el logo (texto) sale
 * desde detrás de él, se queda un instante y vuelve a esconderse. Al final
 * se desvanece y llama a `onFinish`.
 */
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// Porcentaje del ancho de la pantalla que ocupa el trébol.
const ESCALA = 0.28;

// ── Medidas derivadas (todo mantiene su proporción) ──
const TREBOL_SIZE = width * ESCALA;
const LOGO_HEIGHT = TREBOL_SIZE * 0.54;

// Proporción real de la imagen del logo (ancho / alto).
const PROPORCION_LOGO = 820 / 300;
const LOGO_WIDTH = LOGO_HEIGHT * PROPORCION_LOGO;

// Qué tan cerca queda el texto del trébol (antes 0.10, ahora más pegado).
// Súbelo (0.35) para acercarlo aún más; bájalo (0.20) si se monta sobre el trébol.
const ACERCAR = 0.28;
const GAP = -TREBOL_SIZE * ACERCAR;

// Ancho total del conjunto trébol + espacio + texto
const TOTAL_WIDTH = TREBOL_SIZE + GAP + LOGO_WIDTH;

// Posición del texto dentro de la ventana de recorte
const TEXTO_LEFT = TREBOL_SIZE / 2 + GAP;

// Desplazamiento para que el trébol empiece justo en el centro de la pantalla
const DESPLAZAMIENTO_INICIAL = (GAP + LOGO_WIDTH) / 2;

export default function AnimatedSplash({ onFinish }) {
  const spinValue = useRef(new Animated.Value(0)).current;
  // 0 = texto escondido detrás del trébol (trébol al centro)
  // 1 = texto afuera (trébol a la izquierda)
  const progreso = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. El trébol gira continuamente
    const giro = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    giro.start();

    // 2. El texto sale, se queda un instante y vuelve a entrar
    const secuencia = Animated.sequence([
      Animated.timing(progreso, {
        toValue: 1,
        duration: 850,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.delay(500),
      Animated.timing(progreso, {
        toValue: 0,
        duration: 700,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    secuencia.start();

    // 3. Ocultar el splash completo para dar paso a la app
    const timer = setTimeout(() => {
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }, 2500);

    return () => {
      clearTimeout(timer);
      giro.stop();
      secuencia.stop();
    };
  }, []);

  // Giro del trébol: de 0 a 360 grados
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // El conjunto se desliza a su posición final, corriendo el trébol a la izquierda
  const conjuntoX = progreso.interpolate({
    inputRange: [0, 1],
    outputRange: [DESPLAZAMIENTO_INICIAL, 0],
  });

  // El texto viaja de izquierda a derecha dentro de la ventana de recorte
  const textoX = progreso.interpolate({
    inputRange: [0, 1],
    outputRange: [-(TEXTO_LEFT + LOGO_WIDTH), 0],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      <Animated.View
        style={[styles.conjunto, { transform: [{ translateX: conjuntoX }] }]}
      >
        {/* Ventana de recorte: solo muestra el texto a medida que sale */}
        <View style={styles.ventana}>
          <Animated.Image
            source={require('../../assets/LogoNegro-removebg-preview.png')}
            style={[styles.texto, { transform: [{ translateX: textoX }] }]}
            resizeMode="contain"
          />
        </View>

        {/* Trébol por encima del texto, girando */}
        <Animated.Image
          source={require('../../assets/logoLucky_remove.png')}
          style={[styles.trebol, { transform: [{ rotate: spin }] }]}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FAD4DC',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
  },
  conjunto: {
    width: TOTAL_WIDTH,
    height: TREBOL_SIZE,
  },
  trebol: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: TREBOL_SIZE,
    height: TREBOL_SIZE,
    zIndex: 2,
  },
  ventana: {
    position: 'absolute',
    left: TREBOL_SIZE / 2,
    top: 0,
    width: TREBOL_SIZE / 2 + GAP + LOGO_WIDTH,
    height: TREBOL_SIZE,
    overflow: 'hidden',
    zIndex: 1,
  },
  texto: {
    position: 'absolute',
    left: TEXTO_LEFT,
    top: (TREBOL_SIZE - LOGO_HEIGHT) / 2,
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
  },
});