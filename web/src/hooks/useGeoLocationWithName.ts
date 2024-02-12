import { useMemo, useState } from "react";
import { useGeolocation } from "react-use";
import { MemoLocation } from "@/types/proto/api/v2/memo_service";
import { resolveLocation } from "@/utils/geolocation";

// A memo hook that provides the user's geolocation and resolves it to a human-readable location name.
// Should not refetch the location name if the latitude and longitude are the same.
const useGeoLocationWithName = (): MemoLocation | undefined => {
  const location = useGeolocation();
  const [currentLocation, setCurrentLocation] = useState<string>();

  useMemo(() => {
    if (!location.loading && location.latitude && location.longitude) {
      resolveLocation(location.latitude, location.longitude).then((location) => {
        setCurrentLocation(location);
      });
    }
  }, [location]);

  if (!currentLocation || !location.latitude || !location.longitude) {
    return undefined;
  }
  return { latitude: location.latitude, longitude: location.longitude, name: currentLocation };
};

export { useGeoLocationWithName };