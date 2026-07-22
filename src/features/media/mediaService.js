import { storedSession } from "../../lib/session.js";
import { supabaseStorageSignedUrl, uploadMediaFile } from "../../lib/production.js";

const todayIsoDate = () => new Date().toISOString().split("T")[0];

export const MediaStore = {
  open: () => new Promise((resolve, reject) => {
    const req = indexedDB.open("stepwise_media", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("videos")) db.createObjectStore("videos", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }),
  put: async (id, file) => {
    const db = await MediaStore.open();
    await new Promise((resolve, reject) => {
      const tx = db.transaction("videos", "readwrite");
      tx.objectStore("videos").put({
        id,
        blob: file,
        type: file?.type || "application/octet-stream",
        name: file?.name || id,
        createdAt: todayIsoDate(),
      });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  },
  del: async (id) => {
    if (!id) return;
    const db = await MediaStore.open();
    await new Promise((resolve) => {
      const tx = db.transaction("videos", "readwrite");
      tx.objectStore("videos").delete(id);
      tx.oncomplete = resolve;
      tx.onerror = resolve;
    });
    db.close();
  },
  cleanup: async (validIds = []) => {
    const keep = new Set(validIds.filter(Boolean));
    const db = await MediaStore.open();
    await new Promise((resolve) => {
      const tx = db.transaction("videos", "readwrite");
      const store = tx.objectStore("videos");
      const req = store.getAllKeys();
      req.onsuccess = () => req.result.forEach((id) => {
        if (!keep.has(id)) store.delete(id);
      });
      tx.oncomplete = resolve;
      tx.onerror = resolve;
    });
    db.close();
  },
  url: async (id) => {
    const db = await MediaStore.open();
    const rec = await new Promise((resolve, reject) => {
      const tx = db.transaction("videos", "readonly");
      const req = tx.objectStore("videos").get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return rec?.blob ? URL.createObjectURL(rec.blob) : "";
  },
};

export const persistMedia = async ({ id, file, mediaType, owner, clientId }) => {
  await MediaStore.put(id, file);
  const base = {
    mediaId: id,
    mediaType,
    name: file?.name || id,
    size: file?.size || 0,
    type: file?.type || "application/octet-stream",
    localSavedAt: new Date().toISOString(),
    cloudStatus: "local_saved",
  };
  try {
    const uploaded = await uploadMediaFile(file, {
      token: owner?.supabaseToken,
      ownerId: owner?.id,
      clientId,
      mediaType,
      fileName: file?.name || id,
    });
    return { ...base, ...uploaded, cloudStatus: uploaded?.cloudStatus || (uploaded?.url ? "uploaded" : "local_saved") };
  } catch (err) {
    console.warn("media-upload-fallback", err);
    return base;
  }
};

export const mediaCloudUrl = async (media) => {
  if (!media?.storagePath) return "";
  const token = JSON.parse(storedSession() || "{}")?.supabaseToken;
  if (!token) return media?.url || "";
  try {
    return await supabaseStorageSignedUrl({ token, path: media.storagePath, bucket: media.storageBucket });
  } catch (err) {
    console.warn("media-url-refresh", err);
    return media?.url || "";
  }
};
