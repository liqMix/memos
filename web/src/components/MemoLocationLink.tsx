import useNavigateTo from "@/hooks/useNavigateTo";
import { Memo } from "@/types/proto/api/v2/memo_service";
import Icon from "./Icon";

interface Props {
  memo: Memo;
}

const MemoLocationLink = (props: Props) => {
  const { memo } = props;
  if (!memo.location || !memo.location.name) return null;

  const navigateTo = useNavigateTo();

  return (
    <div
      className={
        "w-full text-xs flex flex-row justify-end items-center mr-2 cursor-pointer dark:text-gray-400 bg-gray-200 dark:bg-zinc-800 truncate"
      }
      onClick={(e) => {
        e.stopPropagation();
        navigateTo(`/map/${memo.name}`);
      }}
    >
      <Icon.LocateIcon className="w-3 mr-1" />
      {memo.location.name}
    </div>
  );
};

export default MemoLocationLink;
