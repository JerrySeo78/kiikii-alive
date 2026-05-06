import { IslandEngine, DECO_ITEMS, WALL_ITEMS, CW, CH, type IslandMode, type TileType, type WallType } from '../island/IslandEngine.js';

// ── Sample room data ────────────────────────────────────────────────────────

type PresetEntry = {
  row: number; col: number;
  tile?: TileType; wall?: WallType;
  deco?: string; decoDir?: 0 | 1;
};

interface SampleRoom {
  id: string;
  ownerName: string;
  ownerAvatar: string;
  ownerOshiId: string;
  greeting: string;
  preset: PresetEntry[];
  visitors: { name: string; avatar: string; message: string }[];
  guestbook: { id: string; name: string; avatar: string; message: string; time: string }[];
}

// ── 샘플 룸 프리셋 ──────────────────────────────────────────────────────────

/** 핑크 카펫 거실형 — 소파/테이블/러그 중심, 8×8 */
function makePresetJiyu(): PresetEntry[] {
  const p: PresetEntry[] = [];
  for (let r = 1; r <= 8; r++)
    for (let c = 1; c <= 8; c++)
      p.push({ row: r, col: c, tile: 'carpet_pink' });
  return [
    ...p,
    { row: 1, col: 1, wall: 'corner' },
    { row: 1, col: 2, wall: 'right' }, { row: 1, col: 3, wall: 'right' },
    { row: 1, col: 4, wall: 'right' }, { row: 1, col: 5, wall: 'right' },
    { row: 1, col: 6, wall: 'right' }, { row: 1, col: 7, wall: 'right' },
    { row: 1, col: 8, wall: 'right' },
    { row: 2, col: 1, wall: 'left'  }, { row: 3, col: 1, wall: 'left'  },
    { row: 4, col: 1, wall: 'left'  }, { row: 5, col: 1, wall: 'left'  },
    { row: 6, col: 1, wall: 'left'  }, { row: 7, col: 1, wall: 'left'  },
    { row: 8, col: 1, wall: 'left'  },
    { row: 2, col: 2, deco: 'mirror'    },
    { row: 2, col: 5, deco: 'bookshelf' },
    { row: 2, col: 7, deco: 'dresser'   },
    { row: 2, col: 8, deco: 'wardrobe'  },
    { row: 4, col: 5, deco: 'rug'       },
    { row: 3, col: 8, deco: 'lamp'      },
    { row: 5, col: 3, deco: 'sofa'      },
    { row: 5, col: 6, deco: 'table'     },
    { row: 7, col: 4, deco: 'bed'       },
  ];
}

/** 마블 서재형 — 책장/옷장 중심, 8×8 */
function makePresetJiwoo(): PresetEntry[] {
  const p: PresetEntry[] = [];
  for (let r = 1; r <= 8; r++)
    for (let c = 1; c <= 8; c++)
      p.push({ row: r, col: c, tile: 'marble' });
  return [
    ...p,
    { row: 1, col: 1, wall: 'corner' },
    { row: 1, col: 2, wall: 'right' }, { row: 1, col: 3, wall: 'right' },
    { row: 1, col: 4, wall: 'right' }, { row: 1, col: 5, wall: 'right' },
    { row: 1, col: 6, wall: 'right' }, { row: 1, col: 7, wall: 'right' },
    { row: 1, col: 8, wall: 'right' },
    { row: 2, col: 1, wall: 'left'  }, { row: 3, col: 1, wall: 'left'  },
    { row: 4, col: 1, wall: 'left'  }, { row: 5, col: 1, wall: 'left'  },
    { row: 6, col: 1, wall: 'left'  }, { row: 7, col: 1, wall: 'left'  },
    { row: 8, col: 1, wall: 'left'  },
    { row: 2, col: 2, deco: 'bookshelf' },
    { row: 2, col: 3, deco: 'bookshelf' },
    { row: 2, col: 5, deco: 'wardrobe'  },
    { row: 2, col: 7, deco: 'dresser'   },
    { row: 2, col: 8, deco: 'mirror'    },
    { row: 4, col: 4, deco: 'rug'       },
    { row: 3, col: 8, deco: 'lamp'      },
    { row: 5, col: 2, deco: 'sofa'      },
    { row: 5, col: 5, deco: 'table'     },
    { row: 7, col: 3, deco: 'bed'       },
  ];
}

