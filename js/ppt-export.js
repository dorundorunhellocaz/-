/* ==========================================================================
   요약 PPT(.pptx) 생성기 — 브라우저에서 파워포인트 파일을 직접 만듭니다.
   - 사용 라이브러리: PptxGenJS (CDN, https://gitbrent.github.io/PptxGenJS/)
   - 서버가 필요 없으며, 모든 텍스트는 PPT에서 편집 가능한 텍스트 상자로 생성됩니다.
   - 데이터는 js/summary-deck.js 를 그대로 사용하므로 미리보기와 내용이 일치합니다.
   ========================================================================== */
window.PptExport = (function () {
  'use strict';

  var D = window.SummaryDeck;

  /* ---------- 레이아웃 상수 (16:9, 인치 단위) ---------- */
  var L = {
    w: 13.333,
    h: 7.5,
    marginX: 0.6,
    top: 0.42,
    bodyTop: 1.85,
    footerY: 6.94,
    gap: 0.18
  };
  L.contentW = L.w - L.marginX * 2;

  var FONT = 'Malgun Gothic'; // 한글 표시가 안정적인 기본 글꼴
  var COLOR = {
    ink: '16262E',
    body: '40545F',
    muted: '7A8C95',
    line: 'E4DED5',
    white: 'FFFFFF',
    canvas: 'FDF8F2',
    canvasAlt: 'F6EFE6',
    primary: '0E6B74',
    primaryDark: '0A5259',
    primarySoft: 'E3F2F3',
    mint: '4FB8A5',
    mintSoft: 'E5F6F2',
    accent: 'F28C4B',
    accentSoft: 'FDECE0',
    accentDark: 'B25C1F',
    risk: 'E05A5A',
    riskSoft: 'FCEAEA',
    warnSoft: 'FDF2DF',
    inkSoft: 'EEF1F2'
  };

  /* 톤별 색상 묶음 (미리보기의 data-tone 과 동일한 대응) */
  function tone(name) {
    var map = {
      primary: { main: COLOR.primary, soft: COLOR.primarySoft, text: COLOR.primaryDark },
      accent: { main: COLOR.accent, soft: COLOR.accentSoft, text: COLOR.accentDark },
      mint: { main: COLOR.mint, soft: COLOR.mintSoft, text: '2C7C6C' },
      risk: { main: COLOR.risk, soft: COLOR.riskSoft, text: 'B23B3B' },
      warn: { main: 'E8A33D', soft: COLOR.warnSoft, text: 'A16D14' },
      ink: { main: COLOR.ink, soft: COLOR.inkSoft, text: COLOR.ink }
    };
    return map[name] || map.primary;
  }

  /* ---------- 저수준 헬퍼 ---------- */
  function rect(slide, x, y, w, h, options) {
    var opts = options || {};
    slide.addShape(
      opts.radius ? 'roundRect' : 'rect',
      Object.assign({
        x: x, y: y, w: w, h: h,
        fill: { color: opts.fill || COLOR.white },
        line: { color: opts.line || COLOR.line, width: opts.lineWidth === undefined ? 0.75 : opts.lineWidth },
        rectRadius: opts.radius || 0
      }, opts.shapeOptions || {})
    );
  }

  /**
   * 텍스트 추가 (문자열 또는 런 배열)
   */
  function text(slide, runs, options) {
    var opts = Object.assign({
      x: L.marginX, y: 0, w: L.contentW, h: 0.4,
      fontSize: 12, color: COLOR.body, fontFace: FONT,
      valign: 'top', align: 'left', margin: 0
    }, options || {});
    slide.addText(runs, opts);
  }

  function bullets(items, options) {
    var opts = Object.assign({ bullet: { indent: 12 }, fontSize: 10.5, color: COLOR.body }, options || {});
    return items.map(function (run, i) {
      var r = Object.assign({}, run);
      r.options = Object.assign({}, opts, r.options || {});
      if (i < items.length - 1) r.options.breakLine = true;
      return r;
    });
  }

  /* ---------- 블록 렌더러 ---------- */
  var BLOCK = {

    /* 카드 그리드 */
    cards: function (slide, block, y, h) {
      var cols = block.cols || 3;
      var gap = 0.16;
      var w = (L.contentW - gap * (cols - 1)) / cols;

      block.items.forEach(function (item, i) {
        var t = tone(item.tone);
        var x = L.marginX + i * (w + gap);

        rect(slide, x, y, w, h, { fill: COLOR.white, line: COLOR.line, radius: 0.07 });
        rect(slide, x, y, 0.055, h, { fill: t.main, line: t.main, lineWidth: 0, radius: 0 });

        var cursor = y + 0.13;
        if (item.title) {
          text(slide, item.title, {
            x: x + 0.16, y: cursor, w: w - 0.32, h: 0.28,
            fontSize: 13.5, bold: true, color: COLOR.ink
          });
          cursor += 0.31;
        }

        var hasBullets = item.bullets && item.bullets.length;
        var hasBody = !!item.body;
        var footSpace = item.foot ? 0.42 : 0.1;
        var availH = (y + h - footSpace) - cursor;

        if (hasBullets) {
          text(slide, bullets(item.bullets.map(function (b) {
            return {
              text: b.lead + b.body,
              options: { fontSize: 10.5, color: COLOR.body, breakLine: false }
            };
          }), { bullet: { indent: 12 } }), {
            x: x + 0.16, y: cursor, w: w - 0.32, h: hasBody ? availH * 0.72 : availH,
            fontSize: 10.5, color: COLOR.body, valign: 'top', lineSpacingMultiple: 1.15
          });
          cursor += (hasBody ? availH * 0.72 : availH);
        }

        if (hasBody) {
          text(slide, item.body, {
            x: x + 0.16, y: cursor, w: w - 0.32, h: Math.max(0.3, (y + h - footSpace) - cursor),
            fontSize: 10.5, color: COLOR.body, valign: 'top', lineSpacingMultiple: 1.15
          });
        }

        if (item.foot) {
          slide.addShape('line', {
            x: x + 0.16, y: y + h - 0.38, w: w - 0.32, h: 0,
            line: { color: COLOR.line, width: 0.5, dashType: 'dash' }
          });
          text(slide, item.foot, {
            x: x + 0.16, y: y + h - 0.33, w: w - 0.32, h: 0.26,
            fontSize: 8.5, color: COLOR.muted
          });
        }
      });
    },

    /* 악순환 체인 */
    chain: function (slide, block, y, h) {
      var n = block.items.length;
      var arrowW = 0.42;
      var nodeW = (L.contentW - arrowW * (n - 1)) / n;
      var boxH = 0.44;
      var boxY = y + (h - boxH) / 2;

      block.items.forEach(function (label, i) {
        var x = L.marginX + i * (nodeW + arrowW);
        var t = i === 1 ? tone('risk') : (i === 2 ? tone('accent') : { main: COLOR.line, soft: COLOR.white, text: COLOR.ink });

        rect(slide, x, boxY, nodeW, boxH, { fill: t.soft, line: t.main, radius: 0.22 });
        text(slide, label, {
          x: x, y: boxY, w: nodeW, h: boxH,
          fontSize: 11, bold: true, color: t.text, align: 'center', valign: 'middle'
        });

        if (i < n - 1) {
          text(slide, '▼', {
            x: x + nodeW, y: boxY, w: arrowW, h: boxH,
            fontSize: 10, color: COLOR.muted, align: 'center', valign: 'middle'
          });
        }
      });
    },

    /* 강조 문장 */
    note: function (slide, block, y, h) {
      var t = tone(block.tone || 'primary');
      rect(slide, L.marginX, y, L.contentW, h, { fill: t.soft, line: t.main, radius: 0.08 });
      text(slide, block.text, {
        x: L.marginX + 0.22, y: y, w: L.contentW - 0.44, h: h,
        fontSize: 11.5, bold: true, color: t.text, valign: 'middle'
      });
    },

    /* 3개 요약 pill */
    pills: function (slide, block, y, h) {
      var gap = 0.16;
      var w = (L.contentW - gap * (block.items.length - 1)) / block.items.length;

      block.items.forEach(function (p, i) {
        var x = L.marginX + i * (w + gap);
        rect(slide, x, y, w, h, { fill: COLOR.canvasAlt, line: 'ECDFD0', radius: 0.08 });
        text(slide, [
          { text: p.title + '\n', options: { fontSize: 12, bold: true, color: COLOR.ink, breakLine: true } },
          { text: p.sub, options: { fontSize: 9.5, color: COLOR.muted } }
        ], {
          x: x + 0.16, y: y, w: w - 0.32, h: h, valign: 'middle', lineSpacingMultiple: 1.05
        });
      });
    },

    /* 4계층 아키텍처 (가로형) */
    layers: function (slide, block, y, h) {
      var gap = 0.16;
      var cols = block.items.length;
      var w = (L.contentW - gap * (cols - 1)) / cols;
      var labelH = 0.34;
      var nodeGap = 0.12;

      block.items.forEach(function (layer, i) {
        var t = tone(layer.tone);
        var x = L.marginX + i * (w + gap);

        rect(slide, x, y, w, labelH, { fill: t.main, line: t.main, lineWidth: 0, radius: 0.06 });
        text(slide, layer.label, {
          x: x + 0.05, y: y, w: w - 0.1, h: labelH,
          fontSize: 9.5, bold: true, color: COLOR.white, align: 'center', valign: 'middle'
        });

        var nodesY = y + labelH + nodeGap;
        var nodesH = h - labelH - nodeGap;
        var n = layer.nodes.length;
        var nodeH = (nodesH - nodeGap * (n - 1)) / n;

        layer.nodes.forEach(function (node, j) {
          var nx = x;
          var ny = nodesY + j * (nodeH + nodeGap);
          var fill = layer.tone === 'mint' ? COLOR.primarySoft : (layer.tone === 'accent' ? COLOR.accentSoft : COLOR.white);

          rect(slide, nx, ny, w, nodeH, { fill: fill, line: COLOR.line, radius: 0.06 });
          text(slide, [
            { text: node.title + '\n', options: { fontSize: 11, bold: true, color: COLOR.ink, breakLine: true } },
            { text: node.sub, options: { fontSize: 8.5, color: COLOR.muted } }
          ], {
            x: nx + 0.08, y: ny, w: w - 0.16, h: nodeH,
            align: 'center', valign: 'middle', lineSpacingMultiple: 1.02
          });
        });
      });
    },

    /* 데이터 파이프라인 */
    pipeline: function (slide, block, y, h) {
      var gap = 0.14;
      var n = block.items.length;
      var w = (L.contentW - gap * (n - 1)) / n;

      block.items.forEach(function (p, i) {
        var x = L.marginX + i * (w + gap);
        rect(slide, x, y, w, h, { fill: COLOR.white, line: COLOR.line, radius: 0.07 });
        text(slide, [
          { text: p.step + '\n', options: { fontSize: 8, bold: true, color: COLOR.mint, breakLine: true, charSpacing: 1 } },
          { text: p.title + '\n', options: { fontSize: 11.5, bold: true, color: COLOR.ink, breakLine: true } },
          { text: p.body, options: { fontSize: 8.8, color: COLOR.muted } }
        ], {
          x: x + 0.09, y: y + 0.06, w: w - 0.18, h: h - 0.12,
          align: 'center', valign: 'middle', lineSpacingMultiple: 1.06
        });

        if (i < n - 1) {
          text(slide, '▶', {
            x: x + w, y: y, w: gap, h: h,
            fontSize: 9, color: 'C3D2D5', align: 'center', valign: 'middle'
          });
        }
      });
    },

    /* 표 */
    table: function (slide, block, y, h) {
      var titleH = 0.32;
      rect(slide, L.marginX, y, L.contentW, h, { fill: COLOR.white, line: COLOR.line, radius: 0.07 });

      text(slide, block.title, {
        x: L.marginX + 0.18, y: y + 0.09, w: L.contentW - 0.36, h: titleH,
        fontSize: 12.5, bold: true, color: COLOR.ink
      });

      var header = block.head.map(function (label) {
        return {
          text: label,
          options: { bold: true, fontSize: 9.5, color: COLOR.ink, fill: { color: COLOR.canvasAlt }, valign: 'middle' }
        };
      });

      var rows = [header].concat(block.rows.map(function (row) {
        return row.map(function (cell, i) {
          return {
            text: cell,
            options: {
              fontSize: 9.5,
              color: i === 0 ? COLOR.ink : COLOR.body,
              bold: i === 0,
              valign: 'middle'
            }
          };
        });
      }));

      var colW = [3.36, 3.36, L.contentW - 0.36 - 3.36 * 2];

      slide.addTable(rows, {
        x: L.marginX + 0.18,
        y: y + titleH + 0.12,
        w: L.contentW - 0.36,
        colW: colW,
        rowH: 0.315,
        fontFace: FONT,
        border: { type: 'solid', color: COLOR.line, pt: 0.5 },
        margin: 0.06,
        autoPage: false
      });
    },

    /* 글머리 목록 카드 */
    bullets: function (slide, block, y, h) {
      var t = tone(block.tone);
      rect(slide, L.marginX, y, L.contentW, h, { fill: COLOR.white, line: COLOR.line, radius: 0.07 });
      rect(slide, L.marginX, y, 0.055, h, { fill: t.main, line: t.main, lineWidth: 0, radius: 0 });

      text(slide, block.title, {
        x: L.marginX + 0.18, y: y + 0.1, w: L.contentW - 0.36, h: 0.3,
        fontSize: 12.5, bold: true, color: COLOR.ink
      });

      var footH = block.foot ? 0.66 : 0.14;
      text(slide, bullets(block.items.map(function (b) {
        return { text: b.lead + b.body, options: { fontSize: 10.5, color: COLOR.body } };
      }), { bullet: { indent: 12 } }), {
        x: L.marginX + 0.18, y: y + 0.42, w: L.contentW - 0.36, h: h - 0.42 - footH,
        fontSize: 10.5, color: COLOR.body, valign: 'top', lineSpacingMultiple: 1.2
      });

      if (block.foot) {
        slide.addShape('line', {
          x: L.marginX + 0.18, y: y + h - footH + 0.06, w: L.contentW - 0.36, h: 0,
          line: { color: COLOR.line, width: 0.5, dashType: 'dash' }
        });
        text(slide, block.foot, {
          x: L.marginX + 0.18, y: y + h - footH + 0.12, w: L.contentW - 0.36, h: footH - 0.16,
          fontSize: 9, color: COLOR.muted, lineSpacingMultiple: 1.1
        });
      }
    },

    /* 2분할 (좌: 표 / 우: 목록 등) */
    split: function (slide, block, y, h) {
      var gap = 0.18;
      var leftW = (L.contentW - gap) * 0.55;
      var rightW = L.contentW - gap - leftW;

      // 좌측
      var savedMargin = L.marginX;
      L.marginX = savedMargin;
      drawSplitSide(slide, block.left, savedMargin, y, leftW, h, block.left.kind === 'table');
      drawSplitSide(slide, block.right, savedMargin + leftW + gap, y, rightW, h, block.right.kind === 'table');
    },

    /* 5단계 타임라인 */
    timeline: function (slide, block, y, h) {
      var gap = 0.14;
      var n = block.items.length;
      var w = (L.contentW - gap * (n - 1)) / n;

      block.items.forEach(function (phase, i) {
        var x = L.marginX + i * (w + gap);
        rect(slide, x, y, w, h, { fill: COLOR.white, line: COLOR.line, radius: 0.08 });
        rect(slide, x, y, 0.05, h, { fill: COLOR.primary, line: COLOR.primary, lineWidth: 0 });

        text(slide, phase.step, {
          x: x + 0.14, y: y + 0.1, w: w - 0.28, h: 0.22,
          fontSize: 8, bold: true, color: COLOR.muted, charSpacing: 0.6
        });
        text(slide, phase.title, {
          x: x + 0.14, y: y + 0.31, w: w - 0.28, h: 0.5,
          fontSize: 11.5, bold: true, color: COLOR.ink, lineSpacingMultiple: 1.02
        });
        text(slide, bullets(phase.bullets.map(function (b) {
          return { text: b, options: { fontSize: 9, color: COLOR.body } };
        }), { bullet: { indent: 10 }, fontSize: 9, color: COLOR.body }), {
          x: x + 0.14, y: y + 0.86, w: w - 0.28, h: h - 1.34,
          fontSize: 9, color: COLOR.body, valign: 'top', lineSpacingMultiple: 1.12
        });

        // 소요 기간 배지
        var badgeW = 0.92;
        rect(slide, x + 0.14, y + h - 0.42, badgeW, 0.26, { fill: COLOR.primarySoft, line: COLOR.primarySoft, radius: 0.12 });
        text(slide, phase.duration, {
          x: x + 0.14, y: y + h - 0.42, w: badgeW, h: 0.26,
          fontSize: 8.5, bold: true, color: COLOR.primaryDark, align: 'center', valign: 'middle'
        });
      });
    }
  };

  /* split 블록의 좌/우 패널을 임의 위치/폭으로 그립니다. */
  function drawSplitSide(slide, block, x, y, w, h, isTable) {
    var t = tone(block.tone || 'primary');
    rect(slide, x, y, w, h, { fill: COLOR.white, line: COLOR.line, radius: 0.07 });
    rect(slide, x, y, 0.055, h, { fill: t.main, line: t.main, lineWidth: 0, radius: 0 });

    text(slide, block.title, {
      x: x + 0.18, y: y + 0.1, w: w - 0.36, h: 0.3,
      fontSize: 12.5, bold: true, color: COLOR.ink
    });

    if (isTable) {
      var header = block.head.map(function (label) {
        return {
          text: label,
          options: { bold: true, fontSize: 9.5, color: COLOR.ink, fill: { color: COLOR.canvasAlt }, valign: 'middle' }
        };
      });
      var rows = [header].concat(block.rows.map(function (row) {
        return row.map(function (cell, i) {
          return {
            text: cell,
            options: { fontSize: 9.5, color: i === 0 ? COLOR.ink : COLOR.body, bold: i === 0, valign: 'middle' }
          };
        });
      }));
      var inner = w - 0.36;
      slide.addTable(rows, {
        x: x + 0.18, y: y + 0.46, w: inner,
        colW: [inner * 0.34, inner * 0.36, inner * 0.30],
        rowH: 0.3,
        fontFace: FONT,
        border: { type: 'solid', color: COLOR.line, pt: 0.5 },
        margin: 0.05,
        autoPage: false
      });
      return;
    }

    var footH = block.foot ? 0.62 : 0.14;
    text(slide, bullets(block.items.map(function (b) {
      return { text: b.lead + b.body, options: { fontSize: 10, color: COLOR.body } };
    }), { bullet: { indent: 12 }, fontSize: 10, color: COLOR.body }), {
      x: x + 0.18, y: y + 0.44, w: w - 0.36, h: h - 0.44 - footH,
      fontSize: 10, color: COLOR.body, valign: 'top', lineSpacingMultiple: 1.18
    });

    if (block.foot) {
      slide.addShape('line', {
        x: x + 0.18, y: y + h - footH + 0.04, w: w - 0.36, h: 0,
        line: { color: COLOR.line, width: 0.5, dashType: 'dash' }
      });
      text(slide, block.foot, {
        x: x + 0.18, y: y + h - footH + 0.1, w: w - 0.36, h: footH - 0.14,
        fontSize: 8.8, color: COLOR.muted, lineSpacingMultiple: 1.1
      });
    }
  }

  /* ---------- 슬라이드 조립 ---------- */
  function addFooter(slide, pageNo) {
    slide.addShape('line', {
      x: L.marginX, y: L.footerY, w: L.contentW, h: 0,
      line: { color: COLOR.line, width: 0.75 }
    });
    text(slide, [
      { text: D.meta.shortName, options: { color: COLOR.primary, bold: true } },
      { text: '                    ' + pageNo + ' / ' + D.slides.length, options: { color: COLOR.muted } }
    ], {
      x: L.marginX, y: L.footerY + 0.06, w: L.contentW, h: 0.3,
      fontSize: 9, color: COLOR.muted
    });
  }

  function buildCoverSlide(pptx, slide, pageNo) {
    // 배경: 은은한 크림 + 우측 상단 민트 힌트 (도형으로 표현)
    slide.background = { color: 'FBF7F1' };
    rect(slide, L.w - 5.6, -1.4, 7.4, 5.2, { fill: COLOR.mintSoft, line: COLOR.mintSoft, lineWidth: 0, radius: 1.6 });
    rect(slide, -1.6, L.h - 2.6, 5.6, 4.2, { fill: COLOR.accentSoft, line: COLOR.accentSoft, lineWidth: 0, radius: 1.4 });

    text(slide, D.meta.kicker, {
      x: 0.9, y: 1.5, w: 8.2, h: 0.34,
      fontSize: 11.5, bold: true, color: COLOR.accent, charSpacing: 1.2
    });

    text(slide, D.meta.titleLines.join('\n'), {
      x: 0.9, y: 1.95, w: 8.2, h: 2.0,
      fontSize: 27, bold: true, color: COLOR.ink, lineSpacingMultiple: 1.14
    });

    text(slide, D.meta.subtitle, {
      x: 0.9, y: 4.02, w: 7.9, h: 0.8,
      fontSize: 12.5, color: COLOR.body, lineSpacingMultiple: 1.2
    });

    slide.addShape('line', {
      x: 0.9, y: 4.98, w: 7.9, h: 0,
      line: { color: COLOR.line, width: 1 }
    });

    D.meta.coverMeta.forEach(function (m, i) {
      var x = 0.9 + i * 2.68;
      text(slide, [
        { text: m.k + '\n', options: { fontSize: 9.5, bold: true, color: COLOR.ink, breakLine: true } },
        { text: m.v, options: { fontSize: 9, color: COLOR.muted } }
      ], {
        x: x, y: 5.12, w: 2.6, h: 0.8, lineSpacingMultiple: 1.08
      });
    });

    // 우측 원형 엠블럼
    slide.addShape('ellipse', {
      x: 9.55, y: 2.05, w: 2.6, h: 2.6,
      fill: { color: COLOR.white },
      line: { color: 'D5E9E7', width: 1.5 }
    });
    text(slide, '🤖', {
      x: 9.55, y: 2.05, w: 2.6, h: 2.6,
      fontSize: 54, align: 'center', valign: 'middle'
    });
    text(slide, D.meta.audience, {
      x: 8.9, y: 4.78, w: 3.9, h: 0.34,
      fontSize: 9.5, color: COLOR.muted, align: 'center'
    });

    addFooter(slide, pageNo);
  }

  function buildContentSlide(pptx, slide, pageNo) {
    slide.background = { color: COLOR.white };

    var y = L.top;
    text(slide, slide.eyebrow || '', {
      x: L.marginX, y: y, w: 5.4, h: 0.28,
      fontSize: 10, bold: true, color: COLOR.primary, charSpacing: 0.8
    });
    y += 0.42;

    text(slide, slide.title || '', {
      x: L.marginX, y: y, w: L.contentW, h: 0.62,
      fontSize: 22, bold: true, color: COLOR.ink, lineSpacingMultiple: 1.06
    });
    y += 0.66;

    if (slide.subtitle) {
      text(slide, slide.subtitle, {
        x: L.marginX, y: y, w: L.contentW, h: 0.36,
        fontSize: 11, color: COLOR.muted
      });
    }

    // 본문 블록 순차 배치
    var cursor = L.bodyTop;
    (slide.blocks || []).forEach(function (block) {
      var h = block.h;
      if (!h) h = 1.2;
      if (BLOCK[block.kind]) BLOCK[block.kind](slide, block, cursor, h);
      cursor += h + L.gap;
    });

    addFooter(slide, pageNo);
  }

  /* ---------- 문서 생성 ---------- */
  function requireLib() {
    if (typeof window.PptxGenJS === 'undefined') {
      throw new Error('PptxGenJS 라이브러리를 불러오지 못했습니다. 네트워크 연결을 확인해 주세요.');
    }
    if (!D) {
      throw new Error('요약 덱 데이터를 찾을 수 없습니다.');
    }
  }

  function build() {
    requireLib();

    var pptx = new window.PptxGenJS();
    pptx.defineLayout({ name: 'SC_16x9', width: L.w, height: L.h });
    pptx.layout = 'SC_16x9';
    pptx.author = D.meta.shortName;
    pptx.company = D.meta.shortName;
    pptx.title = D.meta.docTitle;
    pptx.subject = '노인 정신건강·신체활동 유도 플랫폼 요약 자료';

    D.slides.forEach(function (slideData, i) {
      var slide = pptx.addSlide();
      if (slideData.layout === 'cover') {
        buildCoverSlide(pptx, slide, i + 1);
      } else {
        buildContentSlide(pptx, slide, i + 1);
      }
    });

    return pptx;
  }

  function fileName() {
    return D.meta.fileBase + '.pptx';
  }

  /* ---------- 다운로드 ---------- */
  function saveBlob(blob, name) {
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(function () { window.URL.revokeObjectURL(url); }, 4000);
  }

  /**
   * 요약 PPT 다운로드
   * @returns {Promise<{mode:string, bytes:number|null}>}
   */
  function download() {
    var pptx;
    try {
      pptx = build();
    } catch (err) {
      return Promise.reject(err);
    }

    var name = fileName();

    // 1순위: blob 생성 후 직접 다운로드 (파일 크기 확인 가능)
    if (typeof pptx.write === 'function') {
      return Promise.resolve(pptx.write({ outputType: 'blob' }))
        .then(function (blob) {
          if (!blob || !blob.size) throw new Error('빈 파일이 생성되었습니다.');
          saveBlob(blob, name);
          return { mode: 'blob', bytes: blob.size };
        })
        .catch(function () {
          // 2순위: 라이브러리 자체 저장 기능
          return Promise.resolve(pptx.writeFile({ fileName: name }))
            .then(function () { return { mode: 'writeFile', bytes: null }; });
        });
    }

    return Promise.resolve(pptx.writeFile({ fileName: name }))
      .then(function () { return { mode: 'writeFile', bytes: null }; });
  }

  /**
   * 다운로드 없이 생성만 수행 (자동 검증용)
   * @returns {Promise<{slides:number, bytes:number, mode:string}>}
   */
  function selfTest() {
    var pptx;
    try {
      pptx = build();
    } catch (err) {
      return Promise.reject(err);
    }

    return Promise.resolve(pptx.write({ outputType: 'blob' }))
      .then(function (blob) {
        return { slides: D.slides.length, bytes: blob ? blob.size : 0, mode: 'blob' };
      })
      .catch(function () {
        return Promise.resolve(pptx.write({ outputType: 'base64' }))
          .then(function (data) {
            return { slides: D.slides.length, bytes: typeof data === 'string' ? data.length : 0, mode: 'base64' };
          });
      });
  }

  return {
    build: build,
    download: download,
    selfTest: selfTest,
    fileName: fileName
  };
})();
