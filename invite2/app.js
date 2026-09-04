const toast = document.querySelector('#toast');
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

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
