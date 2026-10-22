/**
 * PromocionesScreen.jsx
 * Productos con promoción vigente (mismos datos que la web: /promociones/activas).
 * Muestra el precio rebajado, el original tachado, el % de descuento y la
 * fecha hasta cuándo dura. La flecha de la esquina regresa al Home.
 */
import React from "react";
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from "react-native";

import Loader from "../../components/Loader";
import Icon from "../../components/Icon";
import usePromociones from "../../hooks/usePromociones";
import { colors } from "../../theme/colors";

const PromocionesScreen = ({ navigation }) => {
  const { promociones, cargando, error, recargar } = usePromociones();

  // Abre el detalle del producto con el precio YA rebajado, para que el carrito
  // use el precio con descuento (igual que en la web).
  const abrir = (promo, precioFinal) => {
    navigation.navigate("ProductoDetalle", {
      producto: { ...promo.idProducto, precio: precioFinal },
    });
  };

  return (
    <View style={styles.pantalla}>
      {/* Flecha para regresar + título, juntos en una sola línea */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.volver} onPress={() => navigation.goBack()} hitSlop={12}>
          <Icon name="chevron-back" size={24} color={colors.textDark} />
          <Text style={styles.volverTexto}>Promociones</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.sub}>
          Una joya es buena, dos son mejor. Explora nuestros descuentos especiales.
        </Text>

        {/* Carga, error (con botón de reintentar), vacío o cuadrícula */}
        {cargando ? (
          <Loader texto="Cargando promociones..." />
        ) : error ? (
          <View style={styles.centro}>
            <Text style={styles.vacio}>{error}</Text>
            <TouchableOpacity onPress={recargar} style={styles.reintentar}>
              <Text style={styles.reintentarTexto}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : promociones.length === 0 ? (
          <Text style={styles.vacio}>No hay promociones vigentes por ahora.</Text>
        ) : (
          <View style={styles.grid}>
            {promociones.map((promo) => {
              // El producto viene dentro de la promoción (idProducto).
              const p = promo.idProducto;
              const uri = p.imagenPresentacion || p.imagenes?.[0] || null;

              // Precio original y precio con el descuento aplicado (2 decimales).
              const original = Number(p.precio || 0);
              const final = Math.round(original * (1 - promo.descuento / 100) * 100) / 100;

              // Fecha en que termina la promoción (en UTC para evitar desfases).
              const fin = promo.fechaFin
                ? new Date(promo.fechaFin).toLocaleDateString("es-SV", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    timeZone: "UTC",
                  })
                : null;

              return (
                <TouchableOpacity
                  key={promo._id}
                  style={styles.card}
                  activeOpacity={0.9}
                  onPress={() => abrir(promo, final)}
                >
                  <View style={styles.imagenWrap}>
                    {uri ? (
                      <Image source={{ uri }} style={styles.imagen} resizeMode="cover" />
                    ) : (
                      <View style={[styles.imagen, { backgroundColor: colors.pinkSoft }]} />
                    )}
                    {/* Etiqueta con el % de descuento */}
                    <View style={styles.badge}>
                      <Text style={styles.badgeTexto}>-{promo.descuento}%</Text>
                    </View>
                  </View>
                  <Text style={styles.nombre} numberOfLines={1}>{p.nombre}</Text>
                  {/* Precio rebajado en rosa y el original tachado */}
                  <View style={styles.precios}>
                    <Text style={styles.precioFinal}>${final.toFixed(2)}</Text>
                    <Text style={styles.precioOriginal}>${original.toFixed(2)}</Text>
                  </View>
                  {fin && <Text style={styles.vigencia}>Hasta el {fin}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

export default PromocionesScreen;

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.white },
  header: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  volver: { flexDirection: "row", alignItems: "center", gap: 6 },
  volverTexto: { fontSize: 22, fontWeight: "800", color: colors.textDark },
  sub: { fontSize: 13, color: colors.textGray, paddingHorizontal: 20, marginTop: 6, marginBottom: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: 20 },
  card: { width: "48%", marginBottom: 18 },
  imagenWrap: { borderRadius: 16, overflow: "hidden", backgroundColor: colors.surface },
  imagen: { width: "100%", height: 150 },
  // Etiqueta rosa del descuento, arriba a la izquierda de la imagen
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: colors.pink,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeTexto: { color: colors.white, fontSize: 11, fontWeight: "800" },
  nombre: { fontSize: 14, fontWeight: "700", color: colors.textDark, marginTop: 8 },
  precios: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  precioFinal: { fontSize: 15, fontWeight: "800", color: colors.pink },
  precioOriginal: { fontSize: 13, color: colors.textLight, textDecorationLine: "line-through" },
  vigencia: { fontSize: 11, color: colors.pink, marginTop: 2 },
  centro: { alignItems: "center", paddingVertical: 30 },
  vacio: { textAlign: "center", color: colors.textGray, paddingVertical: 30, paddingHorizontal: 20 },
  reintentar: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: colors.pinkSoft, borderRadius: 20 },
  reintentarTexto: { color: colors.pink, fontWeight: "700" },
});