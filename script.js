(() => {
  'use strict';

  const CONFIG = {
    title: 'Trip Surprises · 5 Days',
    devMode: false,
    cacheVersion: '202407150001',
    passwordHashHex: '7997990d5e281fc7d53c474a269e8da29d7866a12cc5fe702efaf68d2a8bf354',
    timeZone: 'America/Los_Angeles',
    bonusUnlockDate: '2025-11-15'
  };

  const STORAGE_KEYS = {
    auth: 'ts5_auth_v1',
    viewed: 'ts5_viewed_days_v1',
    revealPrefix: 'ts5_reveal_day_'
  };

  const ROUTES = ['#', '#day1', '#day2', '#day3', '#day4', '#day5', '#bonus'];
  const DEFAULT_UNLOCK_TIME = '00:00';

  const withCache = (asset) => `assets/${asset}?v=${CONFIG.cacheVersion}`;

  const days = [
    {
      id: 1,
      routeHash: '#day1',
      dateISO: '2025-11-11',
      title: '2025-11-11',
      videoUrl: 'https://www.youtube.com/watch?v=P04IYEOIr38',
      quote: {
        text: 'You must always have faith in people. And, most importantly, you must always have faith in yourself.',
        attribution: 'Elle Woods'
      },
      treat: {
        type: 'embed',
        payload:
          '<iframe data-testid=\"embed-iframe\" style=\"border-radius:12px\" src=\"https://open.spotify.com/embed/track/5BkNCuxzzid0gz9sx3NNbX?utm_source=generator\" width=\"100%\" height=\"352\" frameborder=\"0\" allowfullscreen=\"\" allow=\"autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture\" loading=\"lazy\"></iframe>',
        label: 'Motivational track',
        note:
          'Idk why, but I feel like this is motivational and made me think of you when it came up on shuffle today... "I won\'t take the easy road"... "Keep on keepin\' on"... Keep on keepin\' on honey, I\'m so proud of you.'
      }
    },
    {
      id: 2,
      routeHash: '#day2',
      dateISO: '2025-11-12',
      title: '2025-11-12',
      videoUrl: 'https://www.youtube.com/watch?v=0jxVnlRdelU',
      quote: {
        text: 'We are what we repeatedly do. Excellence, then, is not an act but a habit.',
        attribution: 'Will Durant',
        extra: {
          text: 'You are excellence',
          attribution: 'Guz Reister'
        }
      }
    },
    {
      id: 3,
      routeHash: '#day3',
      dateISO: '2025-11-13',
      title: '2025-11-13',
      unlockTime: '12:00',
      videoUrl: withCache('day3.mp4'),
      quote: {
        text: 'Fortune favors the bold.',
        attribution: 'Terence'
      },
      treat: {
        type: 'code',
        payload: 'LUNCH-1313',
        label: 'Lunch pickup code'
      }
    },
    {
      id: 4,
      routeHash: '#day4',
      dateISO: '2025-11-14',
      title: '2025-11-14',
      videoUrl: withCache('day4.mp4'),
      quote: {
        text: 'Let gratitude be the pillow upon which you kneel to say your nightly prayer.',
        attribution: 'Maya Angelou'
      },
      treat: {
        type: 'link',
        payload: withCache('montage.mp4'),
        label: 'Mini montage'
      }
    },
    {
      id: 5,
      routeHash: '#day5',
      dateISO: '2025-11-15',
      title: '2025-11-15',
      videoUrl: withCache('day5.mp4'),
      quote: {
        text: 'What you do today can improve all your tomorrows.',
        attribution: 'Ralph Marston'
      },
      treat: {
        type: 'note',
        payload: 'Finish this day and the bonus surprise unlocks automatically.'
      }
    }
  ];

  const bonusContent = {
    title: 'Bonus Surprise',
    message:
      'You made it through all five days! Here is a little extra spark to carry along the rest of the trip.',
    linkLabel: 'Open the finale gift',
    linkHref: 'https://example.com/finale-gift'
  };


  const collageSources = [
    'collage/MSDERBR_EC017.jpeg',
    'collage/MarkRuffCourt.avif',
    'collage/RBG1.jpg',
    'collage/Ruth_Bader_Ginsburg_2016_portrait.jpg',
    'collage/images.jpeg',
    'collage/legally_blonde_-_h_-_2016.jpeg',
    'collage/Notorious-RBG-book-cover-illustration.jpg',
    'collage/Thurgood-marshall-2.jpg'
  ];

  const TOTAL_DAYS = days.length;
  const dayByRoute = new Map(days.map((day) => [day.routeHash, day]));
  const dayUnlockTimes = new Map(days.map((day) => [day.dateISO, day.unlockTime || DEFAULT_UNLOCK_TIME]));

  const isYouTubeUrl = (url) => /(?:youtu\.be|youtube\.com)/i.test(url);

  const toYouTubeEmbed = (url) => {
    try {
      const parsed = new URL(url);
      let id = parsed.searchParams.get('v');
      if (!id && /youtu\.be/i.test(parsed.hostname)) {
        id = parsed.pathname.slice(1);
      }
      return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` : url;
    } catch (error) {
      console.warn('Failed to parse YouTube URL', error);
      return url;
    }
  };

  const tzFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: CONFIG.timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const unlockLabelFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: CONFIG.timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const zoneLabel =
    CONFIG.timeZone === 'America/Los_Angeles'
      ? 'LA'
      : CONFIG.timeZone.split('/')[1]?.replace('_', ' ') || CONFIG.timeZone;

  const unlockCache = new Map();

  const resolveUnlockTime = (dateISO) => dayUnlockTimes.get(dateISO) || DEFAULT_UNLOCK_TIME;

  const extractTzParts = (date) => {
    const parts = tzFormatter.formatToParts(date);
    const map = {};
    parts.forEach(({ type, value }) => {
      if (type !== 'literal') {
        map[type] = value;
      }
    });
    return map;
  };

  const computeUnlockTimestamp = (dateISO, timeStr = DEFAULT_UNLOCK_TIME) => {
    const [year, month, day] = dateISO.split('-').map(Number);
    const [hourStr = '00', minuteStr = '00'] = timeStr.split(':');
    const anchor = new Date(Date.UTC(year, month - 1, day, Number(hourStr), Number(minuteStr), 0));
    const map = extractTzParts(anchor);
    const asUTC = Date.UTC(
      Number(map.year),
      Number(map.month) - 1,
      Number(map.day),
      Number(map.hour),
      Number(map.minute),
      Number(map.second)
    );
    const offsetMinutes = (asUTC - anchor.getTime()) / 60000;
    return anchor.getTime() - offsetMinutes * 60000;
  };

  const getUnlockTimestamp = (dateISO, timeStr) => {
    const resolvedTime = timeStr || resolveUnlockTime(dateISO);
    const key = `${dateISO}|${resolvedTime}`;
    if (!unlockCache.has(key)) {
      unlockCache.set(key, computeUnlockTimestamp(dateISO, resolvedTime));
    }
    return unlockCache.get(key);
  };

  const bonusUnlockTimestamp = () => getUnlockTimestamp(CONFIG.bonusUnlockDate, DEFAULT_UNLOCK_TIME);

  const isUnlocked = (dateISO) => CONFIG.devMode || Date.now() >= getUnlockTimestamp(dateISO);

  const shouldUnlockBonusByDate = () => CONFIG.devMode || Date.now() >= bonusUnlockTimestamp();

  const formatUnlockLabel = (dateISO) =>
    `${unlockLabelFormatter.format(new Date(getUnlockTimestamp(dateISO)))} (${zoneLabel})`;

  const formatCountdown = (targetMs) => {
    const diff = targetMs - Date.now();
    if (diff <= 0) {
      return '00:00:00';
    }
    let seconds = Math.floor(diff / 1000);
    const hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;
    const minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;
    const pad = (value) => value.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const countdownTimers = [];
  const clearCountdowns = () => {
    countdownTimers.forEach((id) => window.clearInterval(id));
    countdownTimers.length = 0;
  };

  const makeCountdown = (targetMs) => {
    const span = document.createElement('span');
    span.className = 'countdown';

    const tick = () => {
      const diff = targetMs - Date.now();
      if (diff <= 0) {
        span.textContent = '00:00:00';
        window.clearInterval(intervalId);
        setTimeout(renderCurrentRoute, 0);
        return;
      }
      span.textContent = formatCountdown(targetMs);
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    countdownTimers.push(intervalId);
    return span;
  };

  const getStorage = () => window.localStorage;

  const readJson = (key, fallback) => {
    try {
      const raw = getStorage().getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn('Unable to parse storage for', key, error);
      return fallback;
    }
  };

  const writeJson = (key, value) => getStorage().setItem(key, JSON.stringify(value));

  const isAuthed = () => getStorage().getItem(STORAGE_KEYS.auth) === '1';

  const persistAuth = () => getStorage().setItem(STORAGE_KEYS.auth, '1');

  const getViewedDays = () => new Set(readJson(STORAGE_KEYS.viewed, []));

  const hasViewedDay = (dayId) => getViewedDays().has(dayId);

  const markDayViewed = (dayId) => {
    const viewed = getViewedDays();
    if (!viewed.has(dayId)) {
      viewed.add(dayId);
      writeJson(STORAGE_KEYS.viewed, Array.from(viewed));
    }
  };

  const getProgressCount = () => getViewedDays().size;

  const revealKey = (dayId) => `${STORAGE_KEYS.revealPrefix}${dayId}`;

  const isTreatRevealed = (dayId) => getStorage().getItem(revealKey(dayId)) === '1';

  const revealTreat = (dayId) => getStorage().setItem(revealKey(dayId), '1');

  const hashStringHex = async (input) => {
    const data = new TextEncoder().encode(input);
    const buffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buffer))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  };

  const verifyPassword = async (value) => {
    const hash = await hashStringHex(value);
    return hash === CONFIG.passwordHashHex;
  };

  const buildAuthOverlay = () => {
    const overlay = document.createElement('div');
    overlay.className = 'auth-overlay';
    overlay.innerHTML = `
      <div class="auth-card">
        <h1>Trip Surprises Locked</h1>
        <p>Enter the password to unlock the surprises.</p>
        <form>
          <input type="password" placeholder="Password" autocomplete="current-password" required />
          <button type="submit">Unlock</button>
          <p class="auth-error" aria-live="polite"></p>
        </form>
      </div>
    `;
    return overlay;
  };

  const requireAuth = () =>
    new Promise((resolve) => {
      if (isAuthed()) {
        resolve();
        return;
      }

      const overlay = buildAuthOverlay();
      document.body.appendChild(overlay);
      const form = overlay.querySelector('form');
      const input = overlay.querySelector('input');
      const errorEl = overlay.querySelector('.auth-error');
      const button = overlay.querySelector('button');
      input && input.focus();

      const resetState = () => {
        if (input) {
          input.disabled = false;
          input.value = '';
          input.focus();
        }
        if (button) {
          button.disabled = false;
          button.textContent = 'Unlock';
        }
      };

      form?.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!input || !button) {
          return;
        }
        const value = input.value.trim();
        if (!value) {
          return;
        }
        input.disabled = true;
        button.disabled = true;
        button.textContent = 'Checking…';
        const valid = await verifyPassword(value);
        if (valid) {
          persistAuth();
          overlay.remove();
          resolve();
          return;
        }
        if (errorEl) {
          errorEl.textContent = 'That password did not match. Please try again.';
        }
        resetState();
      });
    });

  const appRoot = document.getElementById('app');
  const collageFallbackColor = '#050608';
  let collageImagesCache = null;
  let collageResizeTimer = null;

  const preloadCollageImages = () => {
    if (!collageSources.length) {
      return Promise.resolve([]);
    }

    if (!collageImagesCache) {
      collageImagesCache = Promise.all(
        collageSources.map(
          (src) =>
            new Promise((resolve) => {
              const image = new Image();
              image.onload = () => resolve(image);
              image.onerror = () => resolve(null);
              image.src = src;
            })
        )
      ).then((images) => images.filter(Boolean));
    }

    return collageImagesCache;
  };

  const applyCollageFallback = () => {
    document.body.style.backgroundColor = collageFallbackColor;
    document.body.style.backgroundImage = '';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
  };

  const generateCollageBackground = () => {
    preloadCollageImages()
      .then((images) => {
        if (!images.length) {
          applyCollageFallback();
          return;
        }

        const viewportWidth = Math.max(window.innerWidth || 0, 640);
        const viewportHeight = Math.max(window.innerHeight || 0, 720);
        const ratio = Math.min(window.devicePixelRatio || 1, 2);

        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewportWidth * ratio);
        canvas.height = Math.ceil(viewportHeight * ratio);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = collageFallbackColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const cols = Math.max(3, Math.round(viewportWidth / 360));
        const rows = Math.max(3, Math.round(viewportHeight / 320));
        const cellW = canvas.width / cols;
        const cellH = canvas.height / rows;
        let imageIndex = 0;

        for (let row = 0; row < rows; row += 1) {
          for (let col = 0; col < cols; col += 1) {
            const image = images[imageIndex % images.length];
            imageIndex += 1;

            const centerX = (col + 0.5) * cellW;
            const centerY = (row + 0.5) * cellH;
            const rotation = ((Math.random() * 6 - 3) * Math.PI) / 180;
            const scale = 0.9 + Math.random() * 0.2;

            const maxWidth = cellW * 0.9 * scale;
            const maxHeight = cellH * 0.9 * scale;
            const aspect = image.width / image.height;
            let drawW = maxWidth;
            let drawH = maxHeight;

            if (maxWidth / maxHeight > aspect) {
              drawW = maxHeight * aspect;
            } else {
              drawH = maxWidth / aspect;
            }

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(rotation);
            ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
            ctx.restore();
          }
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
        document.body.style.backgroundColor = collageFallbackColor;
        document.body.style.backgroundImage = `url(${dataUrl})`;
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
      })
      .catch(() => {
        applyCollageFallback();
      });
  };

  const scheduleCollageRegeneration = () => {
    if (collageResizeTimer) {
      window.clearTimeout(collageResizeTimer);
    }
    collageResizeTimer = window.setTimeout(() => {
      generateCollageBackground();
    }, 250);
  };

  const devBadge = document.getElementById('dev-badge');

  if (!appRoot) {
    throw new Error('Missing #app root');
  }

  const renderTimesNote = () => {
    const note = document.createElement('p');
    note.className = 'time-note';
    note.textContent = 'Times are based on Los Angeles time.';
    return note;
  };

  const buildProgress = () => {
    const viewed = getProgressCount();
    const percent = Math.round((viewed / TOTAL_DAYS) * 100);
    const wrapper = document.createElement('div');
    wrapper.className = 'progress-card';

    const label = document.createElement('div');
    label.className = 'progress-label';
    label.textContent = `${viewed} / ${TOTAL_DAYS} viewed`;

    const bar = document.createElement('div');
    bar.className = 'progress-bar';

    const fill = document.createElement('div');
    fill.className = 'progress-fill';
    fill.style.width = `${percent}%`;

    bar.appendChild(fill);
    wrapper.appendChild(label);
    wrapper.appendChild(bar);
    return wrapper;
  };

  const buildDayCard = (day) => {
    const unlocked = isUnlocked(day.dateISO);
    const viewed = hasViewedDay(day.id);
    const card = document.createElement('article');
    card.className = `card day-card ${unlocked ? 'unlocked' : 'locked'}`;

    const heading = document.createElement('div');
    heading.className = 'day-heading';
    heading.innerHTML = `<strong>Day ${day.id}</strong><span>${day.title}</span>`;

    const status = document.createElement('p');
    status.className = 'day-status';
    status.textContent = unlocked ? (viewed ? 'Viewed' : 'Unlocked') : 'Locked';

    card.appendChild(heading);
    card.appendChild(status);

    if (unlocked) {
      const action = document.createElement('a');
      action.href = day.routeHash;
      action.className = `btn ${viewed ? 'btn-secondary' : 'btn-primary'}`;
      action.textContent = viewed ? 'Viewed' : 'Unlock';
      card.appendChild(action);
    } else {
      const unlockCopy = document.createElement('p');
      unlockCopy.className = 'unlock-copy';
      unlockCopy.textContent = `Unlocks at ${formatUnlockLabel(day.dateISO)}`;
      card.appendChild(unlockCopy);
      if (!CONFIG.devMode) {
        card.appendChild(makeCountdown(getUnlockTimestamp(day.dateISO)));
      }
    }

    return card;
  };

  const isBonusUnlocked = () =>
    CONFIG.devMode || hasViewedDay(5) || shouldUnlockBonusByDate();

  const buildBonusCard = () => {
    const unlocked = isBonusUnlocked();
    const card = document.createElement('article');
    card.className = `card bonus-card ${unlocked ? 'unlocked' : 'locked'}`;

    const heading = document.createElement('div');
    heading.className = 'day-heading';
    heading.innerHTML = '<strong>Bonus</strong><span>Final Surprise</span>';
    card.appendChild(heading);

    if (unlocked) {
      const action = document.createElement('a');
      action.href = '#bonus';
      action.className = 'btn btn-primary';
      action.textContent = 'Open bonus';
      card.appendChild(action);
    } else {
      const copy = document.createElement('p');
      copy.className = 'unlock-copy';
      copy.textContent = 'Unlocks after Day 5 is viewed or on Nov 15 (NY).';
      card.appendChild(copy);
      if (!CONFIG.devMode && !shouldUnlockBonusByDate()) {
        card.appendChild(makeCountdown(bonusUnlockTimestamp()));
      }
    }

    return card;
  };

  const renderHome = () => {
    const view = document.createElement('section');
    view.className = 'view home-view';

    const hero = document.createElement('header');
    hero.className = 'hero';
    hero.innerHTML = `
      <div class="hero-glass">
        <p class="eyebrow">Trip Surprises</p>
        <h1>${CONFIG.title}</h1>
        <p>Five days of potentially motivational (but hopefully at least make you smile) things.</p>
      </div>
    `;

    view.appendChild(hero);
    view.appendChild(buildProgress());

    const list = document.createElement('div');
    list.className = 'day-list';
    days.forEach((day) => list.appendChild(buildDayCard(day)));
    view.appendChild(list);

    view.appendChild(buildBonusCard());
    view.appendChild(renderTimesNote());
    return view;
  };

  const buildBackLink = () => {
    const link = document.createElement('a');
    link.href = '#';
    link.className = 'back-link';
    link.textContent = '← Back home';
    return link;
  };

  const buildLockedBlock = (label, targetMs) => {
    const block = document.createElement('div');
    block.className = 'locked-block';
    const text = document.createElement('p');
    text.textContent = label;
    block.appendChild(text);
    if (!CONFIG.devMode) {
      block.appendChild(makeCountdown(targetMs));
    }
    return block;
  };

  const buildQuote = (day) => {
    const block = document.createElement('blockquote');
    block.className = 'quote';
    const cite = day.quote.attribution ? `<cite>— ${day.quote.attribution}</cite>` : '';
    block.innerHTML = `<p>“${day.quote.text}”</p>${cite}`;

    if (day.quote.extra) {
      const extra = document.createElement('div');
      extra.className = 'quote-extra';
      const extraCite = day.quote.extra.attribution ? `<cite>— ${day.quote.extra.attribution}</cite>` : '';
      extra.innerHTML = `<p>“${day.quote.extra.text}”</p>${extraCite}`;
      block.appendChild(extra);
    }

    return block;
  };

  const renderTreat = (day) => {
    if (!day.treat) {
      return null;
    }
    const wrapper = document.createElement('section');
    wrapper.className = 'treat';
    const title = document.createElement('h3');
    title.textContent = day.treat.label || 'Treat';
    wrapper.appendChild(title);

    let noteAppended = false;
    const appendNote = () => {
      if (noteAppended || !day.treat?.note) {
        return;
      }
      const note = document.createElement('p');
      note.className = 'treat-note';
      note.textContent = day.treat.note;
      wrapper.appendChild(note);
      noteAppended = true;
    };

    if (day.treat.type === 'code') {
      const revealed = isTreatRevealed(day.id);
      const code = document.createElement('div');
      code.className = `treat-code ${revealed ? 'revealed' : ''}`;
      code.textContent = revealed
        ? day.treat.payload
        : '•'.repeat(Math.max(6, day.treat.payload.length));
      wrapper.appendChild(code);

      if (!revealed) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-primary';
        button.textContent = 'Reveal code';
        button.addEventListener('click', () => {
          revealTreat(day.id);
          renderCurrentRoute();
        });
        wrapper.appendChild(button);
      }
    } else if (day.treat.type === 'link') {
      const link = document.createElement('a');
      link.className = 'btn btn-primary';
      link.href = day.treat.payload;
      if (day.treat.payload.startsWith('http')) {
        link.target = '_blank';
        link.rel = 'noreferrer';
      }
      link.textContent = day.treat.label || 'Open treat';
      wrapper.appendChild(link);
    } else if (day.treat.type === 'embed') {
      appendNote();
      const embed = document.createElement('div');
      embed.className = 'treat-embed';
      embed.innerHTML = day.treat.payload;
      wrapper.appendChild(embed);
    } else {
      const note = document.createElement('p');
      note.textContent = day.treat.payload;
      wrapper.appendChild(note);
    }

    appendNote();

    return wrapper;
  };

  const buildCta = (day) => {
    if (!day.cta) {
      return null;
    }
    const link = document.createElement('a');
    link.className = 'btn btn-secondary';
    link.textContent = day.cta.label;
    link.href = day.cta.href || '#';
    if (day.cta.href && day.cta.href.startsWith('http')) {
      link.target = '_blank';
      link.rel = 'noreferrer';
    }
    return link;
  };

  const renderDayView = (day) => {
    const view = document.createElement('section');
    view.className = 'view day-view';
    view.appendChild(buildBackLink());

    if (!isUnlocked(day.dateISO)) {
      view.appendChild(
        buildLockedBlock(`Unlocks at ${formatUnlockLabel(day.dateISO)}`, getUnlockTimestamp(day.dateISO))
      );
      return view;
    }

    markDayViewed(day.id);

    const card = document.createElement('article');
    card.className = 'card day-detail';

    const title = document.createElement('h2');
    title.textContent = `Day ${day.id} · ${day.title}`;
    card.appendChild(title);

    let media;
    if (isYouTubeUrl(day.videoUrl)) {
      media = document.createElement('iframe');
      media.src = toYouTubeEmbed(day.videoUrl);
      media.className = 'video-embed';
      media.width = '100%';
      media.height = '360';
      media.allow =
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      media.allowFullscreen = true;
    } else {
      media = document.createElement('video');
      media.controls = true;
      media.preload = 'metadata';
      media.src = day.videoUrl;
    }
    card.appendChild(media);

    card.appendChild(buildQuote(day));

    const treat = renderTreat(day);
    if (treat) {
      card.appendChild(treat);
    }

    const cta = buildCta(day);
    if (cta) {
      card.appendChild(cta);
    }

    view.appendChild(card);
    return view;
  };

  const renderBonusView = () => {
    const view = document.createElement('section');
    view.className = 'view bonus-view';
    view.appendChild(buildBackLink());

    if (!isBonusUnlocked()) {
      const label = hasViewedDay(5)
        ? 'Hang tight! Bonus unlocks momentarily.'
        : 'Finish Day 5 or wait until Nov 15 (NY) to unlock the bonus.';
      view.appendChild(buildLockedBlock(label, bonusUnlockTimestamp()));
      return view;
    }

    const card = document.createElement('article');
    card.className = 'card bonus-detail';

    const title = document.createElement('h2');
    title.textContent = bonusContent.title;
    card.appendChild(title);

    const body = document.createElement('p');
    body.textContent = bonusContent.message;
    card.appendChild(body);

    const link = document.createElement('a');
    link.href = bonusContent.linkHref;
    link.className = 'btn btn-primary';
    link.textContent = bonusContent.linkLabel;
    link.target = '_blank';
    link.rel = 'noreferrer';
    card.appendChild(link);

    view.appendChild(card);
    return view;
  };

  const getRouteTitle = (route) => {
    if (route === '#') {
      return CONFIG.title;
    }
    if (route === '#bonus') {
      return `${CONFIG.title} · Bonus`;
    }
    const day = dayByRoute.get(route);
    return day ? `${CONFIG.title} · Day ${day.id}` : CONFIG.title;
  };

  const renderRoute = (route) => {
    clearCountdowns();
    appRoot.innerHTML = '';
    document.title = getRouteTitle(route);

    if (CONFIG.devMode) {
      devBadge?.classList.remove('hidden');
    } else {
      devBadge?.classList.add('hidden');
    }

    let view;
    if (route === '#') {
      view = renderHome();
    } else if (route === '#bonus') {
      view = renderBonusView();
    } else {
      const day = dayByRoute.get(route);
      view = day ? renderDayView(day) : renderHome();
    }

    appRoot.appendChild(view);
  };

  const normalizeRoute = (hashValue) => {
    const hash = hashValue || '#';
    return ROUTES.includes(hash) ? hash : '#';
  };

  const getCurrentRoute = () => normalizeRoute(window.location.hash);

  const renderCurrentRoute = () => {
    renderRoute(getCurrentRoute());
  };

  window.addEventListener('resize', scheduleCollageRegeneration);
  window.addEventListener('hashchange', renderCurrentRoute);
  window.addEventListener('storage', renderCurrentRoute);

  generateCollageBackground();

  requireAuth().then(() => {
    renderCurrentRoute();
  });

  // Dev helper: uncomment to log the SHA-256 hex for any password.
  // (async () => {
  //   console.log('hash preview', await hashStringHex('YOUR_PASSWORD_HERE'));
  // })();
})();
