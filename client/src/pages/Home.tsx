import { useMemo, useRef, useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { copyText } from "@/lib/copy";
import { accountCopySuccessMessage, copyAccountNumber } from "@/lib/account-copy";
import { buildVenueLinks, VENUE_MAP_SEARCH_QUERY } from "@/lib/venue-links";
import { formatVenueDisplay } from "@/lib/venue-display";
import { startBgmOnTap } from "@/lib/bgm";
import { addCompanionInput, normalizeCompanionNames, removeCompanionInput } from "@/lib/companions";
import { createInitialRsvpAttendees, summarizeRsvpAttendees } from "@/lib/rsvp-attendees";
import { CompanionFields, PartyNameLabel } from "@/components/CompanionFields";
import { RsvpAttendeeFields } from "@/components/RsvpAttendeeFields";
import { toast } from "sonner";
import { Copy, MapPin, MessageCircle, Pause, Play, Share2 } from "lucide-react";
import { AccountSection } from "@/components/AccountSection";

const HERO_IMAGE = "/manus-storage/invitations/1/1787323479492-chaewon-hotel-hero_a7c0aa2c.png?v=20260903-mobile-hero-2";
const BGM = "/manus-storage/chaewon-first-birthday-bgm_af29a8dc.mp3?v=20260903-blue-danube-2";
const BGM_FALLBACK = "https://upload.wikimedia.org/wikipedia/commons/transcoded/9/91/Strauss%2C_An_der_sch%C3%B6nen_blauen_Donau.ogg/Strauss%2C_An_der_sch%C3%B6nen_blauen_Donau.ogg.mp3";
const fallback = { id: 0, babyName: "채원", fatherName: "강호성", motherName: "NGUYEN HONG NGOC", invitationTitle: "채원의 첫 번째 생일에 소중한 분들을 초대합니다.", greeting: "저희에게 찾아온 가장 빛나는 선물, 채원이가 어느덧 첫 번째 생일을 맞았습니다. 그동안 보내주신 따뜻한 사랑에 감사드리며, 소중한 분들과 함께 채원이의 첫걸음을 축복하는 자리를 마련했습니다.", eventDate: "2026. 10. 18 SUN", eventTime: "12:00 PM", venueName: "코트야드 메리어트 서울 명동\n3층 한양 1+2홀", venueAddress: "서울특별시 중구 남대문로 9", parkingInfo: "호텔 지하 주차장을 이용하실 수 있습니다. 행사 당일 주차 등록 및 세부 안내는 호텔 데스크에서 확인해 주세요.", heroImageUrl: null, galleryImageUrls: null, accountInfo: "강호성 | 카카오뱅크 3333-19-8058955" };

function Section({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <section className={`hotel-section ${className}`}><p className="section-label">{label}</p>{children}</section>;
}

function VenueMap() { return <div className="venue-map"><iframe title="코트야드 메리어트 서울 명동 위치 지도" src={`https://maps.google.com/maps?q=${encodeURIComponent(VENUE_MAP_SEARCH_QUERY)}&t=&z=16&ie=UTF8&iwloc=&output=embed`} loading="lazy" /></div>; }

export default function Home() {
  const [, params] = useRoute("/invite/:slug");
  const slug = params?.slug ?? "invite-peach-ribbon-x7k2p";
  const inviteQuery = trpc.invitation.get.useQuery({ slug }, { staleTime: 30000 });
  const invite = inviteQuery.data ?? fallback;
  const guestbook = trpc.invitation.guestbook.useQuery({ slug }, { staleTime: 15000 });
  const [guestName, setGuestName] = useState("");
  const [guestCompanions, setGuestCompanions] = useState<string[]>([]);
  const [guestMessage, setGuestMessage] = useState("");

  const addGuestbook = trpc.invitation.addGuestbook.useMutation({
    onSuccess: () => {
      guestbook.refetch();
      setGuestName("");
      setGuestCompanions([]);
      setGuestMessage("");
      toast.success("채원이에게 축하 메시지가 전달되었어요.");
    }
  });

  const addRsvp = trpc.invitation.addRsvp.useMutation({ onSuccess: () => { setRsvpSent(true); toast.success("참석 여부가 전달되었어요."); } });
  const [rsvpSent, setRsvpSent] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [rsvp, setRsvp] = useState({ attendees: createInitialRsvpAttendees(), attendance: "attending" as "attending" | "unable", contact: "", note: "" });
  const accounts = useMemo(() => invite.accountInfo.split("\n").map(line => { const [label, ...rest] = line.split("|"); return { label: label?.trim() || "계좌", value: rest.join("|").trim() || line }; }), [invite.accountInfo]);
  const venueLinks = buildVenueLinks(invite.venueName, invite.venueAddress);
  const copy = async (value: string, label: string) => { if (await copyText(value)) toast.success(`${label} 복사 완료`); else toast.error("복사할 수 없어요. 길게 눌러 복사해 주세요."); };
  const copyAccount = async (value: string) => { const copied = await copyAccountNumber(value); if (copied) toast.success(accountCopySuccessMessage()); else toast.error("복사할 수 없어요. 길게 눌러 복사해 주세요."); return copied; };
  const share = async () => { const kakao = (window as any).Kakao; if (kakao?.Share?.sendDefault) { kakao.Share.sendDefault({ objectType: "feed", content: { title: `${invite.babyName}의 첫 번째 생일`, description: invite.invitationTitle, imageUrl: `${location.origin}${HERO_IMAGE}`, link: { mobileWebUrl: location.href, webUrl: location.href } } }); return; } if (navigator.share) await navigator.share({ title: `${invite.babyName}의 첫 번째 생일`, text: invite.invitationTitle, url: location.href }); else await copy(location.href, "초대장 링크"); };
  const submitGuestbook = (event: React.FormEvent) => { event.preventDefault(); if (!guestName.trim() || !guestMessage.trim()) return toast.error("이름과 축하 메시지를 모두 입력해 주세요."); addGuestbook.mutate({ name: guestName.trim(), companionNames: normalizeCompanionNames(guestCompanions), message: guestMessage.trim(), website: "" }); };
  const submitRsvp = (event: React.FormEvent) => { event.preventDefault(); const summary = summarizeRsvpAttendees(rsvp.attendees); if (!summary.primaryName) return toast.error("참석하시는 분의 성함을 한 분 이상 입력해 주세요."); addRsvp.mutate({ name: summary.primaryName, companionNames: summary.companionNames, attendeeDetails: summary.attendees, attendance: rsvp.attendance, adults: summary.adults, children: summary.children, contact: rsvp.contact, note: rsvp.note }); };
  const toggleMusic = async () => { const audio = audioRef.current; if (!audio) return; if (audio.paused) { try { const next = await startBgmOnTap(audio); setMusicPlaying(next.isPlaying); } catch { toast.error("음악을 재생할 수 없어요."); } } else { audio.pause(); setMusicPlaying(false); } };

  return <main className="hotel-invitation">
    <audio ref={audioRef} preload="auto" loop>
      <source src={BGM} type="audio/mpeg" />
      <source src={BGM_FALLBACK} type="audio/mpeg" />
    </audio>
    <section className="hotel-hero">
      <img src={HERO_IMAGE} alt="채원의 첫 번째 생일을 위한 호텔 스타일 케이크 테이블" />
      <div className="hero-veil" />
      <div className="hero-ribbon">⌇</div><div className="hero-seal"><span>FIRST YEAR</span><b>CW</b><i>2026</i></div>
      <div className="hero-content"><p>OUR BABY&apos;S FIRST BIRTHDAY</p><h1>강채원</h1><span className="hero-rule" /><strong>{invite.eventDate} · {invite.eventTime}</strong><small className="hero-venue">{formatVenueDisplay(invite.venueName)}</small></div>
      <div className="hero-scroll"><span>SCROLL TO CELEBRATE</span><b>↓</b></div>
    </section>

    <Section label="INVITATION" className="invitation-letter"><div className="monogram"><b>CW</b><small>ONE</small></div><h2>사랑을 담아<br /><em>초대합니다</em></h2><p>{invite.greeting}</p><div className="parents">아빠 <b>{invite.fatherName}</b><i /> 엄마 <b>{invite.motherName}</b></div></Section>

    <section className="love-transition"><img src={HERO_IMAGE} alt="채원이의 첫돌을 위한 축하 테이블" /><div><p>A year of love,</p><strong>a lifetime of joy.</strong></div></section>

    <Section label="DATE & VENUE" className="venue-section"><div className="date-venue-card"><div className="date-block"><p>DATE & TIME</p><h2>2026. 10. 18</h2><span>일요일 낮 12시 00분</span><div className="calendar-row"><b>OCT</b><i>18</i><span>SUN</span></div></div><div className="venue-divider" /><div className="venue-block"><p>VENUE</p><h3>{formatVenueDisplay(invite.venueName)}</h3><span>{invite.venueAddress}</span><VenueMap /><div className="map-actions"><a href={venueLinks.naver} target="_blank" rel="noreferrer">네이버지도</a><a href={venueLinks.kakaoMap} target="_blank" rel="noreferrer">카카오맵</a></div><div className="parking-note"><MapPin size={16} /><p><b>주차 안내</b>{invite.parkingInfo}</p></div></div></div></Section>

    <Section label="RESERVATION" className="rsvp-hotel"><div className="rsvp-heading"><h2>참석 여부를<br /><em>알려주세요</em></h2><p>행사 준비를 위해 소중한 응답을 부탁드립니다.</p></div>{rsvpSent ? <div className="rsvp-complete"><span>THANK YOU</span><b>응답이 전달되었습니다</b><p>채원이의 첫 생일에 함께해 주셔서 감사합니다.</p></div> : <form onSubmit={submitRsvp}><div className="attendance-options"><button type="button" onClick={() => setRsvp({ ...rsvp, attendance: "attending" })} className={rsvp.attendance === "attending" ? "active" : ""}>참석하겠습니다</button><button type="button" onClick={() => setRsvp({ ...rsvp, attendance: "unable" })} className={rsvp.attendance === "unable" ? "active" : ""}>참석이 어렵습니다</button></div><RsvpAttendeeFields attendees={rsvp.attendees} onChange={attendees => setRsvp({ ...rsvp, attendees })} /><label>연락처 <small>(선택)</small><input value={rsvp.contact} onChange={event => setRsvp({ ...rsvp, contact: event.target.value })} maxLength={40} /></label><button className="hotel-primary" disabled={addRsvp.isPending}>응답 보내기</button><p className="form-privacy">연락처는 행사 안내를 위해서만 사용하며, 행사 종료 후 정리합니다.</p></form>}</Section>

    <Section label="GUESTBOOK" className="guestbook-hotel">
      <h2>채원이에게<br /><em>축하 메시지를 남겨주세요</em></h2>
      <form className="guestbook-form" onSubmit={submitGuestbook}>
        <div className="guestbook-field">
          <label className="guestbook-label"><span>대표 이름</span></label>
          <input value={guestName} onChange={event => setGuestName(event.target.value)} maxLength={40} placeholder="성함을 입력해 주세요" />
        </div>

        <div className="guestbook-companion-wrap">
          <CompanionFields title="함께 남기는 일행" labelPrefix="일행 이름" max={9} names={guestCompanions} onChange={setGuestCompanions} onAdd={() => setGuestCompanions(addCompanionInput(guestCompanions, 9))} onRemove={index => setGuestCompanions(removeCompanionInput(guestCompanions, index))} />
        </div>

        <div className="guestbook-field message-field">
          <label className="guestbook-label"><span>축하 메시지</span></label>
          <textarea value={guestMessage} onChange={event => setGuestMessage(event.target.value)} maxLength={300} placeholder="채원이를 향한 따뜻한 축하의 마음을 적어주세요" />
        </div>

        <div className="guestbook-footer">
          <small>{guestMessage.length} / 300</small>
          <button className="hotel-primary" disabled={addGuestbook.isPending}><MessageCircle size={15} /> 축하 메시지 남기기</button>
        </div>

        <p className="form-privacy light">작성하신 이름과 메시지는 초대장에 공개됩니다.</p>
      </form>

      <div className="message-list">
        {guestbook.data?.map(message => <article key={message.id}><div className="message-topline"><div><span><PartyNameLabel primaryName={message.name} companionNames={message.companionNames} /></span><time>{new Date(message.createdAt).toLocaleDateString("ko-KR")}</time></div></div><p>{message.message}</p></article>)}
        {guestbook.data?.length === 0 && <p className="empty-message">첫 번째 축하 메시지를 남겨주세요.</p>}
      </div>
    </Section>

    <Section label="FOR YOUR HEART" className="account-hotel"><AccountSection accounts={accounts} onCopy={copyAccount} /></Section>

    <section className="hotel-closing"><div className="closing-ribbon">⌇</div><span>WITH LOVE,</span><h2>채원이의<br /><em>첫 번째 생일</em></h2><p>함께해 주시는 모든 분들께<br />진심으로 감사드립니다.</p><div className="closing-date"><b>2026</b><i>10 · 18</i></div></section>

    <div className="music-control">
      <button type="button" onClick={toggleMusic} aria-label={musicPlaying ? "배경 음악 일시정지" : "배경 음악 재생"}>
        {musicPlaying ? <Pause size={17} /> : <Play size={17} />}
        <span>BGM</span>
      </button>
    </div>

    <div className="share-bar">
      <button type="button" onClick={share}><Share2 size={15} /> 공유하기</button>
      <button type="button" onClick={() => copy(location.href, "초대장 링크")}><Copy size={15} /> 링크 복사</button>
    </div>
  </main>;
}
