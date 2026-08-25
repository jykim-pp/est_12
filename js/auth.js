(function () {
  "use strict";

  const isLoginPage = document.body.dataset.page === "login";

  if (!isLoginPage) {
    document.documentElement.classList.add("auth-checking");
  }

  function revealPage() {
    document.documentElement.classList.remove("auth-checking");
  }

  function goToLogin() {
    window.location.replace("login.html");
  }

  function goToMain() {
    window.location.replace("index.html");
  }

  function getFriendlyError(error) {
    const message = String(error?.message || "").toLowerCase();

    if (message.includes("invalid login credentials")) {
      return "이메일 또는 비밀번호가 올바르지 않습니다.";
    }
    if (message.includes("email not confirmed")) {
      return "이메일 인증을 완료한 뒤 로그인해 주세요.";
    }
    if (message.includes("user already registered")) {
      return "이미 가입된 이메일입니다. 로그인해 주세요.";
    }
    if (message.includes("password") && message.includes("at least")) {
      return "비밀번호는 6자 이상 입력해 주세요.";
    }
    if (message.includes("rate limit")) {
      return "요청이 많습니다. 잠시 후 다시 시도해 주세요.";
    }

    return error?.message || "인증 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  }

  function showAuthMessage(message, type = "error") {
    const messageElement = document.getElementById("auth-message");
    if (!messageElement) return;

    messageElement.textContent = message;
    messageElement.className = `auth-message is-${type}`;
  }

  function clearAuthMessage() {
    const messageElement = document.getElementById("auth-message");
    if (!messageElement) return;

    messageElement.textContent = "";
    messageElement.className = "auth-message hidden";
  }

  function setFormLoading(form, isLoading, mode) {
    const submitButton = form.querySelector("[data-auth-submit]");
    const controls = [
      ...form.querySelectorAll("input, button"),
      ...document.querySelectorAll("[data-auth-mode]")
    ];

    controls.forEach((control) => {
      control.disabled = isLoading;
    });
    submitButton.setAttribute("aria-busy", String(isLoading));
    submitButton.textContent = isLoading
      ? (mode === "signup" ? "가입 처리 중..." : "로그인 중...")
      : (mode === "signup" ? "회원가입" : "로그인");
  }

  function initLoginForm(client) {
    const form = document.getElementById("login-form");
    const modeButtons = [...document.querySelectorAll("[data-auth-mode]")];
    const passwordInput = document.getElementById("login-password");
    let mode = "login";

    function selectMode(nextMode) {
      mode = nextMode;
      clearAuthMessage();
      modeButtons.forEach((button) => {
        const isActive = button.dataset.authMode === mode;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-selected", String(isActive));
      });
      passwordInput.autocomplete = mode === "signup" ? "new-password" : "current-password";
      form.querySelector("[data-auth-submit]").textContent = mode === "signup" ? "회원가입" : "로그인";
    }

    modeButtons.forEach((button) => {
      button.addEventListener("click", () => selectMode(button.dataset.authMode));
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearAuthMessage();
      if (!form.reportValidity()) return;

      const email = document.getElementById("login-email").value.trim();
      const password = passwordInput.value;
      setFormLoading(form, true, mode);

      try {
        if (mode === "signup") {
          const { data, error } = await client.auth.signUp({ email, password });
          if (error) throw error;

          if (data.session) {
            goToMain();
            return;
          }

          passwordInput.value = "";
          showAuthMessage("회원가입이 완료되었습니다. 받은 편지함에서 이메일 인증을 완료한 뒤 로그인해 주세요.", "success");
        } else {
          const { data, error } = await client.auth.signInWithPassword({ email, password });
          if (error) throw error;

          if (!data.session) {
            throw new Error("로그인 세션을 만들지 못했습니다. 다시 시도해 주세요.");
          }
          goToMain();
          return;
        }
      } catch (error) {
        showAuthMessage(getFriendlyError(error));
      } finally {
        setFormLoading(form, false, mode);
      }
    });
  }

  function initLogout(client, session) {
    document.querySelectorAll("[data-logout]").forEach((button) => {
      button.classList.remove("hidden");
      button.title = `${session.user.email || "현재 계정"} 로그아웃`;
      button.addEventListener("click", async () => {
        button.disabled = true;
        const originalLabel = button.querySelector(".nav-label")?.textContent;
        const label = button.querySelector(".nav-label");
        if (label) label.textContent = "처리 중";

        const { error } = await client.auth.signOut();
        if (error) {
          button.disabled = false;
          if (label) label.textContent = originalLabel;
          window.alert(getFriendlyError(error));
          return;
        }

        goToLogin();
      });
    });
  }

  async function initAuth() {
    const client = window.supabaseClient;

    if (!client) {
      revealPage();
      if (isLoginPage) {
        showAuthMessage("Supabase에 연결할 수 없습니다. 인터넷 연결을 확인해 주세요.");
        document.getElementById("login-form")?.querySelectorAll("input, button").forEach((control) => {
          control.disabled = true;
        });
      } else {
        goToLogin();
      }
      return;
    }

    const { data, error } = await client.auth.getSession();
    if (error) {
      revealPage();
      if (isLoginPage) {
        showAuthMessage(getFriendlyError(error));
      } else {
        goToLogin();
      }
      return;
    }

    const session = data.session;
    if (isLoginPage) {
      revealPage();
      if (session) {
        goToMain();
        return;
      }
      initLoginForm(client);
    } else if (!session) {
      goToLogin();
      return;
    } else {
      initLogout(client, session);
      revealPage();
    }

    client.auth.onAuthStateChange((event, nextSession) => {
      if (!isLoginPage && event === "SIGNED_OUT") {
        goToLogin();
      }
      if (isLoginPage && event === "SIGNED_IN" && nextSession) {
        goToMain();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initAuth);
})();
