const getModifiedType = (value) => {
  switch (typeof value) {
    case 'number':
      return Number.isInteger(value) ? 'INTEGER' : 'REAL';
    case 'boolean':
      return 'INTEGER';
    case 'string':
      return 'TEXT';
    case 'object':
      if (value instanceof Array || value instanceof Uint8Array) {
        return 'BLOB';
      }
    case 'null':
      return 'NULL';
    default:
      return 'TEXT';
  }
};

const createTable = (db, name, columns, values) => {
  try {
    const tableName = name;

    columns.map((column, index) => {
      return `column ${column}`;
    });

    let sqlStr = `CREATE TABLE ${tableName} `;
    sqlStr += ` (${columns
      .map((column, idx) => {
        return `${column} ${getModifiedType(values[0][idx])}`;
      })
      .join(', ')})`;
    db.run(sqlStr);

    const stmt = db.prepare(
      `INSERT INTO ${tableName} VALUES (${columns.map(() => '?').join(',')})`,
    );
    values.forEach((value) => stmt.run(value));
    stmt.free();

    return name;
  } catch (err) {
    showErrorMessage(err);
  }
};

const getJsonToTable = async (db, name) => {
  const response = await fetch(`./src/data/${name}.json`, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
  const data = await response.json();
  const columns = Object.keys(data[0]);
  const values = data.map((value) => Object.values(value));

  createTable(db, name, columns, values);
};

const getResultTable = (data) => {
  const columns = data?.columns;
  const values = data?.values;

  const errorMsg = document.querySelector('.error-msg');
  errorMsg.classList.add('hidden');

  const container = document.querySelector('.result-table-cont');
  const tableCont = document.createElement('div');
  container.classList.add('table-cont');

  const table = document.createElement('table');
  table.classList.add('result-table');
  // table.innerHTML = '';
  if (!data) {
    table.innerHTML = `
      <thead>
        <tr>
          <th>결과</th>
        </tr>
      </thead>
      <tbody>
      <tr>
      <td>조회된 결과가 없습니다</td>
      </tr>
      </tbody>`;

    return;
  }

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
  tableCont.appendChild(table);
  container.appendChild(tableCont);

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

const showAlertMessage = (err) => {
  const alertMsg = document.querySelector('.alert-msg');
  alertMsg.classList.remove('hidden');
  alertMsg.textContent = err;
  return alertMsg;
};

const showErrorMessage = (err) => {
  const errorMsg = document.querySelector('.error-msg');
  errorMsg.classList.remove('hidden');
  errorMsg.firstElementChild.innerText = err;
  return errorMsg;
};
const $errorCloseBtn = document.querySelector('.error-msg .btn-close');
$errorCloseBtn.addEventListener('click', () => {
  const errorMsg = document.querySelector('.error-msg');
  errorMsg.classList.add('hidden');
});

document.addEventListener('DOMContentLoaded', async () => {
  const SQL = await initSqlJs({
    locateFile: (file) =>
      `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.1/${file}`,
  });
  const db = new SQL.Database();

  // set use database
  const tableList = [
    '상품',
    '카테고리',
    '고객',
    '주문',
    '주문상세',
    '공급업체',
    '고객정보',
    '판매정보',
  ];
  tableList.map((file) => getJsonToTable(db, file));

  const sessionTableList = JSON.parse(sessionStorage.getItem('table_list'));

  const runSQL = (db) => {
    try {
      const sqlStr = window.editor.getValue();
      gtag('event', 'run_sql', {
        sql_code: sqlStr,
      });
      const results = db.exec(sqlStr);
      console.log(results);
      const res = db.exec(sqlStr)[0];
      collectSQL();
      // getResultTable(res);
      clearResult();
      results.forEach((result) => {
        getResultTable(result);
      });
    } catch (err) {
      showErrorMessage(err);
    }
  };

  function clearResult() {
    const $resultCont = document.querySelector('.result-table-cont');
    $resultCont.innerHTML = '';
  }

  const $btnRun = document.querySelector('.run-btn');
  $btnRun.addEventListener('click', () => {
    changeTab('result');
    runSQL(db);
  });

  const $fileCont = document.querySelector('.cont-filemodal');
  const $tableName = document.getElementById('table-name');
  const $tableInput = document.getElementById('table-file');
  const $btnTableUpload = document.getElementById('btn-table-upload');

  const $closeBtn = $fileCont.querySelector('.btn-close');
  const $fileModalBtn = document.querySelector('.btn-file-modal');

  window.addEventListener('click', (e) => {
    if (e.target === $fileModalBtn) {
      $fileCont.classList.toggle('show');
    } else if ($fileCont.classList.contains('show')) {
      if (e.target === $closeBtn) {
        $fileCont.classList.remove('show');
      } else if ($fileCont.contains(e.target)) {
        e.stopPropagation();
      } else {
        $fileCont.classList.remove('show');
      }
    }
  });

  window.editor.on('keydown', (cm, event) => {
    // Shift+ Enter이면 코드 실행
    if (event.keyCode === 13 && event.shiftKey) {
      const runBtn = document.querySelector('.run-btn');
      runBtn.click();
      event.preventDefault();
    }
    // a~z, 1~F12, delete~9
    if (
      (event.keyCode >= 65 && event.keyCode <= 90) ||
      (event.keyCode >= 97 && event.keyCode <= 122) ||
      (event.keyCode >= 46 && event.keyCode <= 57)
    ) {
      CodeMirror.commands.autocomplete(cm, null, { completeSingle: false });
    }
  });

  $tableInput.addEventListener('change', (e) => {
    const csvCont = document.querySelector('label[for="csv-type"]');

    $fileCont.querySelector('.file-name').textContent = e.target.files[0].name;

    if (e.target.files[0].type == 'text/csv') {
      csvCont.classList.remove('hidden');
    } else {
      csvCont.classList.add('hidden');
    }
  });

  $btnTableUpload.addEventListener('click', () => {
    const file = $tableInput.files[0];
    const tableName = $tableName.value;
    console.log('file', file);
    console.log('name', tableName);

    if (!file || !tableName) {
      const err = showErrorMessage('올바른 파일과 테이블 이름을 입력해주세요.');
      hideMessage(err, 2000);
      return;
    }
    try {
      if (file.type == 'application/json') {
        const reader = new FileReader();
        reader.onload = function (e) {
          columns = Object.keys(JSON.parse(e.target.result)[0]);
          values = JSON.parse(e.target.result).map((value) =>
            Object.values(value),
          );
          const state = createTable(db, tableName, columns, values);
          if (state) {
            const alert = showAlertMessage(
              `${tableName} 테이블이 생성되었습니다`,
            );
            hideMessage(alert, 2000);
            resetUplaodForm();
          }
        };
        reader.readAsText(file);
      } else if (file.type == 'text/csv') {
        const reader = new FileReader();
        reader.onload = function (e) {
          const csv = e.target.result;
          const lines = csv.split('\n');
          const type = document.getElementById('csv-type').value;
          const columns = lines[0].split(type);
          const values = lines.slice(1).map((line) => line.split(type));
          const state = createTable(db, tableName, columns, values);
          if (state) {
            const alert = showAlertMessage(
              `${tableName} 테이블이 생성되었습니다`,
            );
            hideMessage(alert, 2000);
            resetUplaodForm();
          }
        };
        reader.readAsText(file);
      }
    } catch (err) {}
  });
});

function resetUplaodForm() {
  document.getElementById('table-name').value = '';
  document.getElementById('table-file').value = '';
  document.querySelector('.cont-filemodal .file-name').textContent = '';
}

function saveUploadedTable(name, columns, values) {
  // table_name의 형태로 세션 스토리지에 저장
  sessionStorage.setItem(`table_${name}`, JSON.stringify({ columns, values }));
  const tableList = JSON.parse(sessionStorage.getItem('table_list')) || [];
  tableList.push(name);
  sessionStorage.setItem('table_list', JSON.stringify(tableList));
}

function hideMessage(elem, time) {
  setTimeout(() => {
    elem.classList.add('hidden');
  }, time);
}
