import React from "react";
import type { RsvpAgeGroup, RsvpAttendee, RsvpAttendeeRole } from "@/lib/rsvp-attendees";
import { RSVP_ROLE_LABEL } from "@/lib/rsvp-attendees";

type Props = {
  attendees: RsvpAttendee[];
  onChange: (attendees: RsvpAttendee[]) => void;
  max?: number;
};

const coreRoles: RsvpAttendeeRole[] = ["father", "mother", "baby"];
const ageLabel: Record<RsvpAgeGroup, string> = { under12: "12세 미만", over12: "12세 이상" };
const placeholders: Record<RsvpAttendeeRole, string> = { father: "아빠 성함", mother: "엄마 성함", baby: "아기 이름", guest: "일행 성함" };

export function RsvpAttendeeFields({ attendees, onChange, max = 20 }: Props) {
  const replace = (index: number, patch: Partial<RsvpAttendee>) => onChange(attendees.map((attendee, current) => current === index ? { ...attendee, ...patch } : attendee));
  const findCore = (role: RsvpAttendeeRole) => attendees.findIndex(attendee => attendee.role === role);
  const addGuest = () => onChange([...attendees, { role: "guest", name: "", ageGroup: "over12" }]);

  const attendeeCard = (index: number, attendee: RsvpAttendee, removable = false) => <div className={`rsvp-person-card ${attendee.role === "baby" ? "is-baby" : ""}`} key={`${attendee.role}-${index}`}>
    <div className="rsvp-person-head"><span>{RSVP_ROLE_LABEL[attendee.role]}</span>{attendee.role === "baby" && <small>함께 오면 꼭 성함을 적어주세요</small>}{removable && <button type="button" aria-label="추가 일행 삭제" onClick={() => onChange(attendees.filter((_, current) => current !== index))}>×</button>}</div>
    <label className="rsvp-person-name"><span className="sr-only">{RSVP_ROLE_LABEL[attendee.role]} 성함</span><input value={attendee.name} maxLength={80} placeholder={placeholders[attendee.role]} onChange={event => replace(index, { name: event.target.value })} /></label>
    <fieldset className="rsvp-age-options"><legend>{RSVP_ROLE_LABEL[attendee.role]} 연령</legend>{(["under12", "over12"] as RsvpAgeGroup[]).map(ageGroup => <label key={ageGroup}><input type="radio" name={`age-${attendee.role}-${index}`} checked={attendee.ageGroup === ageGroup} onChange={() => replace(index, { ageGroup })} /><span>{ageLabel[ageGroup]}</span></label>)}</fieldset>
  </div>;

  return <div className="rsvp-attendee-fields"><div className="rsvp-attendee-guide" role="note"><strong>함께 참석하시는 모든 분의 성함을 정확히 적어 주세요.</strong><span>아기가 함께 오면 <b>아기 이름</b>도 적고, 각 분의 <b>12세 미만 · 12세 이상</b>을 선택해 주세요.</span></div><div className="rsvp-family-grid">{coreRoles.map(role => { const index = findCore(role); return index >= 0 ? attendeeCard(index, attendees[index]!) : null; })}</div><div className="rsvp-guest-list">{attendees.map((attendee, index) => attendee.role === "guest" ? attendeeCard(index, attendee, true) : null)}</div>{attendees.length < max && <button className="rsvp-add-person" type="button" onClick={addGuest}><b>+</b><span>다른 가족 · 일행 추가</span></button>}</div>;
}