/** 핑크 침실형 — 침대/화장대 중심, 8×8 */
function makePresetSubin(): PresetEntry[] {
  const p: PresetEntry[] = [];
  for (let r = 1; r <= 8; r++)
    for (let c = 1; c <= 8; c++)
      p.push({ row: r, col: c, tile: 'pink' });
  return [
    ...p,
    { row: 1, col: 1, wall: 'corner' },
    { row: 1, col: 2, wall: 'right' }, { row: 1, col: 3, wall: 'right' },
    { row: 1, col: 4, wall: 'right' }, { row: 1, col: 5, wall: 'right' },
    { row: 1, col: 6, wall: 'right' }, { row: 1, col: 7, wall: 'right' },
    { row: 1, col: 8, wall: 'right' },
    { row: 2, col: 1, wall: 'left'  }, { row: 3, col: 1, wall: 'left'  },
    { row: 4, col: 1, wall: 'left'  }, { row: 5, col: 1, wall: 'left'  },
    { row: 6, col: 1, wall: 'left'  }, { row: 7, col: 1, wall: 'left'  },
    { row: 8, col: 1, wall: 'left'  },
    { row: 2, col: 2, deco: 'bed'       },
    { row: 2, col: 5, deco: 'wardrobe'  },
    { row: 2, col: 7, deco: 'bookshelf' },
    { row: 2, col: 8, deco: 'dresser'   },
    { row: 3, col: 2, deco: 'mirror'    },
    { row: 3, col: 8, deco: 'lamp'      },
    { row: 5, col: 4, deco: 'rug'       },
    { row: 6, col: 2, deco: 'sofa'      },
    { row: 6, col: 6, deco: 'table'     },
  ];
}

const SAMPLE_ROOMS: SampleRoom[] = [
  {
    id: 'room_jiyufan',
    ownerName: '지유최애💜',
    ownerAvatar: '🌸',
    ownerOshiId: 'jiyu',
    greeting: '어서 와요! 제 방 구경하고 방명록 남겨줘요 💜',
    preset: makePresetJiyu(),
    visitors: [
      { name: '하늘이', avatar: '🌙', message: '방 너무 예뻐요!!' },
      { name: '수달팬', avatar: '🦦', message: '또 왔어요 ㅎㅎ' },
    ],
    guestbook: [
      { id: 'g1', name: '하늘이', avatar: '🌙', message: '방 꾸미기 진짜 잘하신다 부러워요 💕', time: '5분 전' },
      { id: 'g2', name: '별빛소녀', avatar: '⭐', message: '지유 사진 어디서 구하셨어요?? 너무 좋은데', time: '23분 전' },
      { id: 'g3', name: '수달팬', avatar: '🦦', message: '파도타고 왔어요~ 구경 잘 하고 가요!', time: '1시간 전' },
      { id: 'g4', name: '밤하늘', avatar: '🌃', message: '맞팔해요 ㅎㅎ 제 방도 놀러오세요', time: '3시간 전' },
    ],
  },
  {
    id: 'room_jiwoolover',
    ownerName: '지우러버🌊',
    ownerAvatar: '🌊',
    ownerOshiId: 'jiwoo',
    greeting: '지우 팬 여기 또 왔네요~ 놀다 가세요 🌊',
    preset: makePresetJiwoo(),
    visitors: [
      { name: '꽃분이', avatar: '🌺', message: '지우 최고!!' },
    ],
    guestbook: [
      { id: 'g5', name: '꽃분이', avatar: '🌺', message: '지우 방이라 들어왔어요 ㅋㅋ 너무 귀여운 방!', time: '12분 전' },
      { id: 'g6', name: '민들레', avatar: '🌼', message: '방 청소 언제 하셨어요 넘 깔끔해', time: '2시간 전' },
      { id: 'g7', name: '하늘이', avatar: '🌙', message: '파도타고 들렀다가요~', time: '5시간 전' },
    ],
  },
  {
    id: 'room_subinfan',
    ownerName: '수빈이s2🔥',
    ownerAvatar: '🔥',
    ownerOshiId: 'subin',
    greeting: '수빈이 방 발견 축하해요 🔥 방명록 꼭 남기고 가세요!',
    preset: makePresetSubin(),
    visitors: [
      { name: '노을빛', avatar: '🌅', message: '수빈 팬 여기 모여라!!!' },
      { name: '별빛소녀', avatar: '⭐', message: '방 꾸미기 참고할게요' },
    ],
    guestbook: [
      { id: 'g8', name: '노을빛', avatar: '🌅', message: '수빈 최애방 발견!! 이웃 신청해도 되나요?', time: '방금 전' },
      { id: 'g9', name: '별빛소녀', avatar: '⭐', message: '가구 배치 너무 예쁜데 어떻게 한 거예요', time: '44분 전' },
      { id: 'g10', name: '밤하늘', avatar: '🌃', message: '수빈이 방 드디어 찾았다 ㅠㅠ', time: '2시간 전' },
      { id: 'g11', name: '수달팬', avatar: '🦦', message: '또 왔어요 오늘도 예쁘네요', time: '어제' },
    ],
  },
];

