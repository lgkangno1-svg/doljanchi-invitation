const toast = document.querySelector('#toast');
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// 계좌번호 복사
document.querySelectorAll('.account-row').forEach(button => button.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(button.dataset.account);
    showToast('계좌번호를 복사했습니다');
  } catch {
    showToast('계좌번호를 길게 눌러 복사해 주세요');
  }
}));

// 음악 재생 & 유도 화살표 제어
const audio = document.querySelector('#bgm');
const musicButton = document.querySelector('#music-button');
const musicGuide = document.querySelector('#music-guide');

function hideMusicGuide() {
  if (musicGuide && !musicGuide.classList.contains('hidden')) {
    musicGuide.classList.add('hidden');
  }
}

musicButton.addEventListener('click', async () => {
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
});

// 첫 상호작용 시 화살표 클릭도 음악 재생으로 연동
if (musicGuide) {
  musicGuide.addEventListener('click', () => {
    musicButton.click();
  });
}

// 공유 모달 제어
const shareModal = document.querySelector('#share-modal');
const shareButton = document.querySelector('#share-button');
const shareClose = document.querySelector('#share-close');
const shareBackdrop = document.querySelector('#share-backdrop');
const shareKakao = document.querySelector('#share-kakao');
const shareSms = document.querySelector('#share-sms');
const shareCopy = document.querySelector('#share-copy');

function openShareModal() {
  if (shareModal) shareModal.hidden = false;
}

function closeShareModal() {
  if (shareModal) shareModal.hidden = true;
}

if (shareButton) shareButton.addEventListener('click', openShareModal);
if (shareClose) shareClose.addEventListener('click', closeShareModal);
if (shareBackdrop) shareBackdrop.addEventListener('click', closeShareModal);

const SHARE_TITLE = '강채원의 첫 번째 생일';
const SHARE_DESC = '소중한 분들을 채원이의 첫돌에 초대합니다.';

// 카카오톡 공유
if (shareKakao) {
  shareKakao.addEventListener('click', async () => {
    closeShareModal();
    const shareUrl = location.href;
    const shareData = {
      title: SHARE_TITLE,
      text: SHARE_DESC,
      url: shareUrl
    };

    // 모바일 네이티브 공유 창 (카카오톡 최우선 선택 가능)
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }

    // fallback: 카카오톡 웹 공유 URL 또는 클립보드 복사
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('초대장 주소를 복사했습니다. 카카오톡에 붙여넣어 주세요.');
    } catch {
      showToast('초대장 주소를 복사해 주세요');
    }
  });
}

// 문자메시지(SMS) 공유
if (shareSms) {
  shareSms.addEventListener('click', () => {
    closeShareModal();
    const shareUrl = location.href;
    const smsBody = `[초대장] ${SHARE_TITLE}\n${SHARE_DESC}\n\n일시: 2026. 10. 18 낮 12시\n장소: 코트야드 메리어트 서울 명동 3층 한양 1+2홀\n초대장 바로가기: ${shareUrl}`;
    const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const smsScheme = isIos ? 'sms:&body=' : 'sms:?body=';
    location.href = smsScheme + encodeURIComponent(smsBody);
  });
}

// 링크 복사
if (shareCopy) {
  shareCopy.addEventListener('click', async () => {
    closeShareModal();
    try {
      await navigator.clipboard.writeText(location.href);
      showToast('초대장 주소를 복사했습니다');
    } catch {
      showToast('초대장 주소를 길게 눌러 복사해 주세요');
    }
  });
}
