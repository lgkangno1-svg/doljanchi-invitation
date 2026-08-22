import { useEffect, useMemo, useRef, useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { copyText } from "@/lib/copy";
import { accountCopySuccessMessage, copyAccountNumber } from "@/lib/account-copy";
import { buildVenueLinks, VENUE_MAP_SEARCH_QUERY } from "@/lib/venue-links";
import { formatVenueDisplay } from "@/lib/venue-display";
import { parseMedia, parseMediaList, type InvitationMedia } from "@/lib/invitation-media";
import { shouldShowBgmGuide, startBgmOnTap } from "@/lib/bgm";
import { addCompanionInput, normalizeCompanionNames, removeCompanionInput } from "@/lib/companions";
import { createInitialRsvpAttendees, summarizeRsvpAttendees } from "@/lib/rsvp-attendees";
import { CompanionFields, PartyNameLabel } from "@/components/CompanionFields";
import { RsvpAttendeeFields } from "@/components/RsvpAttendeeFields";
import { BgmGuide } from "@/components/BgmGuide";
import { syncViewportVideo } from "@/lib/viewport-video";
import { toast } from "sonner";
import { Copy, MapPin, MessageCircle, Music2, Pause, Play, Share2, Volume2, X } from "lucide-react";
import { AccountSection } from "@/components/AccountSection";

const HERO_IMAGE = "/manus-storage/chaewon-hotel-hero_a8c12ed8.jpg";
const BGM = "/manus-storage/chaewon-first-birthday-bgm_af29a8dc.mp3";
const VENUE_COORDS = { lat: 37.5636, lng: 126.9791 };
const fallback = { id: 0, babyName: "채원", fatherName: "강호성", motherName: "NGUYEN HONG NGOC", invitationTitle: "채원의 첫 번째 생일에 소중한 분들을 초대합니다.", greeting: "저희에게 찾아온 가장 빛나는 선물, 채원이가 어느덧 첫 번째 생일을 맞았습니다. 그동안 보내주신 따뜻한 사랑에 감사드리며, 소중한 분들과 함께 채원이의 첫걸음을 축복하는 자리를 마련했습니다.", eventDate: "2026. 10. 18 SUN", eventTime: "12:00 PM", venueName: "코트야드 메리어트 서울 명동\n3층 한양 1+2홀", venueAddress: "서울특별시 중구 남대문로 9", parkingInfo: "호텔 지하 주차장을 이용하실 수 있습니다. 행사 당일 주차 등록 및 세부 안내는 호텔 데스크에서 확인해 주세요.", heroImageUrl: null, galleryImageUrls: null, accountInfo: "강호성 | 카카오뱅크 3333-19-8058955" };

function Section({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <section className={`hotel-section ${className}`}><p className="section-label">{label}</p>{children}</section>;
}

function VenueMap() { return <div className="venue-map"><iframe title="코트야드 메리어트 서울 명동 위치 지도" src={`https://maps.google.com/maps?q=${encodeURIComponent(VENUE_MAP_SEARCH_QUERY)}&t=&z=16&ie=UTF8&iwloc=&output=embed`} loading="lazy" /></div>; }

function useReducedMotion() { const [reduced, setReduced] = useState(false); useEffect(() => { const query = window.matchMedia("(prefers-reduced-motion: reduce)"); const change = () => setReduced(query.matches); change(); query.addEventListener("change", change); return () => query.removeEventListener("change", change); }, []); return reduced; }

function InvitationMediaView({ media, fallback, alt, className = "", priority = false }: { media: InvitationMedia | null; fallback: string; alt: string; className?: string; priority?: boolean }) {
  const reducedMotion = useReducedMotion();
  const source = media?.url || fallback; const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false); const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => { setLoading(true); setFailed(false); }, [source]);
  useEffect(() => {
    if (media?.kind !== "video") return;
    const video = videoRef.current;
    if (!video) return;
    const sync = (visible: boolean) => { void syncViewportVideo(video, visible, reducedMotion); };
    if (typeof IntersectionObserver === "undefined") { sync(true); return; }
    const observer = new IntersectionObserver(entries => { const entry = entries[0]; if (entry) sync(entry.isIntersecting && entry.intersectionRatio >= 0.25); }, { threshold: [0, 0.25, 0.6] });
    observer.observe(video);
    return () => { observer.disconnect(); video.pause(); };
  }, [media?.kind, source, reducedMotion]);
  return <div className={`invitation-media ${className} ${failed ? "media-error" : ""}`} aria-busy={loading}>
    {failed ? <><img src={fallback} alt={alt} loading={priority ? "eager" : "lazy"} /><span className="media-status">미디어를 불러오지 못해 기본 이미지로 표시합니다.</span></> : media?.kind === "video" ? <video ref={videoRef} src={source} poster={fallback} muted loop playsInline preload="metadata" aria-label={alt} onLoadedData={() => setLoading(false)} onError={() => { setLoading(false); setFailed(true); }} /> : <img src={source} alt={alt} loading={priority ? "eager" : "lazy"} onLoad={() => setLoading(false)} onError={() => { setLoading(false); setFailed(true); }} />}
    {loading && !failed && <span className="media-status media-loading">사진을 준비하고 있어요…</span>}
  </div>;
}

