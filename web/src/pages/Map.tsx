import { Link } from "react-router-dom";
import { LatLngBounds, LatLngBoundsExpression, LatLngExpression, Marker as LeafletMarker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, AttributionControl } from "react-leaflet";
import { memoServiceClient } from "@/grpcweb";
import { MapMemo } from "@/types/proto/api/v2/memo_service";
import { useParams } from "react-router-dom";
import UserAvatar from "@/components/UserAvatar";
import { getDateTimeString } from "@/helpers/datetime";
import MobileHeader from "@/components/MobileHeader";
import { Select } from "@mui/joy";

const DEFAULT_ZOOM = 13;
const DEFAULT_CENTER: LatLngExpression = {
  lat: 51.505,
  lng: -0.09
};

type MapView = {
  center: LatLngExpression;
  bounds?: LatLngBoundsExpression;
}

interface Props {
  selectedMemoName?: string;
}

// Creates a map view with a pin for each memo
const MapMarkers: React.FC<Props> = (props: Props) => {
  const { selectedMemoName } = props;
  const map = useMap();
  const [memos, setMemos] = useState<MapMemo[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>();
  const [markers, setMarkers] = useState<(JSX.Element | null)[]>([]);
  const [mapView, setMapView] = useState<MapView>({ center: DEFAULT_CENTER });
  const selectedMemoRef = useRef<LeafletMarker>(null);

  const createMarkers = (memos: MapMemo[]) => {
    return memos.map((memo) => {
      if (memo.location?.latitude && memo.location?.longitude) {
        return (
          <Marker
            key={memo.name}
            ref={memo.name === selectedMemoName ? selectedMemoRef : null}
            position={[memo.location.latitude, memo.location.longitude]}
          >
            <Popup>
              <div className="mb-3">
                <Link to={`/m/${encodeURIComponent(memo.name)}`} unstable_viewTransition>
                  <span className="w-full flex flex-row justify-start items-center">
                    <UserAvatar className="!w-10 !h-10 mr-2" avatarUrl={memo?.avatarUrl} />
                    <div className="flex flex-col justify-start items-start gap-1">
                      <span className="text-lg leading-none text-gray-600 max-w-[8em] truncate dark:text-gray-400">{memo.creatorName}</span>
                      <span className="text-sm leading-none text-gray-400 select-none">{getDateTimeString(memo.createTime)}</span>
                      <span className="text-sm leading-none text-gray-400 select-none">{memo.location.name}</span>
                    </div>
                  </span>
                </Link>
              </div>
            </Popup>
          </Marker>
        );
      } else {
        return null;
      }
    });
  };

  useEffect(() => {
    // Get memos with location
    memoServiceClient.getMapMemos({}).then((res) => {
      setMemos(res.memos);
      console.log("res.memos", res.memos);
    });
  }, []);

  useEffect(() => {
    if (memos === undefined || memos.length === 0) {
      return;
    }
    
    let mapView: MapView = { center: DEFAULT_CENTER };

    // Use selected memo's location if available
    if (selectedMemoName) {
      const selectedMemo = memos.find((memo) => memo.name === selectedMemoName);
      if (selectedMemo?.location?.latitude && selectedMemo?.location?.longitude) {
        mapView.center =  {
          lat: selectedMemo.location.latitude,
          lng: selectedMemo.location.longitude
        };
      }
    }

    // If we didn't set center to selected memo's location, use center of all memos' locations
    // and set bounds to all memos' locations
    if (mapView.center === DEFAULT_CENTER) {
      const bounds = new LatLngBounds([]);
      memos.forEach((memo) => {
        if (memo.location?.latitude && memo.location?.longitude) {
          bounds.extend([memo.location.latitude, memo.location.longitude]);
        }
      });
      mapView = {
        center: {
          lat: memos.reduce((acc, memo) => acc + (memo?.location?.latitude ?? 0), 0) / memos.length,
          lng: memos.reduce((acc, memo) => acc + (memo?.location?.longitude ?? 0), 0) / memos.length,
        },
        bounds: bounds.isValid() ? bounds : undefined,
      };
    }
    
    setMapView(mapView);

  }, [memos]);

  useEffect(() => {
    if (!map || !mapView) {
      return;
    }
    map.setView(mapView.center, DEFAULT_ZOOM);
    if (mapView.bounds) {
      map.fitBounds(mapView.bounds);
    }
  }, [mapView]);

  useEffect(() => {
    console.log({ selectedMemoRef });
    if (selectedMemoRef && selectedMemoRef.current) {
      selectedMemoRef.current.openPopup();
    }
  }, [markers]);

  useEffect(() => {
    if (!mapView) {
      return;
    }

    if (selectedUser) {
      const userMemos = memos.filter((memo) => memo.creatorName === selectedUser);
      setMarkers(createMarkers(userMemos));
    } else {
      setMarkers(createMarkers(memos));
    }
  }, [selectedUser, mapView])

  return (
    <>
      <Select className="fixed" onChange={(_,v) => setSelectedUser(v)} value={selectedUser}>
        <option value="">All</option>
        {memos.map((memo) => (
          <option key={memo.creatorName} value={memo.creatorName}>
            {memo.creatorName}
          </option>
        ))}
      </Select>
      {markers &&
        markers.map((marker) => {
          return marker;
        })}
    </>
  );
};

// Wrapper to provide MapComponent access to leaflet-react map hooks
const Map: React.FC = () => {
  const selectedMemoName = useParams<{ memoName: string }>().memoName;
  console.log("selectedMemoName", selectedMemoName);

  const sectionRef: React.RefObject<HTMLDivElement> = useRef(null);
  const mapRef: React.RefObject<typeof MapContainer & { _container: HTMLDivElement }> = useRef(null);

  // It would be nice to use a proper reactive state here for style: height, but for whatever reason I couldn't get it working.
  useEffect(() => {
    function updateHeight() {
      if (sectionRef.current && mapRef.current) {
        // FIXME: Accessing _container directly like this feels incorrect. Also the ref type is wrong to give access.
        mapRef.current._container.style.height = `${sectionRef.current.offsetHeight}px`;
      }
    }
    window.addEventListener("resize", updateHeight);
    updateHeight();
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="@container w-full max-w-5xl max-h-full flex flex-col justify-start items-center sm:pt-3 md:pt-6 pb-8"
      style={{ height: "100vh" }}
    >
      <MobileHeader />
      <MapContainer ref={mapRef} className="w-full h-full" center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} attributionControl={false}>
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">
      OpenStreetMap</a> contributors'
        />
        <AttributionControl position="bottomright" prefix={false} />
        <MapMarkers selectedMemoName={selectedMemoName} />;
      </MapContainer>
    </section>
  );
};

export default Map;
