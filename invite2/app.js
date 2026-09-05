const toast = document.querySelector('#toast');
let toastTimer;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
    return true;
  } catch {
    try {
      const input = document.createElement('textarea');
      input.value = text;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      const ok = document.execCommand('copy');
      input.remove();
      if (ok) {
        showToast(successMessage);
        return true;
      }
    } catch {}
    showToast('복사할 수 없습니다. 길게 눌러 복사해 주세요.');
    return false;
  }
}

// Broken remote gallery images fall back to the known hero image without affecting layout.
document.querySelectorAll('.collage-image[data-fallback]').forEach(image => {
  image.addEventListener('error', () => {
    const fallback = image.dataset.fallback;
    if (fallback && image.src !== fallback) image.src = fallback;
  }, { once: true });
});

// Account copy.
document.querySelectorAll('.account-row').forEach(button => {
  button.addEventListener('click', () => copyText(button.dataset.account || '', '계좌번호를 복사했습니다'));
});

// Music.
const audio = document.querySelector('#bgm');
const musicButton = document.querySelector('#music-button');
const musicGuide = document.querySelector('#music-guide');

function hideMusicGuide() {
  if (musicGuide) musicGuide.classList.add('hidden');
}

async function toggleMusic() {
  if (!audio || !musicButton) return;
  hideMusicGuide();
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
}

if (musicButton) musicButton.addEventListener('click', toggleMusic);
if (musicGuide) musicGuide.addEventListener('click', toggleMusic);

// Share modal.
const shareModal = document.querySelector('#share-modal');
const shareButton = document.querySelector('#share-button');
const shareClose = document.querySelector('#share-close');
const shareBackdrop = document.querySelector('#share-backdrop');
const shareKakao = document.querySelector('#share-kakao');
const shareSms = document.querySelector('#share-sms');
const shareCopy = document.querySelector('#share-copy');

const SHARE_TITLE = '강채원의 첫 번째 생일';
const SHARE_DESC = '소중한 분들을 채원이의 첫돌에 초대합니다.';
const SHARE_URL = 'https://invite2.avocadoss.co.kr/';

function openShareModal() {
  if (!shareModal) return;
  shareModal.hidden = false;
  document.body.style.overflow = 'hidden';
  shareClose?.focus();
}

function closeShareModal() {
  if (!shareModal) return;
  shareModal.hidden = true;
  document.body.style.overflow = '';
  shareButton?.focus();
}

if (shareButton) shareButton.addEventListener('click', openShareModal);
if (shareClose) shareClose.addEventListener('click', closeShareModal);
if (shareBackdrop) shareBackdrop.addEventListener('click', closeShareModal);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && shareModal && !shareModal.hidden) closeShareModal();
});

if (shareKakao) {
  shareKakao.addEventListener('click', async () => {
    closeShareModal();
    if (navigator.share) {
      try {
        await navigator.share({ title: SHARE_TITLE, text: SHARE_DESC, url: SHARE_URL });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
    await copyText(SHARE_URL, '초대장 주소를 복사했습니다. 카카오톡에 붙여넣어 주세요.');
  });
}

if (shareSms) {
  shareSms.addEventListener('click', () => {
    closeShareModal();
    const smsBody = `[초대장] ${SHARE_TITLE}\n${SHARE_DESC}\n\n일시: 2026. 10. 18 낮 12시\n장소: 코트야드 메리어트 서울 명동 3층 한양 1+2홀\n초대장 바로가기: ${SHARE_URL}`;
    const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    location.href = (isIos ? 'sms:&body=' : 'sms:?body=') + encodeURIComponent(smsBody);
  });
}

if (shareCopy) {
  shareCopy.addEventListener('click', async () => {
    closeShareModal();
    await copyText(SHARE_URL, '초대장 주소를 복사했습니다');
  });
}