// ── Oshi color map ──────────────────────────────────────────────────────────
const OSHI_COLORS: Record<string, string> = {
  jiyu:  '#F2A7BB',
  jiwoo: '#5B7FA6',
  subin: '#C8384A',
  sumin: '#F07850',
  haeum: '#8B6355',
};
const DEFAULT_OSHI_COLOR = '#9B7FE8';

function getOshiColor(): string {
  const id = localStorage.getItem('kiikii_oshi') ?? '';
  return OSHI_COLORS[id] ?? DEFAULT_OSHI_COLOR;
}

// ── Module-level engine singleton (persists while screen is mounted) ────────
let engine: IslandEngine | null = null;

// ── Current room state ──────────────────────────────────────────────────────
let currentRoomId: string | null = null; // null = 내 방

// ── My guestbook (local dummy state) ───────────────────────────────────────
let myGuestbook: SampleRoom['guestbook'] = [
  { id: 'mg1', name: '별빛소녀', avatar: '⭐', message: '방 너무 예쁘다!! 팔로우 했어요', time: '30분 전' },
  { id: 'mg2', name: '꽃분이', avatar: '🌺', message: '파도타고 왔어요~ 구경 잘 했어요!', time: '2시간 전' },
];

// ── Route-change cleanup ────────────────────────────────────────────────────
function onHashChange(): void {
  const hash = window.location.hash.slice(1);
  if (hash !== 'miniroom' && engine) {
    engine.stop();
    engine = null;
  }
}

window.removeEventListener('hashchange', onHashChange);
window.addEventListener('hashchange', onHashChange);

// ── Tips per mode ───────────────────────────────────────────────────────────
const TIPS: Record<IslandMode, string> = {
  deco:   '바닥 타일을 먼저 깔고, 데코를 탭해서 설치하세요',
  delete: '타일을 탭하면 데코 먼저 삭제, 한 번 더 탭하면 바닥 제거',
  move:   '타일을 드래그해서 이동, 다른 타일 위에 놓으면 교환!',
};

