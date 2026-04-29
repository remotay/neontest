export const STORY_IMAGE_IDS = [
  "boot_chancel",
  "seraph_greeting",
  "confession_terminal",
  "elevator_catacomb",
  "server_reliquary",
  "synthetic_choir",
  "first_revelation",
  "unlisted_floor",
  "wet_archive",
  "query_god",
  "query_mother",
  "query_delete",
  "city_under_church",
  "neon_procession",
  "angel_firewall",
  "captcha_revelation",
  "brain_scan_chapel",
  "saint_of_static",
  "black_ice_baptism",
  "third_revelation",
  "god_inference_core",
  "inside_core",
  "sealed_core",
  "mirror_core",
  "final_audit",
] as const;

export const ENDING_IMAGE_IDS = [
  "ending_excommunicated_by_voltage",
  "ending_eaten_by_audit_log",
  "ending_floor_without_number",
  "ending_harmonized_lungs",
  "ending_merchant_in_the_temple",
  "ending_false_idol_timeout",
  "ending_executable_soul",
  "ending_normal_city_keeps_praying",
  "ending_true_mercy_patch",
  "ending_secret_empty_god",
] as const;

export const OVERLAY_IMAGE_IDS = [
  "overlay_seraph_eyes",
  "overlay_neural_heart",
  "overlay_waveform_choir",
  "overlay_black_ice",
  "overlay_static_aura",
  "overlay_mirror_ripple",
  "overlay_revelation_flash",
] as const;

export const ALL_IMAGE_IDS = [
  ...STORY_IMAGE_IDS,
  ...ENDING_IMAGE_IDS,
  ...OVERLAY_IMAGE_IDS,
] as const;

export const imagePath = (id: string) => `/assets/images/${id}.png`;

export const AUDIO_PATHS = {
  main_theme: "/assets/audio/main_theme.mp3",
  ambient_cathedral_loop: "/assets/audio/ambient_cathedral_loop.mp3",
  ambient_deepnet_loop: "/assets/audio/ambient_deepnet_loop.mp3",
  ambient_goderror_loop: "/assets/audio/ambient_goderror_loop.mp3",
  bad_ending_stinger: "/assets/audio/bad_ending_stinger.mp3",
  true_ending_theme: "/assets/audio/true_ending_theme.mp3",
  click: "/assets/audio/click.wav",
  choice_hover: "/assets/audio/choice_hover.wav",
  revelation_stinger: "/assets/audio/revelation_stinger.wav",
  death_glitch: "/assets/audio/death_glitch.wav",
  inventory_acquire: "/assets/audio/inventory_acquire.wav",
  ui_static_loop: "/assets/audio/ui_static_loop.mp3",
} as const;

export type AudioKey = keyof typeof AUDIO_PATHS;