export default function Home() {
  const [, params] = useRoute("/invite/:slug");
  const slug = params?.slug ?? "invite-peach-ribbon-x7k2p";
  const inviteQuery = trpc.invitation.get.useQuery({ slug }, { staleTime: 30000 });
  const invite = inviteQuery.data ?? fallback;
  const guestbook = trpc.invitation.guestbook.useQuery({ slug }, { staleTime: 15000 });
  const [guestName, setGuestName] = useState("");
  const [guestPassword, setGuestPassword] = useState("");
  const [guestCompanions, setGuestCompanions] = useState<string[]>([]);
  const [guestMessage, setGuestMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; authorName: string } | null>(null);
  const [deletePasswordInput, setDeletePasswordInput] = useState("");

  const saveMyPost = (id: number, pass: string) => {
    try {
      const map = JSON.parse(localStorage.getItem("my_guestbook_posts") || "{}");
      map[id] = pass;
      localStorage.setItem("my_guestbook_posts", JSON.stringify(map));
    } catch {}
  };

  const getMyPostPass = (id: number) => {
    try {
      const map = JSON.parse(localStorage.getItem("my_guestbook_posts") || "{}");
      return map[id] || "";
    } catch { return ""; }
  };

  const addGuestbook = trpc.invitation.addGuestbook.useMutation({
    onSuccess: (data: any) => {
      const newId = data?.id;
      if (newId && guestPassword.trim()) {
        saveMyPost(newId, guestPassword.trim());
      }
      guestbook.refetch();
      setGuestName("");
      setGuestPassword("");
      setGuestCompanions([]);
      setGuestMessage("");
      toast.success("채원이에게 축하 메시지가 전달되었어요.");
    }
  });

  const deleteGuestbook = trpc.invitation.deleteGuestbook.useMutation({
    onSuccess: () => {
      guestbook.refetch();
      setDeleteTarget(null);
      setDeletePasswordInput("");
      toast.success("방명록이 삭제되었습니다.");
    },
    onError: (err: any) => {
      toast.error(err.message || "비밀번호가 일치하지 않습니다.");
    }
  });

  const handleDeleteRequest = (entry: { id: number; authorName: string }) => {
    const savedPass = getMyPostPass(entry.id);
    if (savedPass) {
      if (window.confirm(`'${entry.authorName}' 님의 방명록을 삭제하시겠습니까?`)) {
        deleteGuestbook.mutate({ id: entry.id, password: savedPass } as any);
      }
    } else {
      setDeleteTarget(entry);
      setDeletePasswordInput("");
    }
  };

  const confirmDeleteWithPassword = (event: React.FormEvent) => {
    event.preventDefault();
    if (!deleteTarget) return;
    deleteGuestbook.mutate({ id: deleteTarget.id, password: deletePasswordInput.trim() } as any);
  };

  const addRsvp = trpc.invitation.addRsvp.useMutation({ onSuccess: () => { setRsvpSent(true); toast.success("참석 여부가 전달되었어요."); } });
  const [rsvpSent, setRsvpSent] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [hasStartedMusic, setHasStartedMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [rsvp, setRsvp] = useState({ attendees: createInitialRsvpAttendees(), attendance: "attending" as "attending" | "unable", contact: "", note: "" });
  const accounts = useMemo(() => invite.accountInfo.split("\n").map(line => { const [label, ...rest] = line.split("|"); return { label: label?.trim() || "계좌", value: rest.join("|").trim() || line }; }), [invite.accountInfo]);
  const heroMedia = parseMedia(invite.heroImageUrl);
  const galleryMedia = parseMediaList(invite.galleryImageUrls);
  const venueLinks = buildVenueLinks(invite.venueName, invite.venueAddress);
  const copy = async (value: string, label: string) => { if (await copyText(value)) toast.success(`${label} 복사 완료`); else toast.error("복사할 수 없어요. 길게 눌러 복사해 주세요."); };
  const copyAccount = async (value: string) => { const copied = await copyAccountNumber(value); if (copied) toast.success(accountCopySuccessMessage()); else toast.error("복사할 수 없어요. 길게 눌러 복사해 주세요."); return copied; };
  const share = async () => { const kakao = (window as any).Kakao; const shareImage = heroMedia?.kind === "image" ? heroMedia.url : HERO_IMAGE; if (kakao?.Share?.sendDefault) { kakao.Share.sendDefault({ objectType: "feed", content: { title: `${invite.babyName}의 첫 번째 생일`, description: invite.invitationTitle, imageUrl: `${location.origin}${shareImage}`, link: { mobileWebUrl: location.href, webUrl: location.href } } }); return; } if (navigator.share) await navigator.share({ title: `${invite.babyName}의 첫 번째 생일`, text: invite.invitationTitle, url: location.href }); else await copy(location.href, "초대장 링크"); };
  const submitGuestbook = (event: React.FormEvent) => { event.preventDefault(); if (!guestName.trim() || !guestMessage.trim()) return toast.error("이름과 축하 메시지를 모두 입력해 주세요."); addGuestbook.mutate({ name: guestName.trim(), companionNames: normalizeCompanionNames(guestCompanions), message: guestMessage.trim(), password: guestPassword.trim(), website: "" } as any); };
  const submitRsvp = (event: React.FormEvent) => { event.preventDefault(); const summary = summarizeRsvpAttendees(rsvp.attendees); if (!summary.primaryName) return toast.error("참석하시는 분의 성함을 한 분 이상 입력해 주세요."); addRsvp.mutate({ name: summary.primaryName, companionNames: summary.companionNames, attendeeDetails: summary.attendees, attendance: rsvp.attendance, adults: summary.adults, children: summary.children, contact: rsvp.contact, note: rsvp.note }); };
  const toggleMusic = async () => { const audio = audioRef.current; if (!audio) return; if (audio.paused) { try { const next = await startBgmOnTap(audio); setMusicPlaying(next.isPlaying); setHasStartedMusic(next.hasStartedMusic); } catch { toast.error("음악을 재생할 수 없어요."); } } else { audio.pause(); setMusicPlaying(false); } };

  return <main className="hotel-invitation">
    <audio ref={audioRef} src={BGM} preload="none" onEnded={() => setMusicPlaying(false)} />
    <section className="hotel-hero">
      <InvitationMediaView className="hero-media" media={heroMedia} fallback={HERO_IMAGE} alt="채원의 첫 번째 생일을 위한 호텔 스타일 케이크 테이블" priority />
      <div className="hero-veil" />
      <div className="hero-ribbon">⌇</div><div className="hero-seal"><span>FIRST YEAR</span><b>CW</b><i>2026</i></div>
      <div className="hero-content"><p>OUR BABY&apos;S FIRST BIRTHDAY</p><h1>강채원</h1><span className="hero-rule" /><strong>{invite.eventDate} · {invite.eventTime}</strong><small className="hero-venue">{formatVenueDisplay(invite.venueName)}</small></div>
      <div className="hero-scroll"><span>SCROLL TO CELEBRATE</span><b>↓</b></div>
    </section>

    <Section label="INVITATION" className="invitation-letter"><div className="monogram"><b>CW</b><small>ONE</small></div><h2>사랑을 담아<br /><em>초대합니다</em></h2><p>{invite.greeting}</p><div className="parents">아빠 <b>{invite.fatherName}</b><i /> 엄마 <b>{invite.motherName}</b></div></Section>

    <Section label="A YEAR OF JOY" className="editorial-gallery"><h2>한 해 동안 피어난<br /><em>우리의 기쁨</em></h2><div className="gallery-editorial"><InvitationMediaView className="gallery-portrait" media={galleryMedia[0] ?? null} fallback={HERO_IMAGE} alt="흰 레이스 의상을 입은 채원이" /><div className="gallery-side-story"><p>채원이와 함께한<br />가장 따스한 계절</p></div></div></Section>

    <section className="love-transition"><InvitationMediaView className="seasonal-transition-media" media={galleryMedia[1] ?? null} fallback={HERO_IMAGE} alt="벚꽃 아래 환하게 웃는 채원이" /><div><p>A year of love,</p><strong>a lifetime of joy.</strong></div></section>
    {galleryMedia.slice(2).length > 0 && <section className="memory-strip"><div className="extra-gallery">{galleryMedia.slice(2).map((media, index) => <InvitationMediaView className={index === 0 ? "gallery-blossom-close" : "gallery-blossom"} key={`${media.url}-${index}`} media={media} fallback={HERO_IMAGE} alt={index === 0 ? "벚꽃 아래 환하게 웃는 채원이" : "벚꽃 아래의 채원이"} />)}</div></section>}

    <Section label="DATE & VENUE" className="venue-section"><div className="date-venue-card"><div className="date-block"><p>DATE & TIME</p><h2>2026. 10. 18</h2><span>일요일 낮 12시 00분</span><div className="calendar-row"><b>OCT</b><i>18</i><span>SUN</span></div></div><div className="venue-divider" /><div className="venue-block"><p>VENUE</p><h3>{formatVenueDisplay(invite.venueName)}</h3><span>{invite.venueAddress}</span><VenueMap /><div className="map-actions"><a href={venueLinks.naver} target="_blank" rel="noreferrer">네이버지도</a><a href={venueLinks.kakaoMap} target="_blank" rel="noreferrer">카카오맵</a></div><div className="parking-note"><MapPin size={16} /><p><b>주차 안내</b>{invite.parkingInfo}</p></div></div></div></Section>

    <Section label="RESERVATION" className="rsvp-hotel"><div className="rsvp-heading"><h2>참석 여부를<br /><em>알려주세요</em></h2><p>행사 준비를 위해 소중한 응답을 부탁드립니다.</p></div>{rsvpSent ? <div className="rsvp-complete"><span>THANK YOU</span><b>응답이 전달되었습니다</b><p>채원이의 첫 생일에 함께해 주셔서 감사합니다.</p></div> : <form onSubmit={submitRsvp}><div className="attendance-options"><button type="button" onClick={() => setRsvp({ ...rsvp, attendance: "attending" })} className={rsvp.attendance === "attending" ? "active" : ""}>참석하겠습니다</button><button type="button" onClick={() => setRsvp({ ...rsvp, attendance: "unable" })} className={rsvp.attendance === "unable" ? "active" : ""}>참석이 어렵습니다</button></div><RsvpAttendeeFields attendees={rsvp.attendees} onChange={attendees => setRsvp({ ...rsvp, attendees })} /><label>연락처 <small>(선택)</small><input value={rsvp.contact} onChange={event => setRsvp({ ...rsvp, contact: event.target.value })} maxLength={40} /></label><button className="hotel-primary" disabled={addRsvp.isPending}>응답 보내기</button><p className="form-privacy">연락처는 행사 안내를 위해서만 사용하며, 행사 종료 후 정리합니다.</p></form>}</Section>

    <Section label="GUESTBOOK" className="guestbook-hotel">
      <h2>채원이에게<br /><em>축하 메시지를 남겨주세요</em></h2>
      <form className="guestbook-form" onSubmit={submitGuestbook}>
        <div className="guestbook-row">
          <div className="guestbook-field">
            <label className="guestbook-label">
              <span>대표 이름</span>
            </label>
            <input
              value={guestName}
              onChange={event => setGuestName(event.target.value)}
              maxLength={40}
              placeholder="성함을 입력해 주세요"
            />
          </div>
          <div className="guestbook-field">
            <label className="guestbook-label">
              <span>비밀번호</span>
              <small>(삭제 시 필요)</small>
            </label>
            <input
              type="password"
              value={guestPassword}
              onChange={event => setGuestPassword(event.target.value)}
              maxLength={12}
              placeholder="4자리 숫자 권장"
            />
          </div>
        </div>

        <div className="guestbook-companion-wrap">
          <CompanionFields
            title="함께 남기는 일행"
            labelPrefix="일행 이름"
            max={9}
            names={guestCompanions}
            onChange={setGuestCompanions}
            onAdd={() => setGuestCompanions(addCompanionInput(guestCompanions, 9))}
            onRemove={index => setGuestCompanions(removeCompanionInput(guestCompanions, index))}
          />
        </div>

        <div className="guestbook-field message-field">
          <label className="guestbook-label">
            <span>축하 메시지</span>
          </label>
          <textarea
            value={guestMessage}
            onChange={event => setGuestMessage(event.target.value)}
            maxLength={300}
            placeholder="채원이를 향한 따뜻한 축하의 마음을 적어주세요"
          />
        </div>

        <div className="guestbook-footer">
          <small>{guestMessage.length} / 300</small>
          <button className="hotel-primary" disabled={addGuestbook.isPending}>
            <MessageCircle size={15} /> 축하 메시지 남기기
          </button>
        </div>

        <p className="form-privacy light">작성하신 이름과 메시지는 초대장에 공개되며, 설정하신 비밀번호로 언제든 삭제하실 수 있습니다.</p>
      </form>

      <div className="message-list">
        {(guestbook.data ?? []).map(entry => (
          <article key={entry.id}>
            <p>{entry.message}</p>
            <footer>
              <span>{new Date(entry.createdAt).toLocaleDateString("ko-KR")}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <b><PartyNameLabel primaryName={entry.authorName} companionNames={entry.companionNames} /></b>
                <button
                  type="button"
                  style={{
                    border: "1px solid #c9a38055",
                    background: "transparent",
                    color: "#a48e7f",
                    fontSize: "11px",
                    padding: "2px 7px",
                    borderRadius: "2px",
                    cursor: "pointer"
                  }}
                  onClick={() => handleDeleteRequest(entry)}
                >
                  삭제
                </button>
              </div>
            </footer>
          </article>
        ))}
        {(guestbook.data?.length ?? 0) === 0 && <p className="message-more">첫 번째 축하 메시지를 남겨주세요.</p>}
      </div>

      {deleteTarget && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(20, 13, 10, 0.75)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div style={{
            background: "#fffdfa",
            border: "1px solid #d4be88",
            padding: "28px 24px",
            maxWidth: "360px",
            width: "100%",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            color: "#382319",
            textAlign: "center"
          }}>
            <h3 style={{ margin: "0 0 10px", fontFamily: "'Noto Serif KR', serif", fontSize: "18px" }}>방명록 삭제</h3>
            <p style={{ fontSize: "13px", color: "#776356", margin: "0 0 20px", lineHeight: "1.6" }}>
              <b>{deleteTarget.authorName}</b> 님이 작성하신 방명록을 삭제하시려면 작성 시 설정하신 비밀번호를 입력해 주세요.
            </p>
            <form onSubmit={confirmDeleteWithPassword} style={{ display: "grid", gap: "14px" }}>
              <input
                type="password"
                placeholder="비밀번호 입력"
                value={deletePasswordInput}
                onChange={e => setDeletePasswordInput(e.target.value)}
                autoFocus
                style={{
                  width: "100%",
                  minHeight: "44px",
                  padding: "10px 12px",
                  border: "1px solid #b8987b",
                  background: "#fff",
                  fontSize: "15px",
                  textAlign: "center"
                }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <button
                  type="button"
                  style={{
                    padding: "11px",
                    border: "1px solid #d2bba0",
                    background: "#f4ede4",
                    color: "#5b4a3f",
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                  onClick={() => setDeleteTarget(null)}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={deleteGuestbook.isPending}
                  style={{
                    padding: "11px",
                    border: "1px solid #a83d33",
                    background: "#b84236",
                    color: "#fff",
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  {deleteGuestbook.isPending ? "삭제 중…" : "삭제하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Section>

    <AccountSection accounts={accounts} copyAccount={copyAccount} />

    <section className="hotel-closing"><div className="closing-ribbon">⌇</div><p>채원이의 첫 번째 생일을<br /><em>함께 축하해 주셔서 감사합니다.</em></p></section>
    <div className="music-control">{!hasStartedMusic && !musicPlaying && <BgmGuide onActivate={async () => { await toggleMusic(); }} />}<button aria-label={musicPlaying ? "배경음악 일시정지" : "배경음악 재생"} onClick={toggleMusic}>{musicPlaying ? <Pause size={20} /> : <Play size={20} />}<span>BGM</span></button></div>
    <nav className="share-bar"><button onClick={share}><Share2 size={16} /> 카카오톡 공유</button><button onClick={() => copy(location.href, "초대장 링크")}><Copy size={16} /> 링크 복사</button></nav>
  </main>;
}
