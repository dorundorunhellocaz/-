/* ==========================================================================
   요약 PPT 페이지 컨트롤러
   - 미리보기 렌더링
   - .pptx 다운로드 버튼 / 인쇄 버튼 연결
   ========================================================================== */
(function () {
  'use strict';

  var statusEl = document.getElementById('pptx-status');
  var toastEl = document.getElementById('app-toast');
  var toastTimer = null;

  function toast(message, kind) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.setAttribute('data-kind', kind || 'info');
    toastEl.classList.add('is-visible');
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove('is-visible');
    }, 3200);
  }

  function setStatus(message) {
    if (statusEl) statusEl.textContent = message;
  }

  function humanSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  }

  /* ---------- 미리보기 ---------- */
  if (window.AppSummaryPage && window.AppSummaryPage.renderPreview) {
    window.AppSummaryPage.renderPreview();
  }

  /* ---------- 다운로드 ---------- */
  var downloadBtn = document.getElementById('download-pptx-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function () {
      if (!window.PptExport) {
        setStatus('PPT 생성 모듈을 찾을 수 없습니다.');
        toast('PPT 생성 모듈을 찾을 수 없습니다.', 'error');
        return;
      }

      downloadBtn.disabled = true;
      var original = downloadBtn.innerHTML;
      downloadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> 파일 생성 중…';
      setStatus('파워포인트 파일을 만들고 있습니다…');

      window.PptExport.download()
        .then(function (result) {
          var sizeText = humanSize(result.bytes);
          setStatus('완료 · ' + window.PptExport.fileName() + (sizeText ? ' (' + sizeText + ')' : '') + ' 다운로드를 시작했습니다.');
          toast('요약 PPT 파일을 내려받았습니다' + (sizeText ? ' (' + sizeText + ')' : '') + '.', 'success');
        })
        .catch(function (err) {
          var message = (err && err.message) ? err.message : '알 수 없는 오류';
          setStatus('생성 실패 · ' + message + ' — 아래 인쇄/PDF 저장을 이용해 주세요.');
          toast('PPT 생성에 실패했습니다: ' + message, 'error');
          if (window.console && console.error) console.error('[PPT 생성 실패]', err);
        })
        .then(function () {
          downloadBtn.disabled = false;
          downloadBtn.innerHTML = original;
        });
    });
  }

  /* ---------- 인쇄 ---------- */
  var printBtn = document.getElementById('print-summary-btn');
  if (printBtn) {
    printBtn.addEventListener('click', function () {
      window.print();
    });
  }

  /* ---------- 라이브러리 로드 상태 확인 ---------- */
  if (typeof window.PptxGenJS === 'undefined') {
    setStatus('PPT 라이브러리를 불러오지 못했습니다. 인쇄/PDF 저장을 이용해 주세요.');
    if (downloadBtn) downloadBtn.disabled = true;
  }

  if (window.console && console.info) {
    console.info('[요약 PPT] 미리보기 ' +
      (window.SummaryDeck ? window.SummaryDeck.slides.length : 0) +
      '장 렌더링 · PptxGenJS ' + (typeof window.PptxGenJS !== 'undefined' ? '정상 로드' : '로드 실패'));
  }
})();