// ── Tile options ────────────────────────────────────────────────────────────
const TILE_OPTIONS: { type: TileType; label: string; file: string }[] = [
  { type: 'green',       label: '초록',    file: 'tile_green.png'       },
  { type: 'pink',        label: '핑크',    file: 'tile_pink.png'        },
  { type: 'white',       label: '화이트',  file: 'tile_white.png'       },
  { type: 'wood',        label: '원목',    file: 'tile_wood.png'        },
  { type: 'marble',      label: '대리석',  file: 'tile_marble.png'      },
  { type: 'carpet_pink', label: '카펫',    file: 'tile_carpet_pink.png' },
  { type: 'dark_wood',   label: '다크우드', file: 'tile_dark_wood.png'  },
];

// ── Girl's room preset ───────────────────────────────────────────────────────
const GIRL_ROOM_PRESET: PresetEntry[] = [
  ...(() => {
    const tiles: PresetEntry[] = [];
    for (let r = 2; r <= 7; r++)
      for (let c = 2; c <= 7; c++)
        tiles.push({ row: r, col: c, tile: 'wood' });
    return tiles;
  })(),
  { row: 2, col: 2, wall: 'corner' },
  { row: 2, col: 3, wall: 'right'  }, { row: 2, col: 4, wall: 'right' },
  { row: 2, col: 5, wall: 'right'  }, { row: 2, col: 6, wall: 'right' },
  { row: 2, col: 7, wall: 'right'  },
  { row: 3, col: 2, wall: 'left'   }, { row: 4, col: 2, wall: 'left'  },
  { row: 5, col: 2, wall: 'left'   }, { row: 6, col: 2, wall: 'left'  },
  { row: 7, col: 2, wall: 'left'   },
  { row: 3, col: 3, deco: 'bed'        },
  { row: 4, col: 3, deco: 'mirror'     },
  { row: 3, col: 5, deco: 'bookshelf'  },
  { row: 3, col: 6, deco: 'dresser'    },
  { row: 3, col: 7, deco: 'wardrobe'   },
  { row: 5, col: 7, deco: 'lamp'       },
  { row: 5, col: 5, deco: 'rug'        },
  { row: 7, col: 4, deco: 'sofa'       },
  { row: 6, col: 6, deco: 'table'      },
];

