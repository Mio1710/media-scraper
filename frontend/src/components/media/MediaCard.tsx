import { ExternalLink, Image, Trash2, Video, X } from "lucide-react";
import React, { KeyboardEvent, useState } from "react";
import { Media, MediaType } from "../../types";

interface MediaCardProps {
  readonly media: Media;
  readonly onDelete?: (id: string) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({ media, onDelete }) => {
  const [imageError, setImageError] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const isVideo = media.type === MediaType.VIDEO;
  const isEmbedVideo =
    isVideo && (media.url.includes("youtube.com") || media.url.includes("youtu.be") || media.url.includes("vimeo.com"));

  const handleImageError = (): void => {
    setImageError(true);
  };

  const handleOpenModal = (): void => {
    setShowModal(true);
  };

  const handleCloseModal = (): void => {
    setShowModal(false);
  };

  const handleThumbnailKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpenModal();
    }
  };

  const handleModalBackdropKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === "Escape") {
      handleCloseModal();
    }
  };

  const handleDeleteClick = (event: React.MouseEvent): void => {
    event.stopPropagation();
    if (onDelete) {
      onDelete(media.id);
    }
  };

  const handleLinkClick = (event: React.MouseEvent): void => {
    event.stopPropagation();
  };

  const handleModalContentClick = (event: React.MouseEvent): void => {
    event.stopPropagation();
  };

  const getYouTubeThumbnail = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
    }
    return null;
  };

  const renderThumbnail = (): React.ReactNode => {
    if (imageError) {
      return (
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
          {isVideo ? <Video className="h-12 w-12 text-gray-400" /> : <Image className="h-12 w-12 text-gray-400" />}
        </div>
      );
    }

    if (isVideo) {
      const thumbnail = getYouTubeThumbnail(media.url);
      if (thumbnail) {
        return (
          <img
            src={thumbnail}
            alt={media.title ?? "Video thumbnail"}
            className="w-full h-48 object-cover"
            onError={handleImageError}
          />
        );
      }
      return (
        <div className="w-full h-48 bg-gray-800 flex items-center justify-center">
          <Video className="h-12 w-12 text-white" />
        </div>
      );
    }

    return (
      <img
        src={media.url}
        alt={media.alt ?? media.title ?? "Image"}
        className="w-full h-48 object-cover"
        onError={handleImageError}
        loading="lazy"
      />
    );
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        {/* Thumbnail */}
        <div
          className="relative cursor-pointer group"
          onClick={handleOpenModal}
          onKeyDown={handleThumbnailKeyDown}
          tabIndex={0}
          role="button"
          aria-label={`View ${media.title || media.alt || "media"} in fullscreen`}
        >
          {renderThumbnail()}

          {/* Type Badge */}
          <div
            className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${
              isVideo ? "bg-red-500 text-white" : "bg-blue-500 text-white"
            }`}
          >
            {isVideo ? "Video" : "Image"}
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
            <ExternalLink className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-medium text-gray-900 truncate">{media.title || media.alt || "Untitled"}</h3>
          <p className="text-sm text-gray-500 truncate mt-1" title={media.sourceUrl}>
            From: {new URL(media.url).hostname}
          </p>

          {(media.width || media.height) && (
            <p className="text-xs text-gray-400 mt-1">
              {media.width}×{media.height}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <a
              href={media.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              onClick={handleLinkClick}
              aria-label={`Open ${media.title || "media"} in new tab`}
            >
              <ExternalLink className="h-3 w-3" />
              Open
            </a>

            {onDelete && (
              <button
                onClick={handleDeleteClick}
                className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
                aria-label={`Delete ${media.title || "media"}`}
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
          onClick={handleCloseModal}
          onKeyDown={handleModalBackdropKeyDown}
          role="dialog"
          aria-modal="true"
          aria-label="Media preview"
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden"
            onClick={handleModalContentClick}
          >
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-2 z-10 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            {isVideo && !isEmbedVideo ? (
              <video src={media.url} controls className="max-w-full max-h-[80vh]" autoPlay />
            ) : isEmbedVideo ? (
              <div className="w-[800px] h-[450px]">
                <iframe src={media.url} className="w-full h-full" allowFullScreen title={media.title ?? "Video"} />
              </div>
            ) : (
              <img
                src={media.url}
                alt={media.alt ?? media.title ?? "Image"}
                className="max-w-full max-h-[80vh] object-contain"
              />
            )}

            <div className="p-4 bg-gray-50">
              <h3 className="font-medium text-gray-900">{media.title || media.alt || "Untitled"}</h3>
              <p className="text-sm text-gray-500 mt-1 break-all">{media.url}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MediaCard;
