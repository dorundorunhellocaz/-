/* ==========================================================================
   차트 모듈 (Chart.js 기반)
   - Chart.js 로드 실패 시에도 앱이 죽지 않도록 방어적으로 작성
   - 모든 차트 컨테이너는 고정 높이(css/app.css) 사용
   ========================================================================== */
window.AppCharts = (function () {
  'use strict';

  var registry = {};

  var PALETTE = {
    primary: '#0e6b74',
    primarySoft: 'rgba(14, 107, 116, .16)',
    mint: '#4fb8a5',
    mintSoft: 'rgba(79, 184, 165, .18)',
    accent: '#f28c4b',
    accentSoft: 'rgba(242, 140, 75, .18)',
    joy: '#f2b23e',
    calm: '#4fb8a5',
    low: '#6b8cc7',
    risk: '#e05a5a',
    ink: '#16262e',
    muted: '#7a8c95',
    line: '#e4ded5'
  };

  function hasChart() {
    return typeof window.Chart !== 'undefined';
  }

  function ctx(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    return el.getContext('2d');
  }

  function destroy(id) {
    if (registry[id]) {
      registry[id].destroy();
      delete registry[id];
    }
  }

  /**
   * 차트 생성 공통 래퍼
   * @param {string} id canvas id
   * @param {object} config Chart.js config
   */
  function mount(id, config) {
    if (!hasChart()) return null;
    var context = ctx(id);
    if (!context) return null;
    destroy(id);
    registry[id] = new window.Chart(context, config);
    return registry[id];
  }

  function baseOptions(extra) {
    var options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: PALETTE.ink,
            font: { family: 'Pretendard, sans-serif', size: 12 },
            usePointStyle: true,
            boxWidth: 10
          }
        },
        tooltip: {
          backgroundColor: 'rgba(22,38,46,.94)',
          titleFont: { family: 'Pretendard, sans-serif', size: 12 },
          bodyFont: { family: 'Pretendard, sans-serif', size: 12 },
          padding: 10,
          cornerRadius: 8
        }
      }
    };
    if (extra) {
      Object.keys(extra).forEach(function (key) {
        if (key === 'plugins' || key === 'scales') {
          options[key] = Object.assign({}, options[key], extra[key]);
        } else {
          options[key] = extra[key];
        }
      });
    }
    return options;
  }

  function tickFont() {
    return { family: 'Pretendard, sans-serif', size: 11, color: PALETTE.muted };
  }

  return {
    palette: PALETTE,
    hasChart: hasChart,
    destroy: destroy,
    baseOptions: baseOptions,
    tickFont: tickFont,
    mount: mount
  };
})();