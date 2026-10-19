const SIZE = 9;
const MINES = 10;

const boardEl = document.getElementById('board');
const minesEl = document.getElementById('mines');
const timerEl = document.getElementById('timer');
const messageEl = document.getElementById('message');
const restartEl = document.getElementById('restart');

let cells, buttons, started, over, flags, opened, seconds, intervalId;

function init() {
  clearInterval(intervalId);
  cells = Array.from({ length: SIZE * SIZE }, () => ({ mine: false, open: false, flag: false, count: 0 }));
  started = false;
  over = false;
  flags = 0;
  opened = 0;
  seconds = 0;
  timerEl.textContent = '0';
  messageEl.textContent = '';
  restartEl.textContent = '🙂';
  updateMines();

  boardEl.innerHTML = '';
  buttons = cells.map((_, i) => {
    const b = document.createElement('button');
    b.className = 'cell';
    b.type = 'button';
    b.addEventListener('click', () => openCell(i));
    b.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      toggleFlag(i);
    });
    // 휠 클릭, 또는 좌/우 버튼 동시 누름
    b.addEventListener('mousedown', (e) => {
      if (e.button === 1 || e.buttons === 3) {
        e.preventDefault();
        chord(i);
      }
    });
    b.addEventListener('auxclick', (e) => e.preventDefault());
    boardEl.appendChild(b);
    return b;
  });
}

function neighbors(i) {
  const r = Math.floor(i / SIZE);
  const c = i % SIZE;
  const result = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr;
      const nc = c + dc;
      if ((dr || dc) && nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) result.push(nr * SIZE + nc);
    }
  }
  return result;
}

// 첫 클릭한 칸에는 지뢰를 놓지 않는다
function placeMines(safe) {
  let placed = 0;
  while (placed < MINES) {
    const i = Math.floor(Math.random() * cells.length);
    if (i !== safe && !cells[i].mine) {
      cells[i].mine = true;
      placed++;
    }
  }
  cells.forEach((cell, i) => {
    cell.count = neighbors(i).filter((n) => cells[n].mine).length;
  });
}

function startTimer() {
  intervalId = setInterval(() => {
    seconds++;
    timerEl.textContent = seconds;
  }, 1000);
}

function updateMines() {
  minesEl.textContent = MINES - flags;
}

function render(i) {
  const cell = cells[i];
  const b = buttons[i];
  b.className = 'cell';
  if (cell.open) {
    b.classList.add('open');
    if (cell.mine) {
      b.textContent = '💣';
    } else {
      b.textContent = cell.count || '';
      if (cell.count) b.classList.add('n' + cell.count);
    }
  } else {
    b.textContent = cell.flag ? '🚩' : '';
  }
}

function openCell(i) {
  if (over || cells[i].open || cells[i].flag) return;
  if (!started) {
    started = true;
    placeMines(i);
    startTimer();
  }
  if (cells[i].mine) {
    lose(i);
    return;
  }
  const stack = [i];
  while (stack.length) {
    const cur = stack.pop();
    const cell = cells[cur];
    if (cell.open || cell.flag) continue;
    cell.open = true;
    opened++;
    render(cur);
    if (cell.count === 0) stack.push(...neighbors(cur));
  }
  if (opened === SIZE * SIZE - MINES) win();
}

function chord(i) {
  const cell = cells[i];
  if (over || !cell.open || cell.count === 0) return;
  const around = neighbors(i);
  if (around.filter((n) => cells[n].flag).length !== cell.count) return;
  // 깃발이 잘못 꽂혀 있으면 지뢰 칸이 열리며 openCell이 패배 처리한다
  around.forEach((n) => openCell(n));
}

function toggleFlag(i) {
  const cell = cells[i];
  if (over || cell.open) return;
  cell.flag = !cell.flag;
  flags += cell.flag ? 1 : -1;
  updateMines();
  render(i);
}

function lose(hit) {
  over = true;
  clearInterval(intervalId);
  cells.forEach((cell, i) => {
    if (cell.mine) {
      cell.open = true;
      render(i);
      buttons[i].classList.add('mine');
    }
  });
  buttons[hit].classList.add('exploded');
  restartEl.textContent = '😵';
  messageEl.textContent = '💥 패배! 지뢰를 밟았습니다.';
}

function win() {
  over = true;
  clearInterval(intervalId);
  cells.forEach((cell, i) => {
    if (cell.mine && !cell.flag) {
      cell.flag = true;
      render(i);
    }
  });
  flags = MINES;
  updateMines();
  restartEl.textContent = '😎';
  messageEl.textContent = `🎉 승리! ${seconds}초`;
}

restartEl.addEventListener('click', init);
init();