// ── Main render ──────────────────────────────────────────────────────────────
export async function renderIsland(): Promise<void> {
  const container = document.getElementById('screen-container');
  if (!container) return;

  // Stop any previously running engine
  if (engine) {
    engine.stop();
    engine = null;
  }

  currentRoomId = null;

  const oshiColor = getOshiColor();
  const oshiId    = localStorage.getItem('kiikii_oshi') ?? '';

  // Show loading state while images load
  container.innerHTML = `
    <div class="screen screen--island">
      <div class="island__loading">
        <span>로딩 중...</span>
      </div>
    </div>
  `;

  // Preload images before rendering UI
  const tempCanvas = document.createElement('canvas');
  engine = new IslandEngine(tempCanvas, oshiColor, oshiId, 0.65);
  await engine.preloadImages();

  // Now render full UI
  container.innerHTML = `
    <div class="screen screen--island" id="miniroom-root">

      <!-- 상단 -->
      <div class="island__topbar">
        <span class="island__topbar-owner" id="island-owner-name">내 미니룸</span>
        <button class="island__wave-btn" id="island-wave-btn">🌊 파도타기</button>
      </div>

      <!-- 캔버스 씬 -->
      <div class="island__scene" id="island-scene">
        <div class="island__world" id="island-world" style="width:${CW}px;height:${CH}px;">
          <canvas id="island-canvas"></canvas>
        </div>
        <div class="island__visitors" id="island-visitors"></div>
      </div>

      <!-- 하단 탭 -->
      <div class="island__bottom" id="island-bottom">
        <div class="island__tabs">
          <button class="island__tab island__tab--active" data-tab="guestbook">방명록</button>
          <button class="island__tab" data-tab="shop">상점</button>
          <button class="island__tab" data-tab="decorate">꾸미기</button>
        </div>

        <!-- 방명록 패널 -->
        <div class="island__panel island__panel--active" id="panel-guestbook">
          <div class="island__guestbook-list" id="guestbook-list"></div>
          <div class="island__guestbook-compose">
            <input id="guestbook-input" class="island__guestbook-input" type="text" placeholder="방명록을 남겨보세요…" maxlength="80" />
            <button id="guestbook-send" class="island__guestbook-send">전송</button>
          </div>
        </div>

        <!-- 상점 패널 -->
        <div class="island__panel" id="panel-shop"></div>

        <!-- 꾸미기 패널 -->
        <div class="island__panel" id="panel-decorate">
          <div class="island__mrow">
            <button class="island__mbtn island__mbtn--active" id="ibtn-deco" data-mode="deco">🎨 꾸미기</button>
            <button class="island__mbtn island__mbtn--del" id="ibtn-delete" data-mode="delete">🗑️ 삭제</button>
            <button class="island__mbtn" id="ibtn-move" data-mode="move">✋ 이동</button>
            <button class="island__mbtn island__mbtn--save" id="ibtn-save">💾 저장</button>
          </div>

          <div class="island__palette" id="island-palette">
            <div class="island__mrow" style="margin-bottom:2px;">
              <button class="island__mbtn" id="ibtn-dir" style="flex:0 0 auto;padding:6px 14px;">↔ 방향</button>
              <span id="island-dir-label" style="font-size:11px;color:#9b7fe8;align-self:center;margin-left:4px;">정방향</span>
            </div>

            <div class="island__palette-label">바닥 타일</div>
            <div class="island__trow" id="island-trow">
              ${TILE_OPTIONS.map(t => `
                <button class="island__tpick${t.type === 'green' ? ' island__pick--sel' : ''}"
                  data-tile="${t.type}" title="${t.label}">
                  <img src="/island/${t.file}" alt="${t.label}">
                  <small>${t.label}</small>
                </button>
              `).join('')}
            </div>

            <div class="island__palette-label">벽</div>
            <div class="island__trow" id="island-wrow">
              ${WALL_ITEMS.map(w => `
                <button class="island__tpick" data-wall="${w.id}" title="${w.name}">
                  <img src="/island/${w.file}" alt="${w.name}">
                  <small>${w.name}</small>
                </button>
              `).join('')}
            </div>

            <div class="island__palette-label">데코 아이템</div>
            <div class="island__drow" id="island-drow">
              ${DECO_ITEMS.map(d => `
                <button class="island__dpick" data-id="${d.id}" title="${d.name}">
                  <img src="/island/${d.file}" alt="${d.name}">
                  <small>${d.name}</small>
                </button>
              `).join('')}
            </div>
          </div>

          <div class="island__tip" id="island-tip">${TIPS.deco}</div>
        </div>

      </div>

      <div class="island__toast" id="island-toast"></div>
    </div>
  `;

  // Attach the engine to the real canvas
  const canvas = document.getElementById('island-canvas') as HTMLCanvasElement | null;
  const scene  = document.getElementById('island-scene')  as HTMLElement | null;
  if (!canvas || !scene) return;

  engine.stop();
  engine = new IslandEngine(canvas, oshiColor, oshiId, 0.65);
  await engine.preloadImages();

  if (!localStorage.getItem('kiikii_island_grid')) {
    engine.loadPreset(GIRL_ROOM_PRESET);
  }

  engine.setScene(scene);
  engine.onGridChange = () => { /* grid changed */ };
  engine.start();
  engine.setViewOnly(true); // 방명록 탭이 기본 → 이동 전용

  // ── 탭 전환 ───────────────────────────────────────────────────────────────
  document.querySelectorAll<HTMLButtonElement>('.island__tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset['tab'];
      if (!target) return;

      document.querySelectorAll('.island__tab').forEach(t => t.classList.remove('island__tab--active'));
      tab.classList.add('island__tab--active');

      document.querySelectorAll('.island__panel').forEach(p => p.classList.remove('island__panel--active'));
      document.getElementById(`panel-${target}`)?.classList.add('island__panel--active');

      // 꾸미기 탭에서만 타일 그리기 허용, 나머지는 이동 전용
      engine?.setViewOnly(target !== 'decorate');
    });
  });

  // ── 파도타기 버튼 ─────────────────────────────────────────────────────────
  document.getElementById('island-wave-btn')?.addEventListener('click', () => {
    const others = SAMPLE_ROOMS.filter(r => r.id !== currentRoomId);
    const next = others[Math.floor(Math.random() * others.length)]!;
    _enterRoom(next);
  });

  // ── 방명록 전송 ───────────────────────────────────────────────────────────
  document.getElementById('guestbook-send')?.addEventListener('click', () => {
    _sendGuestbook();
  });
  document.getElementById('guestbook-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') _sendGuestbook();
  });

  // ── 꾸미기 탭: 모드 버튼 ─────────────────────────────────────────────────
  document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset['mode'] as IslandMode;
      engine?.setMode(mode);
      _setActiveMode(mode);
    });
  });

  // ── 타일 팔레트 ───────────────────────────────────────────────────────────
  document.querySelectorAll<HTMLButtonElement>('.island__tpick').forEach(btn => {
    btn.addEventListener('click', () => {
      const tileType = btn.dataset['tile'] as TileType | undefined;
      if (tileType) {
        engine?.selectTile(tileType);
        engine?.setMode('deco');
        _setActiveMode('deco');
        _selectPaletteItem(btn);
      }
    });
  });

  // ── 벽 팔레트 ─────────────────────────────────────────────────────────────
  document.querySelectorAll<HTMLButtonElement>('[data-wall]').forEach(btn => {
    btn.addEventListener('click', () => {
      const wallType = btn.dataset['wall'] as WallType;
      engine?.selectWall(wallType);
      engine?.setMode('deco');
      _setActiveMode('deco');
      _selectPaletteItem(btn);
    });
  });

  // ── 데코 팔레트 ───────────────────────────────────────────────────────────
  document.querySelectorAll<HTMLButtonElement>('.island__dpick').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset['id'] ?? '';
      engine?.selectDeco(id);
      engine?.setMode('deco');
      _setActiveMode('deco');
      _selectPaletteItem(btn);
    });
  });

  // ── 저장 버튼 ─────────────────────────────────────────────────────────────
  document.getElementById('ibtn-save')?.addEventListener('click', () => {
    engine?.save();
    _showToast('저장했어요! 💜');
  });

  // ── 방향 토글 ─────────────────────────────────────────────────────────────
  document.getElementById('ibtn-dir')?.addEventListener('click', () => {
    const dir = engine?.toggleDir();
    const label = document.getElementById('island-dir-label');
    if (label) label.textContent = dir === 1 ? '반전' : '정방향';
  });

  // ── 팔레트 드래그 스크롤 ─────────────────────────────────────────────────
  const trow = document.getElementById('island-trow');
  const drow = document.getElementById('island-drow');
  if (trow) { trow.style.overflowX = 'auto'; _makeDragScroll(trow); }
  if (drow) _makeDragScroll(drow);

  // ── 초기 상태 렌더 ────────────────────────────────────────────────────────
  _renderMyRoomVisitors();
  _renderGuestbook(myGuestbook, null);
  _initShopPanel();
}

