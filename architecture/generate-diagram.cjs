const fs = require('fs');
const path = require('path');

const architectureDir = __dirname;
const iconDir = path.join(architectureDir, '.icon-source');
const drawioPath = path.join(architectureDir, 'lab-architecture.drawio');
const svgPath = path.join(architectureDir, 'lab-architecture.svg');

const iconCells = {
  azure: 'azure-icon',
  resourceGroup: 'rg-icon',
  vnet: 'vnet-icon',
  container: 'kali-icon',
  nsg: 'nsg-icon',
  activity: 'activity-icon',
  entra: 'entra-icon',
  logAnalytics: 'law-icon',
  sentinel: 'sentinel-icon',
  defender: 'dfc-icon',
};

let drawio = fs.readFileSync(drawioPath, 'utf8');
const icons = Object.fromEntries(
  Object.entries(iconCells).map(([name, cellId]) => {
    const sourcePath = path.join(iconDir, `${name}.svg`);
    let svg;
    if (fs.existsSync(sourcePath)) {
      svg = fs.readFileSync(sourcePath, 'utf8');
    } else {
      const cell = drawio.match(new RegExp(`<mxCell id="${cellId}"[^>]*style="([^"]+)"`));
      const embedded = cell?.[1].match(/image=(data:image\/svg\+xml,([^;]+));/);
      if (!embedded) throw new Error(`Could not load embedded icon from ${cellId}`);
      svg = decodeURIComponent(embedded[2]);
    }
    return [
      name,
      {
        drawio: `data:image/svg+xml,${encodeURIComponent(svg)}`,
        svg: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
      },
    ];
  }),
);

const cellIcons = {
  'azure-icon': 'azure',
  'rg-icon': 'resourceGroup',
  'vnet-icon': 'vnet',
  'kali-icon': 'container',
  'nsg-icon': 'nsg',
  'dvwa-icon': 'container',
  'juice-icon': 'container',
  'aci-diag-icon': 'container',
  'activity-icon': 'activity',
  'entra-icon': 'entra',
  'law-icon': 'logAnalytics',
  'sentinel-icon': 'sentinel',
  'dfc-icon': 'defender',
};

for (const [cellId, iconName] of Object.entries(cellIcons)) {
  const cellPattern = new RegExp(`(<mxCell id="${cellId}"[^>]*style=")([^"]+)(")`);
  const match = drawio.match(cellPattern);
  if (!match) throw new Error(`Could not find icon cell ${cellId}`);
  let style = match[2];
  if (/shape=mxgraph\.azure2\.[^;]+;/.test(style)) {
    style = style.replace(
      /shape=mxgraph\.azure2\.[^;]+;/,
      `shape=image;imageAspect=1;image=${icons[iconName].drawio};`,
    );
  } else if (/shape=image;/.test(style) && /image=data:image\/svg\+xml,[^;]+;/.test(style)) {
    style = style.replace(
      /image=data:image\/svg\+xml,[^;]+;/,
      `image=${icons[iconName].drawio};`,
    );
  } else {
    throw new Error(`Could not update embedded icon in ${cellId}`);
  }
  drawio = drawio.replace(cellPattern, `$1${style}$3`);
}

drawio = drawio.replace(
  /shape=mxgraph\.azure2\.general\.user;/,
  'shape=actor;',
);
if (drawio.includes('mxgraph.azure2')) {
  throw new Error('Unresolved mxgraph.azure2 stencil found');
}
fs.writeFileSync(drawioPath, drawio);

