const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    sources: {
      'osm-tiles': {
        type: 'raster',
        tiles: [
          "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
        ],
        tileSize: 256,
        maxzoom: 19
      }
    },
    layers: [
      { id: 'osm-layer', type: 'raster', source: 'osm-tiles' }
    ]
  },
  center: coordinates,
  zoom: 10
});

map.addControl(new maplibregl.NavigationControl());

new maplibregl.Marker({ color: 'red' })
  .setLngLat(coordinates)
  .setPopup(new maplibregl.Popup({ offset: 25 })
    .setHTML(`<h6>${titleText}</h6><p>${locationText}</p>`))
  .addTo(map);
