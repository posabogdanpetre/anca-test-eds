const SAMPLE_DATA = [
  {
    name: "Black Hole Pack 25L",
    description: "Weather-resistant 25-litre daypack made from recycled materials.",
    category: "Packs & Gear"
  },
  {
    name: "Men's R2 TechFace Fleece Jacket",
    description: "Cold-weather crosslayer fleece with weather resistance.",
    category: "Fleece"
  },
  {
    name: "Women's Sindit Insulated Hoody Jacket",
    description: "Nylon-shell jacket with 700-fill recycled down.",
    category: "Jackets"
  },
  {
    name: "Men's Capilene Midweight Baselayer Bottoms",
    description: "Moisture-wicking midweight thermal baselayer.",
    category: "Baselayers"
  },
  {
    name: "Men's R1 Yulex Regulator Full Wetsuit",
    description: "Neoprene-free Yulex natural-rubber wetsuit.",
    category: "Wetsuits"
  }
];

const PALETTE = [];
const CARD_COLORS = ["#378ef0","#9256d9","#0fb5ae","#e68619","#d83790","#2dca72","#4046ca","#72b340"];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace("#", "");
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s=c/255; return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4); };
  const relLum = (r,g,b) => 0.2126*lum(r)+0.7152*lum(g)+0.0722*lum(b);
  if (relLum(r,g,b) <= 0.12) return { bg: `#${hex}`, fg: "#ffffff" };
  let lo=0, hi=1;
  for (let i=0; i<20; i++) {
    const m=(lo+hi)/2;
    if (relLum(Math.round(r*m),Math.round(g*m),Math.round(b*m)) > 0.12) hi=m; else lo=m;
  }
  const dr=Math.round(r*lo), dg=Math.round(g*lo), db=Math.round(b*lo);
  return { bg:`#${dr.toString(16).padStart(2,"0")}${dg.toString(16).padStart(2,"0")}${db.toString(16).padStart(2,"0")}`, fg:"#ffffff" };
}

export default async function decorate(block, bridge) {
  let item;
  
  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      item = SAMPLE_DATA[0];
    } else {
      const _result = await bridge.toolResult;
      item = (_result?.structuredContent || _result) || {};
    }
  } else {
    item = SAMPLE_DATA[0];
  }

  block.textContent = "";
  renderDetail(block, item, bridge);
  
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

function renderDetail(block, item, bridge) {
  const theme = getThemedCardBg(PALETTE);
  const fallbackColor = CARD_COLORS[0];
  
  const card = document.createElement("div");
  card.className = "detail-card";
  
  const imageContainer = document.createElement("div");
  imageContainer.className = "image-container";
  
  if (item.image_url) {
    const img = document.createElement("img");
    img.src = item.image_url;
    img.alt = item.name || "";
    img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";
    
    const colorDiv = document.createElement("div");
    colorDiv.className = "color-fallback";
    colorDiv.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
    
    img.onerror = () => {
      if (img.parentNode) {
        img.parentNode.replaceChild(colorDiv, img);
      }
    };
    imageContainer.appendChild(img);
  } else {
    const colorDiv = document.createElement("div");
    colorDiv.className = "color-fallback";
    colorDiv.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
    imageContainer.appendChild(colorDiv);
  }
  
  const ctaBtn = document.createElement("button");
  ctaBtn.className = "cta-btn";
  ctaBtn.textContent = "View Details";
  if (bridge) {
    ctaBtn.addEventListener("click", () => {
      bridge.sendMessage(`Tell me more about ${item.name || "this product"}`);
    });
  }
  imageContainer.appendChild(ctaBtn);
  
  card.appendChild(imageContainer);
  
  const content = document.createElement("div");
  content.className = "content";
  content.style.cssText = `background:${theme?.bg ?? "#1a1a1a"};color:${theme?.fg ?? "#fff"}`;
  
  const title = document.createElement("h2");
  title.textContent = item.name || "Product";
  content.appendChild(title);
  
  const desc = document.createElement("p");
  desc.className = "description";
  desc.textContent = item.description || "";
  content.appendChild(desc);
  
  if (item.category) {
    const chip = document.createElement("span");
    chip.className = "category-chip";
    chip.textContent = item.category;
    content.appendChild(chip);
  }
  
  card.appendChild(content);
  block.appendChild(card);
}