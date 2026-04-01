// sql 실행 페이지 관련 코드

// Tab
const changeTab = (tabId) => {
  const tabs = document.querySelectorAll("[role='tab']");
  tabs.forEach((tab) => {
    tab.setAttribute('aria-selected', false);
    tab.classList.remove('active');
  });
  const selectedTab = document.querySelector(`#tab-${tabId}`);
  selectedTab.setAttribute('aria-selected', true);
  selectedTab.classList.add('active');

  const tabPanels = document.querySelectorAll("[role='tabpanel']");
  tabPanels.forEach((panel) => {
    panel.setAttribute('aria-hidden', true);
    panel.classList.remove('active');
  });
  const selectedPanel = document.querySelector(`#panel-${tabId}`);
  selectedPanel.setAttribute('aria-hidden', false);
  selectedPanel.classList.add('active');
};

// Sample Data
const getFileData = async (tableId) => {
  const response = await fetch(`./src/data/${tableId}.json`, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
  const data = await response.json();
  const columns = Object.keys(data[0]);
  const values = data.map((value) => Object.values(value));

  showSampleData(tableId, columns, values);
};

const showSampleData = (tableId, columns, values) => {
  const table = document.querySelector('.data-table table');
  table.innerHTML = '';

  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  const tr = document.createElement('tr');
  columns.forEach((column) => {
    const th = document.createElement('th');
    th.textContent = column;
    tr.appendChild(th);
  });
  thead.appendChild(tr);
  table.appendChild(thead);

  values.forEach((value, index) => {
    const tr = document.createElement('tr');

    value.forEach((v) => {
      const td = document.createElement('td');
      if (v === null || v === undefined) {
        td.textContent = 'NULL';
        td.classList.add('null-value');
      } else {
        td.textContent = v;
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
};

const downloadJson = (table) => {
  const a = document.createElement('a');
  a.href = `./src/data/${table}.json`;
  a.download = `${table}.json`;
  a.click();
};

const tableList = ['상품', '카테고리', '고객', '주문', '주문상세', '공급업체', '고객정보', '판매정보'];
const $tableListCont = document.querySelector('.table-list');
const docFrag = document.createDocumentFragment();
tableList.forEach((table) => {
  const li = document.createElement('li');
  li.textContent = table;
  li.addEventListener('click', () => {
    getFileData(table);
    // 다른 li 선택 해제
    const selectedLi = document.querySelector('.table-list .selected');
    selectedLi && selectedLi.classList.remove('selected');
    li.classList.add('selected');
  });
  const btn = document.createElement('button');
  btn.classList.add('btn-download');
  btn.innerHTML = `<span class="sr-only">JSON 파일 다운로드</span>`;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    downloadJson(table);
  });
  li.appendChild(btn);
  docFrag.appendChild(li);
});
$tableListCont.appendChild(docFrag);

const $NoticeCont = document.querySelector('.notice-cont');
const $NoticeCloseBtn = $NoticeCont.querySelector('.btn-close');
$NoticeCloseBtn.addEventListener('click', () => {
  $NoticeCont.classList.remove('show');
  localStorage.setItem('notice-close', 'true');
});

const displayNotice = () => {
  const noticeClose = localStorage.getItem('notice-close');
  if (noticeClose !== 'true') {
    $NoticeCont.classList.add('show');
  }
};
displayNotice();
