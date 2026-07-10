import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const artRoot = path.join(root, 'public', 'assets', 'art');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeAsset(relativePath, svg) {
  const file = path.join(artRoot, relativePath);
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, svg, 'utf8');
}

const palette = {
  ink: '#241d18',
  line: '#6d5639',
  gold: '#b88935',
  pale: '#f5e6c7',
  paper: '#f2dfbd',
  shade: '#927452',
  steel: '#5f6563',
  darkSteel: '#22282a',
  red: '#8b3430',
  wine: '#5d2228',
  teal: '#2f6964',
  green: '#536844',
  bone: '#d8c596',
  wax: '#ead7af',
  violet: '#5c4b82',
  ember: '#c66b38'
};

function defs(accent = palette.gold) {
  return `
  <defs>
    <filter id="softShadow" x="-25%" y="-25%" width="150%" height="160%">
      <feDropShadow dx="0" dy="8" stdDeviation="5" flood-color="#000000" flood-opacity=".32"/>
    </filter>
    <linearGradient id="inkWash" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#fff7e5"/>
      <stop offset=".58" stop-color="${palette.paper}"/>
      <stop offset="1" stop-color="#d7bb88"/>
    </linearGradient>
    <linearGradient id="robe" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#4c4036"/>
      <stop offset=".56" stop-color="#1d1a18"/>
      <stop offset="1" stop-color="#0c0b0b"/>
    </linearGradient>
    <linearGradient id="metal" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#b9b5a8"/>
      <stop offset=".42" stop-color="${palette.steel}"/>
      <stop offset="1" stop-color="#15191a"/>
    </linearGradient>
    <radialGradient id="aura" cx="50%" cy="44%" r="60%">
      <stop offset="0" stop-color="${accent}" stop-opacity=".30"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>`;
}

function svg(width, height, body, accent = palette.gold) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
${defs(accent)}
<path d="M25 ${height - 20} C72 ${height - 8} ${width - 70} ${height - 8} ${width - 25} ${height - 20}" fill="#000" opacity=".24"/>
<g filter="url(#softShadow)">
${body}
</g>
<path d="M33 ${height - 10} C78 ${height - 2} ${width - 80} ${height - 2} ${width - 33} ${height - 10}" fill="none" stroke="${palette.gold}" stroke-width="1.8" opacity=".18"/>
</svg>`;
}

function polyPath(points, close = true) {
  const [first, ...rest] = points;
  return `M${first[0]} ${first[1]} ${rest.map(([x, y]) => `L${x} ${y}`).join(' ')}${close ? ' Z' : ''}`;
}

function highlight(d, color = palette.pale, opacity = 0.38, width = 3) {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" opacity="${opacity}"/>`;
}

function heroKnight() {
  return svg(240, 280, `
    <path d="${polyPath([[63,232],[49,93],[79,55],[117,70],[157,50],[187,93],[173,235],[126,248]])}" fill="${palette.wine}"/>
    <path d="${polyPath([[79,235],[86,90],[113,56],[144,72],[164,234],[134,251]])}" fill="url(#metal)"/>
    <path d="${polyPath([[90,80],[114,48],[140,80],[127,115],[103,112]])}" fill="#d6c2a0"/>
    <path d="${polyPath([[70,100],[34,204],[88,177]])}" fill="${palette.red}"/>
    <path d="${polyPath([[171,89],[205,111],[191,178],[158,167]])}" fill="#383b3c" stroke="${palette.gold}" stroke-width="4"/>
    <path d="M61 96 L25 244" stroke="#d9d2bf" stroke-width="8" stroke-linecap="round"/>
    <path d="M57 101 L20 242" stroke="#51342a" stroke-width="3" stroke-linecap="round"/>
    <path d="M94 118 C118 132 143 128 160 111" stroke="${palette.gold}" stroke-width="5" fill="none"/>
    <path d="M96 143 C120 151 143 147 162 135" stroke="${palette.pale}" stroke-width="3" fill="none" opacity=".42"/>
    <path d="M98 219 L85 265 M143 218 L156 265" stroke="#1b1e1e" stroke-width="16" stroke-linecap="round"/>
    ${highlight('M92 92 C112 101 136 101 155 90')}
    ${highlight('M103 133 L143 137', palette.gold, .46, 2)}
  `, palette.red);
}

