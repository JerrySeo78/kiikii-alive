import {
  OFFICIAL_POSTS, INITIAL_FAN_POSTS, MEMBER_CHAT_STREAM, FAN_CHAT_STREAM,
  type PlazaPost,
} from '../data/plaza.js';
import { getOshi } from '../state.js';
import { asset } from '../utils.js';

// ── Module state ──────────────────────────────────────────────────────────────
let fanPosts: PlazaPost[] = [...INITIAL_FAN_POSTS];
const likeCounts: Record<string, number> = Object.fromEntries(
  OFFICIAL_POSTS.map(p => [p.id, p.likes])
);
const likedSet: Set<string> = new Set();

let memberStreamIdx = 0;
let fanStreamIdx    = 0;
let memberTimer: ReturnType<typeof setInterval> | null = null;
let fanTimer:    ReturnType<typeof setInterval> | null = null;

function clearTimers(): void {
  if (memberTimer !== null) { clearInterval(memberTimer); memberTimer = null; }
  if (fanTimer    !== null) { clearInterval(fanTimer);    fanTimer    = null; }
}

// ── Main render ───────────────────────────────────────────────────────────────
export function renderPlaza(): void {
  const container = document.getElementById('screen-container');
  if (!container) return;

  clearTimers();

  container.innerHTML = `
    <div class="screen screen--plaza">

      <!-- KiiKii Chat (upper) -->
      <div class="plaza__member-channel">
        <button class="plaza__channel-header" id="plaza-kiikii-open">
          <span class="plaza__channel-label">KiiKii Chat</span>
          <span class="plaza__channel-more">전체보기 ›</span>
        </button>
        <div class="plaza__member-list" id="plaza-member-list">
          ${OFFICIAL_POSTS.map(renderMemberMsg).join('')}
        </div>
      </div>

      <!-- 팬 Chat header -->
      <button class="plaza__channel-divider" id="plaza-fan-open">
        <span class="plaza__channel-label">팬 Chat</span>
        <span class="plaza__channel-more">전체보기 ›</span>
      </button>

      <!-- 팬 Chat (scrollable) -->
      <div class="plaza__fan-channel" id="plaza-fan-channel">
        ${fanPosts.map(renderFanMsg).join('')}
      </div>

      <!-- Compose bar -->
      <div class="plaza__compose">
        <div class="plaza__compose-inner">
          <span class="plaza__compose-avatar">${getAuthorAvatar()}</span>
          <input
            id="plaza-input"
            class="plaza__compose-input"
            type="text"
            placeholder="채팅을 입력하세요…"
            maxlength="140"
          />
          <button id="plaza-post-btn" class="plaza__compose-btn">전송</button>
        </div>
      </div>

    </div>
  `;

  const fanChannel = document.getElementById('plaza-fan-channel');
  if (fanChannel) fanChannel.scrollTop = fanChannel.scrollHeight;

  _bindLikeButtons(document);
  _bindCompose();

  document.getElementById('plaza-kiikii-open')?.addEventListener('click', () => openOverlay('kiikii'));
  document.getElementById('plaza-fan-open')?.addEventListener('click', () => openOverlay('fan'));

  // ── Live simulation ──
  memberTimer = setInterval(_tickMember, 5000);
  fanTimer    = setInterval(_tickFan,    2000);
}

// ── Live ticks ────────────────────────────────────────────────────────────────

