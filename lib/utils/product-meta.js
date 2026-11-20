const PORTRAITS = [
  "photo-1534528741775-53994a69daeb",
  "photo-1494790108377-be9c29b29330",
  "photo-1506794778202-cad84cf45f1d",
  "photo-1517841905240-472988babdf9",
  "photo-1524504388940-b1c1722653e1",
  "photo-1531746020798-e6953c6e8e04",
  "photo-1488426862026-3ee34a7d66df",
  "photo-1529626455594-4ff0802cfb7e",
  "photo-1544005313-94ddf0286df2",
  "photo-1500648767791-00dcc994a43e",
  "photo-1507003211169-0a1dd7228f2d",
  "photo-1438761681033-6461ffad8d80",
  "photo-1472099645785-5658abf4ff4e",
  "photo-1507003211169-0a1dd7228f2d"
];

const NATURE = [
  "photo-1501854140801-50d01698950b",
  "photo-1506905925346-21bda4d32df4",
  "photo-1501785888041-af3ef285b470",
  "photo-1441974231531-c6227db76b6e",
  "photo-1470770841072-f978cf4d019e",
  "photo-1441974231531-c6227db76b6e",
  "photo-1506744038136-46273834b3fb",
  "photo-1472214103451-9374bd1c798e",
  "photo-1519681393784-d120267933ba",
  "photo-1500530855697-b586d89ba3ee"
];

const TRAVEL = [
  "photo-1507525428034-b723cf961d3e",
  "photo-1519681393784-d120267933ba",
  "photo-1472214103451-9374bd1c798e",
  "photo-1500530855697-b586d89ba3ee",
  "photo-1441974231531-c6227db76b6e",
  "photo-1501785888041-af3ef285b470",
  "photo-1506905925346-21bda4d32df4"
];

const URBAN = [
  "photo-1477959858617-67f85cf4f1df",
  "photo-1449824913935-59a10b8d2000",
  "photo-1480714378408-67cf0d13bc1b",
  "photo-1514565131-fce0801e5785",
  "photo-1505142468610-359e7d316be0",
  "photo-1565299624946-b28f40a0ae38",
  "photo-1540189549336-e6e99c3679fe",
  "photo-1504674900247-0877df9cc836"
];

const CINEMATIC = [
  "photo-1478720568477-152d9b164e26",
  "photo-1504701954957-2010ec3bcec1",
  "photo-1514565131-fce0801e5785",
  "photo-1449824913935-59a10b8d2000",
  "photo-1480714378408-67cf0d13bc1b",
  "photo-1505142468610-359e7d316be0",
  "photo-1519681393784-d120267933ba"
];

const FILM = [
  "photo-1440404653325-ab127d49abc1",
  "photo-1519681393784-d120267933ba",
  "photo-1470770841072-f978cf4d019e",
  "photo-1438761681033-6461ffad8d80",
  "photo-1500648767791-00dcc994a43e",
  "photo-1501854140801-50d01698950b"
];

const HDR = [
  "photo-1446776877081-d282a0f896e2",
  "photo-1506905925346-21bda4d32df4",
  "photo-1472214103451-9374bd1c798e",
  "photo-1501785888041-af3ef285b470",
  "photo-1469474968028-56623f02e45e"
];

const LIFESTYLE = [
  "photo-1495474472287-4d71bcdd2085",
  "photo-1504674900247-0877df9cc836",
  "photo-1507525428034-b723cf961d3e",
  "photo-1494790108377-be9c29b29330"
];

const AESTHETIC = [
  "photo-1516483638261-f4dbaf036963",
  "photo-1495474472287-4d71bcdd2085",
  ...PORTRAITS.slice(0, 6),
  ...NATURE.slice(0, 5),
  "photo-1507525428034-b723cf961d3e"
];

const IMAGE_POOLS = {
  Aesthetic: AESTHETIC,
  Portrait: PORTRAITS,
  Nature: NATURE,
  Travel: TRAVEL,
  Urban: URBAN,
  Cinematic: CINEMATIC,
  Film: FILM,
  Vintage: FILM,
  Moody: CINEMATIC,
  HDR: HDR,
  Lifestyle: LIFESTYLE,
  "B&W": [...PORTRAITS, ...NATURE],
  General: AESTHETIC
};

