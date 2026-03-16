import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

const createLabelMarker = ({ label, toneClass }) =>
  L.divIcon({
    className: "map-label-icon-wrapper",
    html: `
      <div class="map-label-marker ${toneClass}">
        <span class="map-label-pill">${label}</span>
        <span class="map-label-pin"></span>
      </div>
    `,
    iconSize: [150, 54],
    iconAnchor: [75, 54],
    popupAnchor: [0, -46],
  });

const shopIcon = createLabelMarker({
  label: "Shop Location",
  toneClass: "map-label-shop",
});

const userIcon = createLabelMarker({
  label: "Your Current Location",
  toneClass: "map-label-user",
});

const mapOptions = {
  zoomControl: true,
};

function LocationMap({ shopLocation, userLocation }) {
  const center = userLocation || shopLocation;

  return (
    <MapContainer
      center={[center.latitude, center.longitude]}
      zoom={15}
      scrollWheelZoom={false}
      {...mapOptions}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={[shopLocation.latitude, shopLocation.longitude]} icon={shopIcon}>
        <Popup>Shop Location</Popup>
      </Marker>

      {userLocation ? (
        <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
          <Popup>Your Current Location</Popup>
        </Marker>
      ) : null}
    </MapContainer>
  );
}

export default LocationMap;
