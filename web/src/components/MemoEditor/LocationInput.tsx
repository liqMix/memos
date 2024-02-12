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
    if (props.locationName === "") {
      onChange(initialLocationName);
    };
  };

  return (
    <div className="bg-inherit mr-1 dark:text-gray-300">
      {!focused && <span onClick={() => setFocused(true)}>{locationName}</span>}
      {focused && <input className="bg-transparent" type="text" value={locationName} onChange={(e) => onChange(e.target.value)} onBlur={onBlur}/>}
    </div>
  );
};

export default LocationInput;