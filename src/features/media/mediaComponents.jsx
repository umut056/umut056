import { useEffect, useState } from "react";
import { C, F } from "../../shared/theme/tokens.js";
import { MediaStore, mediaCloudUrl } from "./mediaService.js";

export const ProductVideo = ({ video, style }) => {
  const [src, setSrc] = useState(video?.url || "");
  useEffect(() => {
    let alive = true;
    let old = "";
    setSrc(video?.url || "");
    const load = async () => {
      let next = "";
      if (video?.mediaId) next = await MediaStore.url(video.mediaId).catch(() => "");
      if (!next) next = await mediaCloudUrl(video);
      if (alive) {
        old = next?.startsWith("blob:") ? next : "";
        setSrc(next || "");
      }
    };
    load();
    return () => {
      alive = false;
      if (old) URL.revokeObjectURL(old);
    };
  }, [video?.mediaId, video?.url, video?.storagePath]);

  if (!src) {
    return (
      <div style={{ background: C.foam, borderRadius: 14, padding: "14px", fontSize: 12, color: C.stone, lineHeight: 1.4, ...F }}>
        Video dosyası cihazda bulunamadı. Lütfen tekrar yükle.
      </div>
    );
  }

  return <video src={src} controls style={{ width: "100%", maxHeight: 210, borderRadius: 14, background: C.ink, ...style }} />;
};

export const MediaImage = ({ media, alt = "", style }) => {
  const [src, setSrc] = useState(media?.url || media?.preview || "");
  useEffect(() => {
    let alive = true;
    let old = "";
    setSrc(media?.preview || media?.url || "");
    const load = async () => {
      let next = "";
      if (media?.mediaId) next = await MediaStore.url(media.mediaId).catch(() => "");
      if (!next) next = await mediaCloudUrl(media);
      if (alive) {
        old = next?.startsWith("blob:") ? next : "";
        setSrc(next || media?.preview || media?.url || "");
      }
    };
    load();
    return () => {
      alive = false;
      if (old) URL.revokeObjectURL(old);
    };
  }, [media?.mediaId, media?.url, media?.preview, media?.storagePath]);

  if (!src) return null;
  return <img src={src} alt={alt} style={style} />;
};

export const MediaAudio = ({ media, style }) => {
  const [src, setSrc] = useState(media?.url || "");
  useEffect(() => {
    let alive = true;
    let old = "";
    setSrc(media?.url || "");
    const load = async () => {
      let next = "";
      if (media?.mediaId) next = await MediaStore.url(media.mediaId).catch(() => "");
      if (!next) next = await mediaCloudUrl(media);
      if (alive) {
        old = next?.startsWith("blob:") ? next : "";
        setSrc(next || media?.url || "");
      }
    };
    load();
    return () => {
      alive = false;
      if (old) URL.revokeObjectURL(old);
    };
  }, [media?.mediaId, media?.url, media?.storagePath]);

  if (!src) return null;
  return <audio src={src} controls style={style} />;
};

export const hasMediaImage = (media) => !!(media?.preview || media?.url || media?.mediaId || media?.storagePath);