// ── 방 입장 ──────────────────────────────────────────────────────────────────

function _enterRoom(room: SampleRoom): void {
  currentRoomId = room.id;

  // 그리드를 해당 방 프리셋으로 교체 (localStorage 영향 없음)
  engine?.loadPresetTemp(room.preset);

  // 방 주인 캐릭터를 메인 치비로, 내 캐릭터를 방문자 치비로 표시
  const myOshiIdForVisit = localStorage.getItem('kiikii_oshi') ?? '';
  engine?.changeChibi(room.ownerOshiId);
  engine?.setVisitorChibi(myOshiIdForVisit || null);

  const nameEl = document.getElementById('island-owner-name');
  if (nameEl) {
    nameEl.innerHTML = `
      ${room.ownerName}의 미니룸
      <button class="island__back-btn" id="island-back-btn">← 내 방</button>
    `;
    document.getElementById('island-back-btn')?.addEventListener('click', _leaveRoom);
  }

  // 방문자 오버레이: 기존 방문자들만 표시 (나와 주인은 캔버스 치비로)
  _renderVisitors(room.visitors);
  // 주인 인사 말풍선 — 캔버스에서 치비 바로 위에 그림
  engine?.setGreeting({ name: room.ownerName, text: room.greeting });
  if (_greetingTimer) clearTimeout(_greetingTimer);
  _greetingTimer = setTimeout(() => engine?.setGreeting(null), 6000);
  _renderGuestbook(room.guestbook, room);
}

