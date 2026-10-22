/**
 * TabNavigator.jsx
 * Menú de navegación principal por pestañas (Tab menu): Inicio, Categorías,
 * Carrito y Perfil. Cada pestaña usa su propio stack para poder abrir pantallas
 * internas (detalle de producto, pasarela de pago, etc.) manteniendo el tab bar.
 * El menú se adapta al área segura del teléfono (gestos o botones de Android)
 * y el contador del carrito se muestra en la pestaña "Carrito".
 */
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import InicioStack from "./InicioStack";
import CategoriasStack from "./CategoriasStack";
import CarritoStack from "./CarritoStack";
import PerfilStack from "./PerfilStack";
import Icon from "../components/Icon";
import { useCart } from "../context/CartContext";
import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator();

const ICONOS = { Inicio: "home", Categorias: "grid", Carrito: "cart", Perfil: "person" };

const TabNavigator = () => {
  // Espacio que ocupa la barra de gestos / botones del sistema abajo
  const insets = useSafeAreaInsets();
  const { totalItems } = useCart();

  // Con gestos insets.bottom > 0 y el menú sube lo justo; con botones queda igual que antes
  const paddingInferior = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.magenta,
        tabBarInactiveTintColor: colors.textGray,
        tabBarStyle: {
          height: 54 + paddingInferior,
          paddingBottom: paddingInferior,
          paddingTop: 6,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarIcon: ({ color, focused }) => (
          <Icon name={focused ? ICONOS[route.name] : `${ICONOS[route.name]}-outline`} size={22} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Inicio" component={InicioStack} />
      <Tab.Screen name="Categorias" component={CategoriasStack} options={{ title: "Categorías" }} />
      <Tab.Screen
        name="Carrito"
        component={CarritoStack}
        options={{
          // Número de productos en el carrito (se oculta si es 0)
          tabBarBadge: totalItems > 0 ? totalItems : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.magenta,
            color: colors.white,
            fontSize: 10,
            fontWeight: "800",
          },
        }}
      />
      <Tab.Screen name="Perfil" component={PerfilStack} />
    </Tab.Navigator>
  );
};

export default TabNavigator;