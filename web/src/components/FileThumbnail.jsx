import { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { useResolvedUrl } from '../hooks/useResolvedUrl';

// Grid-view thumbnail for images and videos. Images render the resolved
// file URL directly; videos capture a frame client-side onto a canvas
// since we don't generate server-side thumbnails. Both fall back to the
// passed-in file-type Icon on load/decode/CORS failure — a tainted canvas
// (S3 response without permissive CORS) throws on toDataURL, which is
// caught below rather than crashing the grid.
export function FileThumbnail({ file, Icon }) {
  const isImage = file.mimeType?.startsWith('image/');
  const isVideo = file.mimeType?.startsWith('video/');
  const { data: url } = useResolvedUrl(file.id, isImage || isVideo);
  const [imageFailed, setImageFailed] = useState(false);
  const [videoFrame, setVideoFrame] = useState(null);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    setVideoFrame(null);
    setVideoFailed(false);
  }, [url]);

  if (isImage && url && !imageFailed) {
    return (
      <img
        src={url}
        alt={file.originalName}
        loading="lazy"
        onError={() => setImageFailed(true)}
        className="h-20 w-full rounded-md object-cover"
      />
    );
  }

  if (isVideo && url && !videoFailed) {
    return (
      <div className="relative h-20 w-full">
        <video
          src={url}
          muted
          playsInline
          preload="metadata"
          className="hidden"
          onError={() => setVideoFailed(true)}
          onLoadedData={(e) => {
            const v = e.currentTarget;
            try {
              v.currentTime = Math.min(0.5, (v.duration || 1) / 2);
            } catch {
              setVideoFailed(true);
            }
          }}
          onSeeked={(e) => {
            const v = e.currentTarget;
            const canvas = document.createElement('canvas');
            canvas.width = v.videoWidth;
            canvas.height = v.videoHeight;
            try {
              canvas.getContext('2d').drawImage(v, 0, 0, canvas.width, canvas.height);
              setVideoFrame(canvas.toDataURL('image/jpeg'));
            } catch {
              setVideoFailed(true);
            }
          }}
        />
        {videoFrame ? (
          <img src={videoFrame} alt={file.originalName} className="h-20 w-full rounded-md object-cover" />
        ) : (
          <div className="flex h-20 w-full items-center justify-center rounded-md bg-surface2">
            <Icon size={32} className="text-muted" />
          </div>
        )}
        <div className="absolute bottom-1 left-1 rounded bg-black/60 p-1">
          <Play size={12} className="fill-white text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-20 w-full items-center justify-center">
      <Icon size={32} className="text-muted" />
    </div>
  );
}
