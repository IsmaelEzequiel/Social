import MapboxGL from "@rnmapbox/maps"

const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? ""

export function initMapbox() {
  MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN)
}
