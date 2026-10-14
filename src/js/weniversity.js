// 위니버시티 안내
// 위니브 SQL은 위니버시티 학습 도구 > SQL로 옮겨 갔다.
// 처음 온 사람에게 한 번 안내 창을 띄우고(닫으면 다시 띄우지 않음),
// data-wv-track 링크 클릭을 애널리틱스에 남긴다.
(function () {
  const SQL_URL = "https://weniversity.co.kr/tools/sql/";
  const NOTICE_KEY = "weniversity-moved-notice";

  function sendClick(link, type) {
    try {
      fetch("https://dev.wenivops.co.kr/api/weniv_analytics/collect/anchor-click", {
        method: "POST",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          "Session-Id": sessionStorage.getItem("session_id") || "",
        },
        body: JSON.stringify({
          source_url: location.href,
          target_url: link,
          type: `위니브 SQL: ${type}`,
        }),
      }).catch(() => {});
    } catch (e) {
      /* 수집 실패는 이동에 영향을 주지 않는다 */
    }
  }

  function bindLinks(root) {
    root.querySelectorAll("a[data-wv-track]").forEach((a) => {
      a.addEventListener("click", () => sendClick(a.href, a.dataset.wvTrack));
    });
  }

  function readNotice() {
    try {
      return localStorage.getItem(NOTICE_KEY);
    } catch (e) {
      return "1";
    }
  }

  function showNotice() {
    if (readNotice()) return;

    const notice = document.createElement("div");
    notice.className = "wv-notice";
    notice.setAttribute("role", "dialog");
    notice.setAttribute("aria-labelledby", "wv-notice-title");
    notice.innerHTML = `
      <button type="button" class="wv-notice__close" aria-label="안내 닫기">
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" /></svg>
      </button>
      <p class="wv-notice__eyebrow">weniversity</p>
      <strong id="wv-notice-title" class="wv-notice__title">위니브 SQL이 위니버시티로 옮겨 갔어요</strong>
      <p class="wv-notice__desc">
        위니버시티에서는 SQLite·PostgreSQL·MySQL로 실습하고, SQL 문제를 풀어 바로 채점받을 수 있어요.
        로그인하면 맞힌 문제가 계정에 기록됩니다.
      </p>
      <div class="wv-notice__actions">
        <a class="wv-notice__go" data-wv-track="안내 창 > 위니버시티 SQL" href="${SQL_URL}">위니버시티 SQL로 가기</a>
        <button type="button" class="wv-notice__stay">여기서 계속 실습</button>
      </div>
    `;

    const close = () => {
      try {
        localStorage.setItem(NOTICE_KEY, new Date().toISOString());
      } catch (e) {
        /* 저장이 막혀 있으면 다음에 다시 보일 뿐이다 */
      }
      notice.classList.add("is-hidden");
      setTimeout(() => notice.remove(), 300);
    };

    notice.querySelector(".wv-notice__close").addEventListener("click", close);
    notice.querySelector(".wv-notice__stay").addEventListener("click", close);
    notice.querySelector(".wv-notice__go").addEventListener("click", close);
    document.addEventListener("keydown", function onKey(e) {
      if (e.key === "Escape" && document.body.contains(notice)) {
        close();
        document.removeEventListener("keydown", onKey);
      }
    });

    document.body.appendChild(notice);
    bindLinks(notice);
    requestAnimationFrame(() => notice.classList.add("is-shown"));
  }

  function init() {
    bindLinks(document);
    setTimeout(showNotice, 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
