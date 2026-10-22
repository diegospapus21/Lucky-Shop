/**
 * InicioStack.jsx
 * Stack de la pestaña "Inicio". Permite abrir el detalle de un producto, la
 * Guía de regalo y las Promociones (y desde ahí seguir navegando) manteniendo
 * visible el menú de pestañas de abajo.
 */
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/app/HomeScreen";
import ProductoDetalleScreen from "../screens/app/ProductoDetalleScreen";
import GuiaRegaloScreen from "../screens/app/GuiaRegaloScreen";
import PromocionesScreen from "../screens/app/PromocionesScreen";

const Stack = createNativeStackNavigator();

const InicioStack = () => (
  // headerShown: false oculta la barra superior; cada pantalla dibuja la suya
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="ProductoDetalle" component={ProductoDetalleScreen} />
    {/* Pantallas nuevas: se abren desde las tarjetas del Home */}
    <Stack.Screen name="GuiaRegalo" component={GuiaRegaloScreen} />
    <Stack.Screen name="Promociones" component={PromocionesScreen} />
  </Stack.Navigator>
);

export default InicioStack;