function _leaveRoom(): void {
  currentRoomId = null;

  // 내 저장된 그리드 복원 (없으면 기본 프리셋)
  if (localStorage.getItem('kiikii_island_grid')) {
    engine?.reloadFromStorage();
  } else {
    engine?.loadPresetTemp(GIRL_ROOM_PRESET);
  }

  // 내 오시 캐릭터로 복귀, 방문자 치비 제거
  const myOshiId = localStorage.getItem('kiikii_oshi') ?? '';
  engine?.changeChibi(myOshiId);
  engine?.setVisitorChibi(null);

  engine?.setGreeting(null);
  if (_greetingTimer) { clearTimeout(_greetingTimer); _greetingTimer = null; }

  const nameEl = document.getElementById('island-owner-name');
  if (nameEl) nameEl.textContent = '내 미니룸';
  _renderMyRoomVisitors();
  _renderGuestbook(myGuestbook, null);
}

let _greetingTimer: ReturnType<typeof setTimeout> | null = null;

// ── 내 방 방문자 렌더 (최근 방명록 2개) ──────────────────────────────────────

function _renderMyRoomVisitors(): void {
  const recent = myGuestbook.slice(0, 2).map(e => ({
    name: e.name,
    avatar: e.avatar,
    message: e.message,
  }));
  _renderVisitors(recent);
}

// ── 방문자 오버레이 렌더 ─────────────────────────────────────────────────────

function _renderVisitors(visitors: SampleRoom['visitors']): void {
  const container = document.getElementById('island-visitors');
  if (!container) return;
  const positions = [
    { left: '20%', top: '35%' },
    { left: '55%', top: '50%' },
    { left: '70%', top: '30%' },
  ];
  container.innerHTML = visitors.map((v, i) => {
    const pos = positions[i % positions.length]!;
    return `
      <div class="island__visitor" style="left:${pos.left};top:${pos.top}">
        <div class="island__visitor-bubble">${v.message}</div>
        <div class="island__visitor-avatar">${v.avatar}</div>
        <div class="island__visitor-name">${v.name}</div>
      </div>
    `;
  }).join('');
}

// ── 방명록 렌더 ──────────────────────────────────────────────────────────────

function _renderGuestbook(entries: SampleRoom['guestbook'], room: SampleRoom | null): void {
  const list = document.getElementById('guestbook-list');
  if (!list) return;
  list.innerHTML = entries.map(e => `
    <div class="island__gb-entry">
      <span class="island__gb-avatar">${e.avatar}</span>
      <div class="island__gb-body">
        <div class="island__gb-meta">
          <span class="island__gb-name">${e.name}</span>
          <span class="island__gb-time">${e.time}</span>
        </div>
        <div class="island__gb-msg">${e.message}</div>
      </div>
      ${room ? `<button class="island__gb-room-btn" data-room-id="${room.id}" title="${e.name}의 방 방문">🏠</button>` : ''}
    </div>
  `).join('');

  // 🏠 버튼 이벤트
  list.querySelectorAll<HTMLButtonElement>('.island__gb-room-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetRoom = SAMPLE_ROOMS.find(r => r.id !== currentRoomId);
      if (targetRoom && confirm(`${btn.title}?`)) _enterRoom(targetRoom);
    });
  });
}

