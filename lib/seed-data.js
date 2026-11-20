const imagePool = [
  "photo-1507003211169-0a1dd7228f2d","photo-1534528741775-53994a69daeb","photo-1494790108377-be9c29b29330","photo-1502685104226-ee32379fefbe","photo-1506794778202-cad84cf45f1d","photo-1517841905240-472988babdf9","photo-1524504388940-b1c1722653e1","photo-1531746020798-e6953c6e8e04","photo-1488426862026-3ee34a7d66df","photo-1529626455594-4ff0802cfb7e","photo-1544005313-94ddf0286df2","photo-1500648767791-00dcc994a43e","photo-1539571696580-4693882038f1","photo-1438761681033-6461ffad8d80","photo-1472099645785-5658abf4ff4e","photo-1506905925346-21bda4d32df4","photo-1501785888041-af3ef285b470","photo-1469474968028-56623f02e45e","photo-1470770841072-f978cf4d019e","photo-1441974231531-c6227db76b6e","photo-1500530855697-b586d89ba3ee","photo-1472214103451-9374bd1c798e","photo-1506744038136-46273834b3fb","photo-1519681393784-d120267933ba","photo-1507525428034-b723cf961d3e","photo-1505142468610-359e7d316be0","photo-1504674900247-0877df9cc836","photo-1565299624946-b28f40a0ae38","photo-1540189549336-e6e99c3679fe","photo-1449824913935-59a10b8d2000","photo-1480714378408-67cf0d13bc1b","photo-1514565131-fce0801e5785"
];
const names = [
  "Creamy","Warm Natural","Latte","Golden Hour","Neon Nights","Thermal","Pantone Pastel","HDR Fever","Cartoon Pop","Descendant Sun",
  "Creamy Pie","Wedding Dress","Paint Me","Anime Upgrade","Pink Sunset","Cafe Film","Faded Film","Jungle Vibes","Plantdemic","Golden City",
  "Orange Vibe","Sky Graduated","Natural Sunset","iPhone Clean","Warm Tones","Brown Tones","Cardigan","Blue Tones","Golden Classic","Retro 70s",
  "Thunderbird","Macro Detail","Portrait Matte","Infrared","Rampage Fitness","Calaguas Beach","Perfect HDR","Travel Story","Film Look","Dual Tone",
  "Hongkong Mood","Selfie Glow","35mm Film","Black Tones","Grey Tones","Tanned Me","Duo Tone 2020","Sunset Matte","Daybreak Matte","Fujifilm Classic",
  "Woodland","Flowers Bloom","Clean HDR","Adventure Soft","Extraction","Miag-ao Creamy","David Guison","Minimal Brown","Tanzania","Anime Light",
  "Portrait Clean","Orange & Teal","Textured HDR","Premium B&W","Premium HDR","Sorsogon","Negative Space","Dark City","Beachy","Sunset Drone",
  "Street Style","Summer Vibes"
];
const categories = [
  "Aesthetic","Portrait","Aesthetic","Nature","Cinematic","Cinematic","Aesthetic","HDR","Aesthetic","Cinematic",
  "Aesthetic","Portrait","Aesthetic","Aesthetic","Nature","Film","Film","Nature","Nature","Urban",
  "Cinematic","Nature","Nature","Aesthetic","Aesthetic","Film","Lifestyle","Aesthetic","Nature","Vintage",
  "Cinematic","Nature","Portrait","Cinematic","Lifestyle","Travel","HDR","Travel","Film","Cinematic",
  "Urban","Portrait","Film","B&W","B&W","Lifestyle","Cinematic","Nature","Nature","Film",
  "Nature","Nature","HDR","Travel","Cinematic","Aesthetic","Lifestyle","Aesthetic","Travel","Aesthetic",
  "Portrait","Cinematic","HDR","B&W","HDR","Travel","Aesthetic","Urban","Travel","Travel",
  "Urban","Nature"
];

export const seedProducts = names.map((name, i) => {
  const n = i + 1;
  const code = `LP${String(n).padStart(2, "0")}`;
  const id = `lp${String(n).padStart(2, "0")}`;
  const available = true; // All active
  const premium = [64, 65].includes(n);
  const price = available
    ? ([5, 8, 12, 18, 22].includes(n) ? 39000 : 29000)
    : (premium ? 49000 : (n % 7 === 0 ? 19000 : 29000));
  const subtitle = `${categories[i]} tone for everyday photos`;
  const description = `LUMA ${code} — ${name}. ${categories[i]} look with balanced colors, ready for Lightroom Mobile. Apply, then fine-tune exposure to match your shot.`;
  const image = n === 1
    ? "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=900&q=80"
    : `https://images.unsplash.com/${imagePool[i % imagePool.length]}?auto=format&fit=crop&w=900&q=80`;
  return {
    id, code, name, subtitle, category: categories[i], price,
    status: "AVAILABLE",
    available: true, description, image,
    file: `products/LUMA_${code}_${name.replace(/\s+/g, "_")}.zip`
  };
});
