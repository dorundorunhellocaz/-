/* ==========================================================================
   요약 덱 데이터 (6장)
   - summary.html 미리보기와 .pptx 생성(js/ppt-export.js)이 같은 데이터를 사용합니다.
   ========================================================================== */
window.SummaryDeck = (function () {
  'use strict';

  /* 톤(색상) 정의 — html 미리보기와 pptx 생성 양쪽에서 공용 */
  var TONES = {
    primary: { color: '0E6B74', soft: 'E3F2F3', line: 'CFE7E8', text: '0A5259' },
    accent: { color: 'F28C4B', soft: 'FDECE0', line: 'F4D8C1', text: 'B25C1F' },
    mint: { color: '4FB8A5', soft: 'E5F6F2', line: 'CDE9E1', text: '2C7C6C' },
    risk: { color: 'E05A5A', soft: 'FCEAEA', line: 'F3CFCF', text: 'B23B3B' },
    warn: { color: 'E8A33D', soft: 'FDF2DF', line: 'F3E0BC', text: 'A16D14' },
    ink: { color: '16262E', soft: 'EEF1F2', line: 'DDE3E5', text: '16262E' }
  };

  var meta = {
    shortName: '실버케어 로봇 플랫폼',
    kicker: '고령화 사회를 위한 돌봄 기술 제안',
    titleLines: [
      'AI 휴머노이드 반려로봇 기반',
      '노인 정신건강 진단·증진 및',
      '신체활동 유도 플랫폼'
    ],
    subtitle: '대화로 마음을 읽고, 동작으로 몸을 일으키고, 데이터로 가족과 전문가를 연결합니다.',
    audience: '노인 건강관리 관계자 · 투자자/멘토',
    fileBase: '실버케어_로봇_플랫폼_요약_PPT',
    docTitle: 'AI 휴머노이드 반려로봇 기반 노인 정신건강·신체활동 플랫폼 (요약)',
    coverMeta: [
      { k: '대상', v: '노인 건강관리 관계자 · 투자자/멘토' },
      { k: '핵심 기술', v: 'AI(NLP·감정인식) · 로봇공학 · 동작인식 센서' },
      { k: '단계', v: '프로토타입 기획 · PoC 제안' }
    ]
  };

  var slides = [
    /* ---------------- 1. 표지 ---------------- */
    {
      id: 1,
      type: 'cover',
      layout: 'cover'
    },

    /* ---------------- 2. 문제 정의 ---------------- */
    {
      id: 2,
      eyebrow: '01 기획 배경 및 필요성',
      title: '고령화 사회, 노인의 마음과 몸이 동시에 위험해집니다',
      subtitle: '정신건강 저하와 신체활동 부족은 서로를 악화시키는 악순환을 만듭니다',
      blocks: [
        {
          kind: 'cards',
          cols: 4,
          h: 2.35,
          items: [
            { tone: 'primary', icon: 'fa-user-group', title: '사회적 고립', body: '독거·홀몸 어르신 증가로 일상적 대화 상대가 줄고, 우울 위험이 높아집니다.' },
            { tone: 'risk', icon: 'fa-brain', title: '정신건강·인지 저하', body: '자각이 늦고, 방치 시 치매 위험과 돌봄 부담이 급증합니다.' },
            { tone: 'accent', icon: 'fa-person-walking', title: '신체활동 부족', body: '근력·균형 감소는 낙상으로, 활동 저하는 정서 저하로 이어집니다.' },
            { tone: 'ink', icon: 'fa-eye-slash', title: '조기 발견의 공백', body: '검진 사이의 일상 변화를 관찰·기록할 상시 수단이 부족합니다.' }
          ]
        },
        {
          kind: 'chain',
          h: 0.62,
          items: ['대화·활동 감소', '우울·인지 저하', '신체활동 회피', '근력·자신감 저하']
        },
        {
          kind: 'note',
          h: 0.66,
          tone: 'accent',
          text: '이 고리를 끊으려면 매일의 개입이 필요합니다. 사람이 24시간 곁에 있을 수는 없습니다.'
        }
      ]
    },

    /* ---------------- 3. 솔루션 + 3대 기능 ---------------- */
    {
      id: 3,
      eyebrow: '02 프로젝트 개요 및 주요 기능',
      title: 'AI 반려로봇을 돌봄의 상시 접점으로 만드는 융합 플랫폼',
      subtitle: '로봇은 어르신 곁에서, 앱은 보호자·전문가 곁에서 — 같은 데이터를 함께 봅니다',
      blocks: [
        {
          kind: 'cards',
          cols: 3,
          h: 3.35,
          items: [
            {
              tone: 'primary',
              title: '① 정서 교감 & 인지 훈련',
              bullets: [
                { lead: '자연어 처리(NLP)', body: ' — 일상·회상 대화로 언어 자극, 위험 발화 감지' },
                { lead: '감정 인식', body: ' — 표정·음성 톤·발화 결합 정서 추정' },
                { lead: '인지 훈련', body: ' — 기억·주의력 게임, 난이도 자동 조절' }
              ],
              foot: '산출 신호: 우울/안정/기쁨 지수, 인지 점수 추이'
            },
            {
              tone: 'accent',
              title: '② 맞춤형 신체활동 코칭',
              bullets: [
                { lead: '동작인식 센서', body: ' — 관절 움직임·동작 범위 실시간 추적' },
                { lead: '자세 교정', body: ' — 위험 자세 감지 시 즉시 음성 안내' },
                { lead: '루틴 추천', body: ' — 체력·컨디션 기반 스트레칭·근력 운동' }
              ],
              foot: '산출 신호: 스트레칭 횟수, 운동 시간, 자세 정확도'
            },
            {
              tone: 'mint',
              title: '③ 원격 모니터링',
              bullets: [
                { lead: '보호자 앱', body: ' — 오늘의 정서·활동 요약과 대화 카드 공유' },
                { lead: '전문가 대시보드', body: ' — 주간·월간 추이와 개입 필요 시그널' },
                { lead: '긴급 알림', body: ' — 이상 감지 시 보호자·기관에 단계별 통보' }
              ],
              foot: '산출 신호: 연결 상태, 알림 이력, 응답 시간'
            }
          ]
        },
        {
          kind: 'pills',
          h: 0.8,
          items: [
            { title: '목표', sub: '정신건강 매일 진단·증진 + 신체활동 자연 유도' },
            { title: '접근', sub: '거부감 없는 펫 형태의 휴머노이드 로봇' },
            { title: '연결', sub: '보호자 앱 · 전문가 대시보드가 실시간 공유' }
          ]
        }
      ]
    },

    /* ---------------- 4. 아키텍처 ---------------- */
    {
      id: 4,
      eyebrow: '03 시스템 아키텍처 & 관련 기술',
      title: '엣지(로봇) → 클라우드 → 앱으로 이어지는 4계층 구조',
      subtitle: '엣지 1차 추론 → 가명처리 후 전송 → 클라우드 분석·리포팅 → 앱·대시보드 제공',
      blocks: [
        {
          kind: 'layers',
          h: 3.7,
          items: [
            {
              label: 'Layer 1 · 엣지(로봇 탑재)',
              tone: 'primary',
              nodes: [
                { title: '음성 인식', sub: 'STT · 노이즈 제거' },
                { title: '표정 인식', sub: '카메라 비전' },
                { title: '동작인식 센서', sub: '관절 좌표·관성센서' },
                { title: '음성 안내', sub: 'TTS · 코칭 발화' }
              ]
            },
            {
              label: 'Layer 2 · AI 추론 엔진',
              tone: 'mint',
              nodes: [
                { title: 'NLP 엔진', sub: '대화 의도·위험 발화' },
                { title: '감정 인식 모델', sub: '정서 분류(3~5단계)' },
                { title: '동작 분석 모델', sub: '자세 정확도·낙상 위험' },
                { title: '추천 모델', sub: '콘텐츠·운동 난이도' }
              ]
            },
            {
              label: 'Layer 3 · 플랫폼(클라우드)',
              tone: 'accent',
              nodes: [
                { title: '데이터 저장소', sub: '대화·감정·동작 이력' },
                { title: '분석 / 리포팅', sub: '주간·월간 리포트 생성' },
                { title: '알림 서비스', sub: '이상 감지·단계별 통보' }
              ]
            },
            {
              label: 'Layer 4 · 사용자 접점',
              tone: 'ink',
              nodes: [
                { title: '보호자 모바일 앱', sub: '요약 카드·리포트·알림' },
                { title: '전문가 대시보드', sub: '추이 분석·개입 판단' },
                { title: '펫로봇 UI', sub: '음성·표정·제스처' }
              ]
            }
          ]
        },
        {
          kind: 'note',
          h: 0.58,
          tone: 'primary',
          text: '로봇은 센서로 수집하고, 클라우드는 분석·알림을 담당하며, 앱은 사람이 판단할 수 있게 보여줍니다.'
        }
      ]
    },

    /* ---------------- 5. 데이터 활용 ---------------- */
    {
      id: 5,
      eyebrow: '04 데이터 활용 방안',
      title: '활동·대화 데이터가 맞춤형 추천 AI를 학습시킵니다',
      subtitle: '수집 → 정제 → 분석 → 개인화 → 검증의 순환 구조로, 쓸수록 정확해지는 돌봄이 됩니다',
      blocks: [
        {
          kind: 'pipeline',
          h: 1.3,
          items: [
            { step: 'STEP 1', title: '수집', body: '대화 텍스트, 감정 인식 결과, 동작 센서 시계열' },
            { step: 'STEP 2', title: '정제·가명처리', body: '개인식별정보 비식별화, 결측·노이즈 보정' },
            { step: 'STEP 3', title: '분석', body: '정서 추이, 인지 점수 변화, 활동량 상관 분석' },
            { step: 'STEP 4', title: '개인화', body: '콘텐츠·운동 루틴·대화 주제 자동 추천' },
            { step: 'STEP 5', title: '검증·개선', body: '전문가 피드백 반영, 모델 재학습' }
          ]
        },
        {
          kind: 'split',
          h: 3.1,
          left: {
            kind: 'table',
            title: '데이터 → 지표 매핑',
            head: ['데이터 원천', '파생 지표', '활용'],
            rows: [
              ['대화 텍스트·음성', '정서 지수(우울/안정/기쁨)', '정서 상태 리포트'],
              ['표정·발화 톤', '감정 분류 신뢰도', '알림 민감도 조정'],
              ['동작인식 센서', '자세 정확도·활동량', '운동 코칭·루틴 추천'],
              ['인지 훈련 결과', '기억력·주의력 점수', '난이도 자동 조절'],
              ['앱·로봇 이벤트', '연결 상태·응답 시간', '긴급 알림 판단']
            ]
          },
          right: {
            kind: 'bullets',
            title: '개인정보·윤리 원칙',
            tone: 'accent',
            items: [
              { lead: '최소 수집', body: ' — 목적에 필요한 데이터만 수집' },
              { lead: '가명·익명 처리', body: ' — 분석·리포팅은 비식별 데이터 기반' },
              { lead: '동의 기반', body: ' — 어르신·보호자 동의 범위 내 활용' },
              { lead: '설명가능성', body: ' — 알림 사유와 근거를 앱에서 확인' }
            ],
            foot: '본 플랫폼은 의료적 진단을 대체하지 않으며, 전문가 판단을 보조하는 징후 탐지로 포지셔닝합니다.'
          }
        }
      ]
    },

    /* ---------------- 6. 결과물 & 일정 ---------------- */
    {
      id: 6,
      eyebrow: '05 결과물 & 추진 일정',
      title: '요구사항 분석부터 최종 피드백 검증까지 5단계 운영 계획',
      blocks: [
        {
          kind: 'timeline',
          h: 2.3,
          items: [
            { step: 'STEP 1', title: '요구사항 분석', duration: '1~2개월', bullets: ['대상자·보호자 인터뷰', '기관 니즈 조사', '기능 요구 정의'] },
            { step: 'STEP 2', title: '설계 & 프로토타입', duration: '2~3개월', bullets: ['아키텍처 설계', '펫로봇 프로토타입', '앱 UI/UX 설계'] },
            { step: 'STEP 3', title: '핵심 기능 개발', duration: '3~4개월', bullets: ['NLP·감정인식 탑재', '동작인식 코칭', '콘텐츠 라이브러리'] },
            { step: 'STEP 4', title: '연동 & PoC 운영', duration: '3~4개월', bullets: ['보호자 앱 연동', '분석·리포팅 시스템', '실증 현장 적용'] },
            { step: 'STEP 5', title: '피드백 검증', duration: '2개월', bullets: ['효과성 지표 측정', '사용성 평가', '개선·사업화'] }
          ]
        },
        {
          kind: 'split',
          h: 2.2,
          left: {
            kind: 'bullets',
            title: '최종 결과물',
            tone: 'primary',
            items: [
              { lead: 'AI 펫로봇 프로토타입', body: ' — 대화·감정인식·동작코칭 탑재' },
              { lead: '콘텐츠 라이브러리', body: ' — 대화·인지훈련·운동 콘텐츠 세트' },
              { lead: '보호자용 모바일 앱', body: ' — 요약 카드·리포트·긴급 알림' },
              { lead: '데이터 분석·리포팅', body: ' — 익명화 데이터 기반 정기 리포트' }
            ]
          },
          right: {
            kind: 'bullets',
            title: '협력 요청',
            tone: 'accent',
            items: [
              { lead: '파트너', body: ' — 실증 참여 요양·복지 기관 및 지자체' },
              { lead: '자문', body: ' — 정신건강·재활 전문가 임상 자문' },
              { lead: '투자/멘토링', body: ' — 프로토타입 고도화 및 PoC 운영 지원' }
            ],
            foot: '함께 검증할 파트너를 찾고 있습니다. 웹앱 프로토타입으로 화면을 바로 확인하실 수 있습니다.'
          }
        }
      ]
    }
  ];

  return { meta: meta, slides: slides, tones: TONES };
})();