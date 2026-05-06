// IslandEngine.ts — KiiKii Fan Island isometric canvas engine
// Ported from diy_land_simple.html (brown_farm_ground_edit reference)
import { asset } from '../utils.js';

// ── Constants ──────────────────────────────────────────────────────────────
const COLS = 10;
const ROWS = 10;
const TW = 96;   // tile width
const TH = 48;   // tile height (TW/2)
const BH = 26;   // block wall height
const PAD = 80;

export const CW = (COLS + ROWS) * (TW / 2) + PAD * 2;
export const CH = (COLS + ROWS) * (TH / 2) + BH + PAD * 2 + 30;

const LS_GRID_KEY = 'kiikii_island_grid';

// ── Types ──────────────────────────────────────────────────────────────────
export interface DecoItem {
  id: string;
  name: string;
  file: string;
}

export type WallType = 'left' | 'right' | 'corner';

export interface WallItem {
  id: WallType;
  name: string;
  file: string;
}

export interface GridCell {
  tile: TileType | null;
  deco: DecoItem | null;
  decoDir: 0 | 1;  // 0=normal, 1=horizontally flipped
  wall: WallType | null;
}

export type IslandMode = 'deco' | 'delete' | 'move';
export type TileType =
  | 'green' | 'pink' | 'white'
  | 'wood' | 'marble' | 'carpet_pink' | 'dark_wood';

type PaletteSelection =
  | { kind: 'tile'; tileType: TileType }
  | { kind: 'deco'; item: DecoItem }
  | { kind: 'wall'; wallType: WallType };

// ── Deco catalogue ─────────────────────────────────────────────────────────
export const DECO_ITEMS: DecoItem[] = [
  { id: 'bed',       name: '침대',   file: 'deco_bed.png' },
  { id: 'wardrobe',  name: '옷장',   file: 'deco_wardrobe.png' },
  { id: 'mirror',    name: '거울',   file: 'deco_mirror.png' },
  { id: 'sofa',      name: '소파',   file: 'deco_sofa.png' },
  { id: 'table',     name: '테이블', file: 'deco_table.png' },
  { id: 'rug',       name: '카펫',   file: 'deco_rug.png' },
  { id: 'lamp',      name: '조명',   file: 'deco_lamp.png' },
  { id: 'dresser',   name: '화장대', file: 'deco_dresser.png' },
  { id: 'bookshelf', name: '책장',   file: 'deco_bookshelf.png' },
];

// Keep legacy DECO export alias so existing callers don't break
export const DECO = DECO_ITEMS;

// ── Wall catalogue ──────────────────────────────────────────────────────────
export const WALL_ITEMS: WallItem[] = [
  { id: 'left',   name: '벽(좌)', file: 'tile_wall_left.png'   },
  { id: 'right',  name: '벽(우)', file: 'tile_wall_right.png'  },
  { id: 'corner', name: '코너',   file: 'tile_wall_corner.png' },
];

// ── Chibi walk path (grid cell indices, visits every 3 s) ──────────────────
const CHIBI_PATH: number[] = (() => {
  // Simple spiral-ish path visiting the center area of the 10x10 grid
  const path: number[] = [];
  const waypoints = [
    [4, 4], [4, 5], [5, 5], [5, 4], [5, 3], [4, 3], [3, 4], [3, 5],
    [3, 6], [4, 6], [5, 6], [6, 5], [6, 4], [6, 3], [5, 2], [4, 2],
  ];
  for (const [r, c] of waypoints) path.push(r * COLS + c);
  return path;
})();

// ── Helper: darken a hex color ─────────────────────────────────────────────
function lightenHex(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + amount);
  const g = Math.min(255, ((n >> 8)  & 0xff) + amount);
  const b = Math.min(255, ( n        & 0xff) + amount);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function darkenHex(hex: string, amount: number): string {
  return lightenHex(hex, -amount);
}

