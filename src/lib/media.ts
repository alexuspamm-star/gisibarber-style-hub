import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export const MAX_VIDEO_SECONDS = 30;

/** Reads the duration (in seconds) of a video file in the browser. */
export function getVideoDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Video non leggibile"));
    };
    video.src = url;
  });
}

/** Uploads a file to the media bucket and returns a long-lived signed URL. */
export async function uploadMedia(file: File, folder: "home" | "gallery" | "bookings" | "avatars") {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;

  const { data, error: signError } = await supabase.storage
    .from("media")
    .createSignedUrl(path, TEN_YEARS);
  if (signError || !data) throw signError ?? new Error("Impossibile generare il link dell'immagine");

  return data.signedUrl;
}
