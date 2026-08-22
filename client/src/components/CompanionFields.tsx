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
};

export function CompanionFields({ title, labelPrefix, max, names, onChange, onAdd, onRemove }: CompanionFieldsProps) {
  return <div className="companion-inputs"><div><span>{title} <small>(선택)</small></span>{names.length < max && <button type="button" onClick={onAdd}>+ 일행 추가</button>}</div>{names.map((name, index) => <label key={index}>{labelPrefix} {index + 1}<input value={name} maxLength={80} onChange={event => onChange(names.map((current, position) => position === index ? event.target.value : current))} /><button type="button" aria-label={`일행 ${index + 1} 삭제`} onClick={() => onRemove(index)}>×</button></label>)}</div>;
}

export function PartyNameLabel({ primaryName, companionNames }: { primaryName: string; companionNames: string | null | undefined }) {
  return <span className="party-name-label">{displayPartyNames(primaryName, companionNames)}</span>;
}
