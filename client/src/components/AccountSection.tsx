import React, { useState } from "react";
import { ChevronDown, ChevronUp, Copy } from "lucide-react";

export type InvitationAccount = { label: string; value: string };

export function AccountSection({ accounts, copyAccount }: { accounts: InvitationAccount[]; copyAccount: (value: string) => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const copy = async (value: string) => { const copied = await copyAccount(value); setFeedback(copied ? "복사되었습니다" : "복사할 수 없어요. 길게 눌러 복사해 주세요."); };
  return <section className="hotel-section gift-section"><p className="section-label">WITH LOVE</p><button className="gift-toggle" aria-label="계좌번호 확인하기" onClick={() => setOpen(!open)}><span><small>마음 전하실 곳</small><b>계좌번호 확인하기</b></span>{open ? <ChevronUp /> : <ChevronDown />}</button>{open && <div className="gift-accounts">{accounts.map(account => <div key={account.label}><span><small>{account.label}</small><b>{account.value}</b></span><button aria-label={`${account.label} 계좌번호 복사`} onClick={() => { void copy(account.value); }}><Copy size={15} /> 계좌번호 복사</button></div>)}</div>}{feedback && <p className="account-copy-feedback" role="status">{feedback}</p>}<p>멀리서 마음을 전해주시는 분들을 위해<br />조심스럽게 계좌번호를 안내드립니다.</p></section>;
}