function _tickMember(): void {
  const entry = MEMBER_CHAT_STREAM[memberStreamIdx % MEMBER_CHAT_STREAM.length]!;
  memberStreamIdx++;

  const post: PlazaPost = {
    ...entry,
    id:        `live_m_${Date.now()}`,
    timestamp: '방금 전',
    likes:     0,
  };
  likeCounts[post.id] = 0;

  // Append to main list (keep max 20 visible)
  const list    = document.getElementById('plaza-member-list');
  const channel = document.querySelector<HTMLElement>('.plaza__member-channel');
  if (list) {
    const el = document.createElement('div');
    el.innerHTML = renderMemberMsg(post);
    const msgEl = el.firstElementChild as HTMLElement | null;
    if (msgEl) {
      msgEl.classList.add('plaza__member-msg--new');
      list.appendChild(msgEl);
      _bindLikeButtons(msgEl);
      if (list.children.length > 20) list.removeChild(list.children[0]!);
      // Scroll the overflow container, not the list itself
      if (channel) requestAnimationFrame(() => { channel.scrollTop = channel.scrollHeight; });
    }
  }

  // Append to overlay if KiiKii Chat overlay is open
  const overlay = document.querySelector<HTMLElement>('.plaza-overlay[data-channel="kiikii"]');
  if (overlay) {
    const msgs = overlay.querySelector<HTMLElement>('#plaza-overlay-messages');
    if (msgs) {
      const el = document.createElement('div');
      el.innerHTML = renderMemberMsg(post);
      const msgEl = el.firstElementChild as HTMLElement | null;
      if (msgEl) {
        msgEl.classList.add('plaza__member-msg--new');
        msgs.appendChild(msgEl);
        _bindLikeButtons(msgEl);
        msgs.scrollTop = msgs.scrollHeight;
      }
    }
  }

  // Animate likes up to a random peak
  const peak = Math.floor(Math.random() * 1800) + 200;
  _animateLikes(post.id, peak, 2800);
}

function _tickFan(): void {
  const entry = FAN_CHAT_STREAM[fanStreamIdx % FAN_CHAT_STREAM.length]!;
  fanStreamIdx++;

  const post: PlazaPost = {
    ...entry,
    id:        `live_f_${Date.now()}`,
    timestamp: '방금 전',
    likes:     0,
  };

  fanPosts = [...fanPosts, post];

  // Auto-like: 1~10 likes after a short delay
  likeCounts[post.id] = 0;
  setTimeout(() => {
    const peak = Math.floor(Math.random() * 10) + 1;
    _animateLikes(post.id, peak, 800);
  }, 600);

  const appendFanMsg = (container: HTMLElement) => {
    const el = document.createElement('div');
    el.innerHTML = renderFanMsg(post);
    const msgEl = el.firstElementChild as HTMLElement | null;
    if (msgEl) {
      msgEl.classList.add('plaza__fan-msg--new');
      container.appendChild(msgEl);
      _bindLikeButtons(msgEl);
      requestAnimationFrame(() => { container.scrollTop = container.scrollHeight; });
    }
  };

  const fanChannel = document.getElementById('plaza-fan-channel');
  if (fanChannel) appendFanMsg(fanChannel);

  const overlay = document.querySelector<HTMLElement>('.plaza-overlay[data-channel="fan"]');
  if (overlay) {
    const msgs = overlay.querySelector<HTMLElement>('#plaza-overlay-messages');
    if (msgs) appendFanMsg(msgs);
  }
}

// ── Like animation ────────────────────────────────────────────────────────────

