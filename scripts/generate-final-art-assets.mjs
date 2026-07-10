import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const baseDir = path.join(root, 'public', 'assets', 'art');

const dirs = ['heroes', 'enemies', 'bosses', 'backgrounds', 'ui'];
dirs.forEach((dir) => fs.mkdirSync(path.join(baseDir, dir), { recursive: true }));

const P = {
  night: '#120d18',
  deep: '#1b1424',
  panel: '#241610',
  iron: '#20282a',
  iron2: '#384145',
  gold: '#b88935',
  candle: '#f2c86d',
  parchment: '#d8bd8a',
  paperEdge: '#8a6133',
  blood: '#9e302b',
  shield: '#2f6484',
  poison: '#5f9f62',
  arcane: '#6e4cb0',
  text: '#e8d6b0',
  muted: '#b99b68'
};

function svg(width, height, body, defs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
<defs>
<filter id="softShadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.45"/></filter>
<filter id="glowGold" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="${P.candle}" flood-opacity="0.65"/></filter>
<filter id="greenGlow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="${P.poison}" flood-opacity="0.7"/></filter>
<linearGradient id="metal" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#66777b"/><stop offset="0.45" stop-color="${P.iron}"/><stop offset="1" stop-color="#0a0d0f"/></linearGradient>
<linearGradient id="paper" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ead39b"/><stop offset="1" stop-color="#b98e4f"/></linearGradient>
<radialGradient id="warmGlow" cx="50%" cy="40%" r="55%"><stop offset="0" stop-color="${P.candle}" stop-opacity=".42"/><stop offset="1" stop-color="${P.candle}" stop-opacity="0"/></radialGradient>
<radialGradient id="poisonGlow" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="${P.poison}" stop-opacity=".42"/><stop offset="1" stop-color="${P.poison}" stop-opacity="0"/></radialGradient>
${defs}
</defs>
${body}
</svg>`;
}

function save(relPath, content) {
  const file = path.join(baseDir, relPath);
  fs.writeFileSync(file, content.replaceAll('\n\n', '\n'), 'utf8');
}

function grain(seed = 1, w = 360, h = 520, alpha = 0.14) {
  const dots = [];
  for (let i = 0; i < 38; i += 1) {
    const x = 18 + ((i * 37 + seed * 17) % (w - 36));
    const y = 22 + ((i * 53 + seed * 23) % (h - 44));
    const c = i % 3 === 0 ? P.gold : i % 3 === 1 ? '#ffffff' : '#000000';
    dots.push(`<rect x="${x}" y="${y}" width="${1 + (i % 3)}" height="${1 + (i % 2)}" fill="${c}" opacity="${alpha * (0.45 + (i % 4) * 0.18)}"/>`);
  }
  return dots.join('\n');
}

function knightPortrait() {
  return svg(360, 520, `
<rect width="360" height="520" fill="none"/>
<ellipse cx="180" cy="470" rx="112" ry="24" fill="#000" opacity=".42"/>
<g filter="url(#softShadow)">
<path d="M108 116 C78 166 60 257 70 400 C94 357 111 333 135 314 C137 240 133 174 108 116Z" fill="#681f29"/>
<path d="M96 154 L49 309 L77 294 L62 410 L117 352 L145 420 L157 174Z" fill="#8f2530" opacity=".86"/>
<path d="M118 132 C139 116 164 109 187 113 C221 121 243 145 253 177 L238 284 L118 284Z" fill="url(#metal)"/>
<path d="M128 179 L236 179 L229 248 L137 248Z" fill="#11181b"/>
<path d="M145 195 L179 184 L214 195 L207 238 L151 238Z" fill="#45565a"/>
<path d="M135 258 L226 258 L234 310 L126 310Z" fill="#1a2225"/>
<rect x="128" y="284" width="104" height="20" rx="5" fill="${P.blood}"/>
<path d="M126 318 L158 318 L151 434 L118 434Z" fill="#0b0e10"/>
<path d="M196 318 L229 318 L242 434 L206 434Z" fill="#0b0e10"/>
<path d="M113 428 L164 428 L156 457 L102 457Z" fill="#11171a"/>
<path d="M199 428 L253 428 L264 456 L207 456Z" fill="#11171a"/>
<path d="M91 179 C99 158 120 148 143 154 L136 216 L88 230Z" fill="#1c2528"/>
<path d="M232 151 C257 148 278 163 286 186 L250 230 L229 205Z" fill="#151d20"/>
<path d="M133 82 C154 52 205 49 228 82 L231 130 L131 130Z" fill="#1b2427"/>
<path d="M116 94 L180 38 L246 95 L225 95 L210 73 L149 73 L133 95Z" fill="#101517"/>
<rect x="142" y="92" width="77" height="18" rx="3" fill="#536469"/>
<rect x="138" y="116" width="86" height="9" rx="2" fill="${P.gold}"/>
<rect x="151" y="132" width="58" height="12" rx="3" fill="#030405"/>
<path d="M130 131 L111 169 L153 158Z" fill="#101619"/>
<path d="M227 132 L250 170 L207 158Z" fill="#101619"/>
<path d="M61 191 C71 162 103 144 132 155 L126 313 C105 330 80 332 59 309Z" fill="#17262d"/>
<path d="M67 201 C84 178 104 169 125 175 L121 296 C101 310 82 310 65 291Z" fill="${P.shield}"/>
<path d="M69 202 L121 296 M69 291 L124 179" stroke="${P.parchment}" stroke-width="4" opacity=".7"/>
<path d="M59 190 C82 166 110 154 133 157 L128 315 C100 337 72 329 56 310Z" fill="none" stroke="${P.gold}" stroke-width="8"/>
<path d="M257 177 L312 75 L322 83 L269 191Z" fill="#d9d0a5"/>
<path d="M267 188 L299 204 L293 214 L257 199Z" fill="${P.gold}"/>
<path d="M312 75 L327 55 L323 88Z" fill="#fff2c8"/>
<path d="M257 177 L313 76" stroke="#fff9d9" stroke-width="3" opacity=".72"/>
<path d="M151 161 C167 173 192 173 212 160" fill="none" stroke="${P.gold}" stroke-width="4" opacity=".72"/>
<circle cx="181" cy="285" r="5" fill="${P.gold}"/>
<rect x="150" y="316" width="67" height="12" rx="4" fill="#3d2b1b"/>
<path d="M72 333 C101 350 126 343 153 319" fill="none" stroke="#3a1018" stroke-width="12" opacity=".38"/>
${grain(3)}
</g>`);
}

function knightBattle() {
  return svg(240, 280, `
<ellipse cx="120" cy="258" rx="88" ry="15" fill="#000" opacity=".38"/>
<g filter="url(#softShadow)">
<path d="M77 76 L34 224 L89 200 L112 242 L132 95Z" fill="#78232d"/>
<path d="M88 82 C107 66 138 65 157 84 L159 151 L84 153Z" fill="url(#metal)"/>
<path d="M97 127 L149 127 L154 176 L91 176Z" fill="#141b1d"/>
<rect x="93" y="160" width="61" height="13" rx="3" fill="${P.blood}"/>
<path d="M94 180 L116 180 L111 253 L88 253Z" fill="#0b0f11"/>
<path d="M132 180 L156 180 L166 253 L139 253Z" fill="#0b0f11"/>
<path d="M86 252 L119 252 L113 270 L76 270Z" fill="#101719"/>
<path d="M136 252 L173 252 L180 269 L142 270Z" fill="#101719"/>
<path d="M91 41 L121 18 L154 42 L145 42 L137 32 L105 32 L98 42Z" fill="#101517"/>
<rect x="99" y="48" width="48" height="12" rx="2" fill="#526267"/>
<rect x="98" y="64" width="51" height="6" fill="${P.gold}"/>
<rect x="105" y="78" width="37" height="8" rx="2" fill="#030405"/>
<path d="M84 87 L63 118 L96 111Z" fill="#11171a"/>
<path d="M158 87 L183 121 L147 112Z" fill="#11171a"/>
<path d="M38 105 C54 84 78 78 96 89 L92 197 C71 213 48 205 35 187Z" fill="${P.shield}"/>
<path d="M39 105 C58 83 80 78 98 88 L94 200 C68 219 45 208 33 188Z" fill="none" stroke="${P.gold}" stroke-width="6"/>
<path d="M43 117 L90 185 M45 181 L92 105" stroke="${P.parchment}" stroke-width="3" opacity=".7"/>
<path d="M171 102 L216 42 L223 48 L179 112Z" stroke="#d9d0a5" stroke-width="7" stroke-linecap="round"/>
<path d="M173 103 L218 43" stroke="#fff9d9" stroke-width="2" opacity=".75"/>
<path d="M167 113 L196 124" stroke="${P.gold}" stroke-width="7" stroke-linecap="round"/>
<path d="M69 222 C90 234 116 227 134 204" stroke="#2a1013" stroke-width="9" opacity=".36"/>
</g>`);
}

function nunPortrait() {
  return svg(360, 520, `
<ellipse cx="180" cy="470" rx="104" ry="22" fill="#000" opacity=".38"/>
<circle cx="180" cy="156" r="132" fill="url(#warmGlow)"/>
<g filter="url(#softShadow)">
<path d="M104 176 C120 122 147 91 181 88 C220 92 246 128 256 177 L286 446 L74 446Z" fill="#0e0e11"/>
<path d="M124 166 C138 129 156 110 181 108 C206 111 227 132 239 166 L248 409 L112 409Z" fill="#202126"/>
<path d="M137 178 L180 238 L225 178 L219 376 L141 376Z" fill="#121317"/>
<path d="M138 91 C150 58 213 54 225 91 L219 144 L139 144Z" fill="#f0e6d2"/>
<path d="M122 96 L180 36 L239 96 L220 97 L205 76 L155 76 L140 97Z" fill="#f8efd9"/>
<path d="M142 113 C157 93 204 94 218 114 L211 150 L149 150Z" fill="#151516"/>
<ellipse cx="164" cy="131" rx="5" ry="6" fill="#d9c9a8"/>
<ellipse cx="196" cy="131" rx="5" ry="6" fill="#d9c9a8"/>
<path d="M151 151 C167 165 196 166 211 151" stroke="#2b2520" stroke-width="5" fill="none"/>
<path d="M89 176 L122 188 L112 371 L78 350Z" fill="#15161a"/>
<path d="M238 188 L272 176 L281 350 L247 370Z" fill="#15161a"/>
<circle cx="113" cy="323" r="12" fill="#e8d6b0"/>
<circle cx="248" cy="323" r="12" fill="#e8d6b0"/>
<path d="M112 376 C143 394 214 394 247 376" stroke="${P.gold}" stroke-width="5" fill="none"/>
<path d="M119 420 L153 420 L148 456 L107 456Z" fill="#0d0d10"/>
<path d="M207 420 L249 420 L256 456 L211 456Z" fill="#0d0d10"/>
<path d="M180 173 L180 307" stroke="${P.gold}" stroke-width="4"/>
<path d="M158 217 L202 217" stroke="${P.gold}" stroke-width="4"/>
<circle cx="180" cy="169" r="8" fill="${P.candle}"/>
<path d="M92 365 C134 385 225 386 272 362" fill="none" stroke="${P.gold}" stroke-width="3" opacity=".65"/>
<path d="M72 398 L116 398 L107 433 L61 433Z" fill="#191a20"/>
<path d="M244 398 L289 398 L302 433 L253 433Z" fill="#191a20"/>
<path d="M271 129 L296 129 L300 381 L266 381Z" fill="#9d7b51"/>
<path d="M261 124 C271 88 293 88 304 124 L296 136 L270 136Z" fill="${P.candle}" filter="url(#glowGold)"/>
<path d="M279 92 C289 111 291 125 282 145 C276 127 270 115 279 92Z" fill="#fff1b5"/>
<circle cx="282" cy="120" r="56" fill="${P.candle}" opacity=".14"/>
<path d="M111 187 C135 215 145 278 137 363" stroke="#ffffff" stroke-width="3" opacity=".08"/>
<path d="M229 188 C215 230 211 303 224 359" stroke="#ffffff" stroke-width="3" opacity=".08"/>
${grain(8)}
</g>`);
}

function nunBattle() {
  return svg(230, 280, `
<ellipse cx="116" cy="258" rx="74" ry="15" fill="#000" opacity=".36"/>
<circle cx="118" cy="102" r="86" fill="url(#warmGlow)"/>
<g filter="url(#softShadow)">
<path d="M66 92 C80 55 103 37 124 38 C151 42 171 65 180 96 L205 250 L46 250Z" fill="#0e0e11"/>
<path d="M81 97 C93 68 107 55 124 55 C141 57 157 73 167 97 L173 234 L75 234Z" fill="#202126"/>
<path d="M94 51 L124 20 L155 52 L145 53 L136 43 L112 43 L104 53Z" fill="#f3ead8"/>
<path d="M91 61 C104 48 142 48 155 62 L151 92 L96 92Z" fill="#eee5d4"/>
<path d="M103 74 C113 62 136 63 145 75 L140 98 L108 98Z" fill="#151516"/>
<circle cx="114" cy="84" r="3" fill="#d8c8a7"/><circle cx="134" cy="84" r="3" fill="#d8c8a7"/>
<path d="M64 111 L90 119 L82 216 L55 206Z" fill="#15161a"/>
<path d="M168 119 L194 111 L199 207 L174 216Z" fill="#15161a"/>
<circle cx="82" cy="198" r="8" fill="#e8d6b0"/><circle cx="174" cy="198" r="8" fill="#e8d6b0"/>
<path d="M124 108 L124 196 M110 141 L138 141" stroke="${P.gold}" stroke-width="3"/>
<path d="M73 224 C102 238 150 238 178 224" stroke="${P.gold}" stroke-width="4" fill="none"/>
<path d="M178 76 L192 76 L195 236 L174 236Z" fill="#9d7b51"/>
<path d="M172 72 C179 47 193 47 201 72 L196 82 L177 82Z" fill="${P.candle}" filter="url(#glowGold)"/>
<path d="M185 52 C193 65 193 76 186 88 C181 75 178 64 185 52Z" fill="#fff1b5"/>
</g>`);
}

function alchemistPortrait() {
  return svg(360, 520, `
<ellipse cx="180" cy="470" rx="112" ry="23" fill="#000" opacity=".38"/>
<circle cx="110" cy="193" r="112" fill="url(#poisonGlow)"/>
<circle cx="240" cy="234" r="88" fill="url(#poisonGlow)"/>
<g filter="url(#softShadow)">
<path d="M95 151 C118 100 163 77 207 91 C246 106 268 150 271 206 L291 451 L74 451Z" fill="#1c130e"/>
<path d="M113 155 L247 155 L271 414 L89 414Z" fill="#543820"/>
<path d="M120 178 L69 428 L134 390 L176 438 L176 184Z" fill="#302015"/>
<path d="M242 177 L294 426 L232 389 L185 438 L184 184Z" fill="#2a1d15"/>
<path d="M86 120 C110 91 150 77 199 82 C240 86 271 103 290 131 L251 143 C211 128 151 127 105 143Z" fill="#1a1714"/>
<path d="M132 68 L226 68 L252 118 L101 118Z" fill="#1a1714"/>
<path d="M149 82 L209 82 L230 116 L126 116Z" fill="#2c241b"/>
<path d="M138 112 C155 83 215 84 234 114 L229 158 L139 158Z" fill="#211d19"/>
<path d="M188 117 C225 117 282 128 310 148 C270 156 226 157 188 146Z" fill="#0b0a09"/>
<path d="M190 124 C230 126 268 132 298 146 C259 146 224 144 192 140Z" fill="#d8bd8a" opacity=".72"/>
<circle cx="162" cy="126" r="9" fill="#d8bd8a"/><circle cx="223" cy="132" r="7" fill="${P.poison}" filter="url(#greenGlow)"/>
<path d="M116 183 L247 183" stroke="#8a6133" stroke-width="12"/>
<path d="M130 211 L232 211 M126 254 L236 254 M121 298 L242 298" stroke="#8a6133" stroke-width="5" opacity=".7"/>
<path d="M82 204 L51 334 L88 352 L119 219Z" fill="#25382d"/>
<path d="M271 205 L310 333 L274 351 L239 219Z" fill="#25382d"/>
<circle cx="79" cy="344" r="12" fill="#d8bd8a"/><circle cx="281" cy="345" r="12" fill="#d8bd8a"/>
<rect x="67" y="248" width="36" height="68" rx="10" fill="#122018" stroke="${P.gold}" stroke-width="4"/>
<rect x="75" y="261" width="20" height="45" rx="5" fill="${P.poison}" filter="url(#greenGlow)"/>
<path d="M259 320 L304 259 L312 268 L270 333Z" fill="#d8bd8a"/>
<path d="M260 322 L286 343 L278 353 L250 329Z" fill="#1a1110"/>
<rect x="133" y="318" width="16" height="38" rx="4" fill="${P.poison}" stroke="${P.gold}" stroke-width="3"/>
<rect x="157" y="316" width="16" height="42" rx="4" fill="${P.shield}" stroke="${P.gold}" stroke-width="3"/>
<rect x="181" y="316" width="16" height="39" rx="4" fill="${P.candle}" stroke="${P.gold}" stroke-width="3"/>
<rect x="205" y="318" width="16" height="37" rx="4" fill="${P.blood}" stroke="${P.gold}" stroke-width="3"/>
<path d="M96 410 C136 430 223 431 267 409" stroke="#0c0807" stroke-width="14" opacity=".45"/>
<path d="M75 370 C111 400 257 401 292 370" stroke="${P.poison}" stroke-width="3" opacity=".38"/>
<circle cx="94" cy="213" r="52" fill="${P.poison}" opacity=".11"/>
<circle cx="260" cy="230" r="43" fill="${P.poison}" opacity=".13"/>
${grain(13)}
</g>`);
}

function alchemistBattle() {
  return svg(240, 280, `
<ellipse cx="122" cy="258" rx="88" ry="15" fill="#000" opacity=".37"/>
<circle cx="68" cy="120" r="66" fill="url(#poisonGlow)"/>
<g filter="url(#softShadow)">
<path d="M75 82 C96 55 136 42 167 55 C196 67 210 100 210 134 L225 253 L53 253Z" fill="#1c130e"/>
<path d="M88 91 L195 91 L208 229 L72 229Z" fill="#543820"/>
<path d="M91 110 L58 244 L102 220 L123 249 L125 112Z" fill="#302015"/>
<path d="M196 110 L226 244 L185 220 L145 249 L144 112Z" fill="#2a1d15"/>
<path d="M68 64 C91 42 137 34 190 50 L207 78 C162 66 116 66 78 81Z" fill="#171411"/>
<path d="M94 32 L165 32 L187 65 L74 65Z" fill="#2c241b"/>
<path d="M108 68 C122 48 166 49 181 69 L178 101 L109 101Z" fill="#211d19"/>
<path d="M147 77 C178 78 218 86 231 101 C199 105 173 101 147 94Z" fill="#0b0a09"/>
<path d="M149 82 C177 84 202 90 222 101 C194 99 171 97 151 94Z" fill="#d8bd8a" opacity=".72"/>
<circle cx="127" cy="80" r="6" fill="#d8bd8a"/><circle cx="175" cy="85" r="5" fill="${P.poison}" filter="url(#greenGlow)"/>
<path d="M94 125 L190 125 M91 157 L194 157 M88 190 L198 190" stroke="#8a6133" stroke-width="5" opacity=".75"/>
<path d="M66 126 L43 211 L69 224 L95 138Z" fill="#25382d"/>
<path d="M203 126 L231 210 L205 224 L180 138Z" fill="#25382d"/>
<circle cx="61" cy="212" r="9" fill="#d8bd8a"/><circle cx="210" cy="211" r="9" fill="#d8bd8a"/>
<rect x="42" y="151" width="28" height="48" rx="8" fill="#122018" stroke="${P.gold}" stroke-width="3"/>
<rect x="48" y="162" width="16" height="30" rx="4" fill="${P.poison}" filter="url(#greenGlow)"/>
<rect x="108" y="204" width="11" height="26" rx="3" fill="${P.poison}" stroke="${P.gold}" stroke-width="2"/>
<rect x="126" y="203" width="11" height="27" rx="3" fill="${P.shield}" stroke="${P.gold}" stroke-width="2"/>
<rect x="144" y="204" width="11" height="25" rx="3" fill="${P.blood}" stroke="${P.gold}" stroke-width="2"/>
</g>`);
}

save('heroes/exiled-knight-portrait.svg', knightPortrait());
save('heroes/exiled-knight-battle.svg', knightBattle());
save('heroes/candle-nun-portrait.svg', nunPortrait());
save('heroes/candle-nun-battle.svg', nunBattle());
save('heroes/ashblood-alchemist-portrait.svg', alchemistPortrait());
save('heroes/ashblood-alchemist-battle.svg', alchemistBattle());

function enemySvg(kind, label, body) {
  return svg(220, 260, `
<ellipse cx="110" cy="235" rx="78" ry="14" fill="#000" opacity=".34"/>
<g filter="url(#softShadow)">
${body}
</g>
<path d="M58 248 C86 258 134 258 162 248" stroke="${P.gold}" stroke-width="2" opacity=".18" fill="none"/>`);
}

const enemies = {
  'rotten-villager.svg': ['腐烂村民', `
<path d="M75 88 C82 62 119 54 139 78 L147 151 L66 159Z" fill="#506144"/>
<circle cx="112" cy="55" r="24" fill="#6b7b5c"/><circle cx="103" cy="51" r="4" fill="#141712"/><circle cx="122" cy="52" r="4" fill="${P.blood}"/>
<path d="M69 91 L38 174 L59 183 L83 110Z" fill="#5f4637"/><path d="M144 96 L181 177 L160 186 L131 113Z" fill="#5f4637"/>
<path d="M76 154 L61 232 L87 232 L102 158Z" fill="#1e2b24"/><path d="M128 154 L140 232 L166 232 L149 157Z" fill="#1e2b24"/>
<path d="M41 82 L72 110 L52 132Z" fill="#3e332a"/><path d="M132 126 L154 126 L153 139 L129 139Z" fill="${P.blood}"/>
<path d="M171 105 L197 204" stroke="#856139" stroke-width="7"/><path d="M196 202 L208 221" stroke="#d8bd8a" stroke-width="3"/>
<path d="M70 179 C93 190 128 189 151 175" stroke="#2a1710" stroke-width="5" opacity=".45"/>`],
  'grave-skeleton.svg': ['墓园骷髅', `
<circle cx="110" cy="45" r="26" fill="#d2c294"/><circle cx="99" cy="40" r="7" fill="#0b0b0b"/><circle cx="121" cy="40" r="7" fill="#0b0b0b"/>
<circle cx="99" cy="40" r="3" fill="${P.shield}"/><circle cx="121" cy="40" r="3" fill="${P.shield}"/>
<path d="M96 61 L124 61" stroke="#0b0b0b" stroke-width="5"/>
<path d="M75 89 L145 89 M81 108 L139 108 M89 127 L131 127" stroke="#d2c294" stroke-width="7"/>
<path d="M94 78 L81 169 M126 78 L140 170" stroke="#d2c294" stroke-width="7"/>
<path d="M76 88 L49 160 M146 90 L178 158" stroke="#d2c294" stroke-width="7"/>
<path d="M85 169 L63 232 M136 169 L156 232" stroke="#d2c294" stroke-width="7"/>
<path d="M40 77 L170 188" stroke="#9a723f" stroke-width="6"/><path d="M38 75 L172 189" stroke="#ead7a1" stroke-width="2"/>
<rect x="157" y="125" width="37" height="56" rx="7" fill="#2e3540" stroke="${P.gold}" stroke-width="2"/>`],
  'black-hound.svg': ['黑犬', `
<path d="M35 137 C49 101 106 92 145 107 C166 113 174 128 170 150 C127 166 76 166 35 137Z" fill="#070707"/>
<path d="M132 92 C147 65 180 70 191 96 L178 120 L142 114Z" fill="#121116"/>
<path d="M144 75 L156 38 L169 78Z" fill="#0a0a0c"/><path d="M170 78 L193 45 L185 92Z" fill="#0a0a0c"/>
<circle cx="171" cy="91" r="4" fill="${P.blood}"/>
<path d="M189 102 L211 112 L188 121Z" fill="#d8bd8a"/><path d="M188 119 L205 116" stroke="#fff" stroke-width="2"/>
<path d="M55 145 L47 231 L65 231 L75 150Z" fill="#080808"/><path d="M94 151 L91 231 L109 231 L113 151Z" fill="#080808"/>
<path d="M132 150 L139 231 L157 231 L151 148Z" fill="#080808"/><path d="M162 135 L180 231 L198 231 L181 130Z" fill="#080808"/>
<path d="M45 111 L7 84 L31 134Z" fill="#050505"/><path d="M77 89 L101 65 L112 96Z" fill="#25242a"/>`],
  'plague-rats.svg': ['瘟疫鼠群', `
${[0, 1, 2, 3, 4].map((i) => {
    const x = 38 + i * 34;
    const y = 155 + (i % 2) * 18;
    return `<ellipse cx="${x}" cy="${y}" rx="26" ry="14" fill="${i % 2 ? '#3a3929' : '#22221c'}"/><path d="M${x + 18} ${y - 5} L${x + 42} ${y - 12} L${x + 24} ${y + 2}Z" fill="${i % 2 ? '#3a3929' : '#22221c'}"/><circle cx="${x + 9}" cy="${y - 4}" r="3" fill="${P.blood}"/><path d="M${x - 20} ${y + 4} C${x - 45} ${y + 15} ${x - 50} ${y + 4} ${x - 62} ${y + 14}" stroke="#7b4d3f" stroke-width="3" fill="none"/>`;
  }).join('\n')}
<circle cx="105" cy="142" r="50" fill="${P.poison}" opacity=".09"/>`],
  'raven-messenger.svg': ['乌鸦信使', `
<path d="M108 83 L18 134 L93 145Z" fill="#090911"/><path d="M118 82 L207 128 L128 146Z" fill="#090911"/>
<ellipse cx="112" cy="125" rx="31" ry="57" fill="#151520"/><circle cx="119" cy="63" r="25" fill="#111119"/>
<path d="M139 63 L197 71 L140 82Z" fill="${P.gold}"/><circle cx="124" cy="57" r="4" fill="${P.candle}"/>
<path d="M92 164 L61 232 L112 178Z" fill="#090911"/><path d="M131 164 L163 232 L115 178Z" fill="#090911"/>
<rect x="139" y="153" width="42" height="20" rx="3" fill="#6d4a28"/><path d="M141 163 L181 163" stroke="${P.parchment}" stroke-width="2"/>
<path d="M64 113 L92 97 L101 123Z" fill="#1e1e2a"/><path d="M158 99 L185 114 L136 123Z" fill="#1e1e2a"/>`],
  'broken-militia.svg': ['破甲民兵', `
<rect x="87" y="151" width="22" height="84" fill="#282522"/><rect x="123" y="149" width="22" height="86" fill="#282522"/>
<path d="M73 77 L151 72 L164 151 L61 154Z" fill="#4a4238"/><path d="M73 107 L157 107" stroke="#8a6133" stroke-width="11"/>
<circle cx="112" cy="48" r="24" fill="#9b6b37"/><path d="M77 32 L145 32 L137 50 L85 50Z" fill="#2a2c2d"/><path d="M88 29 L72 18 L105 32Z" fill="#555"/>
<rect x="38" y="102" width="48" height="82" rx="8" fill="#2e3540" stroke="${P.gold}" stroke-width="2"/>
<path d="M170 20 L184 232" stroke="#8b724c" stroke-width="7"/><path d="M174 9 L190 25 L171 28Z" fill="#8b724c"/>
<path d="M61 82 L41 156 M160 80 L187 153" stroke="#4a4238" stroke-width="14"/>`],
  'candle-monk.svg': ['灰烛修士', `
<circle cx="150" cy="51" r="46" fill="url(#warmGlow)"/>
<path d="M58 236 L111 34 L166 236Z" fill="#3f3327"/><path d="M82 236 L112 78 L145 236Z" fill="#241b16"/>
<circle cx="112" cy="58" r="26" fill="#211b17"/><circle cx="103" cy="56" r="4" fill="#0b0b0b"/><circle cx="122" cy="56" r="4" fill="#0b0b0b"/>
<path d="M92 119 L132 119" stroke="${P.gold}" stroke-width="3"/><path d="M84 164 L143 164" stroke="#6a3d20" stroke-width="5"/>
<path d="M153 39 L169 39 L173 220 L148 220Z" fill="#825a38"/>
<path d="M145 35 C153 4 170 4 178 35 L171 48 L151 48Z" fill="${P.candle}" filter="url(#glowGold)"/>
<path d="M160 8 C169 21 168 37 160 49 C154 32 153 19 160 8Z" fill="#fff1b5"/>
<path d="M61 99 L34 181 M163 102 L190 184" stroke="#3f3327" stroke-width="13"/>`],
  'witch.svg': ['尖帽女巫', `
<path d="M70 235 L112 71 L161 235Z" fill="#2b1438"/><path d="M84 235 L113 111 L145 235Z" fill="#1d1026"/>
<path d="M39 82 L113 5 L188 82Z" fill="#271335"/><rect x="31" y="79" width="166" height="20" rx="8" fill="#321a44"/>
<circle cx="113" cy="94" r="23" fill="#32203d"/><path d="M126 96 L164 108 L128 117Z" fill="#7a5934"/><circle cx="105" cy="91" r="3" fill="#0b0b0b"/>
<path d="M73 129 L38 189 M153 130 L181 196" stroke="#3b2149" stroke-width="17"/>
<circle cx="58" cy="192" r="27" fill="${P.arcane}" opacity=".44"/><circle cx="170" cy="197" r="22" fill="${P.arcane}" opacity=".48"/>
<path d="M177 104 L202 231" stroke="#8b6a42" stroke-width="5"/><circle cx="203" cy="118" r="13" fill="#d08a49"/>
<circle cx="92" cy="162" r="54" fill="${P.arcane}" opacity=".13"/>`],
  'plague-doctor.svg': ['瘟疫医生', `
<circle cx="65" cy="145" r="58" fill="${P.poison}" opacity=".14"/>
<path d="M63 237 L82 75 C100 49 140 49 158 76 L178 237Z" fill="#151514"/><path d="M88 90 L154 90 L160 204 L82 204Z" fill="#26221f"/>
<path d="M84 51 C100 31 143 31 158 51 L154 89 L86 89Z" fill="#181514"/><path d="M151 59 L210 70 L154 84Z" fill="#0b0a09"/>
<circle cx="104" cy="61" r="6" fill="#d4caa2"/><circle cx="180" cy="70" r="5" fill="${P.poison}"/>
<path d="M65 111 L42 205 M166 111 L189 203" stroke="#477050" stroke-width="16"/>
<path d="M177 132 L205 206" stroke="#c9c19a" stroke-width="6"/><rect x="90" y="190" width="12" height="25" fill="${P.poison}"/><rect x="108" y="188" width="12" height="28" fill="${P.arcane}"/><rect x="126" y="190" width="12" height="25" fill="${P.blood}"/>`],
  'iron-maiden-nun.svg': ['铁誓修女', `
<path d="M60 233 L68 42 C77 25 143 25 153 42 L162 233Z" fill="#282a2f"/>
<path d="M81 56 L141 56 L136 105 L86 105Z" fill="#111114"/><rect x="92" y="27" width="39" height="13" fill="#e8d6b0"/>
<path d="M57 83 L24 211 L74 184Z" fill="#7a2730"/><path d="M163 83 L196 211 L146 184Z" fill="#7a2730"/>
${Array.from({ length: 7 }).map((_, i) => `<path d="M76 ${82 + i * 22} L96 ${90 + i * 22} L76 ${100 + i * 22}Z" fill="#a7a09a"/><path d="M145 ${82 + i * 22} L125 ${90 + i * 22} L145 ${100 + i * 22}Z" fill="#a7a09a"/>`).join('\n')}
<path d="M97 139 L124 139 M110 125 L110 155" stroke="${P.blood}" stroke-width="7"/>
<path d="M62 42 C90 58 130 58 154 42" stroke="${P.gold}" stroke-width="4" fill="none"/>`],
  'fallen-paladin.svg': ['堕落圣骑士', `
<circle cx="110" cy="98" r="86" fill="#09080b" opacity=".42"/>
<path d="M54 235 L72 73 C86 50 136 43 158 69 L178 235Z" fill="#20272d"/><path d="M78 93 L157 93 L159 178 L75 178Z" fill="#11161a"/>
<path d="M80 41 L141 41 L153 76 L69 76Z" fill="#171b20"/><rect x="79" y="117" width="72" height="10" fill="${P.gold}"/><rect x="105" y="82" width="20" height="128" fill="${P.gold}"/>
<path d="M34 87 L4 189 L70 170Z" fill="#5d1d2b"/><path d="M67 143 L43 234 M155 139 L185 235" stroke="#15191d" stroke-width="25"/>
<path d="M171 17 L205 238" stroke="#2d3038" stroke-width="10"/><path d="M175 19 L205 238" stroke="#d8bd8a" stroke-width="3"/>
<path d="M95 135 L128 135 M112 117 L112 159" stroke="${P.blood}" stroke-width="6"/>
<path d="M82 57 C100 75 130 74 148 57" stroke="${P.gold}" stroke-width="4" fill="none"/>`]
};

for (const [file, [label, body]] of Object.entries(enemies)) save(`enemies/${file}`, enemySvg(file, label, body));

save('bosses/headless-grave-knight.svg', svg(420, 420, `
<ellipse cx="210" cy="388" rx="148" ry="24" fill="#000" opacity=".45"/>
<circle cx="210" cy="124" r="98" fill="${P.arcane}" opacity=".16"/>
<g filter="url(#softShadow)">
<path d="M97 382 L127 122 C151 82 262 80 292 121 L326 382Z" fill="#15191d"/>
<path d="M131 139 L287 139 L279 292 L138 292Z" fill="#252c31"/>
<path d="M73 155 L18 351 L123 321Z" fill="#6b2535"/><path d="M297 156 L392 347 L309 322Z" fill="#241216"/>
<path d="M84 169 L53 340 M334 168 L367 342" stroke="#0d1012" stroke-width="40"/>
<path d="M145 291 L116 387 L170 387 L179 292Z" fill="#0d1012"/><path d="M243 292 L252 387 L306 387 L274 291Z" fill="#0d1012"/>
<rect x="122" y="106" width="174" height="18" fill="${P.gold}" opacity=".72"/><rect x="145" y="172" width="130" height="12" fill="${P.gold}" opacity=".65"/>
<rect x="158" y="199" width="104" height="9" fill="#536469"/><rect x="151" y="235" width="118" height="9" fill="#536469"/>
<circle cx="210" cy="74" r="42" fill="#050406"/><circle cx="210" cy="74" r="66" fill="${P.arcane}" opacity=".36" filter="url(#glowGold)"/>
<path d="M179 70 C194 34 226 34 241 70" stroke="${P.arcane}" stroke-width="8" fill="none"/>
<path d="M186 79 L235 79 M210 51 L210 102" stroke="#0b0710" stroke-width="9"/>
<path d="M182 248 L238 248 M210 218 L210 278" stroke="#d9d0b0" stroke-width="8"/>
<path d="M303 104 L345 104 L342 126 L295 126Z" fill="#2e1d15"/>
<path d="M328 66 L139 388" stroke="#1b1f24" stroke-width="17" stroke-linecap="round"/>
<path d="M331 65 L142 388" stroke="${P.gold}" stroke-width="9" stroke-linecap="round"/>
<path d="M336 64 L147 386" stroke="#fff0b5" stroke-width="3" opacity=".65"/>
<path d="M135 385 L166 366 L151 411Z" fill="#d8bd8a"/>
<path d="M126 135 C168 158 246 159 288 135" stroke="#44565b" stroke-width="8" fill="none" opacity=".58"/>
<path d="M108 195 L63 330 M314 195 L359 330" stroke="${P.arcane}" stroke-width="6" opacity=".6"/>
<path d="M152 124 L128 79 M270 123 L294 79" stroke="${P.arcane}" stroke-width="7" opacity=".75"/>
<path d="M151 312 C191 335 245 334 283 311" stroke="#090909" stroke-width="18" opacity=".42"/>
${grain(31, 420, 420, 0.12)}
</g>`));

function backgroundBase(details) {
  return svg(1536, 864, `
<rect width="1536" height="864" fill="${P.night}"/>
<rect width="1536" height="864" fill="url(#skyGrad)"/>
<ellipse cx="600" cy="370" rx="470" ry="92" fill="${P.candle}" opacity=".09"/>
<ellipse cx="1030" cy="160" rx="220" ry="28" fill="#d8bd8a" opacity=".08"/>
<ellipse cx="520" cy="190" rx="280" ry="35" fill="#d8bd8a" opacity=".07"/>
<path d="M0 590 L300 320 L620 590Z" fill="#272338" opacity=".82"/>
<path d="M410 590 L810 260 L1200 590Z" fill="#292538" opacity=".82"/>
<path d="M100 610 L360 370 L650 610Z" fill="#15141d" opacity=".92"/>
<path d="M680 610 L1010 310 L1320 610Z" fill="#11121a" opacity=".94"/>
<path d="M690 548 h46 v-96 l23 -48 l23 48 v96 h32 v-132 l23 -64 l24 64 v132 h58 v-76 l30 -47 l30 47 v76 h44 v-226 l32 -72 l32 72 v226 h42 v-320 l41 -74 l41 74 v320" fill="#08090d" opacity=".95"/>
<rect y="585" width="1536" height="279" fill="#170d0a"/>
<rect y="585" width="1536" height="64" fill="#362017" opacity=".86"/>
${details}
<path d="M112 118 C245 90 392 96 520 122" stroke="${P.candle}" stroke-width="2" opacity=".1" fill="none"/>
<path d="M118 134 H520" stroke="${P.gold}" stroke-width="1" opacity=".09"/>
${grain(61, 1536, 864, 0.08)}`,
    `<linearGradient id="skyGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${P.deep}"/><stop offset=".55" stop-color="#271723"/><stop offset="1" stop-color="#3b2018"/></linearGradient>`
  );
}

save('backgrounds/main-menu-final.svg', backgroundBase(`
<ellipse cx="365" cy="732" rx="170" ry="28" fill="#000" opacity=".55"/>
<circle cx="365" cy="692" r="92" fill="#382013" opacity=".96"/>
<path d="M318 704 L366 575 L420 704Z" fill="#4f2a17"/><path d="M337 705 L370 613 L408 705Z" fill="${P.candle}"/><path d="M360 706 L384 642 L428 706Z" fill="#e5672d"/>
<rect x="198" y="610" width="13" height="64" rx="3" fill="${P.parchment}"/><path d="M194 606 C202 579 213 579 218 606Z" fill="${P.candle}"/>
<rect x="234" y="637" width="13" height="58" rx="3" fill="${P.parchment}"/><path d="M230 633 C238 610 249 610 254 633Z" fill="${P.candle}"/>
`));
save('backgrounds/character-select-bg.svg', backgroundBase(`<circle cx="768" cy="170" r="180" fill="${P.candle}" opacity=".04"/><path d="M240 624 C420 548 1092 548 1288 624" stroke="${P.gold}" stroke-width="2" opacity=".1" fill="none"/>`));
save('backgrounds/battle-village-final.svg', backgroundBase(`<path d="M82 598 h1000 v52 h-1000Z" fill="#2b1a15"/><path d="M150 548 h860" stroke="${P.gold}" stroke-width="3" opacity=".34"/><path d="M176 620 C410 590 782 590 1042 622" stroke="#6b4a31" stroke-width="2" opacity=".3" fill="none"/>`));
save('backgrounds/map-parchment-final.svg', backgroundBase(`<rect x="332" y="132" width="872" height="640" rx="18" fill="#704725"/><rect x="350" y="150" width="836" height="604" rx="14" fill="${P.parchment}"/><path d="M368 176 C480 150 980 156 1160 184 M368 720 C540 747 923 743 1160 715" stroke="#4a2f1d" stroke-width="3" opacity=".18" fill="none"/>`));

function frameSvg(kind, color = P.gold) {
  return svg(220, 80, `
<rect x="8" y="12" width="204" height="56" rx="8" fill="#050302" opacity=".55"/>
<rect x="12" y="8" width="196" height="56" rx="7" fill="${kind === 'card' ? P.parchment : P.iron}"/>
<rect x="20" y="16" width="180" height="18" rx="4" fill="#fff" opacity=".06"/>
<rect x="12" y="8" width="196" height="56" rx="7" fill="none" stroke="${color}" stroke-width="3"/>
<rect x="21" y="17" width="178" height="38" rx="4" fill="none" stroke="#000" opacity=".5"/>
<path d="M26 28 V20 H34 M194 28 V20 H186 M26 44 V52 H34 M194 44 V52 H186" stroke="${color}" stroke-width="2"/>`);
}
save('ui/panel-frame.svg', frameSvg('panel', P.gold));
save('ui/button-frame.svg', frameSvg('button', P.gold));
save('ui/card-frame-attack.svg', frameSvg('card', P.blood));
save('ui/card-frame-defense.svg', frameSvg('card', P.shield));
save('ui/card-frame-skill.svg', frameSvg('card', P.gold));
save('ui/card-frame-spell.svg', frameSvg('card', P.arcane));
save('ui/card-frame-curse.svg', frameSvg('card', '#2a1b32'));

console.log(JSON.stringify({ ok: true, baseDir, files: fs.readdirSync(baseDir, { recursive: true }).length }, null, 2));