// ── 방명록 전송 ──────────────────────────────────────────────────────────────

function _sendGuestbook(): void {
  const input = document.getElementById('guestbook-input') as HTMLInputElement | null;
  if (!input) return;
  const msg = input.value.trim();
  if (!msg) return;

  const newEntry = {
    id: 'new_' + Date.now(),
    name: '나',
    avatar: '😊',
    message: msg,
    time: '방금 전',
  };

  if (currentRoomId === null) {
    // 내 방 방명록에 추가
    myGuestbook = [newEntry, ...myGuestbook];
    _renderMyRoomVisitors();
    _renderGuestbook(myGuestbook, null);
  } else {
    // 방문 중인 방의 임시 표시 (실제로는 서버에 전송)
    const room = SAMPLE_ROOMS.find(r => r.id === currentRoomId);
    if (room) {
      const updated = [newEntry, ...room.guestbook];
      _renderGuestbook(updated, room);
    }
  }

  input.value = '';
  _showToast('방명록을 남겼어요! 💜');
}

// ── 상점 패널 초기화 ─────────────────────────────────────────────────────────

function _initShopPanel(): void {
  const panel = document.getElementById('panel-shop');
  if (!panel) return;
  panel.innerHTML = `
    <div class="island__shop-grid">
      ${DECO_ITEMS.map((d, i) => `
        <div class="island__shop-item">
          <img src="/island/${d.file}" alt="${d.name}" />
          <div class="island__shop-name">${d.name}</div>
          <div class="island__shop-price">${i < 3 ? '<span class="island__shop-owned">보유 중</span>' : `${(i + 1) * 200}P`}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function _selectPaletteItem(selected: HTMLButtonElement): void {
  document.querySelectorAll<HTMLButtonElement>('.island__tpick, .island__dpick').forEach(b => {
    b.classList.remove('island__pick--sel');
  });
  selected.classList.add('island__pick--sel');
}

function _setActiveMode(mode: IslandMode): void {
  document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(btn => {
    btn.classList.remove('island__mbtn--active');
  });
  const active = document.getElementById('ibtn-' + mode);
  active?.classList.add('island__mbtn--active');

  const palette = document.getElementById('island-palette');
  if (palette) palette.style.display = mode === 'deco' ? 'block' : 'none';

  const tip = document.getElementById('island-tip');
  if (tip) tip.textContent = TIPS[mode];
}

function _makeDragScroll(el: HTMLElement): void {
  let startX = 0;
  let scrollLeft = 0;
  let dragging = false;

  el.addEventListener('mousedown', (e) => {
    dragging = true;
    startX = e.pageX - el.offsetLeft;
    scrollLeft = el.scrollLeft;
    el.style.cursor = 'grabbing';
  });
  el.addEventListener('mouseleave', () => { dragging = false; el.style.cursor = ''; });
  el.addEventListener('mouseup',    () => { dragging = false; el.style.cursor = ''; });
  el.addEventListener('mousemove',  (e) => {
    if (!dragging) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    el.scrollLeft = scrollLeft - (x - startX);
  });

  let touchStartX = 0;
  let touchScrollLeft = 0;
  el.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0]!.pageX - el.offsetLeft;
    touchScrollLeft = el.scrollLeft;
  }, { passive: true });
  el.addEventListener('touchmove', (e) => {
    const x = e.touches[0]!.pageX - el.offsetLeft;
    el.scrollLeft = touchScrollLeft - (x - touchStartX);
  }, { passive: true });
}

let _toastTimer: ReturnType<typeof setTimeout> | null = null;
function _showToast(msg: string): void {
  const el = document.getElementById('island-toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('island__toast--show');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('island__toast--show'), 2200);
}
