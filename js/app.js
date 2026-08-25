(function () {
  "use strict";

  const STORAGE_KEY = "project-dashboard-mock-v1";
  const FLASH_KEY = "project-dashboard-flash";
  const DAY = 24 * 60 * 60 * 1000;
  const RISK_ORDER = {
    "즉시 점검 필요": 0,
    "지연": 1,
    "확인 필요": 2,
    "정상": 3
  };

  let appData = loadData();

  function loadData() {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : window.ProjectMock.createInitialData();
    } catch (error) {
      return window.ProjectMock.createInitialData();
    }
  }

  function saveData() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    } catch (error) {
      // 일부 file:// 환경에서 저장소가 제한되어도 현재 화면 동작은 유지한다.
    }
  }

  function setFlash(message) {
    try {
      sessionStorage.setItem(FLASH_KEY, message);
    } catch (error) {
      // 저장소를 사용할 수 없는 환경에서는 화면 이동만 수행한다.
    }
  }

  function consumeFlash() {
    try {
      const message = sessionStorage.getItem(FLASH_KEY);
      if (message) {
        sessionStorage.removeItem(FLASH_KEY);
        window.setTimeout(() => showToast(message), 80);
      }
    } catch (error) {
      // 저장소를 사용할 수 없는 환경에서는 알림을 생략한다.
    }
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function queryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function getCurrentUser() {
    return appData.users.find((user) => user.id === appData.currentUserId) || appData.users[0];
  }

  function getUser(userId) {
    return appData.users.find((user) => user.id === userId);
  }

  function getProject(projectId) {
    return appData.projects.find((project) => project.id === projectId);
  }

  function initials(name) {
    return String(name || "사용자").slice(-2);
  }

  function riskStatus(lastUpdated) {
    const elapsedDays = Math.max(0, (Date.now() - new Date(lastUpdated).getTime()) / DAY);
    if (elapsedDays >= 10) return "즉시 점검 필요";
    if (elapsedDays >= 5) return "지연";
    if (elapsedDays >= 2) return "확인 필요";
    return "정상";
  }

  function riskClass(status) {
    return `risk-${status.replaceAll(" ", "-")}`;
  }

  function formatDate(dateValue) {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return dateValue;
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric"
    }).format(date);
  }

  function formatDateTime(dateValue) {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return dateValue;
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(date);
  }

  function relativeTime(dateValue) {
    const elapsed = Math.max(0, Date.now() - new Date(dateValue).getTime());
    const minutes = Math.floor(elapsed / (60 * 1000));
    const hours = Math.floor(elapsed / (60 * 60 * 1000));
    const days = Math.floor(elapsed / DAY);
    if (minutes < 1) return "방금 전";
    if (hours < 1) return `${minutes}분 전`;
    if (days < 1) return `${hours}시간 전`;
    return `${days}일 전`;
  }

  function localDateInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  function visibleProjectsFor(user) {
    if (!user) return [];
    if (user.role === "관리자") return [...appData.projects];
    return appData.projects.filter((project) => user.projectIds.includes(project.id));
  }

  function canManageProjects(user) {
    return Boolean(user && user.active && ["관리자", "기획자"].includes(user.role));
  }

  function canUpdateProject(user, project) {
    return Boolean(user && user.active && (user.role === "관리자" || project.responsibleId === user.id));
  }

  function renderCurrentUser() {
    const user = getCurrentUser();
    document.querySelectorAll("[data-current-user]").forEach((element) => {
      element.innerHTML = `
        <span class="avatar" aria-hidden="true">${escapeHTML(initials(user.name))}</span>
        <span><strong>${escapeHTML(user.name)}</strong><span>${escapeHTML(user.role)}</span></span>
      `;
    });

    document.querySelectorAll("[data-admin-link]").forEach((element) => {
      if (user.role !== "관리자") {
        element.classList.add("hidden");
      }
    });

    document.querySelectorAll("[data-project-manage-link]").forEach((element) => {
      if (!canManageProjects(user)) {
        element.classList.add("hidden");
      }
    });
  }

  function showToast(message) {
    const region = document.getElementById("toast-region");
    if (!region) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    region.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3200);
  }

  function renderMissingState(root, title, message) {
    root.innerHTML = `
      <section class="empty-state">
        <div class="empty-icon" aria-hidden="true">!</div>
        <h1>${escapeHTML(title)}</h1>
        <p>${escapeHTML(message)}</p>
        <a class="btn btn-primary" href="index.html">대시보드로 돌아가기</a>
      </section>
    `;
  }

  function stageStrip(currentStage) {
    const currentIndex = window.ProjectMock.UPPER_STAGES.indexOf(currentStage);
    return window.ProjectMock.UPPER_STAGES.map((stage, index) => {
      let className = "stage-item";
      if (index < currentIndex) className += " is-passed";
      if (index === currentIndex) className += " is-current";
      return `<span class="${className}">${escapeHTML(stage)}</span>`;
    }).join("");
  }

  function initDashboard() {
    const currentUser = getCurrentUser();
    const scopedProjects = visibleProjectsFor(currentUser);
    const summaryGrid = document.getElementById("summary-grid");
    const projectGrid = document.getElementById("projects-grid");
    const personFilter = document.getElementById("person-filter");
    const riskFilter = document.getElementById("risk-filter");
    const typeFilter = document.getElementById("type-filter");
    const sortFilter = document.getElementById("sort-filter");
    const resetButton = document.getElementById("reset-filters");

    const scopeDescription = document.getElementById("scope-description");
    const roleScope = currentUser.role === "관리자"
      ? "전체 프로젝트"
      : currentUser.role === "기획자"
        ? "권한이 부여된 프로젝트"
        : "담당 프로젝트";
    scopeDescription.textContent = `${currentUser.name} ${currentUser.role}님에게 표시되는 ${roleScope}의 현황입니다.`;

    const responsibleIds = [...new Set(scopedProjects.map((project) => project.responsibleId))];
    responsibleIds.forEach((userId) => {
      const user = getUser(userId);
      if (!user) return;
      const option = document.createElement("option");
      option.value = user.id;
      option.textContent = user.name;
      personFilter.appendChild(option);
    });

    function renderSummary() {
      const counts = { "정상": 0, "확인 필요": 0, "지연": 0, "즉시 점검 필요": 0 };
      scopedProjects.forEach((project) => {
        counts[riskStatus(project.lastUpdated)] += 1;
      });
      const summaryItems = [
        ["전체 프로젝트", scopedProjects.length, ""],
        ["정상", counts["정상"], "정상"],
        ["확인 필요", counts["확인 필요"], "확인 필요"],
        ["지연", counts["지연"], "지연"],
        ["즉시 점검 필요", counts["즉시 점검 필요"], "즉시 점검 필요"]
      ];
      summaryGrid.innerHTML = summaryItems.map(([label, value, status]) => `
        <article class="summary-card" ${status ? `data-status="${status}"` : ""}>
          <div class="summary-label"><span class="summary-dot"></span>${label}</div>
          <div class="summary-value">${value}</div>
        </article>
      `).join("");
    }

    function projectCard(project) {
      const risk = riskStatus(project.lastUpdated);
      const planner = getUser(project.plannerId);
      const responsible = getUser(project.responsibleId);
      const issueClass = project.issue && project.issue !== "없음" ? " issue" : "";
      return `
        <article class="project-card" data-risk="${escapeHTML(risk)}" data-href="detail.html?id=${encodeURIComponent(project.id)}" tabindex="0" aria-label="${escapeHTML(project.name)} 상세 보기">
          <div class="project-card-top">
            <div>
              <span class="project-type">${escapeHTML(project.type)}</span>
              <h3>${escapeHTML(project.name)}</h3>
            </div>
            <span class="risk-badge ${riskClass(risk)}">${escapeHTML(risk)}</span>
          </div>
          <div class="stage-strip" aria-label="현재 상위 단계 ${escapeHTML(project.upperStage)}">${stageStrip(project.upperStage)}</div>
          <div class="card-meta">
            <div><span class="meta-label">현재 단계</span><span class="meta-value">${escapeHTML(project.upperStage)} · ${escapeHTML(project.detailStage)}</span></div>
            <div><span class="meta-label">담당자</span><span class="meta-value">${escapeHTML(responsible?.name || "미지정")} · 기획 ${escapeHTML(planner?.name || "미지정")}</span></div>
          </div>
          <dl class="card-content-list">
            <div class="card-content-row"><dt>주요 공유</dt><dd>${escapeHTML(project.summary)}</dd></div>
            <div class="card-content-row${issueClass}"><dt>현재 이슈</dt><dd>${escapeHTML(project.issue)}</dd></div>
            <div class="card-content-row"><dt>다음 일정</dt><dd>${escapeHTML(project.nextSchedule)}</dd></div>
          </dl>
          <div class="card-footer">
            <span>마지막 업데이트 · ${escapeHTML(relativeTime(project.lastUpdated))}</span>
            <a class="card-link" href="detail.html?id=${encodeURIComponent(project.id)}">상세 보기 →</a>
          </div>
        </article>
      `;
    }

    function renderProjects() {
      let projects = scopedProjects.filter((project) => {
        const matchesRisk = riskFilter.value === "all" || riskStatus(project.lastUpdated) === riskFilter.value;
        const matchesType = typeFilter.value === "all" || project.type === typeFilter.value;
        const matchesPerson = personFilter.value === "all" || project.responsibleId === personFilter.value;
        return matchesRisk && matchesType && matchesPerson;
      });

      if (sortFilter.value === "risk") {
        projects = [...projects].sort((a, b) => {
          const riskDifference = RISK_ORDER[riskStatus(a.lastUpdated)] - RISK_ORDER[riskStatus(b.lastUpdated)];
          if (riskDifference !== 0) return riskDifference;
          return new Date(a.lastUpdated) - new Date(b.lastUpdated);
        });
      }

      document.getElementById("project-count").textContent = String(projects.length);
      const activeFilters = [riskFilter, typeFilter, personFilter].filter((filter) => filter.value !== "all").length;
      document.getElementById("filter-summary").textContent = activeFilters
        ? `${activeFilters}개 조건으로 필터링한 결과입니다.`
        : "전체 프로젝트를 표시하고 있습니다.";

      projectGrid.innerHTML = projects.length
        ? projects.map(projectCard).join("")
        : `
          <div class="empty-state">
            <div class="empty-icon" aria-hidden="true">0</div>
            <h3>조건에 맞는 프로젝트가 없습니다</h3>
            <p>필터 조건을 초기화하고 다시 확인해 보세요.</p>
            <button class="btn btn-secondary" type="button" data-reset-empty>필터 초기화</button>
          </div>
        `;
    }

    function resetFilters() {
      riskFilter.value = "all";
      typeFilter.value = "all";
      personFilter.value = "all";
      sortFilter.value = "default";
      renderProjects();
    }

    [riskFilter, typeFilter, personFilter, sortFilter].forEach((filter) => {
      filter.addEventListener("change", renderProjects);
    });
    resetButton.addEventListener("click", resetFilters);
    projectGrid.addEventListener("click", (event) => {
      const reset = event.target.closest("[data-reset-empty]");
      if (reset) {
        resetFilters();
        return;
      }
      if (event.target.closest("a, button")) return;
      const card = event.target.closest("[data-href]");
      if (card) window.location.href = card.dataset.href;
    });
    projectGrid.addEventListener("keydown", (event) => {
      const card = event.target.closest("[data-href]");
      if (card && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        window.location.href = card.dataset.href;
      }
    });

    renderSummary();
    renderProjects();
  }

  function initDetail() {
    const root = document.getElementById("detail-root");
    const projectId = queryParam("id") || visibleProjectsFor(getCurrentUser())[0]?.id;
    const project = getProject(projectId);
    if (!project) {
      renderMissingState(root, "프로젝트를 찾을 수 없습니다", "목록에서 확인할 프로젝트를 다시 선택해 주세요.");
      return;
    }

    const currentUser = getCurrentUser();
    const editable = canUpdateProject(currentUser, project);
    let draftUpperStage = project.upperStage;
    let draftDetailStage = project.detailStage;
    const upperStageSelector = document.getElementById("upper-stage-selector");
    const detailStageSelector = document.getElementById("detail-stage-selector");
    const form = document.getElementById("update-form");

    document.title = `${project.name} | 모두의 프로젝트 관리실`;
    document.getElementById("breadcrumb-name").textContent = project.name;
    document.getElementById("project-summary").value = project.summary;
    document.getElementById("project-issue").value = project.issue;
    document.getElementById("project-schedule").value = project.nextSchedule;

    function renderHero() {
      const planner = getUser(project.plannerId);
      const responsible = getUser(project.responsibleId);
      const risk = riskStatus(project.lastUpdated);
      const editButton = canManageProjects(currentUser)
        ? `<a class="btn btn-secondary" href="project-form.html?id=${encodeURIComponent(project.id)}">
             <svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
             기본정보 수정
           </a>`
        : "";
      document.getElementById("detail-hero").innerHTML = `
        <div class="detail-hero-top">
          <div class="detail-title-group">
            <span class="project-type">${escapeHTML(project.type)}</span>
            <h1>${escapeHTML(project.name)}</h1>
            <div class="badge-row">
              <span class="risk-badge ${riskClass(risk)}">${escapeHTML(risk)}</span>
              <span class="status-badge${project.status === "완료" ? " is-complete" : ""}">${escapeHTML(project.status)}</span>
              <span class="type-badge">${escapeHTML(project.upperStage)} · ${escapeHTML(project.detailStage)}</span>
            </div>
          </div>
          <div class="page-actions">${editButton}</div>
        </div>
        <div class="detail-meta-grid">
          <div><span class="meta-label">담당 기획자</span><span class="meta-value">${escapeHTML(planner?.name || "미지정")}</span></div>
          <div><span class="meta-label">담당자</span><span class="meta-value">${escapeHTML(responsible?.name || "미지정")}</span></div>
          <div><span class="meta-label">시작일</span><span class="meta-value">${escapeHTML(formatDate(project.startDate))}</span></div>
          <div><span class="meta-label">종료 예정일</span><span class="meta-value">${escapeHTML(formatDate(project.endDate))}</span></div>
          <div><span class="meta-label">마지막 업데이트</span><span class="meta-value">${escapeHTML(formatDateTime(project.lastUpdated))}</span></div>
        </div>
      `;
    }

    function renderStageSelectors() {
      upperStageSelector.innerHTML = window.ProjectMock.UPPER_STAGES.map((stage) => `
        <button class="stage-button${stage === draftUpperStage ? " is-active" : ""}" type="button" data-stage="${escapeHTML(stage)}" ${editable ? "" : "disabled"}>${escapeHTML(stage)}</button>
      `).join("");

      detailStageSelector.innerHTML = window.ProjectMock.PROJECT_TYPES[project.type].map((stage) => `
        <button class="choice-chip${stage === draftDetailStage ? " is-active" : ""}" type="button" data-detail-stage="${escapeHTML(stage)}" ${editable ? "" : "disabled"}>${escapeHTML(stage)}</button>
      `).join("");
    }

    function renderHistory() {
      document.getElementById("history-list").innerHTML = project.updateHistory.length
        ? project.updateHistory.map((history) => {
            const user = getUser(history.userId);
            return `
              <li class="history-item">
                <div class="history-content">${escapeHTML(history.content)}</div>
                <div class="history-meta">${escapeHTML(user?.name || "알 수 없음")} · ${escapeHTML(formatDateTime(history.at))}</div>
              </li>
            `;
          }).join("")
        : `<li class="muted">아직 업데이트 기록이 없습니다.</li>`;
    }

    function renderNotionLink() {
      const area = document.getElementById("notion-link-area");
      area.innerHTML = project.notionUrl
        ? `
          <div class="notion-box">
            <span class="notion-icon" aria-hidden="true">N</span>
            <div><strong>프로젝트 노션</strong><p>회의록, 기획서와 산출물 확인</p></div>
            <a class="btn btn-secondary btn-small" href="${escapeHTML(project.notionUrl)}" target="_blank" rel="noopener noreferrer">새 탭에서 열기</a>
          </div>
        `
        : `
          <div class="empty-state" style="padding: 28px 16px">
            <h3>연결된 노션이 없습니다</h3>
            <p>기본정보 수정에서 URL을 등록할 수 있습니다.</p>
          </div>
        `;
    }

    const permissionNote = document.getElementById("permission-note");
    permissionNote.innerHTML = editable
      ? `<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 6 9 17l-5-5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><p>${escapeHTML(currentUser.name)}님은 이 프로젝트의 현황을 수정할 수 있습니다. 저장하면 마지막 업데이트가 현재 시각으로 바뀝니다.</p>`
      : `<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 17v.01M8 10V7a4 4 0 0 1 8 0v3M6 10h12v10H6V10Z" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><p>담당자만 현황을 수정할 수 있습니다. 현재는 읽기 전용으로 표시됩니다.</p>`;

    form.querySelectorAll("textarea, button[type='submit']").forEach((control) => {
      control.disabled = !editable;
    });

    upperStageSelector.addEventListener("click", (event) => {
      const button = event.target.closest("[data-stage]");
      if (!button || !editable) return;
      draftUpperStage = button.dataset.stage;
      renderStageSelectors();
    });
    detailStageSelector.addEventListener("click", (event) => {
      const button = event.target.closest("[data-detail-stage]");
      if (!button || !editable) return;
      draftDetailStage = button.dataset.detailStage;
      renderStageSelectors();
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!editable || !form.reportValidity()) return;
      const now = new Date().toISOString();
      project.upperStage = draftUpperStage;
      project.detailStage = draftDetailStage;
      project.summary = document.getElementById("project-summary").value.trim();
      project.issue = document.getElementById("project-issue").value.trim();
      project.nextSchedule = document.getElementById("project-schedule").value.trim();
      project.lastUpdated = now;
      project.updateHistory.unshift({
        at: now,
        userId: currentUser.id,
        content: project.summary
      });
      saveData();
      renderHero();
      renderHistory();
      showToast("프로젝트 현황을 저장했습니다.");
    });

    renderHero();
    renderStageSelectors();
    renderHistory();
    renderNotionLink();
  }

  function initProjectForm() {
    const form = document.getElementById("project-form");
    const currentUser = getCurrentUser();
    const projectId = queryParam("id");
    const project = projectId ? getProject(projectId) : null;
    const isEdit = Boolean(project);
    const editable = canManageProjects(currentUser);
    const typeSelect = document.getElementById("form-type");
    const plannerSelect = document.getElementById("form-planner");
    const responsibleSelect = document.getElementById("form-responsible");
    const startInput = document.getElementById("form-start-date");
    const endInput = document.getElementById("form-end-date");

    if (projectId && !project) {
      renderMissingState(document.querySelector("main .container"), "프로젝트를 찾을 수 없습니다", "수정할 프로젝트를 목록에서 다시 선택해 주세요.");
      return;
    }

    document.getElementById("form-page-title").textContent = isEdit ? "프로젝트 기본정보 수정" : "새 프로젝트 등록";
    document.getElementById("form-breadcrumb").textContent = isEdit ? "기본정보 수정" : "등록";
    document.title = `${isEdit ? "프로젝트 수정" : "프로젝트 등록"} | 모두의 프로젝트 관리실`;

    function fillPeopleSelect(select, roles, selectedId) {
      const people = appData.users.filter((user) => user.active && roles.includes(user.role));
      if (selectedId && !people.some((user) => user.id === selectedId)) {
        const selectedUser = getUser(selectedId);
        if (selectedUser) people.push(selectedUser);
      }
      select.innerHTML = people.map((user) => `<option value="${escapeHTML(user.id)}">${escapeHTML(user.name)} · ${escapeHTML(user.role)}</option>`).join("");
      if (selectedId) select.value = selectedId;
    }

    fillPeopleSelect(plannerSelect, ["관리자", "기획자"], project?.plannerId);
    fillPeopleSelect(responsibleSelect, ["담당자"], project?.responsibleId);

    if (isEdit) {
      document.getElementById("form-name").value = project.name;
      typeSelect.value = project.type;
      document.getElementById("form-status").value = project.status;
      plannerSelect.value = project.plannerId;
      responsibleSelect.value = project.responsibleId;
      startInput.value = project.startDate;
      endInput.value = project.endDate;
      document.getElementById("form-notion").value = project.notionUrl;
      document.getElementById("form-cancel").href = `detail.html?id=${encodeURIComponent(project.id)}`;
    } else {
      startInput.value = localDateInput(new Date());
      endInput.value = localDateInput(addDays(new Date(), 30));
    }

    function renderStagePreview() {
      document.getElementById("type-stage-preview").innerHTML = window.ProjectMock.PROJECT_TYPES[typeSelect.value]
        .map((stage) => `<span class="choice-chip${isEdit && project.detailStage === stage ? " is-active" : ""}">${escapeHTML(stage)}</span>`)
        .join("");
    }

    function validateDates() {
      endInput.setCustomValidity(endInput.value && startInput.value && endInput.value < startInput.value
        ? "종료 예정일은 시작일보다 빠를 수 없습니다."
        : "");
    }

    typeSelect.addEventListener("change", renderStagePreview);
    startInput.addEventListener("change", validateDates);
    endInput.addEventListener("change", validateDates);

    if (!editable) {
      const panel = form.closest(".panel");
      const warning = document.createElement("div");
      warning.className = "callout";
      warning.innerHTML = "<p>관리자 또는 기획자만 프로젝트 기본정보를 저장할 수 있습니다.</p>";
      panel.insertBefore(warning, form);
      form.querySelectorAll("input, select, button").forEach((control) => { control.disabled = true; });
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      validateDates();
      if (!editable || !form.reportValidity()) return;

      const name = document.getElementById("form-name").value.trim();
      const type = typeSelect.value;
      const status = document.getElementById("form-status").value;
      const now = new Date().toISOString();
      let savedProject;

      if (isEdit) {
        Object.assign(project, {
          name,
          type,
          plannerId: plannerSelect.value,
          responsibleId: responsibleSelect.value,
          startDate: startInput.value,
          endDate: endInput.value,
          notionUrl: document.getElementById("form-notion").value.trim(),
          status
        });
        if (!window.ProjectMock.PROJECT_TYPES[type].includes(project.detailStage)) {
          project.detailStage = window.ProjectMock.PROJECT_TYPES[type][0];
        }
        if (status === "완료") project.upperStage = "완료";
        savedProject = project;
      } else {
        const id = `project-${Date.now()}`;
        savedProject = {
          id,
          name,
          type,
          plannerId: plannerSelect.value,
          responsibleId: responsibleSelect.value,
          startDate: startInput.value,
          endDate: endInput.value,
          notionUrl: document.getElementById("form-notion").value.trim(),
          status,
          upperStage: status === "완료" ? "완료" : "기획",
          detailStage: window.ProjectMock.PROJECT_TYPES[type][0],
          summary: "프로젝트 기본정보가 등록되었습니다.",
          issue: "없음",
          nextSchedule: `${formatDate(endInput.value)} 종료 예정`,
          lastUpdated: now,
          updateHistory: [{ at: now, userId: currentUser.id, content: "프로젝트 기본정보 등록" }]
        };
        appData.projects.unshift(savedProject);
        appData.users.filter((user) => user.role === "관리자").forEach((user) => {
          if (!user.projectIds.includes(id)) user.projectIds.push(id);
        });
      }

      [plannerSelect.value, responsibleSelect.value].forEach((userId) => {
        const user = getUser(userId);
        if (user && !user.projectIds.includes(savedProject.id)) user.projectIds.push(savedProject.id);
      });

      saveData();
      setFlash(isEdit ? "프로젝트 기본정보를 수정했습니다." : "새 프로젝트를 등록했습니다.");
      window.location.href = `detail.html?id=${encodeURIComponent(savedProject.id)}`;
    });

    renderStagePreview();
  }

  function initUsers() {
    const currentUser = getCurrentUser();
    let selectedUserId = appData.users[0]?.id || "";
    const tableBody = document.getElementById("user-table-body");
    const form = document.getElementById("user-form");
    const addButton = document.getElementById("add-user");

    function isAdmin() {
      return getCurrentUser()?.role === "관리자" && getCurrentUser()?.active;
    }

    document.getElementById("users-permission-note").innerHTML = isAdmin()
      ? `<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 6 9 17l-5-5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><p>${escapeHTML(currentUser.name)} 관리자님은 사용자 역할과 담당 프로젝트를 수정할 수 있습니다.</p>`
      : `<p>사용자 정보는 관리자만 수정할 수 있습니다. 현재는 읽기 전용으로 표시됩니다.</p>`;

    function projectNames(user) {
      const names = user.projectIds.map((id) => getProject(id)?.name).filter(Boolean);
      if (!names.length) return "미지정";
      if (names.length === 1) return names[0];
      return `${names[0]} 외 ${names.length - 1}개`;
    }

    function renderTable() {
      document.getElementById("user-count").textContent = `총 ${appData.users.length}명`;
      tableBody.innerHTML = appData.users.map((user) => `
        <tr data-user-id="${escapeHTML(user.id)}" class="${user.id === selectedUserId ? "is-selected" : ""}" tabindex="0">
          <td><div class="person-cell"><span class="avatar">${escapeHTML(initials(user.name))}</span><div><strong>${escapeHTML(user.name)}</strong><span>${escapeHTML(user.email)}</span></div></div></td>
          <td><span class="role-badge role-${escapeHTML(user.role)}">${escapeHTML(user.role)}</span></td>
          <td title="${escapeHTML(projectNames(user))}">${escapeHTML(projectNames(user))}</td>
          <td><span class="active-state${user.active ? "" : " inactive"}">${user.active ? "활성" : "비활성"}</span></td>
        </tr>
      `).join("");
    }

    function renderProjectCheckboxes(selectedIds) {
      document.getElementById("project-checkboxes").innerHTML = appData.projects.map((project) => `
        <label class="check-item">
          <input type="checkbox" name="assigned-project" value="${escapeHTML(project.id)}" ${selectedIds.includes(project.id) ? "checked" : ""} ${isAdmin() ? "" : "disabled"}>
          <span>${escapeHTML(project.name)}</span>
        </label>
      `).join("");
    }

    function fillEditor(user) {
      const isNew = !user;
      document.getElementById("user-editor-title").textContent = isNew ? "새 사용자 추가" : "사용자 정보 편집";
      document.getElementById("edit-user-id").value = user?.id || "";
      document.getElementById("user-name").value = user?.name || "";
      document.getElementById("user-email").value = user?.email || "";
      document.getElementById("user-role").value = user?.role || "담당자";
      document.getElementById("user-active").checked = user?.active ?? true;
      renderProjectCheckboxes(user?.projectIds || []);
      form.querySelectorAll("input, select, button").forEach((control) => {
        control.disabled = !isAdmin();
      });
    }

    function selectUser(userId) {
      const user = getUser(userId);
      if (!user) return;
      selectedUserId = user.id;
      renderTable();
      fillEditor(user);
    }

    tableBody.addEventListener("click", (event) => {
      const row = event.target.closest("[data-user-id]");
      if (row) selectUser(row.dataset.userId);
    });
    tableBody.addEventListener("keydown", (event) => {
      const row = event.target.closest("[data-user-id]");
      if (row && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        selectUser(row.dataset.userId);
      }
    });
    addButton.addEventListener("click", () => {
      if (!isAdmin()) return;
      selectedUserId = "";
      renderTable();
      fillEditor(null);
      document.getElementById("user-name").focus();
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!isAdmin() || !form.reportValidity()) return;
      const id = document.getElementById("edit-user-id").value;
      const email = document.getElementById("user-email").value.trim();
      const duplicate = appData.users.some((user) => user.email.toLowerCase() === email.toLowerCase() && user.id !== id);
      if (duplicate) {
        document.getElementById("user-email").setCustomValidity("이미 사용 중인 이메일입니다.");
        form.reportValidity();
        return;
      }
      document.getElementById("user-email").setCustomValidity("");
      const assignedProjectIds = [...form.querySelectorAll("input[name='assigned-project']:checked")].map((input) => input.value);
      const values = {
        name: document.getElementById("user-name").value.trim(),
        email,
        role: document.getElementById("user-role").value,
        projectIds: assignedProjectIds,
        active: document.getElementById("user-active").checked
      };
      let user = id ? getUser(id) : null;
      if (user) {
        Object.assign(user, values);
      } else {
        user = { id: `user-${Date.now()}`, ...values };
        appData.users.push(user);
      }
      selectedUserId = user.id;
      saveData();
      renderCurrentUser();
      renderTable();
      fillEditor(user);
      showToast(id ? "사용자 정보를 수정했습니다." : "새 사용자를 추가했습니다.");
    });
    document.getElementById("user-email").addEventListener("input", (event) => event.target.setCustomValidity(""));

    if (!isAdmin()) addButton.disabled = true;
    renderTable();
    fillEditor(getUser(selectedUserId));
  }

  function initLogin() {
    document.getElementById("login-form").addEventListener("submit", (event) => {
      event.preventDefault();
      if (!event.currentTarget.reportValidity()) return;
      window.location.href = "index.html";
    });
  }

  function init() {
    renderCurrentUser();
    consumeFlash();
    const page = document.body.dataset.page;
    if (page === "dashboard") initDashboard();
    if (page === "detail") initDetail();
    if (page === "project-form") initProjectForm();
    if (page === "users") initUsers();
    if (page === "login") initLogin();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
