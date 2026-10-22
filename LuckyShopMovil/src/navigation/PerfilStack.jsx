/**
 * PerfilStack.jsx
 * Stack de la pestaña "Perfil". Incluye la pantalla principal y los apartados
 * que se navegan desde las opciones del perfil: Lista de deseos, Ajustes,
 * Videos, Términos y Condiciones y Contacto (ayuda).
 */
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import PerfilScreen       from "../screens/app/PerfilScreen";
import ListaDeseosScreen  from "../screens/app/ListaDeseosScreen";
import AjustesScreen      from "../screens/app/AjustesScreen";
import VideosScreen       from "../screens/app/VideosScreen";
import TerminosScreen     from "../screens/app/TerminosScreen";
import ContactoScreen     from "../screens/app/ContactoScreen";

const Stack = createNativeStackNavigator();

const PerfilStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="PerfilHome"    component={PerfilScreen} />
    <Stack.Screen name="ListaDeseos"   component={ListaDeseosScreen} />
    <Stack.Screen name="Ajustes"       component={AjustesScreen} />
    <Stack.Screen name="Videos"        component={VideosScreen} />
    <Stack.Screen name="Terminos"      component={TerminosScreen} />
    <Stack.Screen name="Contacto"      component={ContactoScreen} />
  </Stack.Navigator>
);

export default PerfilStack;