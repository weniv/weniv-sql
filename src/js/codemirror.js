const resetBtn = document.querySelector('.btn-reset');
resetBtn.addEventListener('click', (e) => {
  e.preventDefault();
  window.editor.setValue('');
});

const copyBtn = document.querySelector('.btn-copy');
copyBtn.addEventListener('click', (e) => {
  const copyCode = window.editor.getValue();
  navigator.clipboard.writeText(copyCode).then((res) => {
    alert('코드가 클립보드에 복사되었습니다.');
  });
});

// URL쿼리 스트링으로 에디터 기본 입력값 설정
const urlParams = new URLSearchParams(window.location.search);
const defaultCode = urlParams.get('code');


document.addEventListener('DOMContentLoaded', () => {
  window.editor = CodeMirror.fromTextArea(
    document.getElementById('codeMirrorTextarea'),
    {
      mode: 'text/x-sqlite',
      indentWithTabs: true,
      smartIndent: true,
      lineNumbers: true,
      matchBrackets: true,
      autofocus: true,
      extraKeys: {
        Tab: 'autocomplete',
        'Ctrl-/': 'toggleComment',
      },
    },
  );
  if (defaultCode) {
    window.editor.setValue(defaultCode);
  } else {
    window.editor.setValue('SELECT * FROM 상품;\n\n\n');
  }
  window.editor.setSize('100%', '100%');
});

const SQLTableList = {
  상품: [
    '상품ID',
    '상품명',
    '카테고리ID',
    '가격',
    '재고',
    '설명',
    '공급업체ID',
  ],
  카테고리: ['카테고리ID', '카테고리명'],
  고객: ['고객ID', '이름', '이메일', '연락처', '주소', '가입일'],
  주문: ['주문ID', '고객ID', '주문날짜', '배송주소', '총주문금액'],
  주문상세: ['주문상세ID', '주문ID', '상품ID', '수량', '단가'],
  공급업체: ['공급업체ID', '회사명', '연락처', '주소'],
  고객정보: ['고객ID', '이름', '나이', '지역', '등급', '이메일', '가입일'],
  판매정보: ['판매ID', '고객ID', '상품명', '카테고리', '수량', '단가', '할인율', '판매일'],
};

CodeMirror.commands.autocomplete = function (cm) {
  CodeMirror.showHint(cm, CodeMirror.hint.sql, {
    completeSingle: false,
  });
};
