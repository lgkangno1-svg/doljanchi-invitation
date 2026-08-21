import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { parseMedia, parseMediaList, type InvitationMedia } from "@/lib/invitation-media";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Eye, EyeOff, ImagePlus, LogOut, Save, Trash2, X } from "lucide-react";

const ACCEPT_MEDIA = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm";
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_VIDEO_BYTES = 30 * 1024 * 1024;

function MediaThumb({ media }: { media: InvitationMedia }) {
  return media.kind === "video" ? <video src={media.url} muted loop playsInline /> : <img src={media.url} alt={media.fileName} />;
}

export default function Admin() {
  const [, navigate] = useLocation(); const { user, loading, isAuthenticated, logout } = useAuth();
  const query = trpc.admin.dashboard.useQuery(undefined, { enabled: !!user && user.role === "admin" });
  const update = trpc.admin.updateInvitation.useMutation({ onSuccess: () => { query.refetch(); toast.success("초대장 정보가 저장되었어요."); } });
  const upload = trpc.admin.uploadMedia.useMutation(); const saveMedia = trpc.admin.saveMedia.useMutation({ onSuccess: () => { query.refetch(); toast.success("사진과 동영상 구성이 저장되었어요."); } });
  const hide = trpc.admin.hideGuestbook.useMutation({ onSuccess: () => query.refetch() }); const remove = trpc.admin.deleteGuestbook.useMutation({ onSuccess: () => query.refetch() });
  const [form, setForm] = useState<any>(null);
  const [media, setMedia] = useState<{ hero: InvitationMedia | null; gallery: InvitationMedia[] } | null>(null);
  useEffect(() => { if (query.data?.invitation && !form) setForm(query.data.invitation); }, [query.data, form]);
  useEffect(() => { if (query.data?.invitation && !media) setMedia({ hero: parseMedia(query.data.invitation.heroImageUrl), gallery: parseMediaList(query.data.invitation.galleryImageUrls) }); }, [query.data, media]);
  useEffect(() => { if (!loading && (!isAuthenticated || user?.role !== "admin")) navigate("/"); }, [loading, isAuthenticated, user, navigate]);
  if (loading || !form || !query.data || !media) return <div className="admin-loading">관리자 화면을 준비하고 있어요…</div>;
  const field = (key: string, label: string, multi = false) => <label className="admin-field">{label}{multi ? <textarea value={form[key] ?? ""} onChange={event => setForm({ ...form, [key]: event.target.value })} /> : <input value={form[key] ?? ""} onChange={event => setForm({ ...form, [key]: event.target.value })} />}</label>;
  const handleFiles = (files: FileList | null, target: "hero" | "gallery") => {
    const file = files?.[0]; if (!file) return;
    const isVideo = file.type.startsWith("video/"); const max = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (!ACCEPT_MEDIA.split(",").includes(file.type)) return toast.error("JPG, PNG, WEBP, GIF, MP4, WEBM 파일만 업로드할 수 있어요.");
    if (file.size > max) return toast.error(isVideo ? "동영상은 30MB 이하만 업로드할 수 있어요." : "사진과 GIF는 12MB 이하만 업로드할 수 있어요.");
    const reader = new FileReader(); reader.onload = () => { const dataBase64 = String(reader.result).split(",")[1]; if (!dataBase64) return toast.error("파일을 읽을 수 없어요."); upload.mutate({ fileName: file.name, mimeType: file.type, dataBase64 }, { onSuccess: uploaded => { setMedia(current => { if (!current) return current; return target === "hero" ? { ...current, hero: uploaded } : { ...current, gallery: [...current.gallery, uploaded].slice(0, 8) }; }); toast.success(target === "hero" ? "히어로 미디어가 추가되었어요." : "갤러리 미디어가 추가되었어요."); }, onError: error => toast.error(error.message) }); }; reader.readAsDataURL(file);
  };
  return <main className="admin-shell"><header className="admin-header"><div><p className="eyebrow">INVITATION STUDIO</p><h1>초대장 관리</h1></div><button onClick={() => { logout(); navigate("/"); }}><LogOut size={16} /> 로그아웃</button></header>
    <section className="admin-card"><h2>초대장 정보</h2><div className="admin-grid">{field("babyName", "아이 이름")}{field("fatherName", "아빠 성함")}{field("motherName", "엄마 성함")}{field("invitationTitle", "초대 문구")}{field("eventDate", "날짜")}{field("eventTime", "시간")}{field("venueName", "행사장명")}{field("venueAddress", "주소")}{field("parkingInfo", "주차 안내", true)}{field("greeting", "인사말", true)}{field("accountInfo", "계좌 안내 (줄바꿈으로 구분)", true)}</div><button className="primary-button admin-save" onClick={() => update.mutate(form)} disabled={update.isPending}><Save size={16} /> 저장하기</button></section>
    <section className="admin-card media-manager"><div className="admin-section-title"><h2>사진 · GIF · 동영상</h2><p>사진/GIF 최대 12MB, MP4/WEBM 최대 30MB · 갤러리 8개</p></div><div className="media-slots"><div className="media-slot hero-slot"><span className="media-slot-label">히어로 미디어</span>{media.hero ? <><MediaThumb media={media.hero} /><button className="remove-media" onClick={() => setMedia({ ...media, hero: null })}><X size={14} /></button></> : <div className="media-empty">첫 화면에 보여줄 사진 또는 영상</div>}<label className="media-upload"><ImagePlus size={15} /> {media.hero ? "교체하기" : "업로드"}<input type="file" accept={ACCEPT_MEDIA} onChange={event => handleFiles(event.target.files, "hero")} /></label></div><div className="gallery-slots"><span className="media-slot-label">갤러리 미디어 · 좌우 버튼으로 순서 변경</span><div className="gallery-thumb-grid">{media.gallery.map((item, index) => <div className="gallery-thumb" key={`${item.url}-${index}`}><MediaThumb media={item} /><div className="gallery-order"><button disabled={index === 0} aria-label="앞으로 이동" onClick={() => { const gallery = [...media.gallery]; [gallery[index - 1], gallery[index]] = [gallery[index], gallery[index - 1]]; setMedia({ ...media, gallery }); }}><ChevronLeft size={12} /></button><button disabled={index === media.gallery.length - 1} aria-label="뒤로 이동" onClick={() => { const gallery = [...media.gallery]; [gallery[index], gallery[index + 1]] = [gallery[index + 1], gallery[index]]; setMedia({ ...media, gallery }); }}><ChevronRight size={12} /></button></div><button className="gallery-remove" onClick={() => setMedia({ ...media, gallery: media.gallery.filter((_, currentIndex) => currentIndex !== index) })}><X size={13} /></button></div>)}{media.gallery.length < 8 && <label className="gallery-upload"><ImagePlus size={18} /> 추가<input type="file" accept={ACCEPT_MEDIA} onChange={event => handleFiles(event.target.files, "gallery")} /></label>}</div></div></div><button className="primary-button admin-save" onClick={() => saveMedia.mutate(media)} disabled={saveMedia.isPending || upload.isPending}><Save size={16} /> 미디어 구성 저장</button></section>
    <section className="admin-card"><div className="admin-section-title"><h2>참석 응답 <span>{query.data.rsvps.length}</span></h2><div className="stats">참석 {query.data.rsvps.filter(response => response.attendance === "attending").length}명 · 성인 {query.data.rsvps.reduce((sum, response) => sum + response.adults, 0)} · 아이 {query.data.rsvps.reduce((sum, response) => sum + response.children, 0)}</div></div><div className="admin-table">{query.data.rsvps.length === 0 ? <p className="empty">아직 도착한 응답이 없어요.</p> : query.data.rsvps.map(response => <div className="admin-row" key={response.id}><strong>{response.name}</strong><span>{response.attendance === "attending" ? "참석" : "불참"} · 성인 {response.adults} · 아이 {response.children}</span><small>{response.note || "메모 없음"}</small></div>)}</div></section>
    <section className="admin-card"><div className="admin-section-title"><h2>방명록 <span>{query.data.guestbook.length}</span></h2><p>숨김 처리된 글도 함께 표시됩니다.</p></div><div className="admin-table">{query.data.guestbook.map(entry => <div className={`admin-row ${entry.isHidden ? "is-hidden" : ""}`} key={entry.id}><div><strong>{entry.authorName}</strong><p>{entry.message}</p></div><div className="row-actions"><button onClick={() => hide.mutate({ id: entry.id, hidden: !Boolean(entry.isHidden) })}>{entry.isHidden ? <Eye size={16} /> : <EyeOff size={16} />}</button><button onClick={() => remove.mutate({ id: entry.id })}><Trash2 size={16} /></button></div></div>)}</div></section></main>;
}
