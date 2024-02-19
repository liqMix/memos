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

const defaultState: State = {
  scale: 1,
  originX: -1,
  originY: -1,
};

const PreviewImageDialog: React.FC<Props> = ({ destroy, imgUrls, initialIndex, isVideo }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [state, setState] = useState<State>(defaultState);
  let startX = -1;
  let endX = -1;

  const handleTouchStart = (event: React.TouchEvent) => {
    if (event.touches.length > 1) {
      // two or more fingers, ignore
      return;
    }
    startX = event.touches[0].clientX;
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (event.touches.length > 1) {
      // two or more fingers, ignore
      return;
    }
    endX = event.touches[0].clientX;

    // Move image with touch
    // If current index is the first or last image, don't move the image
    if (currentIndex === 0 && endX - startX > 0) {
      return;
    }
    if (currentIndex === imgUrls.length - 1 && endX - startX < 0) {
      return;
    }
    const img = event.currentTarget.querySelector("img") as HTMLImageElement | null;
    if (img) {
      img.style.transform = `translateX(${endX - startX}px)`;
    }
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (event.touches.length > 1) {
      // two or more fingers, ignore
      return;
    }
    if (startX > -1 && endX > -1) {
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

    endX = -1;
    startX = -1;
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

  const imageComputedStyle = {
    transform: `scale(${state.scale})`,
    transformOrigin: `${state.originX === -1 ? "center" : `${state.originX}px`} ${state.originY === -1 ? "center" : `${state.originY}px`}`,
  };

  const image = isVideo ? (
    <video preload="metadata" crossOrigin="anonymous" style={imageComputedStyle} src={imgUrls[currentIndex]} controls />
  ) : (
    <img
      style={imageComputedStyle}
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
