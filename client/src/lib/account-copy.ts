import { copyText } from "@/lib/copy";

export async function copyAccountNumber(value: string, copy = copyText) {
  return copy(value);
}

export function accountCopySuccessMessage() {
  return "복사되었습니다";
}
