(function () {
  "use strict";

  const DAY = 24 * 60 * 60 * 1000;

  function toLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function daysFromNow(days, hour) {
    const date = new Date(Date.now() + days * DAY);
    date.setHours(hour ?? 9, 30, 0, 0);
    return date.toISOString();
  }

  function dateOnly(days) {
    return toLocalDateString(new Date(Date.now() + days * DAY));
  }

  const PROJECT_TYPES = {
    "사업/용역 수행": ["착수", "자료수집", "사업수행", "결과보고"],
    "서비스 개발": ["요구사항", "설계", "개발", "QA", "배포"],
    "콘텐츠 제작": ["기획", "원고", "제작", "검수", "배포"]
  };

  const UPPER_STAGES = ["기획", "준비", "실행", "검토", "완료"];

  function createInitialData() {
    return {
      currentUserId: "user-1",
      users: [
        {
          id: "user-1",
          name: "박서연",
          email: "seoyeon.park@example.com",
          role: "관리자",
          projectIds: ["project-1", "project-2", "project-3", "project-4", "project-5", "project-6"],
          active: true
        },
        {
          id: "user-2",
          name: "최유진",
          email: "yujin.choi@example.com",
          role: "기획자",
          projectIds: ["project-1", "project-2", "project-4", "project-6"],
          active: true
        },
        {
          id: "user-3",
          name: "김민준",
          email: "minjun.kim@example.com",
          role: "담당자",
          projectIds: ["project-1", "project-3", "project-5"],
          active: true
        },
        {
          id: "user-4",
          name: "한지우",
          email: "jiwoo.han@example.com",
          role: "담당자",
          projectIds: ["project-2", "project-4", "project-6"],
          active: true
        },
        {
          id: "user-5",
          name: "오세진",
          email: "sejin.oh@example.com",
          role: "기획자",
          projectIds: ["project-3", "project-5"],
          active: false
        }
      ],
      projects: [
        {
          id: "project-1",
          name: "통합 고객지원 포털 구축",
          type: "서비스 개발",
          plannerId: "user-2",
          responsibleId: "user-3",
          startDate: dateOnly(-42),
          endDate: dateOnly(32),
          notionUrl: "https://www.notion.so/",
          status: "진행 중",
          upperStage: "실행",
          detailStage: "개발",
          summary: "고객 문의 이력 화면과 상담원 배정 기능의 1차 개발을 마쳤습니다.",
          issue: "기존 회원 데이터의 중복 계정 처리 기준 확인이 필요합니다.",
          nextSchedule: `${dateOnly(3)} 개발 중간 점검`,
          lastUpdated: daysFromNow(-0.4, 14),
          updateHistory: [
            { at: daysFromNow(-0.4, 14), userId: "user-3", content: "고객 문의 이력 화면 1차 개발 완료" },
            { at: daysFromNow(-2.2, 11), userId: "user-3", content: "상담원 배정 API 연결 시작" },
            { at: daysFromNow(-5.1, 16), userId: "user-2", content: "개발 범위 및 우선순위 조정" }
          ]
        },
        {
          id: "project-2",
          name: "2026 하반기 브랜드 캠페인",
          type: "콘텐츠 제작",
          plannerId: "user-2",
          responsibleId: "user-4",
          startDate: dateOnly(-28),
          endDate: dateOnly(18),
          notionUrl: "https://www.notion.so/",
          status: "진행 중",
          upperStage: "검토",
          detailStage: "검수",
          summary: "메인 영상 2차 편집본을 공유하고 채널별 배너 시안을 정리했습니다.",
          issue: "영상 내 제품 표현 문구의 법무 검토가 대기 중입니다.",
          nextSchedule: `${dateOnly(2)} 최종 편집본 검수`,
          lastUpdated: daysFromNow(-2.7, 10),
          updateHistory: [
            { at: daysFromNow(-2.7, 10), userId: "user-4", content: "메인 영상 2차 편집본 및 배너 시안 공유" },
            { at: daysFromNow(-4.8, 15), userId: "user-4", content: "촬영 원본 셀렉 완료" },
            { at: daysFromNow(-8, 13), userId: "user-2", content: "채널별 제작 규격 확정" }
          ]
        },
        {
          id: "project-3",
          name: "지역 상권 디지털 전환 지원",
          type: "사업/용역 수행",
          plannerId: "user-5",
          responsibleId: "user-3",
          startDate: dateOnly(-65),
          endDate: dateOnly(48),
          notionUrl: "https://www.notion.so/",
          status: "진행 중",
          upperStage: "실행",
          detailStage: "사업수행",
          summary: "참여 점포 24곳의 현장 컨설팅 중 16곳을 완료했습니다.",
          issue: "4개 점포의 POS 연동 가능 여부를 추가 확인해야 합니다.",
          nextSchedule: `${dateOnly(5)} 2차 현장 컨설팅 마감`,
          lastUpdated: daysFromNow(-6.2, 16),
          updateHistory: [
            { at: daysFromNow(-6.2, 16), userId: "user-3", content: "현장 컨설팅 16개 점포 완료" },
            { at: daysFromNow(-9.5, 10), userId: "user-5", content: "참여 점포별 실행 계획 검토" },
            { at: daysFromNow(-14, 14), userId: "user-3", content: "1차 현장 인터뷰 결과 취합" }
          ]
        },
        {
          id: "project-4",
          name: "사내 업무 자동화 고도화",
          type: "서비스 개발",
          plannerId: "user-2",
          responsibleId: "user-4",
          startDate: dateOnly(-74),
          endDate: dateOnly(12),
          notionUrl: "https://www.notion.so/",
          status: "진행 중",
          upperStage: "검토",
          detailStage: "QA",
          summary: "정산 자동화 시나리오의 통합 테스트를 진행하고 있습니다.",
          issue: "회계 시스템 테스트 계정 권한이 만료되어 QA가 중단되었습니다.",
          nextSchedule: `${dateOnly(1)} 권한 복구 후 회귀 테스트`,
          lastUpdated: daysFromNow(-11.3, 9),
          updateHistory: [
            { at: daysFromNow(-11.3, 9), userId: "user-4", content: "통합 테스트 중 계정 권한 만료 이슈 등록" },
            { at: daysFromNow(-13.6, 17), userId: "user-2", content: "QA 시나리오 28건 확정" },
            { at: daysFromNow(-17, 11), userId: "user-4", content: "정산 자동화 개발 완료" }
          ]
        },
        {
          id: "project-5",
          name: "신규 입사자 온보딩 콘텐츠",
          type: "콘텐츠 제작",
          plannerId: "user-5",
          responsibleId: "user-3",
          startDate: dateOnly(-15),
          endDate: dateOnly(24),
          notionUrl: "",
          status: "진행 중",
          upperStage: "준비",
          detailStage: "원고",
          summary: "직무 공통 과정의 구성안을 확정하고 인터뷰 원고를 작성 중입니다.",
          issue: "없음",
          nextSchedule: `${dateOnly(4)} 인터뷰 원고 초안 공유`,
          lastUpdated: daysFromNow(-1.3, 15),
          updateHistory: [
            { at: daysFromNow(-1.3, 15), userId: "user-3", content: "직무 공통 과정 구성안 확정" },
            { at: daysFromNow(-3.4, 10), userId: "user-5", content: "현업 인터뷰 대상자 섭외 완료" }
          ]
        },
        {
          id: "project-6",
          name: "공공데이터 활용 성과조사",
          type: "사업/용역 수행",
          plannerId: "user-2",
          responsibleId: "user-4",
          startDate: dateOnly(-92),
          endDate: dateOnly(-4),
          notionUrl: "https://www.notion.so/",
          status: "완료",
          upperStage: "완료",
          detailStage: "결과보고",
          summary: "최종 결과보고서 제출과 발주처 검수를 완료했습니다.",
          issue: "없음",
          nextSchedule: "완료된 프로젝트입니다.",
          lastUpdated: daysFromNow(-4.1, 13),
          updateHistory: [
            { at: daysFromNow(-4.1, 13), userId: "user-4", content: "최종 결과보고서 검수 완료" },
            { at: daysFromNow(-6.8, 16), userId: "user-2", content: "발주처 수정 의견 반영" },
            { at: daysFromNow(-10, 10), userId: "user-4", content: "최종 결과보고서 제출" }
          ]
        }
      ]
    };
  }

  window.ProjectMock = {
    PROJECT_TYPES,
    UPPER_STAGES,
    createInitialData
  };
})();
