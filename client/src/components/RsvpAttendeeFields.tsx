import React from "react";
import type { RsvpAgeGroup, RsvpAttendee } from "@/lib/rsvp-attendees";

type Props = {
  attendees: RsvpAttendee[];
  onChange: (attendees: RsvpAttendee[]) => void;
  max?: number;
};

const ageLabel: Record<RsvpAgeGroup, string> = {
  under12: "12세 미만 (자녀·아기)",
  over12: "12세 이상 (성인)",
};

export function RsvpAttendeeFields({ attendees, onChange, max = 20 }: Props) {
  const replace = (index: number, patch: Partial<RsvpAttendee>) => {
    onChange(
      attendees.map((attendee, current) =>
        current === index ? { ...attendee, ...patch } : attendee
      )
    );
  };

  const addGuest = (isChild = false) => {
    onChange([
      ...attendees,
      {
        role: isChild ? "baby" : "guest",
        name: "",
        ageGroup: isChild ? "under12" : "over12",
      },
    ]);
  };

  const removeAttendee = (index: number) => {
    onChange(attendees.filter((_, current) => current !== index));
  };

  const primaryAttendee = attendees[0] ?? { role: "guest", name: "", ageGroup: "over12" };
  const companionAttendees = attendees.slice(1);

  return (
    <div className="rsvp-attendee-fields">
      <div className="rsvp-attendee-guide" role="note">
        <strong>참석하시는 분의 성함을 입력해 주세요.</strong>
        <span style={{ wordBreak: "keep-all", lineHeight: "1.6", display: "block" }}>
          함께 오시는 가족이나 자녀가 있으신 경우<br />
          아래 <b>'+ 동행 가족 · 자녀 · 일행 추가'</b> 버튼을 눌러 추가해 주세요.
        </span>
      </div>

      {/* 1. Primary Attendee (대표 성함) */}
      <div className="rsvp-person-card primary-person">
        <div className="rsvp-person-head">
          <span>참석자 성함</span>
        </div>
        <label className="rsvp-person-name">
          <span className="sr-only">성함</span>
          <input
            value={primaryAttendee.name}
            maxLength={80}
            placeholder="성함을 입력해 주세요"
            onChange={(event) => replace(0, { name: event.target.value })}
          />
        </label>
      </div>

      {/* 2. Companions (추가된 일행/자녀 목록) */}
      {companionAttendees.length > 0 && (
        <div className="rsvp-guest-list">
          {companionAttendees.map((attendee, compIdx) => {
            const actualIndex = compIdx + 1;
            return (
              <div
                className={`rsvp-person-card ${attendee.ageGroup === "under12" ? "is-baby" : ""}`}
                key={`companion-${actualIndex}`}
              >
                <div className="rsvp-person-head">
                  <span>동행 일행 {compIdx + 1}</span>
                  <button
                    type="button"
                    aria-label="일행 삭제"
                    onClick={() => removeAttendee(actualIndex)}
                  >
                    ×
                  </button>
                </div>
                <label className="rsvp-person-name">
                  <span className="sr-only">일행 성함</span>
                  <input
                    value={attendee.name}
                    maxLength={80}
                    placeholder="동행자 성함 또는 자녀 이름"
                    onChange={(event) =>
                      replace(actualIndex, { name: event.target.value })
                    }
                  />
                </label>
                <fieldset className="rsvp-age-options">
                  <legend>연령 구분</legend>
                  {(["over12", "under12"] as RsvpAgeGroup[]).map((ageGroup) => (
                    <label key={ageGroup}>
                      <input
                        type="radio"
                        name={`age-companion-${actualIndex}`}
                        checked={attendee.ageGroup === ageGroup}
                        onChange={() =>
                          replace(actualIndex, {
                            ageGroup,
                            role: ageGroup === "under12" ? "baby" : "guest",
                          })
                        }
                      />
                      <span>{ageLabel[ageGroup]}</span>
                    </label>
                  ))}
                </fieldset>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Add Companion Button */}
      {attendees.length < max && (
        <button
          className="rsvp-add-person"
          type="button"
          onClick={() => addGuest(false)}
        >
          <b>+</b>
          <span>동행 가족 · 자녀 · 일행 추가</span>
        </button>
      )}
    </div>
  );
}
