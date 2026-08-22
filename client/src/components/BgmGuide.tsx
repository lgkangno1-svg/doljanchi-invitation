import React from "react";

export function BgmGuide({ onActivate }: { onActivate: () => void | Promise<void> }) {
  return <button className="music-guide" onClick={() => { void onActivate(); }}><span>여기를 클릭하세요<br /><b>채원이의 BGM</b></span><i className="music-guide-arrow" aria-hidden="true">→</i></button>;
}
