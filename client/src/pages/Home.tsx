import { useEffect, useMemo, useRef, useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { copyText } from "@/lib/copy";
import { buildVenueLinks } from "@/lib/venue-links";
import { parseMedia, parseMediaList, type InvitationMedia } from "@/lib/invitation-media";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Copy, MapPin, MessageCircle, Music2, Pause, Play, Share2, Volume2, X } from "lucide-react";

const HERO_IMAGE = "/manus-storage/chaewon-hotel-hero_a8c12ed8.jpg";
const BGM = "/manus-storage/chaewon-first-birthday-bgm_af29a8dc.mp3";
const VENUE_COORDS = { lat: 37.5636, lng: 126.9791 };
const fallback = { id: 0, babyName: "채원", fatherName: "강호성", motherName: "Nguyen HongNgoc", invitationTitle: "채원의 첫 번째 생일에 소중한 분들을 초대합니다.", greeting: "저희에게 찾아온 가장 빛나는 선물, 채원이가 어느덧 첫 번째 생일을 맞았습니다. 그동안 보내주신 따뜻한 사랑에 감사드리며, 소중한 분들과 함께 채원이의 첫걸음을 축복하는 자리를 마련했습니다.", eventDate: "2026. 10. 18 SUN", eventTime: "12:00 PM", venueName: "코트야드 메리어트 서울 명동", venueAddress: "서울특별시 중구 남대문로 9", parkingInfo: "호텔 지하 주차장을 이용하실 수 있습니다. 행사 당일 주차 등록 및 세부 안내는 호텔 데스크에서 확인해 주세요.", heroImageUrl: null, galleryImageUrls: null, accountInfo: "강호성 | 카카오뱅크 3333-19-8058955" };

function Section({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <section className={`hotel-section ${className}`}><p className="section-label">{label}</p>{children}</section>;
}

function VenueMap() { return <div className="venue-map"><iframe title="코트야드 메리어트 서울 명동 위치 지도" src="https://maps.google.com/maps?q=Courtyard%20by%20Marriott%20Seoul%20Myeongdong&t=&z=16&ie=UTF8&iwloc=&output=embed" loading="lazy" /></div>; }

function useReducedMotion() { const [reduced, setReduced] = useState(false); useEffect(() => { const query = window.matchMedia("(prefers-reduced-motion: reduce)"); const change = () => setReduced(query.matches); change(); query.addEventListener("change", change); return () => query.removeEventListener("change", change); }, []); return reduced; }

function InvitationMediaView({ media, fallback, alt, className = "", priority = false }: { media: InvitationMedia | null; fallback: string; alt: string; className?: string; priority?: boolean }) {
  const reducedMotion = useReducedMotion();
  const source = media?.url || fallback; const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false);
  useEffect(() => { setLoading(true); setFailed(false); }, [source]);
  return <div className={`invitation-media ${className} ${failed ? "media-error" : ""}`} aria-busy={loading}>
    {failed ? <><img src={fallback} alt={alt} loading={priority ? "eager" : "lazy"} /><span className="media-status">미디어를 불러오지 못해 기본 이미지로 표시합니다.</span></> : media?.kind === "video" ? <video src={source} poster={fallback} autoPlay={!reducedMotion} muted loop playsInline preload="metadata" aria-label={alt} onLoadedData={() => setLoading(false)} onError={() => { setLoading(false); setFailed(true); }} /> : <img src={source} alt={alt} loading={priority ? "eager" : "lazy"} onLoad={() => setLoading(false)} onError={() => { setLoading(false); setFailed(true); }} />}
    {loading && !failed && <span className="media-status media-loading">사진을 준비하고 있어요…</span>}
  </div>;
}

