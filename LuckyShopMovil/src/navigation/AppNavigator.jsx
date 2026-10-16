/**
 * AppNavigator.jsx
 * Navegador RAÍZ de la aplicación. Decide qué mostrar según el estado global de
 * autenticación (AuthContext):
 *   - Mientras se valida la sesión inicial -> no se muestra nada (sigue visible
 *     el splash nativo de Expo).
 *   - Si NO hay sesión -> stack de autenticación (AuthNavigator).
 *   - Si hay sesión activa -> menú principal por pestañas (TabNavigator).
 *
 * Al cambiar el estado de autenticación (login/logout), React Navigation cambia
 * automáticamente de un navegador a otro sin que las pantallas naveguen a mano.
 */
import React from "react";
import { NavigationContainer } from "@react-navigation/native";

import AuthNavigator from "./AuthNavigator";
import TabNavigator from "./TabNavigator";
import { useAuth } from "../context/AuthContext";

const AppNavigator = () => {
  const { estaAutenticado, cargandoSesion } = useAuth();

  // Mientras se valida la sesión guardada no pintamos nada.
  if (cargandoSesion) return null;

  return (
    <NavigationContainer>
      {estaAutenticado ? <TabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;