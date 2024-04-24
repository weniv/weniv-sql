(async function () {
  const PAGE_NAME = window.location.pathname.split('/')[1];

  const normalize = (markdown) => {
    return markdown
      .replace(/\r\n?/g, '\n')
      .replace(/\n{2,}/g, '\n\n')
      .split('\n');
  };

  const parse = (token, { regex, tagName, replace }) => {
    return token.replace(regex, replace ?? `<${tagName}>$1</${tagName}>`);
  };

  const codeBlockStart = {
    regex: /^\s*`{3}(.+)/,
    replace: '<pre class="tuto-sec-example-query"><code>$1',
  };

  const codeBlockEnd = {
    regex: /(.*)`{3}\s*$/,
    replace: '$1</code></pre>',
  };

  const unorderedListItem = {
    regex: /^\s*-\s(.+)/,
    replace: '<li class="tuto-unordered-list-item">$1',
  };

  const orderedListItem = {
    regex: /^\s*(\d+\.\s.+)/,
    replace: '<li class="tuto-ordered-list-item">$1',
  };

  const tableRow = {
    regex: /^\|(.+)\|$/,
    replace: (_, group) => {
      const heads = group
        .split('|')
        .map((text) => `<td>${text.trim()}</td>`)
        .join('');
      return `<tr>${heads}</tr>`;
    },
  };

  const tableDivision = {
    regex: /^\|(([-|]|\s)+)\|$/,
    replace: '',
  };

  const heading = {
    regex: /^\s*(#+)\s(.+)/,
    replace: (_, mark, group) => {
      const tagName = `h${mark.length + 1}`;

      if (mark.length == 1) {
        return `<${tagName} class="tuto-title" id="${group.replace(
          /(\*{2})|`/g,
          '',
        )}">${group}</${tagName}>`;
      } else if (mark.length == 2) {
        return `<${tagName} class="tuto-sec-title" id="${group.replace(
          /(\*{2})|`/g,
          '',
        )}">${group}</${tagName}>`;
      } else if (mark.length == 3) {
        return `<${tagName} class="tuto-sec-subtitle" id="${group.replace(
          /(\*{2})|`/g,
          '',
        )}">${group}</${tagName}>`;
      }
      return `<${tagName} class="" id="${group.replace(
        /(\*{2})|`/g,
        '',
      )}">${group}</${tagName}>`;
    },
  };

  const figure = {
    regex: /^\s*!\[(.*)\]\((.+)\)/,
    replace: (_, g1, g2) => {
      const width = g2.match(/_{2}(\d+)\..+$/)?.[1];
      const img = `<figure><img src="${
        window.location.origin
      }/pagetutorial/img/${PAGE_NAME}/${g2}"${
        width ? ` style="width: ${width}px;"` : ''
      }>${g1 ? `<figcaption>${g1}</figcaption>` : ''}</figure>`;

      return img;
    },
  };

  const lineBreak = {
    regex: /^<br\s*\/>$/,
    replace: '<br />',
  };

  const paragraph = {
    regex: /(?:^|\n)(.+)$/,
    tagName: 'p',
    replace: (matched, group) =>
      /\<(\/)?(h\d|ul|ol|li|blockquote|pre|img|code)/.test(matched)
        ? matched
        : '<p>' + group + '</p>',
  };

  const link = {
    regex: /\[(.+)\]\((.+)\)/g,
    replace: '<a href="$2">$1</a>',
  };

  const strong = {
    regex: /\*{2}(([^*])+)\*{2}/g,
    tagName: 'strong',
  };

  const code = {
    regex: /`([^`]+)`/g,
    tagName: 'code',
  };

  const listDepth = (token) => {
    const indentation = token.match(/^\s*(?=-|(\d+\.))/)[0].length;
    return indentation % 2 ? indentation - 1 : indentation;
  };

  const encodeEntity = (token) => {
    return token
      .replace(/<br\s*\/>/g, '&br /&')
      .replaceAll('<', '&#60;')
      .replaceAll('>', '&#62;')
      .replaceAll('&br /&', '<br />');
  };

  const encodeCodeEntity = (token) => {
    let keyword = [
      'SELECT',
      'FROM',
      'DISTINCT',
      'WHERE',
      'AND',
      'ORDER BY',
      'LIKE',
      'INNER',
      'INTO',
      'INSERT',
      'HAVING',
      'JOIN',
      'RIGHT',
      'LEFT',
      'FULL',
      'GROUP BY',
      'PRIMARY',
      'CREATE',
      'UPDATE',
      'DELETE',
      'DROP',
      'NULL',
      'NOT',
      'OR',
      'IS',
      'SET',
      'IN',
      'ON',
      'AS',
      'LOWER',
      'UPPER',
      'SUBSTR',
      'LENGTH',
      'REPLACE',
      'DATE',
      'TIME',
      'STRFTIME',
      'DATETIME',
      'MAX',
      'MIN',
      'SUM',
      'COUNT',
      'AVG',
      'CHAR',
      'CONCAT',
      'ASCII',
      'EXISTS',
      'CASE',
      'WHEN',
      'END',
      'DESC',
      'ASC',
      'BETWEEN',
      'VALUES',
      'LIMIT',
      'TOP',
      'INT',
      'KEY',
      'VARCHAR',
      'DEFAULT',
      'TABLE',
      'SHOW',
      'DESC',
      'THEN',
      'ELSE',
      'UNION',
      'ANY',
    ];

    keyword.sort(function (a, b) {
      return b.length - a.length;
    });

    keyword.forEach(
      (key) =>
        (token = token.replaceAll(
          key,
          `<span style="color: var(--ColorCodeBlue)";>${key}</span>`,
        )),
    );

    return token;
  };

  const blockRules = [
    codeBlockStart,
    unorderedListItem,
    orderedListItem,
    tableDivision,
    tableRow,
    heading,
    figure,
    lineBreak,
  ];

  const inlineRules = [link, strong, code];

  const parseMarkdown = (markdown) => {
    const tokens = normalize(markdown);
    let isEditor = false;
    let codeBlockStartIndex = -1;
    let tableStartIndex = -1;
    let curListDepth = -1;
    const listStack = [];
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      // 코드 블럭이 아닐 때
      if (codeBlockStartIndex === -1) {
        const rule =
          blockRules.find(({ regex }) => regex.test(token)) ?? paragraph;
        tokens[i] = parse(encodeEntity(token), rule);

        switch (rule) {
          case codeBlockStart:
            codeBlockStartIndex = i;
            const codeType = tokens[i].match(/<code>(.+)$/)?.[1];
            if (codeType === 'editor') {
              isEditor = true;
              tokens[i] = '';
            } else {
              tokens[i] = tokens[i].replace(codeType, '');
            }
            break;

          case unorderedListItem:
          case orderedListItem:
            const tagName = rule === unorderedListItem ? 'ul' : 'ol';
            const depth = listDepth(token);
            if (depth > curListDepth) {
              tokens[i] = `<${tagName} class='tuto-list'>` + tokens[i];
              listStack.push(`</${tagName}>`);
            } else if (depth < curListDepth) {
              let depthDiff = (curListDepth - depth) / 2;
              while (depthDiff) {
                const tag = listStack.pop();
                // console.log(depthDiff);
                // console.log(tag);
                tokens[i - 1] += tag;
                if (tag === `</${tagName}>`) {
                  depthDiff--;
                }
              }
              tokens[i - 1] += listStack.pop();
            } else {
              tokens[i - 1] += listStack.pop();
            }
            curListDepth = depth;
            listStack.push('</li>');
            break;

          case tableRow:
            if (tableStartIndex === -1) {
              tableStartIndex = i;
              tokens[i] = '<table>' + tokens[i].replace(/(\<\/?)td>/g, '$1th>');
            }
            break;

          default:
            if (token.trim() === '') {
              if (listStack.length) {
                while (listStack.length) {
                  tokens[i - 1] += listStack.pop();
                }
                curListDepth = -1;
              }

              if (tableStartIndex >= 0) {
                tokens[i - 1] += '</table>';
                tableStartIndex = -1;
              }

              isEditor = false;
            }
        }
        // 코드 블럭일 때
      } else {
        if (token.trim() === '') {
          tokens[i] = '\n\n';
        }
        if (!isEditor) {
          // console.log(tokens[i]);
          tokens[i] = encodeCodeEntity(token);
        }
        if (codeBlockEnd.regex.test(token)) {
          tokens[i] = parse(token, codeBlockEnd);
          // console.log(tokens[i]);
          codeBlockStartIndex = -1;
          isEditor = false;
        } else {
          tokens[i] += '\n';
        }
      }
    }

    tokens.forEach((_, index) => {
      inlineRules.forEach((rule) => {
        if (rule.regex.test(tokens[index])) {
          tokens[index] = parse(tokens[index], rule);
        }
      });
    });

    return tokens.filter(Boolean);
  };

  /**
   * 페이지의 markdown 파일을 가져옴
   * @async
   * @function fetchMarkdown
   * @returns {Promise<string>} - 페이지의 markdown 내용을 담은 문자열을 반환하는 프로미스
   */
  const fetchMarkdown = async () => {
    const res = await fetch(
      `${window.location.origin}/src/md/${PAGE_NAME}/article.md`,
    );

    const markdown = await res.text();
    return markdown;
  };

  /**
   * 주어진 HTML 내용을 기반으로 메뉴를 렌더링
   * @param {string[]} html - HTML 내용을 담은 문자열 배열
   */
  const renderMenu = (html) => {
    const menuTitles = html
      .filter((v) => /<h\d.+>/.test(v))
      .map((heading) => {
        const title = heading
          .replace(/^<h(\d).+>(.+)<\/h\d>$/, '$1 $2')
          .split(' ');
        return [Number(title[0]), title.slice(1).join(' ')];
      });

    const asideWrap = document.querySelector('.tutorial-content-wrap'); // 페이지 전체를 감싸는 div
    const aside = document.querySelector('aside'); // 사이드바(목차)
    const asideCloseBtn = document.createElement('button'); // aside 닫기 버튼
    const asideOpenBtn = document.createElement('button'); // aside 열기 버튼
    const dim = document.createElement('div'); // dim(aside open시 음영처리 위함)
    dim.classList.add('dim');
    asideOpenBtn.classList.add('aside-open-button');
    asideWrap.append(asideOpenBtn);
    asideCloseBtn.classList.add('aside-folder-button');
    aside.prepend(asideCloseBtn);

    window.addEventListener('click', (e) => {
      if (e.target === asideOpenBtn) {
        aside.classList.add('aside-open');
        asideWrap.append(dim);
      } else if (e.target === asideCloseBtn) {
        aside.classList.remove('aside-open');
        dim.remove();
      } else if (
        aside.classList.contains('aside-open') &&
        !aside.contains(e.target)
      ) {
        aside.classList.remove('aside-open');
        dim.remove();
      }
    });

    window.addEventListener('resize', (e) => {
      if (window.innerWidth > 1024) {
        aside.classList.remove('aside-open');
        dim.remove();
      }
    });

    let subMenu = null;

    const mainList = document.createElement('ol');
    mainList.setAttribute('class', 'list-item');

    // let activeMenuItem = null;

    // aside 내부 메뉴 리스트 추가
    menuTitles.forEach(([depth, title]) => {
      if (depth === 2) {
        const item = document.createElement('details');
        const itemTitle = document.createElement('summary');
        const link = document.createElement('a');
        link.setAttribute('href', `#${title}`);
        link.innerHTML = title;

        if (PAGE_NAME === 'pagecheatsheet') {
          itemTitle.classList.add('hidden-before');
        }

        const list = document.createElement('ol');
        list.setAttribute('class', 'subtit-drawer-menu');
        itemTitle.appendChild(link);
        item.appendChild(itemTitle);

        item.appendChild(list);
        mainList.appendChild(item);
        subMenu = list;
      } else if (depth === 4) {
      } else {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.setAttribute('href', `#${title}`);
        link.textContent = title;
        item.appendChild(link);
        subMenu.appendChild(item);

        // item.addEventListener('click', () => {
        //   if (activeMenuItem) {
        //     activeMenuItem.classList.remove('active-menu');
        //   }
        //   item.classList.add('active-menu');
        //   activeMenuItem = item;
        // });
      }
    });

    const asideList = document.querySelector(`aside > ul > .list-wrap`);
    asideList.appendChild(mainList);
  };

  const renderContent = (html) => {
    const div = document.querySelector(`main`);
    const innerHTML = [...html];
    // console.log(html);
    let isFirst = true;
    innerHTML.forEach((token, index) => {
      if (/^<h\d+/.test(token) && token.match(/^<h(\d+)/)[1] === '2') {
        if (isFirst) {
          innerHTML[index] = '<article class="tuto-title-box">' + token;
          isFirst = false;
        } else {
          innerHTML[index - 1] += '</article>';
          innerHTML[index] = '<article class="tuto-sec">' + token;
        }
      }
      if (index === innerHTML.length - 1) {
        innerHTML[index] += '</article>';
      }
    });
    div.innerHTML = innerHTML.join('');
  };

  const deleteDivisionLine = () => {
    document
      .querySelectorAll(`.cont-${PAGE_NAME} h3, cont-${PAGE_NAME} h4`)
      .forEach((elem) => {
        const sibling = elem.nextElementSibling;
        if (sibling && (sibling.tagName === 'H3' || sibling.tagName === 'H4')) {
          elem.classList.add('no-border');
        }
      });
  };

  const deleteLineBreak = () => {
    document.querySelectorAll(`.cont-${PAGE_NAME} p`).forEach((elem) => {
      const parent = elem.parentElement;
      const sibling = elem.nextElementSibling;
      if (sibling?.tagName === 'BR') {
        elem.classList.add('margin-bottom');
        parent.removeChild(sibling);
      }
    });
  };

  const modifyStyle = () => {
    deleteDivisionLine();
    deleteLineBreak();
  };

  const render = async () => {
    const markdown = await fetchMarkdown();
    const html = parseMarkdown(markdown);
    renderMenu(html);
    renderContent(html);
    modifyStyle();
    window.dispatchEvent(new Event('markdownParsed'));
  };

  render();

  const isChrome =
    /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);

  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const isSafari = navigator.userAgent.toLowerCase();

  if (isChrome || iOS || isSafari.indexOf('safari') != -1) {
    window.addEventListener('markdownParsed', () => {
      const hash = window.location.hash;
      window.location.hash = '';
      window.location.hash = hash;
    });
  }
})();