function heroNun() {
  return svg(230, 280, `
    <path d="${polyPath([[58,244],[66,82],[91,42],[120,33],[153,72],[174,244],[121,260]])}" fill="url(#robe)"/>
    <path d="${polyPath([[85,235],[92,83],[117,58],[144,83],[152,235],[120,254]])}" fill="#f3e5c9"/>
    <path d="M91 55 C105 38 132 37 148 56 L143 84 L96 84 Z" fill="#ece2d0"/>
    <path d="M96 80 C111 94 130 94 143 80" stroke="${palette.gold}" stroke-width="3" fill="none"/>
    <path d="M72 120 C54 153 47 198 50 240" stroke="${palette.gold}" stroke-width="2" fill="none" opacity=".55"/>
    <path d="M159 117 C176 154 186 206 179 244" stroke="${palette.gold}" stroke-width="2" fill="none" opacity=".55"/>
    <path d="M67 129 C94 151 137 149 166 128" fill="none" stroke="#f6efe0" stroke-width="13" opacity=".82"/>
    <path d="M45 177 C78 178 89 162 98 132" stroke="#1c1a17" stroke-width="16" fill="none" stroke-linecap="round"/>
    <path d="M174 170 C197 144 193 111 184 80" stroke="#4a2d20" stroke-width="9" stroke-linecap="round"/>
    <path d="M184 80 L184 240" stroke="${palette.gold}" stroke-width="5" stroke-linecap="round"/>
    <path d="M170 82 L198 82" stroke="${palette.gold}" stroke-width="4" stroke-linecap="round"/>
    <path d="M184 43 C173 65 196 65 184 43 Z" fill="#f4b45b"/>
    ${highlight('M108 111 L132 111 M120 98 L120 132', palette.gold, .6, 2.4)}
  `, '#d6a84d');
}

function heroAlchemist() {
  return svg(240, 280, `
    <path d="${polyPath([[58,238],[78,75],[111,47],[145,62],[179,238],[129,258]])}" fill="#1f2523"/>
    <path d="${polyPath([[83,235],[94,89],[118,62],[143,87],[158,235],[121,254]])}" fill="#e8dcc6"/>
    <path d="${polyPath([[73,96],[43,218],[92,190]])}" fill="#263836"/>
    <path d="${polyPath([[164,94],[199,214],[146,195]])}" fill="#263836"/>
    <path d="M87 134 C111 149 143 146 165 130" stroke="${palette.teal}" stroke-width="7" fill="none"/>
    <path d="M61 130 L29 174" stroke="#d7d1bd" stroke-width="7" stroke-linecap="round"/>
    <path d="M168 112 C190 104 207 90 218 72" stroke="#d7d1bd" stroke-width="7" stroke-linecap="round"/>
    <path d="M211 68 C190 56 181 80 198 92 C219 103 230 78 211 68 Z" fill="#79b2a5" stroke="${palette.gold}" stroke-width="4"/>
    <path d="M188 86 C201 93 215 88 220 76" stroke="#ffffff" stroke-width="3" fill="none" opacity=".48"/>
    <path d="M90 205 C111 215 144 213 164 201" stroke="${palette.gold}" stroke-width="3" fill="none" opacity=".52"/>
    <path d="M93 221 L77 265 M145 220 L164 265" stroke="#1a1714" stroke-width="16" stroke-linecap="round"/>
    ${highlight('M96 96 C119 107 143 105 157 91', palette.gold, .42, 2)}
    ${highlight('M104 139 L145 133', '#83c5b8', .5, 2)}
  `, palette.teal);
}

