import classNames from "classnames";
import Icon from "./Icon";
import { MemoLocation } from "@/types/proto/api/v2/memo_service";

interface Props {
  location?: MemoLocation;
  className?: string;
}

const LocationLink = (props: Props) => {
    const { location, className } = props;
    if (!location) {
        return null;
    }
    return (
        <div className={classNames(
        `w-full flex flex-row justify-start items-start flex-wrap gap-2 text-sm leading-7 dark:text-gray-400`,
        className,
      )}
    >
        <div
            className={
            "max-w-xs flex flex-row justify-start items-center px-2 mr-2 cursor-pointer dark:text-gray-400 bg-gray-200 dark:bg-zinc-800 rounded whitespace-nowrap truncate hover:line-through " +
            (location ? "" : "!hidden")
            }
            onClick={() => {
                // Open google maps at location
                if (location?.latitude && location?.longitude) {
                    window.open(`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`);
                }
            }}
        >
            <Icon.LocateIcon className="w-4 h-auto mr-1" />
            {location.name}
        </div>
    </div>
  );
};

export default LocationLink;
