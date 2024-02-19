import React, { useState } from "react";
import { generateDialog } from "./Dialog";
import "@/less/preview-image-dialog.less";

interface Props extends DialogProps {
  imgUrls: string[];
  initialIndex: number;
  isVideo?: boolean;
}

interface State {
  scale: number;
  originX: number;
  originY: number;
}

interface TouchPos {
  x: number;
  y: number;
}

const defaultState: State = {
  scale: 1,
  originX: -1,
  originY: -1,
};

const PreviewImageDialog: React.FC<Props> = ({ destroy, imgUrls, initialIndex, isVideo }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [state, setState] = useState<State>(defaultState);
  let touchPositions: TouchPos[] = [];

  const handleTouchStart = (event: React.TouchEvent) => {
    if (event.touches.length > 2) {
      // three or more fingers, ignore
      return;
    }
    // Record touch start position
    touchPositions = Array.from(event.touches).map((touch) => ({ x: touch.clientX, y: touch.clientY }));
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (event.touches.length > 2) {
      // three or more fingers, ignore
      return;
    }
    const endPoints = Array.from(event.touches).map((touch) => ({ x: touch.clientX, y: touch.clientY }));

    // If one finger, move image
    if (touchPositions.length === 1) {
      const [startPos] = touchPositions;
      const [endPos] = endPoints;
      const deltaX = endPos.x - startPos.x;

      // Move image with touch
      // If current index is the first or last image, don't move the image
      if (currentIndex === 0 && deltaX > 0) {
        return;
      }
      if (currentIndex === imgUrls.length - 1 && deltaX < 0) {
        return;
      }
      const img = event.currentTarget.querySelector("img") as HTMLImageElement | null;
      if (img) {
        img.style.transform = `translateX(${deltaX}px)`;
      }
      return;
    }

    // If two fingers, scale image
    if (touchPositions.length === 2) {
      const [startPos1, startPos2] = touchPositions;
      const [endPos1, endPos2] = endPoints;
      const startDistance = Math.sqrt(
        (startPos1.x - startPos2.x) ** 2 + (startPos1.y - startPos2.y) ** 2,
      );
      const endDistance = Math.sqrt((endPos1.x - endPos2.x) ** 2 + (endPos1.y - endPos2.y) ** 2);
      const scale = state.scale * (endDistance / startDistance);
      setState({ ...state, scale });
    }
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (event.touches.length > 2) {
      // three or more fingers, ignore
      return;
    }

    if (touchPositions.length === 2) {
      touchPositions = [];
      if (state.scale < 1) {
        setState(defaultState);
      }
      return;
    }

    // If one finger, show next or previous image
    const [startPos] = touchPositions;
    const [endPos] = Array.from(event.changedTouches).map((touch) => ({ x: touch.clientX, y: touch.clientY }));
    const startX = startPos.x;
    const startY = startPos.y;
    const endX = endPos.x;
    const endY = endPos.y;

    // If swipe x distance is greater than 50, show next or previous image
    if (startX > -1 &&  endX > -1) {
      const distance = startX - endX;
      if (distance > 50) {
        showNextImg();
      } else if (distance < -50) {
        showPrevImg();
      } else {
        // Reset image position
        const img = event.currentTarget.querySelector("img") as HTMLImageElement | null;
        if (img) {
          img.style.transform = "translateX(0)";
        }
      }
    }

    // If swipe y distance is greater than 50, destroy dialog
    if (startY > -1 && endY > -1) {
      const distance = startY - endY;
      if (distance > 50 || distance < -50) {
        destroy();
      }
    }
  };

  const showPrevImg = () => {
    if (currentIndex > 0) {
      setState(defaultState);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const showNextImg = () => {
    if (currentIndex < imgUrls.length - 1) {
      setState(defaultState);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleImgContainerClick = (event: React.MouseEvent) => {
    if (event.clientX < window.innerWidth / 6) {
      showPrevImg();
    } else if (event.clientX > (window.innerWidth / 6) * 5) {
      showNextImg();
    } else {
      destroy();
    }
  };

  const image = isVideo ? (
    <video preload="metadata" crossOrigin="anonymous" src={imgUrls[currentIndex]} controls />
  ) : (
    <img
      src={imgUrls[currentIndex]}
      decoding="async"
      loading="lazy"
      onLoad={(event) => {
        // Reset image position
        const img = event.target as HTMLImageElement | HTMLVideoElement | null;
        if (img) {
          img.style.transform = "translateX(0)";
        }
      }}
    />
  );

  return (
    <>
      <div
        className="img-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleImgContainerClick}
      >
        {image}
      </div>
    </>
  );
};

export default function showPreviewImageDialog(imgUrls: string[] | string, initialIndex?: number, isVideo?: boolean): void {
  generateDialog(
    {
      className: "preview-image-dialog",
      dialogName: "preview-image-dialog",
    },
    PreviewImageDialog,
    {
      imgUrls: Array.isArray(imgUrls) ? imgUrls : [imgUrls],
      initialIndex: initialIndex || 0,
      isVideo,
    },
  );
}