const profiles = {
  'rotting-villager': ['rag', palette.green, palette.ink, 'M83 87 C95 120 134 123 145 86'],
  'graveyard-skeleton': ['skeleton', palette.bone, '#4c4f4a', 'M77 102 L151 102'],
  'black-hound': ['hound', '#141414', palette.red, 'M54 151 C93 132 152 135 184 156'],
  'plague-rat-swarm': ['swarm', '#464b32', '#7e4f37', 'M48 175 C92 145 151 150 187 178'],
  'crow-messenger': ['bird', '#191923', palette.gold, 'M54 118 C98 71 146 79 183 124'],
  'armor-broken-militia': ['militia', '#3f3b34', '#8f693b', 'M72 121 C102 137 138 133 162 114'],
  'candle-monk': ['monk', '#3a3026', palette.gold, 'M84 86 C103 111 134 111 152 87'],
  'pointed-witch': ['witch', '#35233f', '#895fb0', 'M54 112 C101 78 143 77 190 110'],
  'plague-doctor': ['doctor', '#1c1b18', '#679461', 'M79 87 C111 70 145 79 170 103'],
  'iron-maiden-nun': ['ironNun', '#2f3135', '#8e3038', 'M66 80 C100 59 138 60 174 80'],
  'fallen-paladin': ['paladin', '#22272b', palette.red, 'M70 101 C101 82 139 82 169 102'],
  'wax-novice': ['monk', '#e3d0a6', '#9a7442', 'M82 90 C103 112 134 112 153 88'],
  'cinder-acolyte': ['monk', '#2d241e', palette.ember, 'M84 90 C106 111 135 108 152 86'],
  'bell-tower-sentry': ['militia', '#3b4144', palette.gold, 'M65 116 C100 132 141 130 171 111'],
  'scripture-moth-swarm': ['moth', '#d7c28b', '#6b6048', 'M49 132 C98 88 145 88 194 132'],
  'choir-exorcist': ['exorcist', '#c7b686', '#334151', 'M69 94 C102 77 141 78 172 96'],
  'reliquary-jailer': ['jailer', '#2f2d2b', palette.gold, 'M64 104 C100 88 140 88 174 103'],
  'ash-veiled-prioress': ['ironNun', '#5b5145', '#d9c28e', 'M66 81 C101 60 137 61 174 80'],
  'pale-wax-matron': ['matron', '#efe0be', '#37312d', 'M60 83 C102 43 152 43 195 84'],
  'hollow-spearman': ['spearman', '#2d3335', '#9a7544', 'M70 101 C102 82 139 82 170 102'],
  'ashen-banneret': ['banner', '#383a40', '#9b6b37', 'M62 101 C99 79 140 80 176 104'],
  'gutter-fire-archer': ['archer', '#2c211b', palette.ember, 'M69 104 C103 84 139 84 170 105'],
  'crownless-hound': ['hound', '#101010', palette.gold, 'M49 151 C91 130 153 132 189 156'],
  'gate-iron-vicar': ['vicar', '#252c31', palette.gold, 'M62 96 C101 76 142 76 178 98'],
  'royal-pyre-knight': ['pyreKnight', '#20272d', '#d5a24c', 'M69 99 C101 80 139 80 169 100'],
  'clockwork-confessor': ['clockwork', '#39342d', palette.violet, 'M68 98 C101 79 140 79 172 99'],
  'headless-grave-knight': ['graveBoss', '#20262c', palette.red, 'M87 95 C132 63 181 67 217 101'],
  'hollow-crown-regent': ['regent', '#181c20', palette.gold, 'M72 83 C124 34 184 38 228 86']
};

