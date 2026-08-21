import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Eye, EyeOff, LogOut, Save, Trash2 } from "lucide-react";

export default function Admin() {
  const [, navigate] = useLocation(); const { user, loading, isAuthenticated, logout } = useAuth();
  const query = trpc.admin.dashboard.useQuery(undefined, { enabled: !!user && user.role === "admin" });
  const update = trpc.admin.updateInvitation.useMutation({ onSuccess: () => { query.refetch(); toast.success("초대장 정보가 저장되었어요."); } });
  const hide = trpc.admin.hideGuestbook.useMutation({ onSuccess: () => query.refetch() }); const remove = trpc.admin.deleteGuestbook.useMutation({ onSuccess: () => query.refetch() });
  const [form, setForm] = useState<any>(null);
  useEffect(() => { if (query.data?.invitation && !form) setForm(query.data.invitation); }, [query.data, form]);
  useEffect(() => { if (!loading && (!isAuthenticated || user?.role !== "admin")) navigate("/"); }, [loading, isAuthenticated, user, navigate]);
  if (loading || !form || !query.data) return <div className="admin-loading">관리자 화면을 준비하고 있어요…</div>;
  const field = (key: string, label: string, multi = false) => <label className="admin-field">{label}{multi ? <textarea value={form[key] ?? ""} onChange={e => setForm({ ...form, [key]: e.target.value })} /> : <input value={form[key] ?? ""} onChange={e => setForm({ ...form, [key]: e.target.value })} />}</label>;
  return <main className="admin-shell"><header className="admin-header"><div><p className="eyebrow">INVITATION STUDIO</p><h1>초대장 관리</h1></div><button onClick={() => { logout(); navigate("/"); }}><LogOut size={16} /> 로그아웃</button></header><section className="admin-card"><h2>초대장 정보</h2><div className="admin-grid">{field("babyName", "아이 이름")}{field("invitationTitle", "초대 문구")}{field("eventDate", "날짜")}{field("eventTime", "시간")}{field("venueName", "행사장명")}{field("venueAddress", "주소")}{field("parkingInfo", "주차 안내", true)}{field("greeting", "인사말", true)}{field("accountInfo", "계좌 안내 (줄바꿈으로 구분)", true)}</div><button className="primary-button admin-save" onClick={() => update.mutate(form)} disabled={update.isPending}><Save size={16} /> 저장하기</button></section><section className="admin-card"><div className="admin-section-title"><h2>참석 응답 <span>{query.data.rsvps.length}</span></h2><div className="stats">참석 {query.data.rsvps.filter(r => r.attendance === "attending").length}명 · 성인 {query.data.rsvps.reduce((sum, r) => sum + r.adults, 0)} · 아이 {query.data.rsvps.reduce((sum, r) => sum + r.children, 0)}</div></div><div className="admin-table">{query.data.rsvps.length === 0 ? <p className="empty">아직 도착한 응답이 없어요.</p> : query.data.rsvps.map(r => <div className="admin-row" key={r.id}><strong>{r.name}</strong><span>{r.attendance === "attending" ? "참석" : "불참"} · 성인 {r.adults} · 아이 {r.children}</span><small>{r.note || "메모 없음"}</small></div>)}</div></section><section className="admin-card"><div className="admin-section-title"><h2>방명록 <span>{query.data.guestbook.length}</span></h2><p>숨김 처리된 글도 함께 표시됩니다.</p></div><div className="admin-table">{query.data.guestbook.map(entry => <div className={`admin-row ${entry.isHidden ? "is-hidden" : ""}`} key={entry.id}><div><strong>{entry.authorName}</strong><p>{entry.message}</p></div><div className="row-actions"><button onClick={() => hide.mutate({ id: entry.id, hidden: !Boolean(entry.isHidden) })}>{entry.isHidden ? <Eye size={16} /> : <EyeOff size={16} />}</button><button onClick={() => remove.mutate({ id: entry.id })}><Trash2 size={16} /></button></div></div>)}</div></section></main>;
}