// ── Engine class ───────────────────────────────────────────────────────────
export class IslandEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly grid: GridCell[];
  private readonly oshiColor: string;
  private readonly oshiId: string;
  private chibiImg: HTMLImageElement | null = null;

  private mode: IslandMode = 'deco';
  private selection: PaletteSelection = { kind: 'tile', tileType: 'green' };
  private placingDir: 0 | 1 = 0;

  // Image cache
  private images: Map<string, HTMLImageElement> = new Map();

  // rAF handle
  private rafId: number | null = null;

  // Pointer state
  private isDragging = false;
  private lastActed = -1;
  private dragAction: 'place' | 'remove' | null = null;
  private panning = false;
  private panStart: { x: number; y: number } | null = null;

  // View-only mode (guestbook / shop tabs) — pan only, no tile placement
  private _viewOnly = false;
  private _voPanClient: { x: number; y: number } | null = null;

  // Move-mode state
  private moveFrom: number | null = null;
  private movingDeco: DecoItem | null = null;
  private ghostPx: { px: number; py: number } | null = null;
  private moveHoverIdx: number | null = null;

  // Chibi walk state (owner / my character)
  private chibiPathIdx = 0;
  private chibiLastStep = 0;
  private chibiCur: { col: number; row: number } = { col: 4, row: 4 };
  private chibiNext: { col: number; row: number } = { col: 4, row: 4 };
  private chibiLerp = 0; // 0..1 interpolation between cur and next

  // Visitor chibi (my character when visiting another room)
  private _visitImg: HTMLImageElement | null = null;
  private _visitPathIdx = 8; // halfway through path so two chars are apart
  private _visitLastStep = 0;
  private _visitCur: { col: number; row: number } = { col: 6, row: 3 };
  private _visitNext: { col: number; row: number } = { col: 6, row: 3 };
  private _visitLerp = 0;

  // Scene scroll element (passed in so we can center on start)
  private scene: HTMLElement | null = null;

  // ── Zoom / pan state ──────────────────────────────────────────────────────
  private scale: number = 1;
  private readonly MIN_SCALE = 0.5;
  private readonly MAX_SCALE = 2.5;
  private offsetX: number = 0;
  private offsetY: number = 0;

  // Pinch-to-zoom tracking
  private _pinchDist: number | null = null;
  private _pinchMid: { x: number; y: number } | null = null;

  // Owner greeting shown above chibi (canvas-drawn)
  private _greeting: { name: string; text: string } | null = null;

  // Callbacks
  onGridChange?: () => void;

  constructor(canvas: HTMLCanvasElement, oshiColor: string, oshiId: string = '', initialScale: number = 1) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context');
    this.ctx = ctx;
    this.oshiColor = oshiColor;
    this.oshiId = oshiId;
    // Apply initial scale clamped to valid range
    this.scale = Math.max(this.MIN_SCALE, Math.min(this.MAX_SCALE, initialScale));
    // Initialize all cells as empty
    this.grid = Array.from({ length: COLS * ROWS }, () => ({ tile: null, deco: null, decoDir: 0 as 0 | 1, wall: null }));

    canvas.width  = CW;
    canvas.height = CH;
    canvas.style.width  = CW + 'px';
    canvas.style.height = CH + 'px';

    this.load();
    this._bindEvents();
  }

  // ── Image preloading ──────────────────────────────────────────────────────

  async preloadImages(): Promise<void> {
    const toLoad = [
      'tile_green.png', 'tile_pink.png', 'tile_white.png', 'tile_base.png',
      'tile_wood.png', 'tile_marble.png', 'tile_carpet_pink.png', 'tile_dark_wood.png',
      ...WALL_ITEMS.map(w => w.file),
      ...DECO_ITEMS.map(d => d.file),
    ];
    const islandLoad = Promise.all(toLoad.map(file => new Promise<void>((resolve) => {
      const img = new Image();
      img.onload  = () => { this.images.set(file, img); resolve(); };
      img.onerror = () => resolve();
      img.src = asset(`island/${file}`);
    })));

    const chibiLoad = this.oshiId
      ? new Promise<void>((resolve) => {
          const img = new Image();
          img.onload  = () => { this.chibiImg = img; resolve(); };
          img.onerror = () => resolve();
          img.src = asset(`char_${this.oshiId}.png`);
        })
      : Promise.resolve();

    await Promise.all([islandLoad, chibiLoad]);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  setScene(scene: HTMLElement): void {
    this.scene = scene;
  }

  start(): void {
    if (this.rafId !== null) return;

    // Fix: CSS size must equal pixel size so getBoundingClientRect().width === canvas.width
    // (same fix as original diy_land_simple.html: cvs.style.width = CW + 'px')
    this.canvas.style.width  = CW + 'px';
    this.canvas.style.height = CH + 'px';

    // Center grid in the canvas on first start
    this._centerGrid();

    const loop = (t: number) => {
      this._drawAll(t);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);

    // Center scroll after first paint (legacy scene-scroll path kept for compat)
    requestAnimationFrame(() => {
      if (this.scene) {
        this.scene.scrollLeft = (CW - this.scene.clientWidth)  / 2;
        this.scene.scrollTop  = Math.max(0, (CH - this.scene.clientHeight) / 2 - 30);
      }
    });
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this._unbindEvents();
  }

  setMode(mode: IslandMode): void {
    this.mode = mode;
    // Cancel any in-progress move
    if (this.movingDeco && this.moveFrom !== null) {
      this.movingDeco = null;
      this.moveFrom   = null;
    }
    this.canvas.style.cursor = 'pointer';
  }

  selectTile(type: TileType): void {
    this.selection = { kind: 'tile', tileType: type };
  }

  toggleDir(): 0 | 1 {
    this.placingDir = this.placingDir === 0 ? 1 : 0;
    return this.placingDir;
  }

  getDir(): 0 | 1 { return this.placingDir; }

  selectDeco(id: string): void {
    const found = DECO_ITEMS.find(d => d.id === id);
    if (found) this.selection = { kind: 'deco', item: found };
  }

  /** @deprecated Use selectTile() instead */
  setTileType(type: TileType): void {
    this.selectTile(type);
  }

  getSelection(): PaletteSelection {
    return this.selection;
  }

  /** Returns the currently selected tile type if the selection is a tile, else null */
  getTileType(): TileType | null {
    return this.selection.kind === 'tile' ? this.selection.tileType : null;
  }

  /** Returns the currently selected deco id if selection is deco, else null */
  getSelDecoId(): string | null {
    return this.selection.kind === 'deco' ? this.selection.item.id : null;
  }

  selectWall(type: WallType): void {
    this.selection = { kind: 'wall', wallType: type };
  }

  getSelWallType(): WallType | null {
    return this.selection.kind === 'wall' ? this.selection.wallType : null;
  }

  save(): void {
    const data = this.grid.map(cell => ({
      tile:    cell.tile ?? null,
      deco:    cell.deco?.id ?? null,
      decoDir: cell.decoDir ?? 0,
      wall:    cell.wall ?? null,
    }));
    localStorage.setItem(LS_GRID_KEY, JSON.stringify(data));
  }

  load(): void {
    try {
      const raw = localStorage.getItem(LS_GRID_KEY);
      if (raw) {
        const data = JSON.parse(raw) as ({ tile: string | null; deco: string | null } | string | null)[];
        data.forEach((entry, i) => {
          if (i >= this.grid.length) return;
          // Support legacy format (plain string id or null)
          if (entry === null || typeof entry === 'string') {
            // Old format: entry was a deco id string or null
            // Migrate: treat as green tile + deco if there was a deco
            if (typeof entry === 'string') {
              this.grid[i]!.tile = 'green';
              this.grid[i]!.deco = DECO_ITEMS.find(d => d.id === entry) ?? null;
            }
          } else {
            const tileTypes: TileType[] = ['green', 'pink', 'white', 'wood', 'marble', 'carpet_pink', 'dark_wood'];
            const wallTypes: WallType[] = ['left', 'right', 'corner'];
            this.grid[i]!.tile = (entry.tile && tileTypes.includes(entry.tile as TileType))
              ? (entry.tile as TileType)
              : null;
            this.grid[i]!.deco = entry.deco
              ? (DECO_ITEMS.find(d => d.id === entry.deco) ?? null)
              : null;
            this.grid[i]!.decoDir = (entry as any).decoDir === 1 ? 1 : 0;
            this.grid[i]!.wall = ((entry as any).wall && wallTypes.includes((entry as any).wall))
              ? (entry as any).wall as WallType
              : null;
          }
        });
      }
    } catch {
      // ignore corrupt data
    }
  }

  getPlacedCount(): number {
    return this.grid.filter(cell => cell.deco !== null).length;
  }

  getMode(): IslandMode {
    return this.mode;
  }

  /** Swap the chibi character image — used when visiting another room */
  async changeChibi(newOshiId: string): Promise<void> {
    if (!newOshiId) { this.chibiImg = null; return; }
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload  = () => { this.chibiImg = img; resolve(); };
      img.onerror = () => { this.chibiImg = null; resolve(); };
      img.src = asset(`char_${newOshiId}.png`);
    });
  }

  /** Set the visitor chibi (my character shown when visiting someone else's room). Pass null to hide. */
  async setVisitorChibi(oshiId: string | null): Promise<void> {
    if (!oshiId) { this._visitImg = null; return; }
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload  = () => { this._visitImg = img; resolve(); };
      img.onerror = () => { this._visitImg = null; resolve(); };
      img.src = asset(`char_${oshiId}.png`);
    });
  }

  /** Load a preset without touching localStorage — used when visiting another room */
  loadPresetTemp(preset: Array<{
    row: number; col: number;
    tile?: TileType; wall?: WallType;
    deco?: string; decoDir?: 0 | 1;
  }>): void {
    this.grid.forEach(cell => { cell.tile = null; cell.deco = null; cell.decoDir = 0; cell.wall = null; });
    this.loadPreset(preset);
  }

  /** Set greeting bubble drawn above chibi. Pass null to clear. */
  setGreeting(g: { name: string; text: string } | null): void {
    this._greeting = g;
  }

  /** When true: all pointer interactions pan via offsetX/offsetY (no tile drawing) */
  setViewOnly(on: boolean): void {
    this._viewOnly = on;
    this.isDragging = false;
    this.panning = false;
    this.panStart = null;
    this._voPanClient = null;
  }

  /** Restore from localStorage (used when returning to own room) */
  reloadFromStorage(): void {
    this.grid.forEach(cell => { cell.tile = null; cell.deco = null; cell.decoDir = 0; cell.wall = null; });
    this.load();
  }

  loadPreset(preset: Array<{
    row: number; col: number;
    tile?: TileType; wall?: WallType;
    deco?: string; decoDir?: 0 | 1;
  }>): void {
    // Pass 1: tiles + walls
    for (const { row, col, tile, wall } of preset) {
      const i = row * COLS + col;
      if (i < 0 || i >= this.grid.length) continue;
      const cell = this.grid[i]!;
      if (tile !== undefined) cell.tile = tile;
      if (wall !== undefined) cell.wall = wall;
    }
    // Pass 2: decos (requires tile already set)
    for (const { row, col, deco, decoDir } of preset) {
      if (!deco) continue;
      const i = row * COLS + col;
      if (i < 0 || i >= this.grid.length) continue;
      const cell = this.grid[i]!;
      if (cell.tile === null) continue;
      cell.deco    = DECO_ITEMS.find(d => d.id === deco) ?? null;
      cell.decoDir = decoDir ?? 0;
    }
  }

  /** @deprecated use getSelection() */
  getSelDeco(): DecoItem {
    if (this.selection.kind === 'deco') return this.selection.item;
    return DECO_ITEMS[0]!;
  }

  // ── Zoom helpers ──────────────────────────────────────────────────────────

  private _centerGrid(): void {
    // offsetX/Y must be in canvas pixel space (canvas.width, not clientWidth)
    this.offsetX = (this.canvas.width  - CW * this.scale) / 2;
    this.offsetY = (this.canvas.height - CH * this.scale) / 2;
  }

  private _zoomAround(cx: number, cy: number, factor: number): void {
    const newScale = Math.max(this.MIN_SCALE, Math.min(this.MAX_SCALE, this.scale * factor));
    const actualFactor = newScale / this.scale;
    this.offsetX = cx - actualFactor * (cx - this.offsetX);
    this.offsetY = cy - actualFactor * (cy - this.offsetY);
    this.scale = newScale;
  }

  // ── Coordinate helpers ────────────────────────────────────────────────────

  private _isoXY(col: number, row: number): { x: number; y: number } {
    const ox = PAD + ROWS * (TW / 2);
    const oy = PAD;
    return {
      x: ox + (col - row) * (TW / 2) - TW / 2,
      y: oy + (col + row) * (TH / 2),
    };
  }

  // ── Path helpers (kept for hit-test highlights & chibi) ───────────────────

  private _pathTop(x: number, y: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + TW / 2, y);
    this.ctx.lineTo(x + TW,     y + TH / 2);
    this.ctx.lineTo(x + TW / 2, y + TH);
    this.ctx.lineTo(x,           y + TH / 2);
    this.ctx.closePath();
  }

  // ── Renderers ─────────────────────────────────────────────────────────────

  private _drawTile(x: number, y: number, tileType: TileType): void {
    const tileFile = `tile_${tileType}.png`;
    const img = this.images.get(tileFile);
    if (img) {
      const drawW = TW;
      const drawH = Math.round(drawW * img.naturalHeight / img.naturalWidth);
      const wallH = drawH - TH;
      // Lighten the plain wood tile so it reads as a pale oak floor
      if (tileType === 'wood') this.ctx.filter = 'brightness(1.5) saturate(0.75)';
      this.ctx.drawImage(img, x, y - wallH, drawW, drawH);
      if (tileType === 'wood') this.ctx.filter = 'none';
    } else {
      this._drawGroundFallback(x, y);
    }
  }

  private _drawWall(x: number, y: number, wallType: WallType): void {
    const item = WALL_ITEMS.find(w => w.id === wallType);
    if (!item) return;
    const img = this.images.get(item.file);
    if (!img) return;
    const drawW = TW;
    const drawH = Math.round(drawW * img.naturalHeight / img.naturalWidth);
    const wallH = drawH - TH;
    this.ctx.drawImage(img, x, y - wallH, drawW, drawH);
  }

  private _drawEmpty(x: number, y: number): void {
    // Draw faint diamond outline so user can see placement grid
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + TW / 2, y);
    ctx.lineTo(x + TW,     y + TH / 2);
    ctx.lineTo(x + TW / 2, y + TH);
    ctx.lineTo(x,          y + TH / 2);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(155, 127, 232, 0.2)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  private _drawGroundFallback(x: number, y: number): void {
    const ctx = this.ctx;
    // Left wall
    ctx.beginPath();
    ctx.moveTo(x,           y + TH / 2);
    ctx.lineTo(x + TW / 2,  y + TH);
    ctx.lineTo(x + TW / 2,  y + TH + 5);
    ctx.lineTo(x,           y + TH / 2 + 5);
    ctx.closePath();
    ctx.fillStyle = '#aaa'; ctx.fill();
    // Right wall
    ctx.beginPath();
    ctx.moveTo(x + TW,      y + TH / 2);
    ctx.lineTo(x + TW / 2,  y + TH);
    ctx.lineTo(x + TW / 2,  y + TH + 5);
    ctx.lineTo(x + TW,      y + TH / 2 + 5);
    ctx.closePath();
    ctx.fillStyle = '#ccc'; ctx.fill();
    // Top face
    ctx.beginPath();
    ctx.moveTo(x + TW / 2, y);
    ctx.lineTo(x + TW,     y + TH / 2);
    ctx.lineTo(x + TW / 2, y + TH);
    ctx.lineTo(x,           y + TH / 2);
    ctx.closePath();
    ctx.fillStyle = '#e8e8e8'; ctx.fill();
  }

  private _drawDeco(x: number, y: number, d: DecoItem, dir: 0 | 1 = 0): void {
    const img = this.images.get(d.file);
    if (img) {
      const itemW = TW;
      const itemH = itemW * (img.naturalHeight / img.naturalWidth);
      const iy = y + TH / 2 - itemH;
      const cx = x + TW / 2;  // tile center x
      if (dir === 1) {
        this.ctx.save();
        this.ctx.translate(cx, 0);
        this.ctx.scale(-1, 1);
        this.ctx.drawImage(img, -itemW / 2, iy, itemW, itemH);
        this.ctx.restore();
      } else {
        this.ctx.drawImage(img, cx - itemW / 2, iy, itemW, itemH);
      }
    } else {
      this._drawDecoFallback(x, y, d);
    }
  }

  private _drawDecoFallback(x: number, y: number, d: DecoItem): void {
    const ctx = this.ctx;
    ctx.font = `${Math.round(TW * 0.33)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.name.slice(0, 1), x + TW / 2, y + TH / 2);
  }

  private _drawDecoGhost(px: number, py: number, d: DecoItem): void {
    const img = this.images.get(d.file);
    if (img) {
      const itemW = TW * 1.4;
      const itemH = itemW * (img.naturalHeight / img.naturalWidth);
      const ix = px - itemW / 2;
      const iy = py - itemH / 2;
      this.ctx.drawImage(img, ix, iy, itemW, itemH);
    }
  }

  private _drawChibi(t: number): void {
    // Advance walk every 3 s
    if (t - this.chibiLastStep > 3000) {
      this.chibiLastStep = t;
      this.chibiCur  = { ...this.chibiNext };
      this.chibiPathIdx = (this.chibiPathIdx + 1) % CHIBI_PATH.length;
      const nextIdx = CHIBI_PATH[this.chibiPathIdx]!;
      this.chibiNext = {
        row: Math.floor(nextIdx / COLS),
        col: nextIdx % COLS,
      };
      this.chibiLerp = 0;
    }

    // Interpolate between cur and next
    this.chibiLerp = Math.min(1, this.chibiLerp + 0.016);
    const lerp = (a: number, b: number, t2: number) => a + (b - a) * t2;

    const curXY  = this._isoXY(this.chibiCur.col,  this.chibiCur.row);
    const nextXY = this._isoXY(this.chibiNext.col, this.chibiNext.row);

    const screenX = lerp(curXY.x,  nextXY.x,  this.chibiLerp) + TW / 2;
    const screenY = lerp(curXY.y,  nextXY.y,  this.chibiLerp) + TH / 2;

    // Bob
    const bob = Math.sin(t / 800) * 3;

    const ctx = this.ctx;

    if (this.chibiImg) {
      // Draw actual character image
      const drawH = 90;
      const drawW = Math.round(drawH * this.chibiImg.naturalWidth / this.chibiImg.naturalHeight);
      const dx = screenX - drawW / 2;
      const dy = screenY - drawH - BH + bob;
      ctx.drawImage(this.chibiImg, dx, dy, drawW, drawH);
    } else {
      // Fallback: colored circle placeholder
      const r = 18;
      const cy = screenY - r * 1.5 - BH + bob;
      ctx.beginPath();
      ctx.arc(screenX, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = this.oshiColor;
      ctx.fill();
      ctx.strokeStyle = darkenHex(this.oshiColor, 30);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  private _drawVisitorChibi(t: number): void {
    if (!this._visitImg) return;

    // Advance visitor walk every 3.5 s (slightly different cadence from owner)
    if (t - this._visitLastStep > 3500) {
      this._visitLastStep = t;
      this._visitCur  = { ...this._visitNext };
      this._visitPathIdx = (this._visitPathIdx + 1) % CHIBI_PATH.length;
      const nextIdx = CHIBI_PATH[this._visitPathIdx]!;
      this._visitNext = { row: Math.floor(nextIdx / COLS), col: nextIdx % COLS };
      this._visitLerp = 0;
    }
    this._visitLerp = Math.min(1, this._visitLerp + 0.016);

    const lp = (a: number, b: number, t2: number) => a + (b - a) * t2;
    const curXY  = this._isoXY(this._visitCur.col,  this._visitCur.row);
    const nextXY = this._isoXY(this._visitNext.col, this._visitNext.row);
    const screenX = lp(curXY.x, nextXY.x, this._visitLerp) + TW / 2;
    const screenY = lp(curXY.y, nextXY.y, this._visitLerp) + TH / 2;
    const bob = Math.sin(t / 750 + Math.PI) * 3; // phase-shifted bob

    const ctx = this.ctx;
    const drawH = 90;
    const drawW = Math.round(drawH * this._visitImg.naturalWidth / this._visitImg.naturalHeight);
    ctx.drawImage(this._visitImg, screenX - drawW / 2, screenY - drawH - BH + bob, drawW, drawH);
  }

  private _drawGreeting(): void {
    if (!this._greeting) return;
    const lp = (a: number, b: number, t: number) => a + (b - a) * t;
    const curXY  = this._isoXY(this.chibiCur.col,  this.chibiCur.row);
    const nextXY = this._isoXY(this.chibiNext.col, this.chibiNext.row);
    const cx = lp(curXY.x, nextXY.x, this.chibiLerp) + TW / 2;
    const cy = lp(curXY.y, nextXY.y, this.chibiLerp) + TH / 2 - 90 - BH - 18;

    const { name, text } = this._greeting;
    const ctx = this.ctx;
    const bw = 180, bh = 50, br = 10;
    const bx = cx - bw / 2;
    const by = cy - bh;

    // Bubble shape with tail pointing down toward chibi head
    ctx.beginPath();
    ctx.moveTo(bx + br, by);
    ctx.arcTo(bx + bw, by,     bx + bw, by + bh, br);
    ctx.arcTo(bx + bw, by + bh, bx,     by + bh, br);
    ctx.lineTo(cx + 7, by + bh);
    ctx.lineTo(cx,     by + bh + 9);
    ctx.lineTo(cx - 7, by + bh);
    ctx.arcTo(bx, by + bh, bx, by, br);
    ctx.arcTo(bx, by,     bx + bw, by, br);
    ctx.closePath();
    ctx.fillStyle   = 'rgba(255,255,255,0.97)';
    ctx.fill();
    ctx.strokeStyle = '#c5b5f0';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Name (purple, small)
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.font         = 'bold 10px sans-serif';
    ctx.fillStyle    = '#9b7fe8';
    ctx.fillText(name, cx, by + 8);

    // Message text (wrap at bw-20)
    ctx.font      = '11px sans-serif';
    ctx.fillStyle = '#2c1e4a';
    const words = text.split(' ');
    let line = '';
    let lineY = by + 22;
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > bw - 20 && line) {
        ctx.fillText(line, cx, lineY);
        line  = word;
        lineY += 14;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, cx, lineY);

    ctx.textAlign    = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  // ── Main draw ──────────────────────────────────────────────────────────────

  private _drawAll(t: number): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CW, CH);

    // Apply zoom + pan transform for all world-space drawing
    ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);

    // Build painter's order (top-left → bottom-right)
    const order: { c: number; r: number; i: number }[] = [];
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        order.push({ c, r, i: r * COLS + c });
    order.sort((a, b) => (a.r + a.c) - (b.r + b.c));

    // Pass 1: all floors
    for (const { c, r, i } of order) {
      const { x, y } = this._isoXY(c, r);
      const cell = this.grid[i]!;
      if (cell.tile !== null) {
        this._drawTile(x, y, cell.tile);
      } else {
        this._drawEmpty(x, y);
      }
    }

    // Pass 2: all walls (guaranteed above every floor tile)
    for (const { c, r, i } of order) {
      const cell = this.grid[i]!;
      if (cell.wall !== null) {
        const { x, y } = this._isoXY(c, r);
        this._drawWall(x, y, cell.wall);
      }
    }

    // Pass 3: decos + move highlights
    for (const { c, r, i } of order) {
      const { x, y } = this._isoXY(c, r);
      const cell = this.grid[i]!;
      const isMovingFrom = i === this.moveFrom;

      if (cell.tile !== null && cell.deco !== null && !isMovingFrom) {
        if (this.mode === 'move' && i === this.moveHoverIdx && this.movingDeco) {
          ctx.globalAlpha = 0.35;
          this._drawDeco(x, y, cell.deco, cell.decoDir);
          ctx.globalAlpha = 1;
        } else {
          this._drawDeco(x, y, cell.deco, cell.decoDir);
        }
      }

      // Drop-target highlight in move mode
      if (this.mode === 'move' && this.movingDeco && i === this.moveHoverIdx) {
        this._pathTop(x, y);
        ctx.fillStyle = 'rgba(100,220,120,0.28)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(60,180,80,0.7)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // Ghost tile while dragging in move mode
    if (this.mode === 'move' && this.movingDeco && this.ghostPx) {
      ctx.globalAlpha = 0.65;
      this._drawDecoGhost(this.ghostPx.px, this.ghostPx.py, this.movingDeco);
      ctx.globalAlpha = 1;
    }

    // Chibi characters + greeting bubble (world space, same transform)
    this._drawChibi(t);
    this._drawVisitorChibi(t);
    this._drawGreeting();

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Unused timestamp shimmer suppressed — keep t param for chibi
    void t;
  }

  // ── Hit testing ───────────────────────────────────────────────────────────

  private _pickCell(px: number, py: number): number | null {
    // Direct inverse isometric transform from _isoXY:
    //   cx_anchor = ox + (col - row) * (TW/2)  →  col - row = (px - ox) / (TW/2)
    //   y_anchor  = oy + (col + row) * (TH/2)  →  col + row = (py - oy) / (TH/2)
    const ox = PAD + ROWS * (TW / 2);
    const oy = PAD;
    const u = (px - ox) / (TW / 2);

    const tryPick = (qy: number) => {
      const v = (qy - oy) / (TH / 2);
      const col = Math.floor((u + v) / 2);
      const row = Math.floor((v - u) / 2);
      if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
      return row * COLS + col;
    };

    // First try exact position; if null (click in tile's wall region above diamond),
    // shift down by ~wall height so wall clicks map to the tile below.
    return tryPick(py) ?? tryPick(py + 16);
  }

  // ── Event coordinate helper ────────────────────────────────────────────────

  private _evPt(e: MouseEvent | TouchEvent): { px: number; py: number } {
    const rect  = this.canvas.getBoundingClientRect();
    const src   = 'touches' in e ? e.touches[0]! : e;
    // CSS pixels → canvas pixels, then undo setTransform(scale, offsetX, offsetY)
    const scaleX = this.canvas.width  / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      px: ((src.clientX - rect.left) * scaleX - this.offsetX) / this.scale,
      py: ((src.clientY - rect.top)  * scaleY - this.offsetY) / this.scale,
    };
  }

  // ── Pinch distance helper ─────────────────────────────────────────────────

  private _pinchInfo(e: TouchEvent): { dist: number; midX: number; midY: number } | null {
    if (e.touches.length < 2) return null;
    const t0 = e.touches[0]!;
    const t1 = e.touches[1]!;
    const rect   = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width  / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const dx = t1.clientX - t0.clientX;
    const dy = t1.clientY - t0.clientY;
    return {
      dist: Math.sqrt(dx * dx + dy * dy),
      // midX/midY in canvas pixel space
      midX: ((t0.clientX + t1.clientX) / 2 - rect.left) * scaleX,
      midY: ((t0.clientY + t1.clientY) / 2 - rect.top)  * scaleY,
    };
  }

  // ── Game logic ────────────────────────────────────────────────────────────

  private _act(i: number): void {
    this.lastActed = i;
    const cell = this.grid[i]!;

    if (this.mode === 'deco') {
      if (this.selection.kind === 'tile') {
        if (this.dragAction === 'remove') {
          if (cell.tile !== null) { cell.tile = null; cell.deco = null; }
        } else {
          cell.tile = this.selection.tileType;
        }
        this.onGridChange?.();
      } else if (this.selection.kind === 'wall') {
        // Toggle: same type removes, different type replaces
        cell.wall = (cell.wall === this.selection.wallType) ? null : this.selection.wallType;
        this.onGridChange?.();
      } else {
        // Deco placement: requires a tile, cell must be empty
        if (cell.tile === null) return;
        if (cell.deco !== null) return;
        cell.deco    = { ...this.selection.item };
        cell.decoDir = this.placingDir;
        this.onGridChange?.();
      }
    } else if (this.mode === 'delete') {
      // Delete order: wall → deco → tile
      if (cell.wall !== null) {
        cell.wall = null;
        this.onGridChange?.();
      } else if (cell.deco !== null) {
        cell.deco = null;
        this.onGridChange?.();
      } else if (cell.tile !== null) {
        cell.tile = null;
        this.onGridChange?.();
      }
    }
  }

  private _dropMove(target: number | null): void {
    if (target === null || target === this.moveFrom) {
      this.moveFrom   = null;
      this.movingDeco = null;
      return;
    }
    const targetCell = this.grid[target]!;
    const fromCell   = this.grid[this.moveFrom!]!;

    if (targetCell.deco !== null) {
      // Swap decos between cells (both must have tiles; if target has no tile, cancel)
      const tmp = targetCell.deco;
      targetCell.deco = this.movingDeco;
      fromCell.deco   = tmp;
    } else if (targetCell.tile !== null) {
      // Drop onto an empty-deco tiled cell
      targetCell.deco = this.movingDeco;
      fromCell.deco   = null;
    } else {
      // Target has no tile — can't place deco here, cancel
      fromCell.deco   = this.movingDeco;
    }

    this.moveFrom   = null;
    this.movingDeco = null;
    this.onGridChange?.();
  }

  // ── Event bindings ────────────────────────────────────────────────────────

  // Bound handlers (stored for removeEventListener)
  private _onMouseDown = (e: MouseEvent) => {
    if (this._viewOnly) {
      this.panning = true;
      this._voPanClient = { x: e.clientX, y: e.clientY };
      return;
    }

    const { px, py } = this._evPt(e);
    const i = this._pickCell(px, py);

    if (this.mode === 'move') {
      if (i !== null && this.grid[i]!.deco !== null) {
        this.isDragging = true;
        this.moveFrom   = i;
        this.movingDeco = { ...this.grid[i]!.deco! };
        this.ghostPx    = { px, py };
        this.canvas.style.cursor = 'grabbing';
      } else {
        this.panning  = true;
        this.panStart = {
          x: e.clientX + (this.scene?.scrollLeft ?? 0),
          y: e.clientY + (this.scene?.scrollTop  ?? 0),
        };
      }
      return;
    }

    if (i !== null) {
      const cell = this.grid[i]!;
      this.dragAction = (this.selection.kind === 'tile' && cell.tile === this.selection.tileType)
        ? 'remove' : 'place';
      this.isDragging = true;
      this.lastActed  = -1;
      this._act(i);
    } else {
      this.panning  = true;
      this.panStart = {
        x: e.clientX + (this.scene?.scrollLeft ?? 0),
        y: e.clientY + (this.scene?.scrollTop  ?? 0),
      };
    }
  };

  private _onMouseMove = (e: MouseEvent) => {
    if (this._viewOnly && this.panning && this._voPanClient) {
      const rect = this.canvas.getBoundingClientRect();
      const sx = this.canvas.width  / rect.width;
      const sy = this.canvas.height / rect.height;
      this.offsetX += (e.clientX - this._voPanClient.x) * sx;
      this.offsetY += (e.clientY - this._voPanClient.y) * sy;
      this._voPanClient = { x: e.clientX, y: e.clientY };
      return;
    }
    if (this.panning && this.panStart && this.scene) {
      this.scene.scrollLeft = this.panStart.x - e.clientX;
      this.scene.scrollTop  = this.panStart.y - e.clientY;
      return;
    }
    if (this.mode === 'move' && this.isDragging && this.movingDeco) {
      const { px, py } = this._evPt(e);
      this.ghostPx      = { px, py };
      this.moveHoverIdx = this._pickCell(px, py);
      return;
    }
    if (!this.isDragging) return;
    const { px, py } = this._evPt(e);
    const i = this._pickCell(px, py);
    if (i !== null && i !== this.lastActed) this._act(i);
  };

  private _onMouseUp = (e: MouseEvent) => {
    if (this._viewOnly) {
      this.panning = false;
      this._voPanClient = null;
      return;
    }
    if (this.mode === 'move' && this.isDragging && this.movingDeco) {
      const { px, py } = this._evPt(e);
      this._dropMove(this._pickCell(px, py));
    }
    this.isDragging   = false;
    this.dragAction   = null;
    this.panning      = false;
    this.panStart     = null;
    this.moveHoverIdx = null;
    this.ghostPx      = null;
    this.canvas.style.cursor = 'pointer';
  };

  private _onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const cx = e.offsetX * (this.canvas.width  / rect.width);
    const cy = e.offsetY * (this.canvas.height / rect.height);
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    this._zoomAround(cx, cy, factor);
  };

  private _onTouchStart = (e: TouchEvent) => {
    e.preventDefault();

    // Two-finger pinch/pan start
    if (e.touches.length === 2) {
      const info = this._pinchInfo(e);
      if (info) {
        this._pinchDist = info.dist;
        this._pinchMid  = { x: info.midX, y: info.midY };
      }
      // Cancel any single-finger drag in progress
      this.isDragging = false;
      this.panning    = false;
      return;
    }

    if (this._viewOnly) {
      this.panning = true;
      const touch = e.touches[0]!;
      this._voPanClient = { x: touch.clientX, y: touch.clientY };
      return;
    }

    const { px, py } = this._evPt(e);
    const i = this._pickCell(px, py);

    if (this.mode === 'move') {
      if (i !== null && this.grid[i]!.deco !== null) {
        this.isDragging = true;
        this.moveFrom   = i;
        this.movingDeco = { ...this.grid[i]!.deco! };
        this.ghostPx    = { px, py };
      }
      return;
    }
    if (i !== null) {
      const cell = this.grid[i]!;
      this.dragAction = (this.selection.kind === 'tile' && cell.tile === this.selection.tileType)
        ? 'remove' : 'place';
    }
    this.isDragging = true;
    this.lastActed  = -1;
    if (i !== null) this._act(i);
  };

  private _onTouchMove = (e: TouchEvent) => {
    e.preventDefault();

    // Two-finger pinch + pan
    if (e.touches.length === 2) {
      const info = this._pinchInfo(e);
      if (info && this._pinchDist !== null && this._pinchMid !== null) {
        // Zoom around pinch midpoint
        const factor = info.dist / this._pinchDist;
        this._zoomAround(this._pinchMid.x, this._pinchMid.y, factor);

        // Pan by midpoint delta
        const dx = info.midX - this._pinchMid.x;
        const dy = info.midY - this._pinchMid.y;
        this.offsetX += dx;
        this.offsetY += dy;

        // Update tracking values
        this._pinchDist = info.dist;
        this._pinchMid  = { x: info.midX, y: info.midY };
      }
      return;
    }

    if (this._viewOnly && this.panning && this._voPanClient) {
      const touch = e.touches[0]!;
      const rect = this.canvas.getBoundingClientRect();
      const sx = this.canvas.width  / rect.width;
      const sy = this.canvas.height / rect.height;
      this.offsetX += (touch.clientX - this._voPanClient.x) * sx;
      this.offsetY += (touch.clientY - this._voPanClient.y) * sy;
      this._voPanClient = { x: touch.clientX, y: touch.clientY };
      return;
    }

    if (!this.isDragging) return;
    const { px, py } = this._evPt(e);

    if (this.mode === 'move' && this.movingDeco) {
      this.ghostPx      = { px, py };
      this.moveHoverIdx = this._pickCell(px, py);
      return;
    }
    const i = this._pickCell(px, py);
    if (i !== null && i !== this.lastActed) this._act(i);
  };

  private _onTouchEnd = (e: TouchEvent) => {
    // Clear pinch state when fingers lift
    if (e.touches.length < 2) {
      this._pinchDist = null;
      this._pinchMid  = null;
    }

    if (this._viewOnly) {
      this.panning = false;
      this._voPanClient = null;
      return;
    }

    if (this.mode === 'move' && this.isDragging && this.movingDeco) {
      const touch = e.changedTouches[0]!;
      const rect  = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width  / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const px = ((touch.clientX - rect.left) * scaleX - this.offsetX) / this.scale;
      const py = ((touch.clientY - rect.top)  * scaleY - this.offsetY) / this.scale;
      this._dropMove(this._pickCell(px, py));
    }
    this.isDragging   = false;
    this.dragAction   = null;
    this.moveHoverIdx = null;
    this.ghostPx      = null;
  };

  // Window-level handlers (for mouse-up outside canvas)
  private _onWindowMouseUp   = (e: MouseEvent)   => this._onMouseUp(e);
  private _onWindowTouchEnd  = (e: TouchEvent)   => this._onTouchEnd(e);

  private _bindEvents(): void {
    const cvs = this.canvas;
    cvs.addEventListener('mousedown',  this._onMouseDown);
    cvs.addEventListener('mousemove',  this._onMouseMove);
    cvs.addEventListener('wheel',      this._onWheel, { passive: false });
    cvs.addEventListener('touchstart', this._onTouchStart, { passive: false });
    cvs.addEventListener('touchmove',  this._onTouchMove,  { passive: false });
    window.addEventListener('mouseup',   this._onWindowMouseUp);
    window.addEventListener('touchend',  this._onWindowTouchEnd);
  }

  private _unbindEvents(): void {
    const cvs = this.canvas;
    cvs.removeEventListener('mousedown',  this._onMouseDown);
    cvs.removeEventListener('mousemove',  this._onMouseMove);
    cvs.removeEventListener('wheel',      this._onWheel);
    cvs.removeEventListener('touchstart', this._onTouchStart);
    cvs.removeEventListener('touchmove',  this._onTouchMove);
    window.removeEventListener('mouseup',  this._onWindowMouseUp);
    window.removeEventListener('touchend', this._onWindowTouchEnd);
  }
}
