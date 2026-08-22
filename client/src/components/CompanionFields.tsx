import React from "react";
import { displayPartyNames } from "@/lib/companions";

type CompanionFieldsProps = {
  title: string;
  labelPrefix: string;
  max: number;
  names: string[];
  onChange: (names: string[]) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  guidance?: React.ReactNode;
};

export function CompanionFields({ title, labelPrefix, max, names, onChange, onAdd, onRemove, guidance }: CompanionFieldsProps) {
  return (
    <div className="companion-inputs">
      {guidance && <div className="companion-guidance" role="note">{guidance}</div>}
      <div className="companion-header">
        <span>{title} <small>(선택)</small></span>
        {names.length < max && (
          <button className="companion-add-button" type="button" aria-label="오른쪽 추가 버튼으로 일행 성함 입력칸 추가" onClick={onAdd}>
            <b aria-hidden="true">+</b>
            <span>일행 추가</span>
          </button>
        )}
      </div>
      {names.map((name, index) => (
        <label key={index} className="companion-item">
          <span>{labelPrefix} {index + 1}</span>
          <input
            value={name}
            maxLength={80}
            placeholder="동행자 성함"
            onChange={event => onChange(names.map((current, position) => position === index ? event.target.value : current))}
          />
          <button type="button" aria-label={`일행 ${index + 1} 삭제`} onClick={() => onRemove(index)}>×</button>
        </label>
      ))}
    </div>
  );
}

export function PartyNameLabel({ primaryName, companionNames }: { primaryName: string; companionNames: string | null | undefined }) {
  return <span className="party-name-label">{displayPartyNames(primaryName, companionNames)}</span>;
}

