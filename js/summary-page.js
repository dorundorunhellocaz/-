/* ==========================================================================
   요약 덱 미리보기 렌더러
   - js/summary-deck.js 의 데이터를 16:9 시트로 렌더링합니다.
   - .pptx 생성(js/ppt-export.js)도 같은 데이터를 사용하므로 내용이 항상 일치합니다.
   ========================================================================== */
window.AppSummaryPage = (function () {
  'use strict';

  var D = window.SummaryDeck;
  if (!D) return { renderPreview: function () {} };

  /* ---------- 공통 유틸 ---------- */
  function esc(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function bold(text) {
    // **강조** 마크업을 <strong> 으로 변환 (먼저 이스케이프)
    return esc(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  function footerFor(slide) {
    return D.meta.shortName + '  ·  ' + slide.id + ' / ' + D.slides.length;
  }

  /* ---------- 블록 렌더러 ---------- */
  var BLOCK = {

    cards: function (block) {
      return '' +
        '<div class="mini-cards mini-cards--' + (block.cols || 3) + '">' +
          block.items.map(function (item) {
            var head = item.title
              ? '<h3>' + (item.icon ? '<i class="fa-solid ' + esc(item.icon) + '" aria-hidden="true"></i> ' : '') + esc(item.title) + '</h3>'
              : '';
            var body = '';
            if (item.bullets && item.bullets.length) {
              body = '<ul>' + item.bullets.map(function (b) {
                return '<li><strong>' + esc(b.lead) + '</strong>' + esc(b.body) + '</li>';
              }).join('') + '</ul>';
            }
            if (item.body) body += '<p>' + bold(item.body) + '</p>';
            var foot = item.foot ? '<p class="mini-card__foot">' + esc(item.foot) + '</p>' : '';
            return '<article class="mini-card" data-tone="' + esc(item.tone || 'primary') + '">' + head + body + foot + '</article>';
          }).join('') +
        '</div>';
    },

    chain: function (block) {
      return '' +
        '<div class="chain" role="img" aria-label="' + esc(block.items.join(' → ')) + '">' +
          block.items.map(function (text, i) {
            var tone = i === 1 ? 'risk' : (i === 2 ? 'accent' : '');
            var node = '<span class="chain__node"' + (tone ? ' data-tone="' + tone + '"' : '') + '>' + esc(text) + '</span>';
            var arrow = i < block.items.length - 1 ? '<span class="chain__arrow" aria-hidden="true"><i class="fa-solid fa-arrow-down"></i></span>' : '';
            return node + arrow;
          }).join('') +
        '</div>';
    },

    note: function (block) {
      return '' +
        '<div class="callout" data-tone="' + esc(block.tone || 'primary') + '">' +
          '<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>' +
          '<span>' + bold(block.text) + '</span>' +
        '</div>';
    },

    pills: function (block) {
      return '' +
        '<div class="pills">' +
          block.items.map(function (p) {
            return '<div class="pill-item"><strong>' + esc(p.title) + '</strong><span>' + esc(p.sub) + '</span></div>';
          }).join('') +
        '</div>';
    },

    layers: function (block) {
      return '' +
        '<div class="layers">' +
          block.items.map(function (layer) {
            return '' +
              '<div class="layer" data-tone="' + esc(layer.tone || 'primary') + '">' +
                '<p class="layer__label">' + esc(layer.label) + '</p>' +
                '<div class="layer__nodes">' +
                  layer.nodes.map(function (n) {
                    return '<div class="layer__node"><strong>' + esc(n.title) + '</strong><span>' + esc(n.sub) + '</span></div>';
                  }).join('') +
                '</div>' +
              '</div>';
          }).join('') +
        '</div>';
    },

    pipeline: function (block) {
      return '' +
        '<div class="pipeline-row">' +
          block.items.map(function (p) {
            return '' +
              '<div class="pipe-step">' +
                '<span class="pipe-step__no">' + esc(p.step) + '</span>' +
                '<strong>' + esc(p.title) + '</strong>' +
                '<p>' + esc(p.body) + '</p>' +
              '</div>';
          }).join('') +
        '</div>';
    },

    table: function (block) {
      return '' +
        '<div class="mini-card" data-tone="primary">' +
          '<h3>' + esc(block.title) + '</h3>' +
          '<table class="mini-table">' +
            '<thead><tr>' + block.head.map(function (h) { return '<th scope="col">' + esc(h) + '</th>'; }).join('') + '</tr></thead>' +
            '<tbody>' +
              block.rows.map(function (row) {
                return '<tr>' + row.map(function (cell, i) {
                  return i === 0 ? '<th scope="row" style="text-align:left;font-weight:600;color:var(--color-ink)">' + esc(cell) + '</th>' : '<td>' + esc(cell) + '</td>';
                }).join('') + '</tr>';
              }).join('') +
            '</tbody>' +
          '</table>' +
        '</div>';
    },

    bullets: function (block) {
      return '' +
        '<div class="mini-card" data-tone="' + esc(block.tone || 'primary') + '">' +
          '<h3>' + esc(block.title) + '</h3>' +
          '<ul>' +
            block.items.map(function (b) {
              return '<li><strong>' + esc(b.lead) + '</strong>' + esc(b.body) + '</li>';
            }).join('') +
          '</ul>' +
          (block.foot ? '<p class="mini-card__foot">' + bold(block.foot) + '</p>' : '') +
        '</div>';
    },

    split: function (block) {
      return '' +
        '<div class="split">' +
          BLOCK[block.left.kind](block.left) +
          BLOCK[block.right.kind](block.right) +
        '</div>';
    },

    timeline: function (block) {
      return '' +
        '<div class="timeline-row">' +
          block.items.map(function (p) {
            return '' +
              '<div class="tl-phase">' +
                '<span class="tl-phase__step">' + esc(p.step) + '</span>' +
                '<h3>' + esc(p.title) + '</h3>' +
                '<ul>' + p.bullets.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>' +
                '<span class="tl-phase__dur">' + esc(p.duration) + '</span>' +
              '</div>';
          }).join('') +
        '</div>';
    }
  };

  /* ---------- 슬라이드 렌더러 ---------- */
  function coverSheet(slide) {
    return '' +
      '<article class="sheet sheet--cover" data-footer="' + esc(footerFor(slide)) + '" aria-label="요약 ' + slide.id + '장: 표지">' +
        '<div class="cover-grid">' +
          '<div>' +
            '<p class="cover-kicker">' + esc(D.meta.kicker) + '</p>' +
            '<h3 class="cover-title">' +
              D.meta.titleLines.map(function (line, i) {
                var text = i === 1 ? line.replace('반려로봇', '<em>반려로봇</em>') : esc(line);
                return text;
              }).join('<br>') +
            '</h3>' +
            '<p class="cover-sub">' + esc(D.meta.subtitle) + '</p>' +
            '<div class="cover-meta">' +
              D.meta.coverMeta.map(function (m) {
                return '<div><strong>' + esc(m.k) + '</strong>' + esc(m.v) + '</div>';
              }).join('') +
            '</div>' +
          '</div>' +
          '<div class="cover-badge" aria-hidden="true"><i class="fa-solid fa-robot"></i></div>' +
        '</div>' +
      '</article>';
  }

  function contentSheet(slide) {
    return '' +
      '<article class="sheet" data-footer="' + esc(footerFor(slide)) + '" aria-label="요약 ' + slide.id + '장: ' + esc(slide.title || '') + '">' +
        (slide.eyebrow ? '<p class="sheet__eyebrow">' + esc(slide.eyebrow) + '</p>' : '') +
        (slide.title ? '<h3 class="sheet__title">' + esc(slide.title) + '</h3>' : '') +
        (slide.subtitle ? '<p class="sheet__subtitle">' + esc(slide.subtitle) + '</p>' : '') +
        '<div class="sheet__body">' +
          (slide.blocks || []).map(function (block) {
            return BLOCK[block.kind] ? BLOCK[block.kind](block) : '';
          }).join('') +
        '</div>' +
      '</article>';
  }

  /* ---------- 공개 API ---------- */
  function renderPreview() {
    var wrap = document.getElementById('summary-slides');
    if (!wrap) return;

    wrap.innerHTML = D.slides.map(function (slide) {
      var sheet = slide.layout === 'cover' ? coverSheet(slide) : contentSheet(slide);
      return '' +
        '<section class="slide-frame">' +
          '<div class="slide-frame__head no-print">' +
            '<h2>슬라이드 ' + slide.id + '</h2>' +
            '<span>' + esc(slide.title || '표지') + '</span>' +
          '</div>' +
          sheet +
        '</section>';
    }).join('');
  }

  return { renderPreview: renderPreview, esc: esc };
})();