const esc = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const parts = [];
const add = (value) => parts.push(value);
const rect = (x, y, width, height, fill, stroke, strokeWidth = 1, radius = 8, dash = '') => {
  add(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`);
};
const lineText = (x, y, text, options = {}) => {
  const {
    size = 11,
    color = '#1A1A1A',
    weight = 400,
    anchor = 'start',
    style = 'normal',
  } = options;
  add(`<text x="${x}" y="${y}" font-family="Segoe UI, Arial, sans-serif" font-size="${size}" fill="${color}" font-weight="${weight}" font-style="${style}" text-anchor="${anchor}">${esc(text)}</text>`);
};
const multiText = (x, y, lines, options = {}) => {
  const {
    size = 10,
    color = '#1A1A1A',
    weight = 400,
    anchor = 'start',
    style = 'normal',
    lineHeight = size + 4,
  } = options;
  add(`<text x="${x}" y="${y}" font-family="Segoe UI, Arial, sans-serif" font-size="${size}" fill="${color}" font-weight="${weight}" font-style="${style}" text-anchor="${anchor}">`);
  lines.forEach((line, index) => add(`<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${esc(line)}</tspan>`));
  add('</text>');
};
const image = (name, x, y, width, height) => add(`<image href="${icons[name].svg}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/>`);
const arrow = (points, color, width = 2, dashed = false) => {
  const d = points.map(([x, y], index) => `${index ? 'L' : 'M'} ${x} ${y}`).join(' ');
  add(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}"${dashed ? ' stroke-dasharray="7 5"' : ''} marker-end="url(#arrow)"/>`);
};

add('<?xml version="1.0" encoding="UTF-8"?>');
add('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1700" height="1150" viewBox="0 0 1700 1150" role="img" aria-labelledby="diagram-title diagram-desc">');
add('<title id="diagram-title">Azure Red Team and Blue Team lab architecture</title>');
add('<desc id="diagram-desc">Private VNet-integrated Azure Container Instances lab with isolated attacker and victim subnets, telemetry into Log Analytics and Microsoft Sentinel, and a SOC workflow.</desc>');
add('<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke"/></marker></defs>');
add('<rect width="1700" height="1150" fill="#FFFFFF"/>');

lineText(850, 42, 'Azure Red Team + Blue Team Lab — Option A (Private VNet-Integrated ACI)', { size: 18, weight: 700, anchor: 'middle' });
lineText(850, 62, 'Region: westus3  |  Resource Group: rg-redblue-lab  |  No public ingress anywhere', { size: 12, color: '#555555', anchor: 'middle' });

rect(300, 90, 1360, 1010, 'none', '#0078D4', 2, 8);
rect(316, 132, 1330, 950, 'none', '#8C8C8C', 1, 8, '7 5');
rect(346, 182, 800, 600, '#F0F7FF', '#0078D4', 2, 8);
rect(372, 236, 340, 250, '#FDECEA', '#C0392B', 1.5, 8);
rect(820, 236, 300, 350, '#FEF9E7', '#B9770E', 1.5, 8);
rect(1180, 182, 440, 600, '#F0F8F4', '#2E7D5B', 2, 8);
rect(346, 810, 1270, 50, '#FFF4E6', '#D35400', 1.5, 8);
rect(346, 910, 1270, 160, '#FFFFFF', '#8C8C8C', 1, 8);

arrow([[130, 470], [250, 470], [250, 300], [420, 300]], '#4A5BBF', 2, true);
arrow([[480, 300], [610, 300], [610, 350], [738, 350]], '#C0392B', 2);
arrow([[786, 350], [850, 350], [850, 312], [920, 312]], '#C0392B', 2);
arrow([[786, 350], [800, 350], [800, 452], [920, 452]], '#C0392B', 2);
arrow([[1120, 411], [1150, 411], [1150, 250], [1230, 250]], '#2E7D5B', 2);
arrow([[1278, 250], [1325, 250], [1325, 478], [1370, 478]], '#2E7D5B', 1.5);
arrow([[1278, 322], [1340, 322], [1340, 478], [1370, 478]], '#2E7D5B', 1.5);
arrow([[1278, 394], [1355, 394], [1355, 478], [1370, 478]], '#2E7D5B', 1.5, true);
arrow([[1398, 506], [1398, 560]], '#2E7D5B', 2);
arrow([[1398, 616], [1398, 680]], '#2E7D5B', 1, true);
arrow([[1398, 616], [1530, 616], [1530, 810]], '#D35400', 2);

image('azure', 320, 96, 36, 36);
lineText(370, 116, 'AZURE CLOUD', { size: 14, color: '#0078D4', weight: 700 });
image('resourceGroup', 322, 136, 30, 30);
lineText(362, 154, 'Resource Group: rg-redblue-lab  (single-command teardown)', { size: 12, color: '#555555', weight: 400, style: 'italic' });
image('vnet', 352, 186, 34, 34);
lineText(396, 207, 'VNet  vnet-redblue-lab  10.20.0.0/16', { size: 13, color: '#0078D4', weight: 700 });
lineText(542, 260, 'snet-attacker  10.20.2.0/24', { size: 12, color: '#C0392B', weight: 700, anchor: 'middle' });
lineText(970, 260, 'snet-aci  10.20.1.0/24  (delegated: Microsoft.ContainerInstance)', { size: 12, color: '#B9770E', weight: 700, anchor: 'middle' });
lineText(1400, 207, 'BLUE TEAM / TELEMETRY PLANE', { size: 13, color: '#2E7D5B', weight: 700, anchor: 'middle' });

add('<g fill="none" stroke="#4A5BBF" stroke-width="4"><circle cx="100" cy="454" r="11"/><path d="M100 465 L100 490 M82 475 L118 475 M100 490 L84 510 M100 490 L116 510"/></g>');
lineText(100, 524, 'Security Analyst (You)', { size: 11, color: '#4A5BBF', weight: 700, anchor: 'middle' });
multiText(105, 548, ['Azure Portal · Azure CLI', 'az container exec → Kali', 'KQL in Sentinel'], { size: 10, color: '#4A5BBF', anchor: 'middle', lineHeight: 14 });

image('container', 420, 270, 60, 60);
lineText(450, 347, 'Kali Linux (ACI)', { size: 11, color: '#C0392B', weight: 700, anchor: 'middle' });
multiText(542, 374, ['RED TEAM attacker — private IP', 'access: az container exec', 'nmap · sqlmap · hydra · nikto', 'gobuster/ffuf · curl · netcat · Burp/ZAP'], { size: 10, color: '#C0392B', anchor: 'middle', lineHeight: 22 });
image('nsg', 738, 326, 48, 48);
lineText(762, 390, 'NSG-aci', { size: 11, color: '#5B8C2A', weight: 700, anchor: 'middle' });
multiText(762, 408, ['ALLOW inbound ONLY', 'from snet-attacker', 'DENY all else'], { size: 9, color: '#5B8C2A', anchor: 'middle', lineHeight: 12 });
lineText(745, 296, 'controlled attacks', { size: 10, color: '#C0392B', weight: 700, anchor: 'middle' });
lineText(260, 400, 'az container exec', { size: 10, color: '#4A5BBF', weight: 700, anchor: 'middle' });

image('container', 920, 282, 60, 60);
lineText(950, 358, 'DVWA (ACI)', { size: 11, color: '#B9770E', weight: 700, anchor: 'middle' });
multiText(970, 379, ['private IP · port 80', 'SQLi · XSS · brute force · LFI'], { size: 9, color: '#B9770E', anchor: 'middle', lineHeight: 13 });
image('container', 920, 422, 60, 60);
lineText(950, 498, 'Juice Shop (ACI)', { size: 11, color: '#B9770E', weight: 700, anchor: 'middle' });
multiText(970, 519, ['private IP · port 3000', 'OWASP Top 10 · IDOR · JWT · SSRF'], { size: 9, color: '#B9770E', anchor: 'middle', lineHeight: 13 });
lineText(372, 538, 'Outbound egress (image pull / apt) via ACI managed egress.  NO inbound from internet to any container.', { size: 10, color: '#555555', style: 'italic' });

image('container', 1230, 226, 48, 48);
lineText(1254, 290, 'ACI diagnostics', { size: 10, color: '#2E7D5B', anchor: 'middle' });
lineText(1295, 252, 'ContainerInstanceLog_CL · ContainerEvent_CL', { size: 10, color: '#2E7D5B' });
image('activity', 1230, 298, 48, 48);
lineText(1254, 362, 'Activity Log', { size: 10, color: '#2E7D5B', anchor: 'middle' });
lineText(1295, 326, 'AzureActivity (control-plane events)', { size: 10, color: '#2E7D5B' });
image('entra', 1230, 370, 48, 48);
lineText(1254, 434, 'Entra ID (Phase 8)', { size: 10, color: '#2E7D5B', anchor: 'middle' });
lineText(1295, 398, 'SigninLogs · AuditLogs (after MFA / CA)', { size: 10, color: '#2E7D5B', style: 'italic' });
image('logAnalytics', 1370, 450, 56, 56);
multiText(1398, 526, ['Log Analytics', 'law-redblue-lab'], { size: 11, color: '#2E7D5B', weight: 700, anchor: 'middle', lineHeight: 14 });
image('sentinel', 1370, 560, 56, 56);
multiText(1398, 638, ['Microsoft Sentinel', 'Rules · Incidents · Hunting'], { size: 11, color: '#2E7D5B', weight: 700, anchor: 'middle', lineHeight: 14 });
image('defender', 1370, 680, 56, 56);
multiText(1398, 758, ['Defender for Cloud', 'free CSPM · Secure Score'], { size: 11, color: '#2E7D5B', weight: 700, anchor: 'middle', lineHeight: 14 });
lineText(1173, 246, 'container logs', { size: 10, color: '#2E7D5B', weight: 700, anchor: 'middle' });

lineText(981, 841, 'SOC WORKFLOW:   Detect  →  Triage  →  Investigate (IP / user / process / network)  →  Scope & Severity  →  Contain  →  Eradicate  →  Recover  →  Lessons Learned', { size: 12, color: '#D35400', weight: 700, anchor: 'middle' });
lineText(981, 887, 'Mappings:  OWASP Top 10  ·  MITRE ATT&CK  ·  Detection Engineering (KQL → Sentinel Analytics Rules)', { size: 11, color: '#555555', style: 'italic', anchor: 'middle' });
lineText(360, 932, 'LEGEND', { size: 11, color: '#333333', weight: 700 });
lineText(366, 957, 'Red = Red Team (attacker)', { size: 10, color: '#C0392B' });
lineText(366, 982, 'Yellow = Victim / vulnerable apps', { size: 10, color: '#B9770E' });
lineText(366, 1007, 'Green = Blue Team / telemetry / SIEM', { size: 10, color: '#2E7D5B' });
lineText(760, 957, 'Orange = SOC workflow / incident response', { size: 10, color: '#D35400' });
lineText(760, 982, 'Dashed = planned / later phase (Entra, Conditional Access)', { size: 10, color: '#555555' });
lineText(366, 1040, 'Isolation: no public ingress anywhere; victims reachable only from snet-attacker via NSG; analyst reaches Kali via az container exec.', { size: 10, color: '#333333', style: 'italic' });

add('</svg>');
fs.writeFileSync(svgPath, parts.join(''));
console.log(`Updated ${drawioPath}`);
console.log(`Wrote ${svgPath}`);
