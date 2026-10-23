<script setup>
defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 24 },
});

// Ícones em grade 24x24, traço simples (estilo "outline")
const ICONS = {
  challenges:
    "M14.5 4.5 19.5 9.5M4 20l5-5m-3.5-1.5 5 5M14 6l4-2 2 2-2 4-6 6-4-4 6-6zM7 13l-2 2m4 4-2 2",
  story: "M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h7",
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  profile: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM12 8v8M8.5 12h7",
  ranking:
    "M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v4M8 21h8M10 18h4",
  medal1: "M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM9 14l-2 7 5-3 5 3-2-7M12 7v4",
  medal2:
    "M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM9 14l-2 7 5-3 5 3-2-7M10 8h3l-3 3h3",
  medal3:
    "M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM9 14l-2 7 5-3 5 3-2-7M10 8h3l-1.5 1.5L13 11h-3",
};
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="ICONS[name]" />
  </svg>
</template>
