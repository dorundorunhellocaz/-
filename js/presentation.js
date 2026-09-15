/* ==========================================================================
   발표용 프레젠테이션 컨트롤러
   - 슬라이드 전환, 진행 바, 인디케이터, 키보드/스와이프/전체화면/PDF
   ========================================================================== */
(function () {
  'use strict';

  var stage = document.getElementById('deck-stage');
  if (!stage) return;

  var slides = Array.prototype.slice.call(stage.querySelectorAll('.slide'));
  if (!slides.length) return;

  var currentLabel = document.getElementById('deck-current');
  var totalLabel = document.getElementById('deck-total');
  var progressBar = document.getElementById('deck-progress-bar');
  var dotsWrap = document.getElementById('deck-dots');
  var prevBtn = document.getElementById('deck-prev');
  var nextBtn = document.getElementById('deck-next');
  var printBtn = document.getElementById('deck-print');

  var index = 0;

  if (totalLabel) totalLabel.textContent = String(slides.length);

  /* ---------- 인디케이터 버튼 생성 ---------- */
  slides.forEach(function (slideEl, i) {
    if (!dotsWrap) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-label', (i + 1) + '번 슬라이드: ' + (slideEl.dataset.title || ''));
    btn.addEventListener('click', function () { goTo(i); });
    dotsWrap.appendChild(btn);
  });

  var dots = dotsWrap ? Array.prototype.slice.call(dotsWrap.children) : [];
  var slideTitles = slides.map(function (s) { return s.dataset.title || ''; });

  /* ---------- 렌더 ---------- */
  function render() {
    slides.forEach(function (slideEl, i) {
      slideEl.classList.toggle('is-active', i === index);
      slideEl.setAttribute('aria-hidden', i === index ? 'false' : 'true');
    });

    dots.forEach(function (dot, i) {
      if (i === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });

    if (currentLabel) currentLabel.textContent = String(index + 1);

    if (progressBar) {
      var pct = slides.length > 1 ? (index / (slides.length - 1)) * 100 : 100;
      progressBar.style.width = pct + '%';
    }

    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === slides.length - 1;

    // 해시로 현재 슬라이드 공유 가능하게 (뒤로가기 방해하지 않도록 replaceState)
    if (window.history && window.history.replaceState) {
      var hash = '#slide-' + (index + 1);
      if (window.location.hash !== hash) {
        window.history.replaceState(null, '', hash);
      }
    }
  }

  function goTo(next) {
    var clamped = Math.max(0, Math.min(slides.length - 1, next));
    if (clamped === index) return;
    index = clamped;
    render();
  }

  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  /* ---------- 버튼 ---------- */
  if (prevBtn) prevBtn.addEventListener('click', prev);
  if (nextBtn) nextBtn.addEventListener('click', next);

  if (printBtn) {
    printBtn.addEventListener('click', function () {
      // 인쇄 시 모든 슬라이드가 보이도록 클래스 임시 전환 후 복원
      document.body.classList.add('is-printing');
      window.print();
      window.setTimeout(function () {
        document.body.classList.remove('is-printing');
      }, 400);
    });
  }

  /* ---------- 키보드 ---------- */
  document.addEventListener('keydown', function (event) {
    var tag = (event.target && event.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    switch (event.key) {
      case 'ArrowRight':
      case 'PageDown':
      case ' ':
      case 'Spacebar':
        event.preventDefault();
        next();
        break;
      case 'ArrowLeft':
      case 'PageUp':
        event.preventDefault();
        prev();
        break;
      case 'Home':
        event.preventDefault();
        goTo(0);
        break;
      case 'End':
        event.preventDefault();
        goTo(slides.length - 1);
        break;
      case 'f':
      case 'F':
        toggleFullscreen();
        break;
      case 'p':
      case 'P':
        if (printBtn) printBtn.click();
        break;
      default:
        break;
    }
  });

  /* ---------- 전체화면 ---------- */
  function toggleFullscreen() {
    var doc = document;
    var el = doc.documentElement;
    if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } else {
      if (doc.exitFullscreen) doc.exitFullscreen();
      else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
    }
  }

  /* ---------- 터치 스와이프 ---------- */
  var touchStartX = null;
  var touchStartY = null;

  stage.addEventListener('touchstart', function (event) {
    if (!event.changedTouches || !event.changedTouches.length) return;
    touchStartX = event.changedTouches[0].clientX;
    touchStartY = event.changedTouches[0].clientY;
  }, { passive: true });

  stage.addEventListener('touchend', function (event) {
    if (touchStartX === null || !event.changedTouches || !event.changedTouches.length) return;
    var dx = event.changedTouches[0].clientX - touchStartX;
    var dy = event.changedTouches[0].clientY - touchStartY;
    touchStartX = null;
    touchStartY = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) next();
    else prev();
  }, { passive: true });

  /* ---------- 해시 진입점 ---------- */
  function fromHash() {
    var match = /#slide-(\d+)/.exec(window.location.hash || '');
    if (!match) return;
    var target = parseInt(match[1], 10) - 1;
    if (!isNaN(target)) goTo(target);
  }

  window.addEventListener('hashchange', fromHash);

  /* ---------- 초기화 ---------- */
  fromHash();
  render();

  // 발표자 참고용: 슬라이드 목록을 콘솔에 출력
  if (window.console && console.info) {
    console.info('[발표 자료] ' + slides.length + '개 슬라이드: ' + slideTitles.join(' / '));
  }
})();