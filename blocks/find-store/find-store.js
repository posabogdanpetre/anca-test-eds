const SAMPLE_DATA = [
  {
    name: 'Patagonia Manchester',
    address: '51 King Street, Manchester, M2 4LQ, UK',
    city: 'Manchester'
  },
  {
    name: 'Patagonia Bristol',
    address: '81 Park Street, Bristol, BS1 5PF, UK',
    city: 'Bristol'
  }
];

const PALETTE = [];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s=c/255; return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4); };
  const relLum = (r,g,b) => 0.2126*lum(r)+0.7152*lum(g)+0.0722*lum(b);
  if (relLum(r,g,b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo=0, hi=1;
  for (let i=0; i<20; i++) {
    const mid=(lo+hi)/2;
    if (relLum(Math.round(r*mid),Math.round(g*mid),Math.round(b*mid)) > 0.12) hi=mid; else lo=mid;
  }
  const dr=Math.round(r*lo), dg=Math.round(g*lo), db=Math.round(b*lo);
  return { bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`, fg:'#ffffff' };
}

const theme = getThemedCardBg(PALETTE);

export default async function decorate(block, bridge) {
  let stores;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      stores = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      stores = structuredContent?.stores || [];
      // structuredContent.stores — bare array outputSchema; key derived from actionName "find_store"
    }
  } else {
    stores = SAMPLE_DATA;
  }

  block.textContent = '';
  
  if (!stores || stores.length === 0) {
    renderEmptyState(block, bridge);
  } else {
    renderStores(block, stores, bridge);
  }

  if (bridge) {
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => bridge.reportSize(block.offsetWidth, block.offsetHeight), 150);
    });
    ro.observe(block);
  }
}

function renderEmptyState(block, bridge) {
  const card = document.createElement('div');
  card.className = 'store-search-card';
  const cardBg = theme?.bg ?? '#1a3a5c';
  const cardFg = theme?.fg ?? '#fff';
  card.style.cssText = `background:${cardBg};color:${cardFg}`;

  const pinIcon = document.createElement('div');
  pinIcon.className = 'pin-icon';
  pinIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
  pinIcon.style.color = cardFg;
  card.appendChild(pinIcon);

  const heading = document.createElement('h2');
  heading.textContent = 'Find a store near you';
  heading.style.color = cardFg;
  card.appendChild(heading);

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Enter ZIP code…';
  card.appendChild(input);

  const button = document.createElement('button');
  button.textContent = 'Search';
  if (bridge) {
    button.addEventListener('click', () => {
      const query = input.value.trim();
      if (query) {
        bridge.sendMessage(`Find a store near ${query}`);
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = input.value.trim();
        if (query) {
          bridge.sendMessage(`Find a store near ${query}`);
        }
      }
    });
  }
  card.appendChild(button);

  block.appendChild(card);
}

function renderStores(block, stores, bridge) {
  const container = document.createElement('div');
  container.className = 'stores-container';

  const cardBg = theme?.bg ?? '#1a3a5c';
  const cardFg = theme?.fg ?? '#fff';

  stores.slice(0, 2).forEach(store => {
    const card = document.createElement('div');
    card.className = 'store-card';
    card.style.cssText = `background:${cardBg};color:${cardFg}`;

    const pinCircle = document.createElement('div');
    pinCircle.className = 'pin-circle';
    pinCircle.textContent = '📍';
    card.appendChild(pinCircle);

    const name = document.createElement('div');
    name.className = 'store-name';
    name.textContent = store.name || '';
    name.style.color = cardFg;
    card.appendChild(name);

    const address = document.createElement('div');
    address.className = 'store-address';
    address.textContent = store.address || '';
    card.appendChild(address);

    if (store.phone) {
      const phone = document.createElement('div');
      phone.className = 'store-phone';
      phone.textContent = store.phone;
      card.appendChild(phone);
    }

    if (store.hours) {
      const hours = document.createElement('div');
      hours.className = 'store-hours';
      hours.textContent = store.hours;
      card.appendChild(hours);
    }

    container.appendChild(card);
  });

  block.appendChild(container);
}