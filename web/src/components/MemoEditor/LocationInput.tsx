import { Input } from "@mui/joy";
import classNames from "classnames";
import { useState } from "react";

interface Props {
  locationName: string;
  initialLocationName: string;
  onChange: (locationName: string) => void;
  className?: string;
}

const LocationInput = (props: Props) => {
  const { locationName, initialLocationName, onChange, className } = props;
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
    <div className={classNames("bg-inherit dark:text-gray-300", className)}>
      {!focused && (
        <div className="truncate max-w-64" onClick={() => setFocused(true)}>
          {locationName}
        </div>
      )}
      {focused && (
        <Input
          className="bg-transparent max-w-64"
          type="text"
          value={locationName}
          autoFocus={true}
          onKeyDown={onKeyDown}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
      )}
    </div>
  );
};

export default LocationInput;