const CATEGORY_RULES = [
  [/\b(b&w|black|grey|gray|monochrome)\b/, "B&W"],
  [/\b(vintage|sepia|kodak|fuji|film|35mm)\b/, "Film"],
  [/\b(skin|portrait|selfie|glow|pink)\b/, "Portrait"],
  [/\b(green|greens|forest|woodland|flower|bloom|nature|jungle)\b/, "Nature"],
  [/\b(city|urban|street|hongkong)\b/, "Urban"],
  [/\b(beach\w*|summer|travel|adventure|drone|sorsogon|tanzania|calaguas|desert|ocean)\b/, "Travel"],
  [/\b(hdr|textured)\b/, "HDR"],
  [/\b(moody|dark|shadows?|low key|academia|contrast|night|teal|orange|duo tone|cyan|purple|haze)\b/, "Cinematic"],
  [/\b(lifestyle|tan\w*)\b/, "Lifestyle"]
];

function hashCode(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function guessCategory(name) {
  const text = String(name ?? "").toLowerCase();
  for (const [pattern, category] of CATEGORY_RULES) {
    if (pattern.test(text)) return category;
  }
  return "Aesthetic";
}

function buildToneParams(name) {
  const text = String(name ?? "").toLowerCase();
  const params = {};
  const has = (pattern) => pattern.test(text);

  if (has(/\b(black|grey|gray|b&w|monochrome)\b/)) {
    params.monochrome = null;
    return params;
  }
  if (has(/\bsepia\b/)) {
    params.monochrome = "704214";
    return params;
  }

  if (has(/\b(vintage|kodak|fuji|film|35mm)\b/)) {
    params.sat = -18;
    params.con = -8;
    params.exp = 4;
    params.bri = 4;
  }
  if (has(/\b(moody|dark|shadows?|low key|academia|deep contrast|contrast)\b/)) {
    params.exp = -16;
    params.con = 20;
    params.bri = -8;
  }
  if (has(/\b(bright|high key|white|airy|light)\b/)) {
    params.exp = 14;
    params.bri = 8;
    params.con = -8;
    params.sat = -6;
  }
  if (has(/\b(pastel|soft|matte|dream)\b/)) {
    params.sat = -12;
    params.con = -12;
    params.exp = 8;
  }
  if (has(/\b(vibrant|pop)\b/)) {
    params.sat = 28;
    params.con = 12;
  }
  if (has(/\b(hdr|textured)\b/)) {
    params.con = 22;
    params.sat = 10;
  }
  if (has(/\b(teal|duo tone)\b/)) {
    params.sat = 15;
    params.hue = -8;
  }
  if (has(/\b(cool|blue|cyan|mint|slate|silver|night)\b/)) {
    params.hue = -12;
    params.sat = (params.sat ?? 0) + 8;
  }
  if (has(/\b(warm|golden|sunset|amber|copper|gold|brown|earth|desert|creamy)\b/)) {
    params.hue = 12;
    params.sat = (params.sat ?? 0) + 12;
  }
  if (has(/\bpink\b/)) {
    params.hue = -10;
    params.sat = (params.sat ?? 0) + 8;
  }
  if (has(/\b(purple|haze)\b/)) {
    params.hue = 14;
    params.sat = (params.sat ?? 0) + 8;
  }
  if (has(/\b(green|forest|woodland|jungle)\b/)) {
    params.sat = (params.sat ?? 0) + 10;
  }

  return params;
}

export function buildPresetImage(code, name, category) {
  const pool = IMAGE_POOLS[category] || IMAGE_POOLS.General;
  const photoId = pool[hashCode(`${code}:${name}`) % pool.length];
  const parts = ["auto=format", "fit=crop", "w=900", "q=80"];
  const tone = buildToneParams(name);

  for (const [key, value] of Object.entries(tone)) {
    parts.push(value === null ? key : `${key}=${value}`);
  }

  return `https://images.unsplash.com/${photoId}?${parts.join("&")}`;
}
