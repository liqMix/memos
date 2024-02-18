import { Input } from "@mui/joy";
import { useState } from "react";

interface Props {
  locationName: string;
  initialLocationName: string;
  onChange: (locationName: string) => void;
}

const LocationInput = (props: Props) => {
  const { locationName, initialLocationName, onChange } = props;
  const [focused, setFocused] = useState(false);

  // If the input is empty, reset it to the initial location name.
  const onBlur = () => {
    setFocused(false);
    if (!props.locationName) {
      onChange(initialLocationName);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setFocused(false);
      onBlur();
    }
  };

  return (
    <div className="bg-inherit mr-4 dark:text-gray-300">
      {!focused && <span onClick={() => setFocused(true)}>{locationName}</span>}
      {focused && (
        <Input
          className="bg-transparent max-w-32"
          type="text"
          value={locationName}
          onKeyDown={onKeyDown}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
      )}
    </div>
  );
};

export default LocationInput;
