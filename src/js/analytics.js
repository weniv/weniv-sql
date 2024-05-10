const BASE_URL = 'https://www.analytics.weniv.co.kr';

//------------------------------------------------------------
// @post /collect/pageview
function collectPageView(session_id) {
  const header = {
    'Content-Type': 'application/json',
    'Session-Id': session_id,
  };
  const payload = {
    url: window.location.href,
    session_id: session_id,
  };

  fetch(`${BASE_URL}/collect/pageview`, {
    method: 'POST',
    headers: header,
    body: JSON.stringify(payload),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((data) => {
      if (!session_id) {
        sessionStorage.setItem('session_id', data.session_id);
      }
    })
    .catch((error) => console.error('Error:', error));
}
window.addEventListener('load', (e) => {
  const session_id = sessionStorage.getItem('session_id');
  const lastPage = sessionStorage.getItem('lastPage');

  if (!session_id) {
    collectPageView();
  } else if (lastPage !== window.location.pathname) {
    collectPageView(session_id);
  } else {
    return;
  }

  sessionStorage.setItem('lastPage', window.location.pathname);
});

//------------------------------------------------------------
// @post /collect/anchor-click
function collectAnchorClick(event, type) {
  console.log(event.currentTarget, type);
  event.preventDefault(); // 기본 동작 막기

  const ANCHOR = event.currentTarget;

  const session_id = sessionStorage.getItem('session_id');

  const source_url = window.location.href;
  const target_url = ANCHOR.href;
  const target_tar = ANCHOR.target || '_self';

  fetch(`${BASE_URL}/collect/anchor-click`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Session-Id': session_id,
    },
    body: JSON.stringify({ source_url, target_url, type }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
    })
    .catch((error) => {
      console.error('Error:', error);
    })
    .finally(() => {
      window.open(target_url, target_tar);
    });
}

// 외부 링크
document.querySelectorAll('.kebab-list a').forEach((anchor) => {
  anchor.addEventListener('click', (event) =>
    collectAnchorClick(event, `교육서비스:${anchor.innerText}`),
  );
});