export default function Home() {
  const [, params] = useRoute("/invite/:slug");
  const slug = params?.slug ?? "invite-peach-ribbon-x7k2p";
  const inviteQuery = trpc.invitation.get.useQuery({ slug }, { staleTime: 30000 });
  const invite = inviteQuery.data ?? fallback;
  const guestbook = trpc.invitation.guestbook.useQuery({ slug }, { staleTime: 15000 });
  const addGuestbook = trpc.invitation.addGuestbook.useMutation({ onSuccess: () => { guestbook.refetch(); setGuestName(""); setGuestMessage(""); toast.success("채원이에게 축하 메시지가 전달되었어요."); } });
  const addRsvp = trpc.invitation.addRsvp.useMutation({ onSuccess: () => { setRsvpSent(true); toast.success("참석 여부가 전달되었어요."); } });
  const [guestName, setGuestName] = useState("");
  const [guestMessage, setGuestMessage] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [rsvpSent, setRsvpSent] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [rsvp, setRsvp] = useState({ name: "", attendance: "attending" as "attending" | "unable", adults: 1, children: 0, meal: true, contact: "", note: "" });
  const accounts = useMemo(() => invite.accountInfo.split("\n").map(line => { const [label, ...rest] = line.split("|"); return { label: label?.trim() || "계좌", value: rest.join("|").trim() || line }; }), [invite.accountInfo]);
  const heroMedia = parseMedia(invite.heroImageUrl);
  const galleryMedia = parseMediaList(invite.galleryImageUrls);
  const venueLinks = buildVenueLinks(invite.venueName, invite.venueAddress);
  const copy = async (value: string, label: string) => { if (await copyText(value)) toast.success(`${label} 복사 완료`); else toast.error("복사할 수 없어요. 길게 눌러 복사해 주세요."); };
  const share = async () => { const kakao = (window as any).Kakao; const shareImage = heroMedia?.kind === "image" ? heroMedia.url : HERO_IMAGE; if (kakao?.Share?.sendDefault) { kakao.Share.sendDefault({ objectType: "feed", content: { title: `${invite.babyName}의 첫 번째 생일`, description: invite.invitationTitle, imageUrl: `${location.origin}${shareImage}`, link: { mobileWebUrl: location.href, webUrl: location.href } } }); return; } if (navigator.share) await navigator.share({ title: `${invite.babyName}의 첫 번째 생일`, text: invite.invitationTitle, url: location.href }); else await copy(location.href, "초대장 링크"); };
  const submitGuestbook = (event: React.FormEvent) => { event.preventDefault(); if (!guestName.trim() || !guestMessage.trim()) return toast.error("이름과 축하 메시지를 모두 입력해 주세요."); addGuestbook.mutate({ name: guestName.trim(), message: guestMessage.trim(), website: "" }); };
  const submitRsvp = (event: React.FormEvent) => { event.preventDefault(); if (!rsvp.name.trim()) return toast.error("성함을 입력해 주세요."); addRsvp.mutate(rsvp); };
  const toggleMusic = async () => { const audio = audioRef.current; if (!audio) return; if (audio.paused) { try { await audio.play(); setMusicPlaying(true); } catch { toast.error("음악을 재생할 수 없어요."); } } else { audio.pause(); setMusicPlaying(false); } };

  return <main className="hotel-invitation">
    <audio ref={audioRef} src={BGM} preload="none" onEnded={() => setMusicPlaying(false)} />
    <section className="hotel-hero">
      <InvitationMediaView className="hero-media" media={heroMedia} fallback={HERO_IMAGE} alt="채원의 첫 번째 생일을 위한 호텔 스타일 케이크 테이블" priority />
      <div className="hero-veil" />
      <div className="hero-ribbon">⌇</div><div className="hero-seal"><span>FIRST YEAR</span><b>CW</b><i>2026</i></div>
      <div className="hero-content"><p>OUR BABY&apos;S FIRST BIRTHDAY</p><h1>강채원</h1><span className="hero-rule" /><strong>{invite.eventDate} · {invite.eventTime}</strong><small>{invite.venueName}</small></div>
      <div className="hero-scroll">SCROLL TO CELEBRATE <b>↓</b></div>
    </section>

    <Section label="INVITATION" className="invitation-letter"><div className="monogram"><b>CW</b><small>ONE</small></div><h2>사랑을 담아<br /><em>초대합니다</em></h2><p>{invite.greeting}</p><div className="parents">아빠 <b>{invite.fatherName}</b><i /> 엄마 <b>{invite.motherName}</b></div></Section>

    <Section label="A YEAR OF JOY" className="editorial-gallery"><h2>한 해 동안 피어난<br /><em>우리의 기쁨</em></h2><div className="gallery-editorial"><InvitationMediaView media={galleryMedia[0] ?? null} fallback={HERO_IMAGE} alt="채원이의 갤러리 사진" /><div><p>채원이와 함께한<br />가장 따스한 계절</p><InvitationMediaView media={galleryMedia[1] ?? null} fallback={HERO_IMAGE} alt="채원이의 갤러리 사진" /></div></div>{galleryMedia.slice(2).length > 0 && <div className="extra-gallery">{galleryMedia.slice(2).map((media, index) => <InvitationMediaView key={`${media.url}-${index}`} media={media} fallback={HERO_IMAGE} alt="채원이의 갤러리 사진" />)}</div>}</Section>

    <section className="love-transition"><img src={HERO_IMAGE} alt="채원이의 첫돌을 위한 축하 테이블" /><div><p>A year of love,</p><strong>a lifetime of joy.</strong></div></section>

    <Section label="DATE & VENUE" className="venue-section"><div className="date-venue-card"><div className="date-block"><p>DATE & TIME</p><h2>2026. 10. 18</h2><span>일요일 낮 12시 00분</span><div className="calendar-row"><b>OCT</b><i>18</i><span>SUN</span></div></div><div className="venue-divider" /><div className="venue-block"><p>VENUE</p><h3>{invite.venueName}</h3><span>{invite.venueAddress}</span><VenueMap /><div className="map-actions"><a href={venueLinks.naver} target="_blank" rel="noreferrer">네이버지도</a><a href={venueLinks.kakaoMap} target="_blank" rel="noreferrer">카카오맵</a><a href={venueLinks.tmap}>티맵</a><a href={venueLinks.kakaoNavi}>카카오내비</a></div><div className="parking-note"><MapPin size={16} /><p><b>주차 안내</b>{invite.parkingInfo}</p></div></div></div></Section>

    <Section label="RESERVATION" className="rsvp-hotel"><div className="rsvp-heading"><h2>참석 여부를<br /><em>알려주세요</em></h2><p>행사 준비를 위해 소중한 응답을 부탁드립니다.</p></div>{rsvpSent ? <div className="rsvp-complete"><span>THANK YOU</span><b>응답이 전달되었습니다</b><p>채원이의 첫 생일에 함께해 주셔서 감사합니다.</p></div> : <form onSubmit={submitRsvp}><div className="attendance-options"><button type="button" onClick={() => setRsvp({ ...rsvp, attendance: "attending" })} className={rsvp.attendance === "attending" ? "active" : ""}>참석하겠습니다</button><button type="button" onClick={() => setRsvp({ ...rsvp, attendance: "unable" })} className={rsvp.attendance === "unable" ? "active" : ""}>참석이 어렵습니다</button></div><label>성함<input value={rsvp.name} onChange={event => setRsvp({ ...rsvp, name: event.target.value })} maxLength={80} /></label>{rsvp.attendance === "attending" && <div className="guest-counts"><label>성인<input type="number" value={rsvp.adults} min={0} max={10} onChange={event => setRsvp({ ...rsvp, adults: Number(event.target.value) })} /></label><label>아이<input type="number" value={rsvp.children} min={0} max={10} onChange={event => setRsvp({ ...rsvp, children: Number(event.target.value) })} /></label></div>}<label>연락처 <small>(선택)</small><input value={rsvp.contact} onChange={event => setRsvp({ ...rsvp, contact: event.target.value })} maxLength={40} /></label><label>전하고 싶은 말씀 <small>(선택)</small><textarea value={rsvp.note} onChange={event => setRsvp({ ...rsvp, note: event.target.value })} maxLength={300} /></label><label className="meal-check"><input type="checkbox" checked={rsvp.meal} onChange={event => setRsvp({ ...rsvp, meal: event.target.checked })} /> 식사 예정입니다</label><button className="hotel-primary" disabled={addRsvp.isPending}>응답 보내기</button><p className="form-privacy">연락처는 행사 안내를 위해서만 사용하며, 행사 종료 후 정리합니다.</p></form>}</Section>

    <Section label="GUESTBOOK" className="guestbook-hotel"><h2>채원이에게<br /><em>축하 메시지를 남겨주세요</em></h2><form className="guestbook-form" onSubmit={submitGuestbook}><label>이름<input value={guestName} onChange={event => setGuestName(event.target.value)} maxLength={40} /></label><label>축하 메시지<textarea value={guestMessage} onChange={event => setGuestMessage(event.target.value)} maxLength={300} placeholder="따뜻한 마음을 적어주세요" /></label><div><small>{guestMessage.length} / 300</small><button className="hotel-primary" disabled={addGuestbook.isPending}><MessageCircle size={15} /> 축하 메시지 남기기</button></div><p className="form-privacy light">작성하신 이름과 메시지는 초대장에 공개될 수 있습니다.</p></form><div className="message-list">{(guestbook.data ?? []).slice(0, 2).map(entry => <article key={entry.id}><p>{entry.message}</p><footer><span>{new Date(entry.createdAt).toLocaleDateString("ko-KR")}</span><b>{entry.authorName}</b></footer></article>)}{(guestbook.data?.length ?? 0) > 2 && <p className="message-more">축하 메시지 {(guestbook.data ?? []).length}개가 도착했어요.</p>}</div></Section>

    <Section label="WITH LOVE" className="gift-section"><button className="gift-toggle" onClick={() => setAccountOpen(!accountOpen)}><span><small>마음 전하실 곳</small><b>계좌번호 확인하기</b></span>{accountOpen ? <ChevronUp /> : <ChevronDown />}</button>{accountOpen && <div className="gift-accounts">{accounts.map(account => <div key={account.label}><span><small>{account.label}</small><b>{account.value}</b></span><button onClick={() => copy(account.value, "계좌번호")}><Copy size={15} /> 복사</button></div>)}</div>}<p>멀리서 마음을 전해주시는 분들을 위해<br />조심스럽게 계좌번호를 안내드립니다.</p></Section>

    <section className="hotel-closing"><div className="closing-ribbon">⌇</div><p>채원이의 첫 번째 생일을<br /><em>함께 축하해 주셔서 감사합니다.</em></p></section>
    <div className="music-control"><button aria-label="배경음악 제어" onClick={() => setMusicOpen(!musicOpen)}>{musicOpen ? <X size={20} /> : <Music2 size={20} />}<span>BGM</span></button>{musicOpen && <div className="music-panel"><p>채원이의 첫 번째 생일을 위한 음악</p><div><button aria-label="재생 또는 일시정지" onClick={toggleMusic}>{musicPlaying ? <Pause size={18} /> : <Play size={18} />}</button><span className={musicPlaying ? "playing" : ""} /><Volume2 size={15} /></div></div>}</div>
    <nav className="share-bar"><button onClick={share}><Share2 size={16} /> 카카오톡 공유</button><button onClick={() => copy(location.href, "초대장 링크")}><Copy size={16} /> 링크 복사</button></nav>
  </main>;
}
