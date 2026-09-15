/* ==========================================================================
   앱 데이터 계층
   - 시연용 예시 데이터(스키마 정의 + 시계열)와
   - 테이블 API(alerts / care_notes) 연동 헬퍼를 제공합니다.
   ========================================================================== */
window.AppData = (function () {
  'use strict';

  /* ---------- 1. 모니터링 대상 ---------- */
  var elder = {
    name: '김순자 (가명)',
    meta: '78세 · 자택 거주 · 독거',
    expert: '박서연 PT',
    robotId: 'SC-01',
    robotBattery: 86,
    region: '경기 성남시'
  };

  /* ---------- 2. 오늘 정서 상태 ---------- */
  var todayEmotion = {
    labels: ['우울', '안정', '기쁨'],
    values: [38, 72, 54],
    note: '안정 지수는 개선되었으나 기쁨 지수의 변동 폭이 큽니다.'
  };

  /* ---------- 3. 감정 분석 추이 (일별) ---------- */
  var emotionTrend = {
    weekly: {
      labels: ['9/9', '9/10', '9/11', '9/12', '9/13', '9/14', '9/15'],
      depression: [52, 49, 58, 46, 44, 42, 38],
      stability: [58, 60, 55, 63, 66, 68, 72],
      joy: [38, 42, 34, 48, 46, 50, 54]
    },
    monthly: {
      labels: ['8월 하순', '8월 말', '9월 1주', '9월 2주', '9월 3주'],
      depression: [61, 57, 55, 49, 41],
      stability: [52, 56, 59, 63, 69],
      joy: [33, 36, 39, 44, 49]
    }
  };

  /* ---------- 4. 인지 훈련 ---------- */
  var cognitive = {
    labels: ['8/18', '8/25', '9/1', '9/8', '9/15'],
    scores: [82, 84, 81, 79, 78],
    memory: [80, 79, 77, 76, 74],
    items: [
      { name: '기억력 (카드 짝 맞추기)', score: 74, delta: -3, level: '난이도 상향', state: 'warn' },
      { name: '주의력 (숫자 따라 말하기)', score: 81, delta: 2, level: '유지', state: 'good' },
      { name: '언어 유창성 (단어 이어가기)', score: 86, delta: 4, level: '유지', state: 'good' },
      { name: '실행 기능 (순서 맞추기)', score: 71, delta: -2, level: '난이도 하향', state: 'warn' },
      { name: '지남력 (오늘 날짜·날씨)', score: 92, delta: 0, level: '안정', state: 'good' }
    ]
  };

  /* ---------- 5. 신체활동 ---------- */
  var activity = {
    today: { stretching: 2, stretchingTarget: 3, minutes: 23, minutesTarget: 30, accuracy: 84, riskPostures: 3 },
    posture: {
      labels: ['허리', '무릎', '어깨', '목', '발목', '골반'],
      values: [78, 71, 88, 84, 90, 82]
    },
    feedback: [
      { title: '무릎 과신전 주의', detail: '서서 스트레칭 중 무릎이 뒤로 젖혀졌습니다. 로봇이 즉시 음성 안내를 제공했습니다.', score: 62, state: 'risk', time: '오늘 09:12' },
      { title: '허리 굴곡 개선 필요', detail: '앉아서 앞으로 숙이는 동작에서 허리 각도가 권장 범위를 초과했습니다.', score: 68, state: 'warn', time: '오늘 09:20' },
      { title: '어깨 가동 범위 양호', detail: '어깨 회전 동작이 안정적입니다. 목표 범위를 충족했습니다.', score: 91, state: 'good', time: '오늘 09:28' },
      { title: '발목 균형 안정', detail: '한 발 서기 시 좌우 흔들림이 적었습니다. 낙상 위험 지표 양호.', score: 90, state: 'good', time: '어제 18:40' }
    ],
    routines: [
      { icon: 'fa-chair', title: '앉아서 하는 무릎 펴기', detail: '10회 × 2세트 · 무릎 과신전 교정 목적', meta: '오전 권장', level: '저강도' },
      { icon: 'fa-hand-holding-heart', title: '의자 잡고 종아리 스트레칭', detail: '좌우 각 20초 × 3회 · 하체 유연성', meta: '오전 권장', level: '저강도' },
      { icon: 'fa-arrows-left-right', title: '어깨 돌리기 + 팔 벌리기', detail: '15회 × 2세트 · 어깨 가동 범위 유지', meta: '오후 권장', level: '중강도' },
      { icon: 'fa-shoe-prints', title: '실내 걷기 (로봇 동반)', detail: '10분 · 균형 감각 및 심폐 유지', meta: '오후 권장', level: '저강도' }
    ],
    weekly: {
      labels: ['월', '화', '수', '목', '금', '토', '일'],
      minutes: [28, 34, 21, 30, 23, 12, 5],
      target: 30
    }
  };

  /* ---------- 6. 최근 대화 요약 ---------- */
  var chats = [
    { speaker: 'elder', name: '어르신', text: '"오늘 아침에 로봇이랑 같이 스트레칭했어. 다리는 좀 뻐근한데 기분은 좋아."', sentiment: 'joy', sentimentLabel: '기쁨', time: '오늘 09:35' },
    { speaker: 'robot', name: '펫로봇', text: '아침 활동을 마무리하고 물 한 잔을 권했습니다. 어르신이 응해 주셨습니다.', sentiment: 'calm', sentimentLabel: '안정', time: '오늘 09:36' },
    { speaker: 'elder', name: '어르신', text: '"요즘 밤에 잠이 잘 안 와. 자꾸 옛날 생각이 나."', sentiment: 'low', sentimentLabel: '기분 저하', time: '어제 22:10' },
    { speaker: 'robot', name: '펫로봇', text: '수면 관련 발화가 반복되어 취침 안내 시간을 22시로 조정했습니다.', sentiment: 'calm', sentimentLabel: '안정', time: '어제 22:12' },
    { speaker: 'elder', name: '어르신', text: '"손주들이 언제 오는지 모르겠네…"', sentiment: 'low', sentimentLabel: '정서 저하', time: '어제 16:48' }
  ];

  /* ---------- 7. 인사이트 ---------- */
  var insights = [
    { icon: 'fa-chart-line', title: '안정 지수 상승 추세', body: '최근 4일간 안정 지수가 +14 상승했습니다. 오전 스트레칭 루틴과 대화량 증가가 함께 관찰되었습니다.' },
    { icon: 'fa-moon', title: '수면 관련 발화 반복', body: '밤 시간대 부정적 발화가 3회 감지되었습니다. 전문가 상담 및 취침 안내 시간 조정을 권장합니다.' },
    { icon: 'fa-person-walking', title: '주말 활동량 급감', body: '토·일 활동 시간이 평일 대비 45% 낮습니다. 주말용 실내 걷기 콘텐츠 배치를 추천합니다.' },
    { icon: 'fa-triangle-exclamation', title: '무릎 과신전 반복', body: '스트레칭 3회 중 2회 무릎 과신전이 감지되었습니다. 하체 근력 강화 루틴 추가를 권장합니다.' }
  ];

  /* ---------- 8. 원격 상태 점검 항목 ---------- */
  var deviceChecks = [
    { name: '메인 프로세서', state: '정상', detail: 'CPU 24% · 온도 42℃', ok: true },
    { name: '동작인식 센서', state: '정상', detail: '샘플링 30Hz · 오차 0.8%', ok: true },
    { name: '마이크 어레이', state: '정상', detail: 'SNR 21dB', ok: true },
    { name: '카메라 (표정 인식)', state: '정상', detail: '프레임 드롭 0.3%', ok: true },
    { name: '네트워크', state: '정상', detail: 'Wi-Fi 5GHz · 지연 38ms', ok: true },
    { name: '배터리', state: '충전 중', detail: '86% · 완충까지 42분', ok: true }
  ];

  /* ---------- 9. 실시간 이벤트 스트림(시연용) ---------- */
  var eventPool = [
    { kind: 'info', text: '펫로봇이 어르신의 이름을 호출해 대화를 시작했습니다.' },
    { kind: 'info', text: '대화 세션이 4분간 지속되었습니다. 정서: 안정.' },
    { kind: 'info', text: '자세 정확도 84%로 스트레칭 1세트를 완료했습니다.' },
    { kind: 'warn', text: '무릎 과신전이 감지되어 음성 교정 안내를 제공했습니다.' },
    { kind: 'info', text: '활동 데이터가 클라우드에 동기화되었습니다.' },
    { kind: 'info', text: '인지 훈련 콘텐츠를 자동 재생했습니다. 난이도: 보통.' },
    { kind: 'warn', text: '30분 이상 좌식 상태가 지속되어 기립 안내를 제공했습니다.' },
    { kind: 'info', text: '보호자 앱으로 오늘 요약 카드가 전송되었습니다.' }
  ];

  /* ---------- 10. 테이블 API 헬퍼 ---------- */

  /**
   * 테이블 목록 조회
   * @param {string} table 테이블명
   * @param {{page?:number, limit?:number, search?:string, sort?:string}} [options]
   * @returns {Promise<{data:Array, total:number}>}
   */
  function list(table, options) {
    var opts = options || {};
    var params = new URLSearchParams();
    params.set('page', String(opts.page || 1));
    params.set('limit', String(opts.limit || 100));
    if (opts.search) params.set('search', opts.search);
    if (opts.sort) params.set('sort', opts.sort);

    return fetch('tables/' + table + '?' + params.toString(), {
      headers: { Accept: 'application/json' }
    }).then(function (res) {
      if (!res.ok) throw new Error('조회 실패 (' + res.status + ')');
      return res.json();
    });
  }

  function create(table, payload) {
    return fetch('tables/' + table, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error('등록 실패 (' + res.status + ')');
      return res.json();
    });
  }

  function update(table, id, payload) {
    return fetch('tables/' + table + '/' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error('수정 실패 (' + res.status + ')');
      return res.json();
    });
  }

  function remove(table, id) {
    return fetch('tables/' + table + '/' + encodeURIComponent(id), {
      method: 'DELETE'
    }).then(function (res) {
      if (!res.ok && res.status !== 204) throw new Error('삭제 실패 (' + res.status + ')');
      return true;
    });
  }

  /* ---------- 11. 실제 스키마에 맞춘 시드 폴백 ---------- */
  var seedAlerts = [
    { id: 'alert-001', elder_name: '김순자 (가명)', severity: 'critical', category: '응급', message: '거실에서 낙상 의심 정황이 감지되었습니다. 로봇이 3회 호출에 응답하지 않았습니다.', detected_at: '2026-09-15T07:42:00', status: 'acknowledged', assignee: '이지훈 (보호자)', note: '보호자 통화 완료. 어르신 자력으로 일어나셨고 상태 양호 확인.' },
    { id: 'alert-002', elder_name: '김순자 (가명)', severity: 'warning', category: '정서', message: '3일 연속 우울 지수가 기준치(60)를 초과했습니다. 대화량이 평소 대비 42% 감소했습니다.', detected_at: '2026-09-14T20:15:00', status: 'open', assignee: '', note: '' },
    { id: 'alert-003', elder_name: '김순자 (가명)', severity: 'warning', category: '활동', message: '오늘 권장 스트레칭 3세트 중 1세트만 완료했습니다. 좌식 시간이 6시간을 초과했습니다.', detected_at: '2026-09-15T18:30:00', status: 'open', assignee: '', note: '' },
    { id: 'alert-004', elder_name: '김순자 (가명)', severity: 'info', category: '인지', message: '기억력 게임 점수가 2주 연속 소폭 하락했습니다. 난이도 자동 하향 조정이 적용되었습니다.', detected_at: '2026-09-13T10:05:00', status: 'resolved', assignee: '박서연 (전문가)', note: '난이도 조정 후 재측정 예정. 다음 주간 리포트에서 추이 확인.' },
    { id: 'alert-005', elder_name: '김순자 (가명)', severity: 'info', category: '연결', message: '펫로봇 펌웨어 업데이트가 완료되었습니다. 모든 센서 정상 작동 중입니다.', detected_at: '2026-09-12T02:00:00', status: 'resolved', assignee: '시스템', note: '자동 처리' }
  ];

  var seedNotes = [
    { id: 'note-001', elder_name: '김순자 (가명)', author: '박서연', role: '전문가', category: '정서', content: "회상 대화 주제를 '손주'에서 '젊은 시절 일'로 바꾼 뒤 발화량이 눈에 띄게 늘었습니다. 다음 세션도 같은 계열 주제로 진행 권장.", created_at: '2026-09-15T09:20:00', pinned: true },
    { id: 'note-002', elder_name: '김순자 (가명)', author: '이지훈', role: '보호자', category: '활동', content: '어머니가 아침 스트레칭을 로봇이랑 같이 한다고 좋아하십니다. 저녁 시간대 운동은 피곤해하시니 오전 위주로 부탁드립니다.', created_at: '2026-09-14T21:05:00', pinned: false },
    { id: 'note-003', elder_name: '김순자 (가명)', author: '박서연', role: '전문가', category: '인지', content: '기억력 점수 하락은 수면 패턴과 상관이 있어 보입니다. 로봇 취침 안내 기능을 22시로 조정했습니다.', created_at: '2026-09-13T15:40:00', pinned: false },
    { id: 'note-004', elder_name: '김순자 (가명)', author: '이지훈', role: '보호자', category: '일반', content: '다음 주 병원 정기검진 일정이 있어 12일 오전에는 로봇 알림을 잠시 꺼두겠습니다.', created_at: '2026-09-11T19:10:00', pinned: false }
  ];

  return {
    elder: elder,
    todayEmotion: todayEmotion,
    emotionTrend: emotionTrend,
    cognitive: cognitive,
    activity: activity,
    chats: chats,
    insights: insights,
    deviceChecks: deviceChecks,
    eventPool: eventPool,
    seedAlerts: seedAlerts,
    seedNotes: seedNotes,
    api: { list: list, create: create, update: update, remove: remove }
  };
})();