function enemyBody(id, kind, main, accent, gesture) {
  const commonGlow = `<path d="${gesture}" fill="none" stroke="${accent}" stroke-width="3" opacity=".22"/>`;
  const weapon = `<path d="M161 80 L190 238" stroke="${palette.line}" stroke-width="7" stroke-linecap="round"/><path d="M188 70 L196 102 L173 92 Z" fill="${accent}"/>`;
  if (kind === 'hound') {
    return `
      <path d="M33 176 C62 128 145 121 187 153 C197 170 182 192 136 192 L78 193 C45 194 25 190 33 176 Z" fill="${main}"/>
      <path d="M145 128 C161 105 188 112 197 136 C184 135 174 137 163 146 Z" fill="${main}"/>
      <path d="M158 118 L171 85 L180 124 Z M183 123 L207 94 L198 139 Z" fill="${main}"/>
      <path d="M49 178 L31 235 M89 187 L78 241 M137 187 L146 241 M174 177 L196 235" stroke="#0b0b0b" stroke-width="12" stroke-linecap="round"/>
      <path d="M190 143 L216 150 L190 159 Z" fill="${accent}"/>
      <path d="M38 162 C25 132 13 119 4 111" stroke="#0c0c0c" stroke-width="9" stroke-linecap="round"/>
      ${highlight('M64 147 C103 133 143 136 169 151', '#807b67', .28, 3)}
    `;
  }
  if (kind === 'swarm') {
    return Array.from({ length: 10 }, (_, i) => {
      const x = 34 + (i % 5) * 36 + (i > 4 ? 18 : 0);
      const y = 154 + Math.floor(i / 5) * 42 + (i % 2) * 7;
      return `<path d="M${x - 19} ${y} C${x - 3} ${y - 18} ${x + 25} ${y - 11} ${x + 30} ${y + 4} C${x + 12} ${y + 20} ${x - 20} ${y + 16} ${x - 19} ${y} Z" fill="${i % 2 ? '#343726' : main}"/>
      <path d="M${x + 21} ${y - 2} L${x + 51} ${y - 12} L${x + 28} ${y + 9} Z" fill="${accent}"/>
      <path d="M${x - 12} ${y + 5} C${x - 30} ${y + 12} ${x - 40} ${y + 17} ${x - 50} ${y + 11}" stroke="${palette.line}" stroke-width="2" fill="none"/>`;
    }).join('\n');
  }
  if (kind === 'bird' || kind === 'moth') {
    const wing = kind === 'moth' ? palette.wax : '#12131a';
    return `
      <path d="M101 109 C55 69 19 92 7 149 C56 151 92 139 112 116 Z" fill="${wing}" opacity="${kind === 'moth' ? .82 : 1}"/>
      <path d="M119 112 C161 68 203 91 214 151 C163 151 132 139 112 118 Z" fill="${wing}" opacity="${kind === 'moth' ? .82 : 1}"/>
      <path d="M84 86 C100 62 130 63 145 88 L139 173 C122 193 96 190 79 172 Z" fill="${main}"/>
      <path d="M108 61 C124 50 145 58 151 76 L124 87 Z" fill="${main}"/>
      <path d="M143 76 L198 85 L149 99 Z" fill="${accent}"/>
      <path d="M101 167 L80 234 M123 168 L148 234" stroke="${palette.ink}" stroke-width="8" stroke-linecap="round"/>
      ${highlight('M28 130 C62 123 91 115 112 102', accent, .35, 2)}
      ${highlight('M194 132 C160 124 132 116 111 103', accent, .35, 2)}
    `;
  }
  const head = kind === 'graveBoss' ? '' : `<path d="M88 38 C112 17 145 20 162 44 C156 74 96 76 88 38 Z" fill="${kind === 'skeleton' ? palette.bone : kind === 'doctor' ? '#151414' : kind === 'matron' ? palette.wax : '#d2bea0'}"/>`;
  const body = `<path d="${polyPath([[57,232],[69,84],[96,49],[129,66],[158,47],[184,86],[169,235],[118,252]])}" fill="${main}"/>`;
  const robe = `<path d="${polyPath([[77,230],[88,95],[113,65],[139,95],[151,230],[116,251]])}" fill="${kind === 'matron' ? '#fff2d5' : kind === 'skeleton' ? 'none' : '#1b1a17'}" opacity="${kind === 'skeleton' ? 0 : .72}"/>`;
  const face = kind === 'skeleton'
    ? `<path d="M87 51 C105 28 139 29 155 53 L146 80 L96 80 Z" fill="${palette.bone}"/><path d="M101 57 L111 57 M131 57 L141 57" stroke="#17110d" stroke-width="7" stroke-linecap="round"/><path d="M105 75 L137 75" stroke="#17110d" stroke-width="4"/>`
    : head;
  const legs = `<path d="M92 217 L77 252 M138 217 L157 252" stroke="#151414" stroke-width="15" stroke-linecap="round"/>`;
  const details = {
    rag: `<path d="M63 102 C89 134 135 136 163 103" fill="none" stroke="${accent}" stroke-width="6" opacity=".42"/><path d="M56 132 C76 178 111 193 169 168" stroke="#6f3a2f" stroke-width="5" fill="none" opacity=".45"/>`,
    skeleton: `<path d="M78 98 L151 98 M84 116 L143 116 M92 135 L135 135" stroke="${palette.bone}" stroke-width="7" stroke-linecap="round"/><path d="M113 98 L103 196 M124 98 L136 196" stroke="${palette.bone}" stroke-width="6" stroke-linecap="round"/>${weapon}`,
    militia: `<path d="M69 96 L162 96 L155 171 L75 171 Z" fill="url(#metal)"/><path d="M45 128 L82 112 L79 181 L42 184 Z" fill="#33373b" stroke="${accent}" stroke-width="3"/>${weapon}`,
    spearman: `<path d="M74 98 L160 98 L153 174 L80 174 Z" fill="url(#metal)"/><path d="M181 36 L180 238" stroke="${accent}" stroke-width="5"/><path d="M181 20 L195 55 L166 55 Z" fill="#d8d0b2"/>`,
    banner: `<path d="M75 98 L160 98 L153 174 L80 174 Z" fill="url(#metal)"/><path d="M174 45 L174 235" stroke="${accent}" stroke-width="5"/><path d="M176 50 L217 68 L216 154 L176 137 Z" fill="${palette.wine}"/>`,
    archer: `<path d="M68 118 C96 139 134 136 162 113" stroke="${accent}" stroke-width="5" fill="none"/><path d="M176 75 C207 115 207 170 176 210" fill="none" stroke="${accent}" stroke-width="5"/><path d="M176 75 L176 210" stroke="#d9cfaa" stroke-width="2"/>`,
    monk: `<path d="M83 84 C103 105 132 105 152 84" stroke="${accent}" stroke-width="5" fill="none"/><path d="M167 74 L167 229" stroke="${accent}" stroke-width="5"/><path d="M154 76 L180 76" stroke="${accent}" stroke-width="4"/><path d="M167 45 C154 68 181 68 167 45 Z" fill="${palette.ember}"/>`,
    witch: `<path d="M44 88 L113 13 L182 88 Z" fill="#1e1428"/><path d="M42 91 C90 103 139 104 185 92" stroke="${accent}" stroke-width="8" fill="none"/><path d="M176 95 L198 232" stroke="${palette.line}" stroke-width="6"/><path d="M190 111 C205 121 213 141 204 158" stroke="${accent}" stroke-width="5" fill="none"/>`,
    doctor: `<path d="M128 58 L202 75 L137 93 Z" fill="#d8cfb2"/><path d="M62 130 C94 150 140 151 174 129" stroke="${accent}" stroke-width="5" fill="none"/><path d="M52 164 C66 147 81 139 96 133" stroke="${accent}" stroke-width="9" fill="none" opacity=".8"/>`,
    ironNun: `<path d="M59 68 C88 51 139 48 178 69 L160 238 L73 238 Z" fill="${main}" stroke="${accent}" stroke-width="4"/><path d="M83 87 L153 87 L145 124 L91 124 Z" fill="#111"/><path d="M79 145 L101 153 L79 164 M151 145 L129 153 L151 164 M80 178 L102 186 L80 197 M151 178 L129 186 L151 197" stroke="#aaa391" stroke-width="4" fill="none"/>`,
    paladin: `<path d="M69 94 L161 94 L158 178 L73 178 Z" fill="url(#metal)"/><path d="M53 78 L26 223 L80 190 Z" fill="${palette.wine}"/><path d="M174 62 L200 235" stroke="${accent}" stroke-width="7"/>`,
    exorcist: `<path d="M67 92 L164 93 L160 190 L72 190 Z" fill="#eee2c4" opacity=".82"/><path d="M76 132 L154 132" stroke="${accent}" stroke-width="5"/><path d="M115 101 L115 168" stroke="${accent}" stroke-width="5"/>`,
    jailer: `<path d="M42 105 L91 82 L98 177 L46 186 Z" fill="#3a3330" stroke="${accent}" stroke-width="4"/><path d="M153 62 L198 104 L187 173 L143 151 Z" fill="#5f4b32"/><path d="M57 186 C95 212 139 206 173 176" stroke="${accent}" stroke-width="5" fill="none"/>`,
    matron: `<path d="M66 76 C96 41 158 40 193 76 L173 241 L81 241 Z" fill="#fff3d8" stroke="${accent}" stroke-width="4"/><path d="M82 102 C111 125 151 123 177 99" stroke="#d7b669" stroke-width="6" fill="none"/><path d="M67 156 C101 179 151 178 185 154" fill="none" stroke="#c8b085" stroke-width="4" opacity=".5"/>`,
    vicar: `<path d="M65 94 L169 94 L158 196 L77 196 Z" fill="url(#metal)"/><path d="M50 56 L114 26 L180 58 L163 84 L66 82 Z" fill="#242a2e" stroke="${accent}" stroke-width="4"/><path d="M183 86 L203 218" stroke="${accent}" stroke-width="10"/>`,
    pyreKnight: `<path d="M69 94 L161 94 L158 178 L73 178 Z" fill="url(#metal)"/><path d="M58 118 C93 147 139 146 170 116" stroke="${accent}" stroke-width="6" fill="none"/><path d="M37 216 L86 74" stroke="#e7d0a4" stroke-width="8" stroke-linecap="round"/>`,
    clockwork: `<path d="M69 95 L160 95 L157 186 L73 186 Z" fill="#2d2924"/><path d="M94 126 C115 105 146 122 139 151 C124 174 91 160 94 126 Z" fill="none" stroke="${accent}" stroke-width="5"/><path d="M117 126 L117 145 L132 151" stroke="${accent}" stroke-width="4" fill="none"/>`,
    graveBoss: `<path d="M61 238 L78 82 L118 49 L164 70 L202 56 L232 90 L214 302 L121 326 Z" fill="${main}"/><path d="M83 102 L193 103 L184 204 L91 203 Z" fill="url(#metal)"/><path d="M118 45 C141 22 177 28 193 53 L176 78 L135 75 Z" fill="#090909" stroke="${accent}" stroke-width="5"/><path d="M63 93 L17 300 L106 265 Z" fill="${palette.wine}"/><path d="M210 49 L259 319" stroke="${accent}" stroke-width="10" stroke-linecap="round"/>`,
    regent: `<path d="M53 232 L78 75 L126 43 L176 51 L222 76 L240 236 L151 260 Z" fill="${main}"/><path d="M82 90 C122 66 177 66 218 91" stroke="${accent}" stroke-width="7" fill="none"/><path d="M98 54 L125 24 L151 57 L177 25 L204 55" fill="none" stroke="${accent}" stroke-width="6"/><path d="M80 139 C121 172 180 172 222 138" fill="none" stroke="#d8c596" stroke-width="4" opacity=".5"/>`
  };
  return `
    <path d="M42 66 C83 33 151 31 195 66 C170 41 71 41 42 66 Z" fill="url(#aura)"/>
    ${body}
    ${robe}
    ${face}
    ${legs}
    ${details[kind] ?? details.rag}
    ${commonGlow}
  `;
}

