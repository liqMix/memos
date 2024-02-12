import classNames from "classnames";
import Icon from "./Icon";
import useNavigateTo from "@/hooks/useNavigateTo";
import { Memo } from "@/types/proto/api/v2/memo_service";

interface Props {
  memo: Memo;
  className?: string;
}

const MemoLocationLink = (props: Props) => {
  const { memo, className } = props;
  if (!memo.location || !memo.location.name) return null;

  const navigateTo = useNavigateTo();

  return (
    <div
      className={classNames(
        `w-full flex flex-row justify-start items-start flex-wrap gap-2 text-sm leading-7 dark:text-gray-400`,
        className,
      )}
    >
      <div
        className={
          "max-w-xs flex flex-row justify-start items-center px-2 mr-2 cursor-pointer dark:text-gray-400 bg-gray-200 dark:bg-zinc-800 rounded whitespace-nowrap truncate"
        }
        onClick={() => {
            navigateTo(`/map/${memo.name}`);
        }}
      >
        <Icon.LocateIcon className="w-4 h-auto mr-1" />
        {memo.location.name}
      </div>
    </div>
  );
};

export default MemoLocationLink;
