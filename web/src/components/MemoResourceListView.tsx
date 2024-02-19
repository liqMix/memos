import classNames from "classnames";
import { memo } from "react";
import { absolutifyLink } from "@/helpers/utils";
import { Resource } from "@/types/proto/api/v2/resource_service";
import { getResourceType, getResourceUrl } from "@/utils/resource";
import Icon from "./Icon";
import MemoResource from "./MemoResource";
import showPreviewImageDialog from "./PreviewImageDialog";
import SquareDiv from "./kit/SquareDiv";

const MemoResourceListView = ({ resources = [] }: { resources: Resource[] }) => {
  const mediaResources: Resource[] = [];
  const otherResources: Resource[] = [];

  resources.forEach((resource) => {
    const type = getResourceType(resource);
    if (type === "image/*" || type === "video/*") {
      mediaResources.push(resource);
      return;
    }

    otherResources.push(resource);
  });

  const handleImageClick = (imgUrl: string) => {
    const imgUrls = mediaResources
      .filter((resource) => getResourceType(resource) === "image/*")
      .map((resource) => getResourceUrl(resource));
    const index = imgUrls.findIndex((url) => url === imgUrl);
    showPreviewImageDialog(imgUrls, index);
  };

  const MediaCard = ({ resource, thumbnail }: { resource: Resource; thumbnail?: boolean }) => {
    const type = getResourceType(resource);
    const url = getResourceUrl(resource);
    const className = thumbnail ? "min-h-full" : "h-96";
    if (type === "image/*") {
      return (
        <img
          className={classNames("cursor-pointer object-cover min-w-full", className)}
          src={resource.externalLink ? url : `${url}${thumbnail ? "?thumbnail=1" : ""}`}
          onClick={() => handleImageClick(url)}
          decoding="async"
          loading="lazy"
        />
      );
    } else if (type === "video/*") {
      // Show the first frame of the video as a thumbnail.
      // Show play icon on top of the thumbnail.
      // No controls
      const props = thumbnail
        ? {
            controls: false,
            preload: "metadata",
            onClick: (event: React.MouseEvent) => {
              // force full screen
              const t = event.target as any;
              if (t.requestFullscreen) t.requestFullscreen();
              else if (t.webkitRequestFullscreen) t.webkitRequestFullscreen();
              else if (t.msRequestFullScreen) t.msRequestFullScreen();
              else if (t.mozRequestFullScreen) t.mozRequestFullScreen();
              else showPreviewImageDialog([url], 0, true);
            },
          }
        : { controls: true };
      return (
        <>
          {thumbnail && <Icon.Play fill="white" stroke="white" strokeWidth={1} style={{ scale: "350%" }} className="absolute" />}
          <video
            className={classNames("cursor-pointer min-w-full min-h-full bg-zinc-100 dark:bg-zinc-800", className)}
            preload="metadata"
            crossOrigin="anonymous"
            src={absolutifyLink(`${url}`)}
            {...props}
          />
        </>
      );
    } else {
      return <></>;
    }
  };

  const MediaList = ({ resources = [] }: { resources: Resource[] }) => {
    if (resources.length === 0) return <></>;

    if (resources.length === 1) {
      return (
        <div className="mt-2 flex justify-center items-center border dark:border-zinc-800 rounded overflow-hidden hide-scrollbar hover:shadow-md">
          <MediaCard resource={mediaResources[0]} />
        </div>
      );
    }

    const cards = resources.map((resource) => (
      <SquareDiv
        key={resource.id}
        className="flex justify-center items-center border border-4 dark:border-zinc-900 rounded overflow-hidden hide-scrollbar hover:shadow-md transition-transform duration-150 ease-in-out hover:scale-105"
      >
        <MediaCard resource={resource} thumbnail />
      </SquareDiv>
    ));

    if (resources.length === 2 || resources.length === 4) {
      return <div className="w-full mt-2 grid gap-0 grid-cols-2">{cards}</div>;
    }

    return <div className="w-full mt-2 grid gap-0 grid-cols-2 sm:grid-cols-3">{cards}</div>;
  };

  const OtherList = ({ resources = [] }: { resources: Resource[] }) => {
    if (resources.length === 0) return <></>;

    return (
      <div className="w-full flex flex-row justify-start flex-wrap mt-2">
        {otherResources.map((resource) => (
          <MemoResource key={resource.id} className="my-1 mr-2" resource={resource} />
        ))}
      </div>
    );
  };

  return (
    <>
      <MediaList resources={mediaResources} />
      <OtherList resources={otherResources} />
    </>
  );
};

export default memo(MemoResourceListView);
