import { memoServiceClient } from "@/grpcweb";
import { MemoWithLocation } from "@/types/proto/api/v2/memo_service";
import { useEffect, useState } from "react";

interface Props {
    selectedMemoId?: string;
}
// Creates a map view with a pin for each memo
const Map: React.FC<Props> = (props: Props) => {
  const { selectedMemoId } = props;
  const [mapImage, setMapImage] = useState<string>();
  const [memos, setMemos] = useState<MemoWithLocation[]>([]);

  useEffect(() => {
    // Get memos with location
    memoServiceClient.getMemosWithLocation({}).then((res) => {
        console.log({ memos: res.memos });
        setMemos(res.memos);
    });
  }, []);

  useEffect(() => {
    // Find the center of the map
    if (memos.length > 0) {
      const lat = (memos.reduce((acc, memo) => acc + (memo?.location?.latitude ?? 0), 0) / memos.length).toString();
      const lon = (memos.reduce((acc, memo) => acc + (memo?.location?.longitude ?? 0), 0) / memos.length).toString();
      console.log({ lat, lon });
      setMapImage(`https://maps.geoapify.com/v1/staticmap?style=osm-carto&width=1024&height=800&center=lonlat:${lon},${lat}&zoom=5&apiKey=14020f155b2e4dadb260e850f195e2a3`);
    }

  }, [memos]);
  return (
    <div className="w-full h-full">
      <div className="w-full h-full">
        <img
          className="w-full h-full"
          src={mapImage}
          alt="Map"
        />
        {memos.map((memo) => {
          return (
            <div
              key={memo.id}
              className="absolute"
              style={{
                left: `${memo.location?.latitude}%`,
                top: `${memo.location?.longitude}%`,
              }}
            >
              <img
                src={mapImage}
                alt="Pin"
                className="w-8 h-8"
              />
            </div>
          );
        })}
        </div>
    </div>
  );
};

export default Map;
