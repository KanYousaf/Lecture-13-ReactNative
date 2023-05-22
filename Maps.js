import React, { useState, useEffect } from "react";
import { Text } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import styles from "./styles";
import { SafeAreaView } from "react-native-safe-area-context";
import MapViewDirections from "react-native-maps-directions";

const API_KEY = "YOUR_API_KEY";
const URL = `https://maps.google.com/maps/api/geocode/json?key=${API_KEY}&latlng=`;

export default function WhereAmI() {
  const [address, setAddress] = useState("loading...");
  const [longitude, setLongitude] = useState();
  const [latitude, setLatitude] = useState();
  const [mapRegion, setMapRegion] = useState(null);
  const [destination, setDestination] = useState(null);
  const [polylineCoords, setPolylineCoords] = useState([]);

  useEffect(() => {
    function setPosition({ coords: { latitude, longitude } }) {
      setLongitude(longitude);
      setLatitude(latitude);
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      console.log("Latitude", latitude, " and Longitude", longitude);

      fetch(`${URL}${latitude},${longitude}`)
        .then((resp) => resp.json())
        .then(({ results }) => {
          if (results.length > 0) {
            setAddress(results[0].formatted_address);
            console.log(results);
          }
        })
        .catch((error) => {
          console.log(error.message);
        });
    }

    let watcher;

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setPosition(location);

      watcher = await Location.watchPositionAsync(
        { accuracy: Location.LocationAccuracy.Highest },
        setPosition
      );
    })();

    return () => {
      watcher?.remove();
    };
  }, []);

  useEffect(() => {
    if (destination) {
      const origin = `${latitude},${longitude}`;
      const dest = `${destination.latitude},${destination.longitude}`;
      const apiUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&key=${API_KEY}`;

      fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
          if (data.routes.length > 0) {
            const points = data.routes[0].overview_polyline.points;
            const coords = decodePolyline(points);

            setMapRegion({
              ...mapRegion,
              latitudeDelta: Math.abs(latitude - destination.latitude) * 1.2,
              longitudeDelta: Math.abs(longitude - destination.longitude) * 1.2,
            });

            setPolylineCoords(coords);
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, [destination]);

  const decodePolyline = (encoded) => {
    const poly = [];
    let index = 0,
      len = encoded.length;
    let lat = 0,
      lng = 0;

    while (index < len) {
      let b,
        shift = 0,
        result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      poly.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }

    return poly;
  };

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        style={styles.map}
        region={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        onPress={(event) => {
          const { latitude, longitude } = event.nativeEvent.coordinate;
          setDestination({ latitude, longitude });
        }}
      >
        {mapRegion && (
          <Marker
            coordinate={{
              latitude: mapRegion.latitude,
              longitude: mapRegion.longitude,
            }}
            title="You are here"
          />
        )}
        {destination && (
          <Marker
            coordinate={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            title="Destination"
          />
        )}
        {polylineCoords.length > 0 && (
          <MapViewDirections
            origin={{ latitude, longitude }}
            destination={destination}
            waypoints={polylineCoords.slice(1, -1)} // exclude origin and destination points
            apikey={API_KEY}
            strokeWidth={3}
            strokeColor="red"
            optimizeWaypoints={true}
          />
        )}
      </MapView>
      <Text style={styles.label}>Address: {address}</Text>
      <Text style={styles.label}>Latitude: {latitude}</Text>
      <Text style={styles.label}>Longitude: {longitude}</Text>
    </SafeAreaView>
  );
}
