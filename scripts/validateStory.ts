import { ALL_IMAGE_IDS } from "../src/game/data/assets";
import { endings, storyNodes } from "../src/game/data/story";

const storyIds = new Set(Object.keys(storyNodes));
const endingIds = new Set(Object.keys(endings));
const imageIds = new Set<string>(ALL_IMAGE_IDS);
const missingTargets: string[] = [];
const missingEndings: string[] = [];
const missingImages: string[] = [];

for (const node of Object.values(storyNodes)) {
  if (!imageIds.has(node.image)) missingImages.push(`${node.id} -> ${node.image}`);
  for (const choice of node.choices) {
    if (choice.target && !storyIds.has(choice.target)) missingTargets.push(`${node.id}.${choice.id} -> ${choice.target}`);
    if (choice.ending && !endingIds.has(choice.ending)) missingEndings.push(`${node.id}.${choice.id} -> ${choice.ending}`);
  }
}

for (const ending of Object.values(endings)) {
  if (!imageIds.has(ending.image)) missingImages.push(`${ending.id} -> ${ending.image}`);
}

const requiredBad = [
  "excommunicated_by_voltage",
  "eaten_by_audit_log",
  "floor_without_number",
  "harmonized_lungs",
  "merchant_in_the_temple",
  "false_idol_timeout",
  "executable_soul",
];

const failures = [
  ...missingTargets.map((item) => `Missing story target: ${item}`),
  ...missingEndings.map((item) => `Missing ending: ${item}`),
  ...missingImages.map((item) => `Missing image id: ${item}`),
  ...(Object.keys(storyNodes).length < 25 ? [`Expected at least 25 story nodes, found ${Object.keys(storyNodes).length}`] : []),
  ...requiredBad.filter((id) => !endingIds.has(id)).map((id) => `Required bad ending missing: ${id}`),
  ...["normal_city_keeps_praying", "true_mercy_patch", "secret_empty_god"].filter((id) => !endingIds.has(id)).map((id) => `Required major ending missing: ${id}`),
];

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Story graph valid: ${storyIds.size} scenes, ${endingIds.size} endings, ${imageIds.size} registered image ids.`);
}
