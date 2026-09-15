/* ==========================================================================
   모니터링 웹앱 컨트롤러
   - 탭 전환, 차트 렌더링
   - 긴급 알림 / 돌봄 노트: 테이블 API 연동 + 실패 시 로컬 폴백
   ========================================================================== */
(function () {
  'use strict';

  var D = window.AppData;
  var C = window.AppCharts;
  if (!D) return;

  /* ======================================================================
     0. 공통 유틸
     ====================================================================== */
  var toastEl = document.getElementById('app-toast');
  var toastTimer = null;
  var announcer = document.getElementById('app-announcer');

  function toast(message, kind) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.setAttribute('data-kind', kind || 'info');
    toastEl.classList.add('is-visible');
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove('is-visible');
    }, 2800);
  }

  function announce(message) {
    if (announcer) announcer.textContent = message;
  }

  function escapeHtml(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function fmtDateTime(value) {
    if (!value) return '—';
    var date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    var pad = function (n) { return n < 10 ? '0' + n : String(n); };
    return (date.getMonth() + 1) + '/' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
  }

  function uid(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  /* ======================================================================
     1. 탭 전환
     ====================================================================== */
  var TAB_META = {
    dashboard: { title: '메인 대시보드', subtitle: '오늘의 정서 상태와 활동 달성도를 한눈에 확인합니다.' },
    reports: { title: '정신건강 & 인지 훈련 리포트', subtitle: '주간·월간 감정 분석 추이와 인지 훈련 데이터를 확인합니다.' },
    activity: { title: '신체활동 코칭 기록', subtitle: '동작인식 센서 기반 자세 분석과 권장 운동 루틴입니다.' },
    monitoring: { title: '실시간 모니터링 & 긴급 알림', subtitle: '펫로봇 원격 상태와 이상 감지 알림을 관리합니다.' }
  };

  var tabButtons = Array.prototype.slice.call(document.querySelectorAll('[role="tab"][data-tab]'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.tab-panel'));
  var pageTitle = document.getElementById('page-title');
  var pageSubtitle = document.getElementById('page-subtitle');

  function activateTab(name, updateHash) {
    if (!TAB_META[name]) name = 'dashboard';

    tabButtons.forEach(function (btn) {
      var selected = btn.dataset.tab === name;
      btn.setAttribute('aria-selected', selected ? 'true' : 'false');
    });

    panels.forEach(function (panel) {
      panel.hidden = panel.id !== 'panel-' + name;
    });

    if (pageTitle) pageTitle.textContent = TAB_META[name].title;
    if (pageSubtitle) pageSubtitle.textContent = TAB_META[name].subtitle;

    if (updateHash !== false && window.history && window.history.replaceState) {
      window.history.replaceState(null, '', '#' + name);
    }

    // 탭이 보여진 뒤 차트 크기 재계산 (숨겨진 상태에서 그리면 크기가 0이 되는 문제 방지)
    window.setTimeout(renderCharts, 40);
  }

  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      activateTab(btn.dataset.tab);
      announce(TAB_META[btn.dataset.tab].title + ' 화면으로 이동했습니다.');
    });

    // 좌우 방향키로 탭 이동 (role="tab" 접근성 규약)
    btn.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' &&
          event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      var i = tabButtons.indexOf(btn);
      var forward = event.key === 'ArrowDown' || event.key === 'ArrowRight';
      var nextIndex = (i + (forward ? 1 : -1) + tabButtons.length) % tabButtons.length;
      tabButtons[nextIndex].focus();
      activateTab(tabButtons[nextIndex].dataset.tab);
    });
  });

  /* ======================================================================
     2. 차트 렌더링
     ====================================================================== */
  function renderCharts() {
    if (!C || !C.hasChart()) {
      showChartFallback();
      return;
    }

    // 2-1. 오늘 정서 상태 (막대)
    C.mount('chart-emotion-today', {
      type: 'bar',
      data: {
        labels: D.todayEmotion.labels,
        datasets: [{
          label: '지수 (0~100)',
          data: D.todayEmotion.values,
          backgroundColor: [C.palette.low, C.palette.calm, C.palette.joy],
          borderRadius: 10,
          maxBarThickness: 74
        }]
      },
      options: C.baseOptions({
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, max: 100, grid: { color: C.palette.line }, ticks: C.tickFont() },
          x: { grid: { display: false }, ticks: C.tickFont() }
        }
      })
    });

    // 2-2. 활동 달성 구성 (도넛)
    var act = D.activity.today;
    C.mount('chart-activity-donut', {
      type: 'doughnut',
      data: {
        labels: ['스트레칭 완료', '운동 시간', '남은 목표'],
        datasets: [{
          data: [
            act.stretching * 10,
            act.minutes,
            Math.max(0, (act.stretchingTarget * 10 + act.minutesTarget) - (act.stretching * 10 + act.minutes))
          ],
          backgroundColor: [C.palette.accent, C.palette.primary, C.palette.line],
          borderWidth: 0
        }]
      },
      options: C.baseOptions({
        cutout: '62%',
        plugins: { legend: { position: 'bottom' } }
      })
    });

    // 2-3. 감정 분석 추이 (선)
    var trend = D.emotionTrend[currentRange];
    C.mount('chart-emotion-trend', {
      type: 'line',
      data: {
        labels: trend.labels,
        datasets: [
          {
            label: '우울 위험',
            data: trend.depression,
            borderColor: C.palette.risk,
            backgroundColor: 'rgba(224,90,90,.12)',
            tension: .35, fill: true, pointRadius: 3, borderWidth: 2
          },
          {
            label: '정서 안정',
            data: trend.stability,
            borderColor: C.palette.mint,
            backgroundColor: 'rgba(79,184,165,.14)',
            tension: .35, fill: true, pointRadius: 3, borderWidth: 2
          },
          {
            label: '기쁨',
            data: trend.joy,
            borderColor: C.palette.joy,
            backgroundColor: 'rgba(242,178,62,.12)',
            tension: .35, fill: false, pointRadius: 3, borderWidth: 2
          }
        ]
      },
      options: C.baseOptions({
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: { beginAtZero: true, max: 100, grid: { color: C.palette.line }, ticks: C.tickFont() },
          x: { grid: { display: false }, ticks: C.tickFont() }
        }
      })
    });

    // 2-4. 인지 훈련 점수 · 기억력 (복합)
    C.mount('chart-cognitive', {
      type: 'line',
      data: {
        labels: D.cognitive.labels,
        datasets: [
          {
            label: '인지 훈련 종합 점수',
            data: D.cognitive.scores,
            borderColor: C.palette.primary,
            backgroundColor: C.palette.primarySoft,
            tension: .3, fill: true, borderWidth: 2, pointRadius: 3,
            yAxisID: 'y'
          },
          {
            label: '기억력 정확도',
            type: 'bar',
            data: D.cognitive.memory,
            backgroundColor: C.palette.accentSoft,
            borderColor: C.palette.accent,
            borderWidth: 1,
            borderRadius: 6,
            maxBarThickness: 26,
            yAxisID: 'y'
          }
        ]
      },
      options: C.baseOptions({
        scales: {
          y: { beginAtZero: true, max: 100, grid: { color: C.palette.line }, ticks: C.tickFont() },
          x: { grid: { display: false }, ticks: C.tickFont() }
        }
      })
    });

    // 2-5. 자세 정확도 (레이더)
    C.mount('chart-posture-radar', {
      type: 'radar',
      data: {
        labels: D.activity.posture.labels,
        datasets: [{
          label: '관절 부위별 정확도',
          data: D.activity.posture.values,
          borderColor: C.palette.primary,
          backgroundColor: C.palette.mintSoft,
          pointBackgroundColor: C.palette.primary,
          borderWidth: 2
        }]
      },
      options: C.baseOptions({
        scales: {
          r: {
            beginAtZero: true, max: 100,
            angleLines: { color: C.palette.line },
            grid: { color: C.palette.line },
            pointLabels: { font: { family: 'Pretendard, sans-serif', size: 11 }, color: C.palette.ink },
            ticks: { backdropColor: 'transparent', color: C.palette.muted, stepSize: 25 }
          }
        }
      })
    });

    // 2-6. 주간 활동량 (막대)
    C.mount('chart-weekly-activity', {
      type: 'bar',
      data: {
        labels: D.activity.weekly.labels,
        datasets: [
          {
            label: '운동 시간(분)',
            data: D.activity.weekly.minutes,
            backgroundColor: D.activity.weekly.minutes.map(function (m) {
              return m >= D.activity.weekly.target ? C.palette.mint : C.palette.accent;
            }),
            borderRadius: 8,
            maxBarThickness: 40
          },
          {
            label: '권장(30분)',
            type: 'line',
            data: D.activity.weekly.labels.map(function () { return D.activity.weekly.target; }),
            borderColor: C.palette.muted,
            borderDash: [6, 6],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: C.baseOptions({
        scales: {
          y: { beginAtZero: true, grid: { color: C.palette.line }, ticks: C.tickFont() },
          x: { grid: { display: false }, ticks: C.tickFont() }
        }
      })
    });
  }

  function showChartFallback() {
    var boxes = document.querySelectorAll('.chart-box');
    Array.prototype.forEach.call(boxes, function (box) {
      if (box.querySelector('.chart-fallback')) return;
      var note = document.createElement('p');
      note.className = 'card__hint chart-fallback';
      note.setAttribute('style', 'position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:16px');
      note.innerHTML = '<span><i class="fa-solid fa-chart-simple" aria-hidden="true"></i><br>차트 라이브러리를 불러오지 못했습니다. 숫자 데이터는 표와 카드에서 확인할 수 있습니다.</span>';
      box.appendChild(note);
    });
  }

  /* ======================================================================
     3. 정적 콘텐츠 렌더링
     ====================================================================== */
  function renderStaticContent() {
    // 사이드바 요약
    var sidebarName = document.getElementById('sidebar-elder-name');
    var sidebarMeta = document.getElementById('sidebar-elder-meta');
    var sidebarExpert = document.getElementById('sidebar-expert');
    var sidebarRobot = document.getElementById('sidebar-robot');
    if (sidebarName) sidebarName.textContent = D.elder.name;
    if (sidebarMeta) sidebarMeta.textContent = D.elder.meta;
    if (sidebarExpert) sidebarExpert.textContent = D.elder.expert;
    if (sidebarRobot) sidebarRobot.textContent = D.elder.robotId;

    // 로봇 배터리
    var battery = document.getElementById('robot-battery');
    if (battery) battery.textContent = D.elder.robotBattery + '%';

    // 최근 대화 요약
    var chatList = document.getElementById('chat-summary-list');
    if (chatList) {
      chatList.innerHTML = D.chats.map(function (c) {
        var isElder = c.speaker === 'elder';
        return '' +
          '<li class="chat-item">' +
            '<span class="who' + (isElder ? ' who--elder' : '') + '" aria-hidden="true">' +
              '<i class="fa-solid ' + (isElder ? 'fa-user' : 'fa-robot') + '"></i>' +
            '</span>' +
            '<div>' +
              '<p>' + escapeHtml(c.text) +
                '<span class="sentiment-tag sentiment-tag--' + escapeHtml(c.sentiment) + '">' +
                  escapeHtml(c.sentimentLabel) +
                '</span>' +
              '</p>' +
              '<p class="meta">' + escapeHtml(c.name) + ' · ' + escapeHtml(c.time) + '</p>' +
            '</div>' +
          '</li>';
      }).join('');
    }

    // 인지 훈련 항목 표
    var cogBody = document.getElementById('cognitive-table-body');
    if (cogBody) {
      cogBody.innerHTML = D.cognitive.items.map(function (item) {
        var pillClass = item.state === 'risk' ? 'score-pill score-pill--risk'
          : item.state === 'warn' ? 'score-pill score-pill--warn'
          : 'score-pill';
        var deltaText = item.delta > 0 ? '+' + item.delta : (item.delta === 0 ? '변화 없음' : String(item.delta));
        var deltaColor = item.delta > 0 ? 'var(--color-mint)' : (item.delta < 0 ? 'var(--color-risk)' : 'var(--color-muted)');
        return '' +
          '<tr>' +
            '<td>' + escapeHtml(item.name) + '</td>' +
            '<td class="num"><span class="' + pillClass + '">' + item.score + '</span></td>' +
            '<td class="num" style="color:' + deltaColor + ';font-weight:700">' + escapeHtml(deltaText) + '</td>' +
            '<td>' + escapeHtml(item.level) + '</td>' +
          '</tr>';
      }).join('');
    }

    // 자세 교정 피드백
    var fbList = document.getElementById('posture-feedback-list');
    if (fbList) {
      fbList.innerHTML = D.activity.feedback.map(function (f) {
        var pillClass = f.state === 'risk' ? 'score-pill score-pill--risk'
          : f.state === 'warn' ? 'score-pill score-pill--warn'
          : 'score-pill';
        return '' +
          '<li class="feedback-item">' +
            '<div>' +
              '<strong>' + escapeHtml(f.title) + '</strong>' +
              '<p>' + escapeHtml(f.detail) + '</p>' +
              '<p class="card__hint">' + escapeHtml(f.time) + '</p>' +
            '</div>' +
            '<span class="' + pillClass + '">' + f.score + '</span>' +
          '</li>';
      }).join('');
    }

    // 권장 운동 루틴
    var routineList = document.getElementById('routine-list');
    if (routineList) {
      routineList.innerHTML = D.activity.routines.map(function (r) {
        return '' +
          '<li class="routine-item">' +
            '<span class="rk" aria-hidden="true"><i class="fa-solid ' + escapeHtml(r.icon) + '"></i></span>' +
            '<div>' +
              '<strong>' + escapeHtml(r.title) + '</strong>' +
              '<p>' + escapeHtml(r.detail) + '</p>' +
            '</div>' +
            '<span class="rk-meta">' + escapeHtml(r.meta) + '<br>' + escapeHtml(r.level) + '</span>' +
          '</li>';
      }).join('');
    }

    // 분석 인사이트
    var insightList = document.getElementById('insight-list');
    if (insightList) {
      insightList.innerHTML = D.insights.map(function (i) {
        return '' +
          '<li>' +
            '<span class="icon" aria-hidden="true"><i class="fa-solid ' + escapeHtml(i.icon) + '"></i></span>' +
            '<span><strong>' + escapeHtml(i.title) + '</strong>' + escapeHtml(i.body) + '</span>' +
          '</li>';
      }).join('');
    }

    // 원격 상태 점검 표
    var deviceBody = document.getElementById('device-check-body');
    if (deviceBody) {
      deviceBody.innerHTML = D.deviceChecks.map(function (d) {
        var badge = d.ok ? '<span class="badge badge--mint">' + escapeHtml(d.state) + '</span>'
          : '<span class="badge badge--risk">' + escapeHtml(d.state) + '</span>';
        return '' +
          '<tr>' +
            '<th scope="row" style="text-align:left;font-weight:700;color:var(--color-ink)">' + escapeHtml(d.name) + '</th>' +
            '<td>' + badge + '</td>' +
            '<td class="muted small">' + escapeHtml(d.detail) + '</td>' +
          '</tr>';
      }).join('');
    }
  }

  /* ======================================================================
     4. 정신건강 리포트 기간 전환
     ====================================================================== */
  var currentRange = 'weekly';
  var rangeButtons = Array.prototype.slice.call(document.querySelectorAll('[data-range]'));
  var rangeLabel = document.getElementById('emotion-range-label');

  rangeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      currentRange = btn.dataset.range === 'monthly' ? 'monthly' : 'weekly';
      rangeButtons.forEach(function (other) {
        other.setAttribute('aria-pressed', other.dataset.range === currentRange ? 'true' : 'false');
      });
      if (rangeLabel) {
        rangeLabel.textContent = currentRange === 'monthly' ? '(최근 5개 구간 · 월간)' : '(최근 7일)';
      }
      renderCharts();
      toast(currentRange === 'monthly' ? '월간 추이로 전환했습니다.' : '주간 추이로 전환했습니다.');
      announce(rangeLabel ? rangeLabel.textContent : '');
    });
  });

  /* ======================================================================
     5. 긴급 알림 (테이블 API + 폴백)
     ====================================================================== */
  var alertState = {
    items: [],
    source: 'local', // 'api' | 'local'
    filter: 'all'
  };

  var alertListEl = document.getElementById('alert-list');
  var alertFilterEl = document.getElementById('alert-filter');
  var alertCountPill = document.getElementById('alert-count-pill');
  var alertSummaryEl = document.getElementById('alert-list-summary');
  var dataSourceBadge = document.getElementById('data-source-badge');

  var SEVERITY_META = {
    critical: { icon: 'fa-triangle-exclamation', label: '긴급', badge: 'badge--risk' },
    warning: { icon: 'fa-circle-exclamation', label: '주의', badge: 'badge--warn' },
    info: { icon: 'fa-circle-info', label: '안내', badge: 'badge--muted' }
  };

  var STATUS_LABEL = {
    open: '미처리',
    acknowledged: '확인됨',
    resolved: '처리 완료',
    false_alarm: '오탐'
  };

  function normalizeAlert(row) {
    return {
      id: row.id,
      elder_name: row.elder_name || D.elder.name,
      severity: row.severity || 'info',
      category: row.category || '일반',
      message: row.message || '',
      detected_at: row.detected_at || '',
      status: row.status || 'open',
      assignee: row.assignee || '',
      note: row.note || ''
    };
  }

  function sortedAlerts() {
    var order = { critical: 0, warning: 1, info: 2 };
    return alertState.items.slice().sort(function (a, b) {
      var so = (order[a.severity] === undefined ? 3 : order[a.severity]) - (order[b.severity] === undefined ? 3 : order[b.severity]);
      if (so !== 0) return so;
      var sa = a.status === 'resolved' ? 1 : 0;
      var sb = b.status === 'resolved' ? 1 : 0;
      if (sa !== sb) return sa - sb;
      return String(b.detected_at).localeCompare(String(a.detected_at));
    });
  }

  function renderAlerts() {
    if (!alertListEl) return;

    var visible = sortedAlerts().filter(function (a) {
      return alertState.filter === 'all' ? true : a.status === alertState.filter;
    });

    var openCount = alertState.items.filter(function (a) { return a.status === 'open'; }).length;
    var criticalCount = alertState.items.filter(function (a) { return a.status === 'open' && a.severity === 'critical'; }).length;

    if (alertCountPill) {
      var badgeCount = criticalCount > 0 ? criticalCount : openCount;
      alertCountPill.textContent = String(badgeCount);
      alertCountPill.setAttribute('data-empty', badgeCount === 0 ? 'true' : 'false');
    }

    if (alertSummaryEl) {
      alertSummaryEl.textContent = '전체 ' + alertState.items.length + '건 · 미처리 ' + openCount +
        '건 · 긴급 ' + criticalCount + '건 (' + (alertState.source === 'api' ? 'live DB' : '시연 데이터') + ')';
    }

    if (!visible.length) {
      alertListEl.innerHTML = '' +
        '<li class="empty-state">' +
          '<i class="fa-solid fa-mug-hot" aria-hidden="true"></i>' +
          '<p>조건에 해당하는 알림이 없습니다.<br>이상 징후가 감지되지 않았습니다.</p>' +
        '</li>';
      return;
    }

    alertListEl.innerHTML = visible.map(function (a) {
      var meta = SEVERITY_META[a.severity] || SEVERITY_META.info;
      var resolved = a.status === 'resolved' || a.status === 'false_alarm';
      var actions = '';

      if (a.status === 'open') {
        actions =
          '<button type="button" class="btn btn--quiet btn--sm" data-action="ack" data-id="' + escapeHtml(a.id) + '">' +
            '<i class="fa-solid fa-check" aria-hidden="true"></i> 확인</button>' +
          '<button type="button" class="btn btn--primary btn--sm" data-action="resolve" data-id="' + escapeHtml(a.id) + '">' +
            '<i class="fa-solid fa-flag-checkered" aria-hidden="true"></i> 처리 완료</button>';
      } else if (a.status === 'acknowledged') {
        actions =
          '<button type="button" class="btn btn--primary btn--sm" data-action="resolve" data-id="' + escapeHtml(a.id) + '">' +
            '<i class="fa-solid fa-flag-checkered" aria-hidden="true"></i> 처리 완료</button>' +
          '<button type="button" class="btn btn--quiet btn--sm" data-action="reopen" data-id="' + escapeHtml(a.id) + '">재개</button>';
      } else {
        actions =
          '<button type="button" class="btn btn--quiet btn--sm" data-action="reopen" data-id="' + escapeHtml(a.id) + '">' +
            '<i class="fa-solid fa-rotate-left" aria-hidden="true"></i> 다시 열기</button>';
      }

      return '' +
        '<li class="alert-item" data-severity="' + escapeHtml(a.severity) + '" data-status="' + escapeHtml(a.status) + '">' +
          '<span class="alert-item__icon" aria-hidden="true"><i class="fa-solid ' + meta.icon + '"></i></span>' +
          '<div>' +
            '<h3>' +
              '<span class="badge ' + meta.badge + '">' + meta.label + '</span> ' +
              escapeHtml(a.category) + ' 알림' +
            '</h3>' +
            '<p>' + escapeHtml(a.message) + '</p>' +
            '<p class="alert-meta">' +
              '<span><i class="fa-regular fa-clock" aria-hidden="true"></i> 감지 ' + escapeHtml(fmtDateTime(a.detected_at)) + '</span>' +
              '<span><i class="fa-solid fa-circle-half-stroke" aria-hidden="true"></i> 상태 ' + escapeHtml(STATUS_LABEL[a.status] || a.status) + '</span>' +
              '<span><i class="fa-solid fa-user" aria-hidden="true"></i> 담당 ' + escapeHtml(a.assignee || '미지정') + '</span>' +
            '</p>' +
            (a.note ? '<p class="card__hint" style="margin-top:6px"><i class="fa-regular fa-note-sticky" aria-hidden="true"></i> ' + escapeHtml(a.note) + '</p>' : '') +
          '</div>' +
          '<div class="alert-item__actions no-print">' + actions + '</div>' +
        '</li>';
    }).join('');
  }

  function loadAlerts() {
    return D.api.list('alerts', { limit: 100 })
      .then(function (payload) {
        var rows = (payload && payload.data) ? payload.data : [];
        if (!rows.length) throw new Error('empty');
        alertState.items = rows.map(normalizeAlert);
        alertState.source = 'api';
        return true;
      })
      .catch(function () {
        alertState.items = D.seedAlerts.map(normalizeAlert);
        alertState.source = 'local';
        return false;
      })
      .then(function (usedApi) {
        renderAlerts();
        if (dataSourceBadge) {
          dataSourceBadge.textContent = usedApi ? 'live DB 연결됨 (alerts)' : '시연 데이터 모드';
          dataSourceBadge.className = usedApi ? 'badge badge--mint' : 'badge badge--warn';
        }
        return usedApi;
      });
  }

  function persistAlert(id, patch, successMessage) {
    var target = alertState.items.filter(function (a) { return a.id === id; })[0];
    if (!target) return;

    var previous = {};
    Object.keys(patch).forEach(function (key) { previous[key] = target[key]; });
    Object.keys(patch).forEach(function (key) { target[key] = patch[key]; });
    renderAlerts();

    if (alertState.source !== 'api') {
      toast(successMessage + ' (시연 데이터 모드)');
      return;
    }

    D.api.update('alerts', id, patch)
      .then(function () {
        toast(successMessage);
        announce(successMessage);
      })
      .catch(function () {
        Object.keys(previous).forEach(function (key) { target[key] = previous[key]; });
        renderAlerts();
        toast('저장에 실패해 변경을 되돌렸습니다.', 'error');
      });
  }

  if (alertListEl) {
    alertListEl.addEventListener('click', function (event) {
      var btn = event.target.closest('[data-action]');
      if (!btn) return;
      var id = btn.dataset.id;
      var action = btn.dataset.action;

      if (action === 'ack') {
        persistAlert(id, { status: 'acknowledged', assignee: '이지훈 (보호자)' }, '알림을 확인 처리했습니다.');
      } else if (action === 'resolve') {
        persistAlert(id, { status: 'resolved', note: '앱에서 처리 완료로 기록되었습니다.' }, '알림을 처리 완료로 기록했습니다.');
      } else if (action === 'reopen') {
        persistAlert(id, { status: 'open' }, '알림을 다시 열었습니다.');
      }
    });
  }

  if (alertFilterEl) {
    alertFilterEl.addEventListener('change', function () {
      alertState.filter = alertFilterEl.value;
      renderAlerts();
      announce('알림 필터: ' + alertFilterEl.options[alertFilterEl.selectedIndex].text);
    });
  }

  /* ======================================================================
     6. 돌봄 노트 (테이블 API + 폴백)
     ====================================================================== */
  var noteState = { items: [], source: 'local' };
  var noteListEl = document.getElementById('care-note-list');
  var noteForm = document.getElementById('care-note-form');
  var noteSubmitBtn = document.getElementById('note-submit-btn');

  function normalizeNote(row) {
    return {
      id: row.id,
      elder_name: row.elder_name || D.elder.name,
      author: row.author || '익명',
      role: row.role || '보호자',
      category: row.category || '일반',
      content: row.content || '',
      created_at: row.created_at || new Date().toISOString(),
      pinned: row.pinned === true || row.pinned === 'true'
    };
  }

  function sortedNotes() {
    return noteState.items.slice().sort(function (a, b) {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return String(b.created_at).localeCompare(String(a.created_at));
    });
  }

  function renderNotes() {
    if (!noteListEl) return;

    var notes = sortedNotes();
    if (!notes.length) {
      noteListEl.innerHTML = '' +
        '<li class="empty-state">' +
          '<i class="fa-regular fa-note-sticky" aria-hidden="true"></i>' +
          '<p>아직 등록된 돌봄 노트가 없습니다.<br>첫 노트를 남겨보세요.</p>' +
        '</li>';
      return;
    }

    noteListEl.innerHTML = notes.map(function (n) {
      return '' +
        '<li class="note-card" data-pinned="' + (n.pinned ? 'true' : 'false') + '">' +
          '<header>' +
            (n.pinned ? '<span class="badge badge--accent"><i class="fa-solid fa-thumbtack" aria-hidden="true"></i> 고정</span>' : '') +
            '<span class="author">' + escapeHtml(n.author) + '</span>' +
            '<span class="badge badge--muted">' + escapeHtml(n.role) + '</span>' +
            '<span class="badge">' + escapeHtml(n.category) + '</span>' +
            '<span class="spacer"></span>' +
            '<span class="card__hint">' + escapeHtml(fmtDateTime(n.created_at)) + '</span>' +
          '</header>' +
          '<p>' + escapeHtml(n.content) + '</p>' +
          '<footer class="no-print">' +
            '<button type="button" class="btn btn--quiet btn--sm" data-note-action="pin" data-id="' + escapeHtml(n.id) + '">' +
              '<i class="fa-solid fa-thumbtack" aria-hidden="true"></i> ' + (n.pinned ? '고정 해제' : '고정') +
            '</button>' +
            '<button type="button" class="btn btn--quiet btn--sm" data-note-action="delete" data-id="' + escapeHtml(n.id) + '">' +
              '<i class="fa-solid fa-trash-can" aria-hidden="true"></i> 삭제' +
            '</button>' +
          '</footer>' +
        '</li>';
    }).join('');
  }

  function loadNotes() {
    return D.api.list('care_notes', { limit: 100 })
      .then(function (payload) {
        var rows = (payload && payload.data) ? payload.data : [];
        if (!rows.length) throw new Error('empty');
        noteState.items = rows.map(normalizeNote);
        noteState.source = 'api';
        return true;
      })
      .catch(function () {
        noteState.items = D.seedNotes.map(normalizeNote);
        noteState.source = 'local';
        return false;
      })
      .then(function (usedApi) {
        renderNotes();
        return usedApi;
      });
  }

  if (noteForm) {
    noteForm.addEventListener('submit', function (event) {
      event.preventDefault();

      var authorEl = document.getElementById('note-author');
      var categoryEl = document.getElementById('note-category');
      var contentEl = document.getElementById('note-content');
      var pinnedEl = document.getElementById('note-pinned');

      var author = (authorEl && authorEl.value || '').trim();
      var content = (contentEl && contentEl.value || '').trim();
      if (!author || !content) {
        toast('작성자와 내용을 입력해 주세요.', 'error');
        return;
      }

      var payload = {
        id: uid('note'),
        elder_name: D.elder.name,
        author: author,
        role: /보호자|자녀/.test(author) ? '보호자' : (/전문가|PT|간호|의사/.test(author) ? '전문가' : '보호자'),
        category: categoryEl ? categoryEl.value : '일반',
        content: content,
        created_at: new Date().toISOString(),
        pinned: pinnedEl ? pinnedEl.checked : false
      };

      if (noteSubmitBtn) noteSubmitBtn.disabled = true;

      function done(savedToApi) {
        if (noteSubmitBtn) noteSubmitBtn.disabled = false;
        noteForm.reset();
        renderNotes();
        toast(savedToApi ? '노트를 저장했습니다.' : '노트를 저장했습니다. (시연 데이터 모드)');
        announce('돌봄 노트가 등록되었습니다.');
      }

      if (noteState.source !== 'api') {
        noteState.items.push(normalizeNote(payload));
        done(false);
        return;
      }

      D.api.create('care_notes', payload)
        .then(function (created) {
          noteState.items.push(normalizeNote(created && created.id ? created : payload));
          done(true);
        })
        .catch(function () {
          noteState.items.push(normalizeNote(payload));
          done(false);
        });
    });
  }

  if (noteListEl) {
    noteListEl.addEventListener('click', function (event) {
      var btn = event.target.closest('[data-note-action]');
      if (!btn) return;
      var id = btn.dataset.id;
      var action = btn.dataset.noteAction;
      var target = noteState.items.filter(function (n) { return n.id === id; })[0];
      if (!target) return;

      if (action === 'pin') {
        var nextPinned = !target.pinned;
        target.pinned = nextPinned;
        renderNotes();
        if (noteState.source === 'api') {
          D.api.update('care_notes', id, { pinned: nextPinned })
            .then(function () { toast(nextPinned ? '상단에 고정했습니다.' : '고정을 해제했습니다.'); })
            .catch(function () { target.pinned = !nextPinned; renderNotes(); toast('변경 저장에 실패했습니다.', 'error'); });
        } else {
          toast(nextPinned ? '상단에 고정했습니다.' : '고정을 해제했습니다.');
        }
      } else if (action === 'delete') {
        var removed = noteState.items.filter(function (n) { return n.id === id; })[0];
        noteState.items = noteState.items.filter(function (n) { return n.id !== id; });
        renderNotes();
        if (noteState.source === 'api') {
          D.api.remove('care_notes', id)
            .then(function () { toast('노트를 삭제했습니다.'); })
            .catch(function () {
              noteState.items.push(removed);
              renderNotes();
              toast('삭제에 실패해 되돌렸습니다.', 'error');
            });
        } else {
          toast('노트를 삭제했습니다. (시연 데이터 모드)');
        }
      }
    });
  }

  /* ======================================================================
     7. 실시간 이벤트 타임라인 (시연용 스트림)
     ====================================================================== */
  var timelineEl = document.getElementById('event-timeline');
  var eventIndex = 0;

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function pushEvent(entry) {
    if (!timelineEl) return;
    var li = document.createElement('li');
    li.setAttribute('data-kind', entry.kind || 'info');
    var now = new Date();
    li.innerHTML = '<time datetime="' + now.toISOString() + '">' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds()) + '</time>' +
      escapeHtml(entry.text);
    timelineEl.insertBefore(li, timelineEl.firstChild);
    while (timelineEl.children.length > 8) {
      timelineEl.removeChild(timelineEl.lastChild);
    }
  }

  if (timelineEl) {
    // 초기 3건
    for (var i = 0; i < 3; i++) {
      pushEvent(D.eventPool[eventIndex % D.eventPool.length]);
      eventIndex++;
    }
    // 실시간 스트리밍 시뮬레이션
    window.setInterval(function () {
      if (document.hidden) return;
      if (panels.length && document.getElementById('panel-monitoring').hidden) return;
      pushEvent(D.eventPool[eventIndex % D.eventPool.length]);
      eventIndex++;
    }, 6500);
  }

  /* ======================================================================
     8. 원격 점검 / 이상 상황 시뮬레이션
     ====================================================================== */
  var remoteBtn = document.getElementById('remote-check-btn');
  var simulateBtn = document.getElementById('simulate-alert-btn');
  var liveStatus = document.getElementById('live-status');
  var liveStatusText = document.getElementById('live-status-text');
  var robotSync = document.getElementById('robot-sync');

  if (remoteBtn) {
    remoteBtn.addEventListener('click', function () {
      remoteBtn.disabled = true;
      var original = remoteBtn.innerHTML;
      remoteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> 점검 중…';

      window.setTimeout(function () {
        remoteBtn.disabled = false;
        remoteBtn.innerHTML = original;
        if (liveStatus) liveStatus.setAttribute('data-state', 'online');
        if (liveStatusText) liveStatusText.textContent = '펫로봇 실시간 연결됨';
        if (robotSync) robotSync.textContent = '방금 전';
        pushEvent({ kind: 'info', text: '원격 상태 점검 완료 — 모든 센서 정상.' });
        toast('원격 점검 완료: 6개 항목 모두 정상입니다.');
        announce('원격 상태 점검이 완료되었습니다.');
      }, 900);
    });
  }

  if (simulateBtn) {
    simulateBtn.addEventListener('click', function () {
      var simulated = normalizeAlert({
        id: uid('alert'),
        elder_name: D.elder.name,
        severity: 'critical',
        category: '응급',
        message: '이상 상황 시뮬레이션 — 3분간 움직임이 감지되지 않았습니다. 즉시 확인이 필요합니다.',
        detected_at: new Date().toISOString(),
        status: 'open',
        assignee: '',
        note: ''
      });

      alertState.items.unshift(simulated);
      renderAlerts();
      pushEvent({ kind: 'risk', text: '긴급 알림 발생: 움직임 미감지 (시뮬레이션)' });
      toast('긴급 알림이 발생했습니다. 목록에서 확인하세요.', 'error');
      announce('긴급 알림이 추가되었습니다.');

      if (alertState.source === 'api') {
        D.api.create('alerts', {
          id: simulated.id,
          elder_name: simulated.elder_name,
          severity: simulated.severity,
          category: simulated.category,
          message: simulated.message,
          detected_at: simulated.detected_at,
          status: simulated.status,
          assignee: simulated.assignee,
          note: simulated.note
        }).then(function (created) {
          if (created && created.id && created.id !== simulated.id) {
            simulated.id = created.id;
            renderAlerts();
          }
        }).catch(function () {
          toast('시뮬레이션 알림은 이 브라우저에만 표시됩니다.', 'error');
        });
      }
    });
  }

  /* ======================================================================
     9. 새로고침 · 인쇄
     ====================================================================== */
  var refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function () {
      refreshBtn.disabled = true;
      var original = refreshBtn.innerHTML;
      refreshBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> 동기화';
      Promise.all([loadAlerts(), loadNotes()]).then(function (results) {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = original;
        var apiCount = results.filter(Boolean).length;
        toast(apiCount > 0 ? '데이터를 동기화했습니다.' : '시연 데이터로 표시 중입니다.');
        announce('데이터를 새로고침했습니다.');
      });
    });
  }

  var printBtn = document.getElementById('print-report-btn');
  if (printBtn) {
    printBtn.addEventListener('click', function () {
      window.print();
    });
  }

  /* ======================================================================
     10. 초기화
     ====================================================================== */
  function init() {
    renderStaticContent();

    var hash = (window.location.hash || '').replace('#', '');
    activateTab(TAB_META[hash] ? hash : 'dashboard', false);

    // 차트는 화면이 보인 뒤 렌더 (컨테이너 높이 확보)
    window.setTimeout(renderCharts, 60);

    Promise.all([loadAlerts(), loadNotes()]).then(function () {
      // 데이터 소스가 하나라도 API면 안내
      if (alertState.source === 'api' || noteState.source === 'api') {
        announce('데이터베이스에 연결되었습니다.');
      }
    });

    window.addEventListener('hashchange', function () {
      var next = (window.location.hash || '').replace('#', '');
      if (TAB_META[next]) activateTab(next, false);
    });

    // 창 크기 변경 시 레이아웃 재계산
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(renderCharts, 200);
    });

    // Chart.js가 뒤늦게 로드되는 경우 대비
    if (C && !C.hasChart()) {
      window.setTimeout(function () {
        if (C.hasChart()) {
          var fallbacks = document.querySelectorAll('.chart-fallback');
          Array.prototype.forEach.call(fallbacks, function (el) { el.remove(); });
          renderCharts();
        }
      }, 1200);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();