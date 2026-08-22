export type ViewportVideo = Pick<HTMLVideoElement, "play" | "pause">;

export function shouldPlayViewportVideo(isVisible: boolean, prefersReducedMotion: boolean) {
  return isVisible && !prefersReducedMotion;
}

export async function syncViewportVideo(video: ViewportVideo, isVisible: boolean, prefersReducedMotion: boolean) {
  if (!shouldPlayViewportVideo(isVisible, prefersReducedMotion)) {
    video.pause();
    return false;
  }
  try {
    await video.play();
    return true;
  } catch {
    return false;
  }
}
