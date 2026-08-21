export function buildVenueLinks(venueName: string, address: string) {
  const query = encodeURIComponent(`${venueName} ${address}`);
  const goalName = encodeURIComponent(venueName);
  return {
    naver: `https://map.naver.com/p/search/${query}`,
    kakaoMap: `https://map.kakao.com/link/search/${query}`,
    tmap: `tmap://route?goalname=${goalName}&goalx=126.9791&goaly=37.5636`,
    kakaoNavi: `kakaonavi://navigate?name=${goalName}&x=126.9791&y=37.5636&coordType=wgs84`,
  };
}
