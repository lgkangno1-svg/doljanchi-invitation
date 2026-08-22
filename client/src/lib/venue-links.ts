export const VENUE_MAP_SEARCH_QUERY = "서울 코트야드 메리어트 명동";

export function buildVenueLinks(_venueName: string, _address: string) {
  const query = encodeURIComponent(VENUE_MAP_SEARCH_QUERY);
  const goalName = encodeURIComponent(VENUE_MAP_SEARCH_QUERY);
  return {
    naver: `https://map.naver.com/p/search/${query}`,
    kakaoMap: `https://map.kakao.com/link/search/${query}`,
    tmap: `tmap://route?goalname=${goalName}&goalx=126.9791&goaly=37.5636`,
    kakaoNavi: `kakaonavi://navigate?name=${goalName}&x=126.9791&y=37.5636&coordType=wgs84`,
  };
}
