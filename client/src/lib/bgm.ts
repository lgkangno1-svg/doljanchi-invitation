export function shouldShowBgmGuide(hasStartedMusic: boolean, isPlaying: boolean) {
  return !hasStartedMusic && !isPlaying;
}
