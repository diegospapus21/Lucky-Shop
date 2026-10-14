import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// Un solo valor controla el tamaño de todo: porcentaje del ancho de la pantalla que ocupa el trébol.
// 0.28 = tamaño actual (grande). Bájalo a 0.24 para más pequeño o súbelo a 0.30 como máximo.
const ESCALA = 0.28;

// Medidas derivadas (todo mantiene su proporción)
const TREBOL_SIZE = width * ESCALA;
const LOGO_WIDTH = TREBOL_SIZE * 1.95;
const LOGO_HEIGHT = TREBOL_SIZE * 0.54;
// Espacio entre el trébol y el texto cuando ya salió.
// Si la imagen del logo tiene margen transparente y se ve lejos, usa un valor negativo (ej. -8)
const GAP = 0;

// Ancho total del conjunto trébol + espacio + texto
const TOTAL_WIDTH = TREBOL_SIZE + GAP + LOGO_WIDTH;

// Posición del texto dentro de la ventana de recorte (a la derecha del trébol)
const TEXTO_LEFT = TREBOL_SIZE / 2 + GAP;

// Cuánto hay que correr el conjunto a la derecha para que el trébol empiece en el centro
const DESPLAZAMIENTO_INICIAL = (GAP + LOGO_WIDTH) / 2;

export default function AnimatedSplash({ onFinish }) {
  const spinValue = useRef(new Animated.Value(0)).current;
  // 0 = texto escondido detrás del trébol (trébol al centro), 1 = texto afuera (trébol a la izquierda)
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

    // 2. El texto sale desde detrás del trébol, se queda un instante y vuelve a entrar
    Animated.sequence([
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
    ]).start();

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
    };
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // El conjunto empieza corrido a la derecha (trébol en el centro) y se desliza a su
  // posición final, lo que hace que el trébol se corra a la izquierda
  const conjuntoX = progreso.interpolate({
    inputRange: [0, 1],
    outputRange: [DESPLAZAMIENTO_INICIAL, 0],
  });

  // El texto viaja de izquierda a derecha dentro de la ventana de recorte:
  // en 0 está totalmente fuera de la ventana (escondido) y en 1 queda en su lugar
  const textoX = progreso.interpolate({
    inputRange: [0, 1],
    outputRange: [-(TEXTO_LEFT + LOGO_WIDTH), 0],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      <Animated.View
        style={[styles.conjunto, { transform: [{ translateX: conjuntoX }] }]}
      >
        {/* Ventana de recorte: empieza en el centro del trébol, por debajo de él.
            Solo muestra el texto a medida que sale hacia la derecha */}
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
    backgroundColor: '#FAD4DC', // Tono rosa exacto
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