function _animateLikes(id: string, target: number, durationMs: number): void {
  const start     = likeCounts[id] ?? 0;
  const startTime = performance.now();

  const tick = (now: number) => {
    const t       = Math.min(1, (now - startTime) / durationMs);
    const eased   = 1 - Math.pow(1 - t, 3); // ease-out cubic
    const current = Math.round(start + (target - start) * eased);
    likeCounts[id] = current;

    document.querySelectorAll<HTMLElement>(`[data-like="${id}"] .plaza__like-count`).forEach(el => {
      el.textContent = current >= 1000
        ? (current / 1000).toFixed(1) + 'k'
        : String(current);
    });

    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ── Overlay ───────────────────────────────────────────────────────────────────

function openOverlay(channel: 'kiikii' | 'fan'): void {
  const isKiikii = channel === 'kiikii';
  const title    = isKiikii ? 'KiiKii Chat' : '팬 Chat';

  const overlay = document.createElement('div');
  overlay.className = 'plaza-overlay';
  overlay.dataset['channel'] = channel;
  overlay.innerHTML = `
    <div class="plaza-overlay__sheet">
      <div class="plaza-overlay__header">
        <span class="plaza-overlay__title">${title}</span>
        <button class="plaza-overlay__close" id="plaza-overlay-close">✕</button>
      </div>
      <div class="plaza-overlay__messages" id="plaza-overlay-messages">
        ${isKiikii
          ? [...OFFICIAL_POSTS, ...Array.from(document.querySelectorAll<HTMLElement>('#plaza-member-list .plaza__member-msg'))
              .map(el => el.outerHTML)].join('')
          : fanPosts.map(renderFanMsg).join('')
        }
      </div>
      ${!isKiikii ? `
        <div class="plaza__compose plaza-overlay__compose">
          <div class="plaza__compose-inner">
            <span class="plaza__compose-avatar">${getAuthorAvatar()}</span>
            <input id="plaza-overlay-input" class="plaza__compose-input" type="text" placeholder="채팅을 입력하세요…" maxlength="140" />
            <button id="plaza-overlay-post-btn" class="plaza__compose-btn">전송</button>
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Re-render member messages properly if kiikii
  if (isKiikii) {
    const msgs = overlay.querySelector('#plaza-overlay-messages')!;
    msgs.innerHTML = [
      ...OFFICIAL_POSTS,
      ...fanPosts.filter(() => false), // placeholder
    ].map(renderMemberMsg).join('');
    // Also grab live messages from main list
    const liveEls = document.querySelectorAll('#plaza-member-list .plaza__member-msg');
    liveEls.forEach(el => {
      const clone = el.cloneNode(true) as HTMLElement;
      msgs.appendChild(clone);
    });
  }

  (document.getElementById('app') ?? document.body).appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('plaza-overlay--open'));

  const msgList = overlay.querySelector<HTMLElement>('#plaza-overlay-messages');
  if (msgList) {
    _bindLikeButtons(overlay);
    if (!isKiikii) msgList.scrollTop = msgList.scrollHeight;
  }

  const close = () => {
    overlay.classList.remove('plaza-overlay--open');
    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
  };
  overlay.querySelector('#plaza-overlay-close')?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  if (!isKiikii && msgList) {
    const input   = overlay.querySelector<HTMLInputElement>('#plaza-overlay-input');
    const postBtn = overlay.querySelector<HTMLButtonElement>('#plaza-overlay-post-btn');
    if (input && postBtn) {
      const send = () => {
        const text = input.value.trim();
        if (!text) return;
        const post = _makeMyPost(text);
        fanPosts = [...fanPosts, post];
        input.value = '';

        const appendMsg = (container: HTMLElement) => {
          const el = document.createElement('div');
          el.innerHTML = renderFanMsg(post);
          const msgEl = el.firstElementChild as HTMLElement | null;
          if (msgEl) {
            msgEl.classList.add('plaza__fan-msg--new');
            container.appendChild(msgEl);
            _bindLikeButtons(msgEl);
            container.scrollTop = container.scrollHeight;
          }
        };
        appendMsg(msgList);
        const mainChannel = document.getElementById('plaza-fan-channel');
        if (mainChannel) appendMsg(mainChannel);
      };
      postBtn.addEventListener('click', send);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _bindLikeButtons(root: Document | HTMLElement): void {
  root.querySelectorAll<HTMLButtonElement>('[data-like]').forEach(btn => {
    if (btn.dataset['likeBound']) return;
    btn.dataset['likeBound'] = '1';
    btn.addEventListener('click', () => {
      const id = btn.dataset['like']!;
      if (likedSet.has(id)) return;
      likedSet.add(id);
      const current = (likeCounts[id] ?? 0) + 1;
      _animateLikes(id, current, 400);
      document.querySelectorAll<HTMLButtonElement>(`[data-like="${id}"]`).forEach(b => {
        b.classList.add('plaza__like-btn--active');
      });
    });
  });
}

function _bindCompose(): void {
  const input   = document.getElementById('plaza-input')    as HTMLInputElement | null;
  const postBtn = document.getElementById('plaza-post-btn') as HTMLButtonElement | null;
  if (!input || !postBtn) return;

  const send = () => {
    const text = input.value.trim();
    if (!text) return;
    const post = _makeMyPost(text);
    fanPosts = [...fanPosts, post];
    input.value = '';

    const fanChannel = document.getElementById('plaza-fan-channel');
    if (fanChannel) {
      const el = document.createElement('div');
      el.innerHTML = renderFanMsg(post);
      const msgEl = el.firstElementChild as HTMLElement | null;
      if (msgEl) {
        msgEl.classList.add('plaza__fan-msg--new');
        fanChannel.appendChild(msgEl);
        _bindLikeButtons(msgEl);
        fanChannel.scrollTop = fanChannel.scrollHeight;
      }
    }
  };
  postBtn.addEventListener('click', send);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
}

function _makeMyPost(text: string): PlazaPost {
  const oshi = getOshi();
  return {
    id:           `fan_new_${Date.now()}`,
    authorId:     'fan_me',
    authorName:   '나',
    authorAvatar: oshi ? getAuthorAvatar() : '🌟',
    content:      text,
    timestamp:    '방금 전',
    isOfficial:   false,
    likes:        0,
  };
}

function getAuthorAvatar(): string {
  const oshi = getOshi();
  if (!oshi) return '🌟';
  const avatars: Record<string, string> = {
    jiyu: '🌸', jiwoo: '🌊', subin: '🔥', sumin: '🍑', haeum: '☕',
  };
  return avatars[oshi.id] ?? '🌟';
}

// ── Render helpers ────────────────────────────────────────────────────────────

function renderMemberMsg(post: PlazaPost): string {
  const count = likeCounts[post.id] ?? post.likes;
  const liked = likedSet.has(post.id);
  const hasChar = ['jiyu', 'jiwoo', 'subin', 'sumin', 'haeum'].includes(post.authorId);
  const avatarHTML = hasChar
    ? `<div class="plaza__member-avatar plaza__member-avatar--char">
         <img src="${asset('char_' + post.authorId + '.png')}" alt="${post.authorName}" />
       </div>`
    : `<div class="plaza__member-avatar">${post.authorAvatar}</div>`;
  return `
    <div class="plaza__member-msg">
      ${avatarHTML}
      <div class="plaza__member-body">
        <div class="plaza__member-meta">
          <span class="plaza__member-name">${post.authorName}</span>
          <span class="plaza__member-badge">Official</span>
          <span class="plaza__member-time">${post.timestamp}</span>
        </div>
        <p class="plaza__member-text">${post.content}</p>
      </div>
      <button class="plaza__like-btn ${liked ? 'plaza__like-btn--active' : ''}" data-like="${post.id}">
        ❤️ <span class="plaza__like-count">${count >= 1000 ? (count / 1000).toFixed(1) + 'k' : count}</span>
      </button>
    </div>
  `;
}

function renderFanMsg(post: PlazaPost): string {
  const isMe  = post.authorId === 'fan_me';
  const count = likeCounts[post.id] ?? post.likes;
  const liked = likedSet.has(post.id);
  const likeBtn = `
    <button class="plaza__like-btn ${liked ? 'plaza__like-btn--active' : ''}" data-like="${post.id}">
      ❤️ <span class="plaza__like-count">${count >= 1000 ? (count / 1000).toFixed(1) + 'k' : count}</span>
    </button>`;
  return `
    <div class="plaza__fan-msg ${isMe ? 'plaza__fan-msg--me' : ''}">
      ${!isMe ? `<span class="plaza__fan-avatar">${post.authorAvatar}</span>` : ''}
      <div class="plaza__fan-body">
        ${!isMe ? `<span class="plaza__fan-name">${post.authorName}</span>` : ''}
        <div class="plaza__fan-bubble">${post.content}</div>
      </div>
      ${!isMe ? likeBtn : ''}
      ${isMe ? `<span class="plaza__fan-avatar">${post.authorAvatar}</span>` : ''}
    </div>
  `;
}