function writeEnemies() {
  for (const [id, [kind, main, accent, gesture]] of Object.entries(profiles)) {
    const isBoss = kind === 'graveBoss' || kind === 'matron' || kind === 'regent';
    const width = isBoss ? 420 : 220;
    const height = isBoss ? 420 : 260;
    const body = enemyBody(id, kind, main, accent, gesture);
    const file = isBoss ? `bosses/${id}.svg` : `enemies/${id}.svg`;
    writeAsset(file, svg(width, height, body, accent));
  }
}

function storyPanel(index, title, body) {
  const accent = [palette.gold, palette.red, palette.teal][index] ?? palette.gold;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="860" height="320" viewBox="0 0 860 320" role="img">
${defs(accent)}
<rect width="860" height="320" rx="22" fill="url(#inkWash)"/>
<path d="M24 29 C244 15 582 12 835 28 M31 294 C258 315 598 313 832 292" fill="none" stroke="${palette.line}" stroke-width="2" opacity=".42"/>
<path d="M48 53 C230 39 630 40 810 57 L795 268 C594 288 232 286 63 268 Z" fill="#fff4dd" opacity=".28" stroke="${palette.gold}" stroke-width="2"/>
${body}
<text x="74" y="265" font-family="Georgia, 'Microsoft YaHei', serif" font-size="25" fill="#6b4c2f" stroke="#f6e2b9" stroke-width=".8">${title}</text>
<path d="M70 279 C230 270 430 271 596 278" fill="none" stroke="${accent}" stroke-width="2" opacity=".45"/>
</svg>`;
}

function writeStory() {
  writeAsset('story/prologue-page-1.svg', storyPanel(0, '圣火守城', `
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M77 237 C147 208 242 205 329 224 C406 240 491 246 579 228 C659 211 744 215 805 240" stroke="${palette.line}" stroke-width="3" opacity=".34"/>
      <path d="M94 223 C155 196 234 196 315 213 C411 234 492 231 570 212 C653 191 733 200 790 222" stroke="${palette.line}" stroke-width="2" opacity=".26"/>
      <path d="M110 216 L115 125 C140 103 165 97 190 118 L192 214" stroke="${palette.line}" stroke-width="4"/>
      <path d="M129 117 C151 67 187 68 212 117 M146 91 C164 75 188 76 203 94" stroke="${palette.line}" stroke-width="2.3" opacity=".72"/>
      <path d="M134 147 C152 137 174 137 190 148 M141 170 C153 162 178 162 189 171 M139 195 C156 187 176 189 190 196" stroke="${palette.line}" stroke-width="1.7" opacity=".62"/>
      <path d="M228 219 L230 107 C255 78 287 75 315 107 L319 225" stroke="${palette.line}" stroke-width="4"/>
      <path d="M240 112 C262 89 288 90 308 113 M255 139 C269 130 291 131 305 142 M254 168 C270 158 292 159 307 170" stroke="${palette.line}" stroke-width="1.8" opacity=".62"/>
      <path d="M332 228 L338 92 C370 56 421 57 451 94 L459 232" stroke="${palette.line}" stroke-width="4.4"/>
      <path d="M354 96 C383 66 418 67 444 98 M367 131 C388 119 421 121 440 134 M363 166 C391 151 423 154 444 168" stroke="${palette.line}" stroke-width="2" opacity=".62"/>
      <path d="M503 232 C524 208 556 205 579 227 M540 221 L544 153 C563 130 592 130 610 153 L613 222" stroke="${palette.line}" stroke-width="3.4" opacity=".72"/>
      <path d="M556 153 C575 134 596 136 609 155 M563 179 C579 172 596 173 607 181" stroke="${palette.line}" stroke-width="1.6" opacity=".58"/>
      <path d="M625 224 C655 191 714 190 753 224 M675 215 L679 111 C704 74 742 80 762 116 L767 221" stroke="${palette.line}" stroke-width="3.8" opacity=".78"/>
      <path d="M691 119 C710 92 742 97 758 121 M700 150 C720 140 744 143 760 153 M700 183 C724 173 747 176 764 186" stroke="${palette.line}" stroke-width="1.8" opacity=".58"/>
      <path d="M424 245 C493 230 573 232 640 247" stroke="${palette.gold}" stroke-width="2.2" opacity=".35"/>
      <path d="M529 226 C485 190 496 145 548 110 C590 147 586 196 529 226 Z" fill="${palette.gold}" opacity=".16" stroke="${palette.gold}" stroke-width="3"/>
      <path d="M542 202 C516 176 524 142 552 120 C574 150 569 183 542 202 Z" fill="${palette.ember}" opacity=".38" stroke="${palette.ember}" stroke-width="2"/>
      <path d="M508 96 C566 64 671 66 734 99 M487 118 C556 96 679 96 759 121" stroke="${palette.gold}" stroke-width="1.7" opacity=".28"/>
      <path d="M513 255 C553 247 594 248 636 258" stroke="${palette.line}" stroke-width="2" opacity=".34"/>
      <path d="M382 222 C397 205 416 204 429 222 M394 219 L397 188 C405 178 416 179 423 190 L425 221" stroke="${palette.line}" stroke-width="2.3" opacity=".62"/>
      <path d="M401 188 C410 178 419 180 424 191 M404 202 C413 197 421 199 426 205" stroke="${palette.line}" stroke-width="1.2" opacity=".55"/>
      <path d="M456 225 C470 208 488 209 501 225 M467 223 L470 194 C477 184 488 185 495 196 L497 224" stroke="${palette.line}" stroke-width="2.2" opacity=".56"/>
      <path d="M703 247 C724 235 755 236 779 249 M732 238 C739 226 754 226 762 239" stroke="${palette.line}" stroke-width="1.8" opacity=".38"/>
      <path d="M70 246 C122 232 177 233 229 248 M250 251 C303 239 354 240 405 253" stroke="${palette.line}" stroke-width="1.7" opacity=".28"/>
      <path d="M119 231 C122 217 128 207 138 199 C147 208 151 218 149 232 M245 235 C249 220 257 209 268 201 C277 213 279 224 276 236" stroke="${palette.gold}" stroke-width="1.5" opacity=".36"/>
      <path d="M596 240 C618 229 643 230 666 241 M630 233 C637 221 650 222 657 234" stroke="${palette.line}" stroke-width="1.7" opacity=".35"/>
    </g>
  `));
  writeAsset('story/prologue-page-2.svg', storyPanel(1, '灰雾逼近', `
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M71 231 C166 199 284 201 374 229 C462 258 578 253 676 229 C722 218 771 221 808 237" stroke="${palette.line}" stroke-width="3" opacity=".32"/>
      <path d="M84 197 C156 165 252 163 341 186 C432 209 533 210 640 183 C711 165 768 176 815 200" stroke="${palette.line}" stroke-width="11" opacity=".10"/>
      <path d="M74 164 C166 126 286 126 391 153 C494 180 587 176 689 142 C740 126 786 132 819 152" stroke="#554639" stroke-width="5" opacity=".21"/>
      <path d="M100 109 C205 78 322 87 429 116 C528 143 636 134 748 96" stroke="${palette.red}" stroke-width="2.2" opacity=".22"/>
      <path d="M110 127 C206 98 316 105 414 132 C514 160 620 151 731 115" stroke="${palette.line}" stroke-width="1.5" opacity=".25"/>
      <path d="M149 228 L154 139 C174 118 198 117 220 138 L225 226" stroke="${palette.line}" stroke-width="3.2" opacity=".64"/>
      <path d="M166 139 C181 122 202 122 217 140 M176 165 C189 158 207 159 219 167 M175 190 C190 184 209 185 222 193" stroke="${palette.line}" stroke-width="1.5" opacity=".55"/>
      <path d="M272 228 L280 105 C310 68 359 71 385 109 L392 231" stroke="${palette.line}" stroke-width="4" opacity=".68"/>
      <path d="M294 109 C318 82 354 83 379 112 M305 145 C326 133 358 136 380 149 M304 181 C331 166 362 171 384 184" stroke="${palette.line}" stroke-width="1.8" opacity=".55"/>
      <path d="M476 238 L505 103 L566 65 L627 109 L650 240" stroke="${palette.line}" stroke-width="4.4"/>
      <path d="M536 81 L536 234 M499 144 C534 128 589 130 628 148 M510 180 C541 165 598 167 640 184" stroke="${palette.line}" stroke-width="2" opacity=".68"/>
      <path d="M598 85 C634 119 656 161 665 217" stroke="${palette.red}" stroke-width="4" opacity=".42"/>
      <path d="M628 91 C661 130 684 174 689 230" stroke="${palette.red}" stroke-width="2.3" opacity=".26"/>
      <path d="M143 247 C210 231 286 233 352 250 M494 257 C560 243 639 244 709 257" stroke="${palette.gold}" stroke-width="1.7" opacity=".25"/>
      <path d="M705 220 C725 195 754 193 778 221 M733 213 L734 166 C748 152 766 154 777 169 L780 218" stroke="${palette.line}" stroke-width="2.7" opacity=".58"/>
      <path d="M728 106 C751 127 767 152 777 190" stroke="${palette.red}" stroke-width="2" opacity=".32"/>
    </g>
  `));
  writeAsset('story/prologue-page-3.svg', storyPanel(2, '余烬启程', `
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M78 238 C166 215 283 211 389 230 C497 249 606 251 790 230" stroke="${palette.line}" stroke-width="3" opacity=".33"/>
      <path d="M105 218 C198 189 312 191 405 209 C512 231 632 230 762 207" stroke="${palette.line}" stroke-width="2" opacity=".24"/>
      <path d="M138 246 C195 219 265 219 323 247 M535 249 C610 226 697 224 777 247" stroke="${palette.gold}" stroke-width="1.7" opacity=".30"/>
      <path d="M195 230 C219 176 260 145 313 138 C345 168 344 203 309 228" stroke="${palette.line}" stroke-width="4"/>
      <path d="M243 135 C246 105 272 83 304 90" stroke="${palette.teal}" stroke-width="4"/>
      <path d="M242 159 C260 146 291 145 314 160 M236 190 C263 175 299 178 322 193" stroke="${palette.line}" stroke-width="1.8" opacity=".58"/>
      <path d="M207 229 C213 206 220 184 233 163 M291 228 C298 203 305 180 316 158" stroke="${palette.line}" stroke-width="2" opacity=".55"/>
      <path d="M415 231 L430 104 C450 80 480 80 500 105 L508 233" stroke="${palette.line}" stroke-width="4"/>
      <path d="M454 85 C437 116 479 118 454 85 Z" fill="${palette.gold}" opacity=".23" stroke="${palette.gold}" stroke-width="2.6"/>
      <path d="M438 121 C456 105 483 107 499 123 M439 154 C459 144 486 145 504 157 M437 190 C462 177 490 179 508 193" stroke="${palette.line}" stroke-width="1.8" opacity=".58"/>
      <path d="M422 231 C438 205 461 190 487 185 C505 198 512 216 508 234" stroke="${palette.line}" stroke-width="2.6" opacity=".65"/>
      <path d="M608 226 C631 178 670 151 721 147 C752 171 752 205 722 227" stroke="${palette.line}" stroke-width="4"/>
      <path d="M660 144 C666 116 688 96 720 100" stroke="${palette.teal}" stroke-width="3.4"/>
      <path d="M649 169 C669 154 701 155 725 171 M646 198 C672 184 706 186 730 201" stroke="${palette.line}" stroke-width="1.8" opacity=".58"/>
      <path d="M630 226 C635 204 644 181 656 161 M706 227 C714 202 720 181 729 160" stroke="${palette.line}" stroke-width="2" opacity=".55"/>
      <path d="M90 126 C197 91 322 94 430 128 C534 160 647 154 765 117" stroke="${palette.teal}" stroke-width="2" opacity=".22"/>
      <path d="M139 103 C232 74 342 79 435 107" stroke="${palette.gold}" stroke-width="1.5" opacity=".22"/>
    </g>
  `));
}

writeAsset('heroes/exiled-knight-battle.svg', heroKnight());
writeAsset('heroes/candle-nun-battle.svg', heroNun());
writeAsset('heroes/ashblood-alchemist-battle.svg', heroAlchemist());
writeEnemies();
writeStory();

console.log('low-noise art assets regenerated');
