export function shouldShowBgmGuide(hasStartedMusic: boolean, isPlaying: boolean) {
  return !hasStartedMusic && !isPlaying;
}

export async function startBgmOnTap(audio: Pick<HTMLAudioElement, "play">) {
  await audio.play();
  return { hasStartedMusic: true, isPlaying: true } as const;
}
