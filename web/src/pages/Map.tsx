import { Button, Option, Select } from "@mui/joy";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, AttributionControl, Polyline } from "react-leaflet";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import MemoContent from "@/components/MemoContent";
import MobileHeader from "@/components/MobileHeader";
import UserAvatar from "@/components/UserAvatar";
import { memoServiceClient } from "@/grpcweb";
import { getDateTimeString } from "@/helpers/datetime";
import { MapMemo } from "@/types/proto/api/v2/memo_service";

const DEFAULT_ZOOM = 13;
const DEFAULT_CENTER: L.LatLngExpression = {
  lat: 51.505,
  lng: -0.09,
};

type MapView = {
  center: L.LatLngExpression;
  bounds?: L.LatLngBoundsExpression;
};

interface Props {
  selectedMemoName?: string;
}

interface DropDownUser {
  id: number;
  name: string;
  avatarUrl: string;
}

// Creates a map view with a pin for each memo
const MapMarkers: React.FC<Props> = (props: Props) => {
  const { selectedMemoName } = props;
  const map = useMap();
  const [memos, setMemos] = useState<MapMemo[]>([]);
  const [selectedUser, setSelectedUser] = useState<number>(-1);
  const [markers, setMarkers] = useState<(JSX.Element | null)[]>([]);
  const [lines, setLines] = useState<(JSX.Element | null)[]>([]);
  const [mapView, setMapView] = useState<MapView>({ center: DEFAULT_CENTER });
  const [dropdownUsers, setDropdownUsers] = useState<DropDownUser[]>([]);
  const [drawLines, setDrawLines] = useState<boolean>(false);
  const [userColors, setUserColors] = useState<Map<number, string>>(new Map());
  const selectedMemoRef = useRef<L.Marker>(null);

  const createMarkers = (memos: MapMemo[]) => {
    return memos.map((memo) => {
      if (memo.location?.latitude && memo.location?.longitude) {
        const icon = L.icon({
          iconUrl: memo.avatarUrl || "/logo.webp",
          iconSize: [40, 40],
          className: "rounded-full border-2 border-white bg-white dark:bg-zinc-800 dark:border-zinc-700",
        });
        return (
          <Marker
            key={memo.name}
            ref={memo.name === selectedMemoName ? selectedMemoRef : null}
            position={[memo.location.latitude, memo.location.longitude]}
            icon={icon}
          >
            <Popup>
              <div className="cursor-pointer w-full flex flex-row justify-start items-center select-none">
                <Link to={`/u/${encodeURIComponent(memo.creatorName)}`} unstable_viewTransition>
                  <UserAvatar className="!w-10 !h-10" avatarUrl={memo?.avatarUrl} />
                </Link>
                <Link to={`/m/${encodeURIComponent(memo.name)}`} unstable_viewTransition>
                  <div className="ml-3 flex flex-col justify-start items-start gap-2">
                    <span className="text-xl leading-none text-gray-300">{memo.creatorName}</span>
                    <span className="text-sm leading-none text-gray-400">{getDateTimeString(memo.createTime)}</span>
                    <span className="text-sm leading-none text-gray-400">{memo.location.name}</span>
                  </div>
                </Link>
              </div>
              <Link to={`/m/${encodeURIComponent(memo.name)}`} unstable_viewTransition>
                <MemoContent
                  className="overflow-hidden max-h-12 !text-gray-400"
                  key={`${memo.id}`}
                  memoId={memo.id}
                  content={memo.content}
                  readonly={true}
                />
              </Link>
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
    });

    // Manually update css for popup
    const style = document.createElement("style");
    style.innerHTML = `
      .leaflet-popup-content-wrapper {
        background: rgb(24 24 27 / var(--tw-bg-opacity));
      }
      .leaflet-popup-content {
        background-color: rgb(24 24 27 / var(--tw-bg-opacity));
      }
      .leaflet-popup-tip {
        background-color: rgb(24 24 27 / var(--tw-bg-opacity));
      }
      .leaflet-popup-close-button {
        display: none;
      }
    `;
    document.head.appendChild(style);
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
        mapView.center = {
          lat: selectedMemo.location.latitude,
          lng: selectedMemo.location.longitude,
        };
      }
    }

    // If we didn't set center to selected memo's location, use center of all memos' locations
    // and set bounds to all memos' locations
    if (mapView.center === DEFAULT_CENTER) {
      const bounds = new L.LatLngBounds([]);
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

    // Identify unique users for dropdown
    // with avatar url and name
    const uniqueUsers: DropDownUser[] = [];
    memos.forEach((memo) => {
      const user = uniqueUsers.find((u) => u.id === memo.creatorId);
      if (!user) {
        uniqueUsers.push({
          id: memo.creatorId,
          name: memo.creatorName,
          avatarUrl: memo.avatarUrl,
        });
      }
    });

    setDropdownUsers(uniqueUsers);
    setMapView(mapView);
  }, [memos]);

  useEffect(() => {
    // Set user colors
    // Define color by using user's avatar color
    // Create temp canvas to display avatar from avatarUrl
    // Then calculate average color of avatar
    const setUserColor = async (userId: number) => {
      const avatarUrl = dropdownUsers.find((user) => user.id === userId)?.avatarUrl;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (context && avatarUrl) {
        const img = new Image();
        img.src = avatarUrl;
        img.onload = () => {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          context.drawImage(img, 0, 0);
          const data = context.getImageData(0, 0, img.width, img.height).data;
          let r = 0;
          let g = 0;
          let b = 0;
          for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
          }
          r = Math.floor(r / (data.length / 4));
          g = Math.floor(g / (data.length / 4));
          b = Math.floor(b / (data.length / 4));
          const color = `rgb(${r},${g},${b})`;

          setUserColors((prev) => {
            const newMap = new Map(prev);
            newMap.set(userId, color);
            return newMap;
          });
        };
      } else {
        setUserColors((prev) => {
          const newMap = new Map(prev);
          newMap.set(userId, "gray");
          return newMap;
        });
      }
    };

    for (const user of dropdownUsers) {
      setUserColor(user.id);
    }
  }, [dropdownUsers]);

  // Center and size map
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
    if (selectedMemoRef && selectedMemoRef.current) {
      selectedMemoRef.current.openPopup();
    }
  }, [markers]);

  // Filter markers by user
  useEffect(() => {
    if (!mapView) {
      return;
    }

    if (selectedUser > 0) {
      const userMemos = memos.filter((memo) => memo.creatorId === selectedUser);
      setMarkers(createMarkers(userMemos));
    } else {
      setMarkers(createMarkers(memos));
    }
  }, [selectedUser, mapView]);

  // When markers update, update lines
  useEffect(() => {
    if (memos === undefined || memos.length === 0 || markers === undefined || markers.length === 0) {
      return;
    }

    // Draw separate lines for each user
    // Divide memos by user
    const userMemos: Map<number, MapMemo[]> = new Map();
    memos.forEach((memo) => {
      if (!userMemos.has(memo.creatorId)) {
        userMemos.set(memo.creatorId, []);
      }
      userMemos.get(memo.creatorId)?.push(memo);
    });

    // Filter to selected user
    if (selectedUser > 0) {
      const userMemosArray = userMemos.get(selectedUser);
      if (userMemosArray) {
        userMemos.clear();
        userMemos.set(selectedUser, userMemosArray);
      } else {
        userMemos.clear();
      }
    }

    // Sort user memos by time
    // create time is a date
    userMemos.forEach((memos) => {
      memos.sort((a, b) => {
        if (a.createTime === undefined || b.createTime === undefined) {
          return 0;
        }
        return a.createTime.getTime() - b.createTime.getTime();
      });
    });

    const newLines: JSX.Element[] = [];
    userMemos.forEach((memos, userId) => {
      const userLines = memos
        .map((memo, index) => {
          if (index === 0) {
            return null;
          }
          const prevMemo = memos[index - 1];
          if (prevMemo.location?.latitude && prevMemo.location?.longitude && memo.location?.latitude && memo.location?.longitude) {
            return (
              <Polyline
                key={`${prevMemo.id}-${memo.id}`}
                positions={[
                  [prevMemo.location.latitude, prevMemo.location.longitude],
                  [memo.location.latitude, memo.location.longitude],
                ]}
                color={userColors.get(userId)}
                weight={3}
              />
            );
          }
          return null;
        })
        .filter((line) => line !== null) as JSX.Element[];
      newLines.push(...userLines);
    });
    setLines(newLines);
  }, [markers, userColors]);

  return (
    <div className="flex m-1 space-x-1 z-[999]">
      <Button color={drawLines ? "danger" : "success"} onClick={() => setDrawLines(!drawLines)}>
        {drawLines ? "Hide" : "Show"} Paths
      </Button>
      <Select
        className="h-10 w-12"
        onChange={(_, v) => setSelectedUser(v ?? -1)}
        value={selectedUser}
        indicator={false}
        slotProps={{
          button: { className: "justify-center" },
          listbox: {
            style: { justifyContent: "center", textAlign: "center" },
            sx: { overflow: "auto", maxHeight: 500, scrollbarWidth: 500 },
            placement: "bottom-end",
          },
        }}
        renderValue={(option) => {
          const user = dropdownUsers.find((u) => u.id === option?.value);
          if (user) {
            return <UserAvatar avatarUrl={user?.avatarUrl} />;
          }
          return <span>All</span>;
        }}
      >
        <Option key={-1} value={-1} className="flex justify-center">
          <span>All</span>
        </Option>
        {dropdownUsers.map((user) => (
          <Option key={user.id} value={user.id}>
            <UserAvatar avatarUrl={user?.avatarUrl} />
            <span className="mr-1 ml-1">{user.name}</span>
          </Option>
        ))}
      </Select>

      {markers &&
        markers.map((marker) => {
          return marker;
        })}
      {drawLines &&
        lines &&
        lines.map((line) => {
          return line;
        })}
    </div>
  );
};

// Wrapper to provide MapComponent access to leaflet-react map hooks
const MapComponent: React.FC = () => {
  const selectedMemoName = useParams<{ memoName: string }>().memoName;
  const sectionRef: React.RefObject<HTMLDivElement> = useRef(null);
  const mapRef: React.RefObject<any> = useRef(null);

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
      className="@container w-10/12 max-h-full flex flex-col justify-start items-center sm:pt-3 md:pt-6 pb-8"
      style={{ height: "100vh" }}
    >
      <MobileHeader className="px-0" />
      <MapContainer
        ref={mapRef}
        className="w-full h-full flex flex-row justify-end items-start rounded-md border-8 border-gray-200 dark:border-zinc-700"
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        attributionControl={false}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">
      OpenStreetMap</a> contributors'
        />
        <AttributionControl position="bottomright" prefix={false} />
        <MapMarkers selectedMemoName={selectedMemoName} />
      </MapContainer>
    </section>
  );
};

export default MapComponent;
