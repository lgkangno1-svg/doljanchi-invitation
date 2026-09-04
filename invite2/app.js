const form = document.querySelector('#rsvp-form');
const success = document.querySelector('#rsvp-success');
const toast = document.querySelector('#toast');
const RSVP_NOTE_PREFIX = '[invite2] ';
const RSVP_NOTE_MAX_LENGTH = 300;
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function createRsvpNote(value) {
  const note = value.trim().slice(0, RSVP_NOTE_MAX_LENGTH - RSVP_NOTE_PREFIX.length);
  return note ? `${RSVP_NOTE_PREFIX}${note}` : '[invite2] 조부모님 지인용 초대장';
}

let selectedAttendance = 'attending';
const adultsInput = form.querySelector('input[name="adults"]');
const childrenInput = form.querySelector('input[name="children"]');
const nameInput = form.querySelector('input[name="name"]');
const companionsInput = form.querySelector('input[name="companions"]');
const contactInput = form.querySelector('input[name="contact"]');
const noteInput = form.querySelector('textarea[name="note"]');

document.querySelectorAll('.attendance').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.attendance').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  selectedAttendance = button.dataset.value;
  const unable = button.dataset.value === 'unable';
  if (unable) {
    if (adultsInput) adultsInput.value = '0';
    if (childrenInput) childrenInput.value = '0';
  } else if (adultsInput && Number(adultsInput.value) === 0) {
    adultsInput.value = '1';
  }
}));

document.querySelectorAll('.account-row').forEach(button => button.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(button.dataset.account);
    showToast('계좌번호를 복사했습니다');
  } catch {
    showToast('계좌번호를 길게 눌러 복사해 주세요');
  }
}));

document.querySelector('#share-button').addEventListener('click', async () => {
  const data = { title: '강채원의 첫 번째 생일', text: '소중한 분들을 채원이의 첫돌에 초대합니다.', url: location.href };
  try {
    if (navigator.share) await navigator.share(data);
    else {
      await navigator.clipboard.writeText(location.href);
      showToast('초대장 주소를 복사했습니다');
    }
  } catch (error) {
    if (error && error.name !== 'AbortError') showToast('공유하지 못했습니다');
  }
});

const audio = document.querySelector('#bgm');
const musicButton = document.querySelector('#music-button');
musicButton.addEventListener('click', async () => {
  try {
    if (audio.paused) {
      await audio.play();
      musicButton.textContent = '정지';
      musicButton.setAttribute('aria-label', '배경음악 일시정지');
    } else {
      audio.pause();
      musicButton.textContent = '음악';
      musicButton.setAttribute('aria-label', '배경음악 재생');
    }
  } catch {
    showToast('음악을 재생할 수 없습니다');
  }
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const submit = form.querySelector('button[type="submit"]');
  const name = (nameInput ? nameInput.value : '').trim();
  if (!name) {
    showToast('성함을 입력해 주세요');
    if (nameInput) nameInput.focus();
    return;
  }
  const companions = (companionsInput ? companionsInput.value : '').split(',').map(value => value.trim()).filter(Boolean).slice(0, 19);
  const attendance = selectedAttendance;
  const adults = Math.max(0, Math.min(20, Number(adultsInput ? adultsInput.value : 0) || 0));
  const children = Math.max(0, Math.min(20, Number(childrenInput ? childrenInput.value : 0) || 0));
  if (attendance === 'attending' && adults + children < 1) {
    showToast('참석 인원을 입력해 주세요');
    return;
  }
  const payload = {
    name,
    companionNames: companions,
    attendeeDetails: [],
    attendance,
    adults,
    children,
    meal: true,
    contact: (contactInput ? contactInput.value : '').trim(),
    note: createRsvpNote(noteInput ? noteInput.value : ''),
  };
  submit.disabled = true;
  submit.textContent = '전송 중...';
  try {
    const response = await fetch('/api/trpc/invitation.addRsvp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json: payload }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || (data && data.error)) {
      throw new Error(data?.error?.json?.message || data?.error?.message || 'RSVP failed');
    }
    form.hidden = true;
    success.hidden = false;
    success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast('참석 여부가 전달되었습니다');
  } catch (error) {
    console.error(error);
    showToast('전송에 실패했습니다. 잠시 후 다시 시도해 주세요');
  } finally {
    submit.disabled = false;
    submit.textContent = '응답 보내기';
  }
});
