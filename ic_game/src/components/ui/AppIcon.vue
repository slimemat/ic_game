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
  play: "M7 5.5v13l11-6.5z",
  briefcase: "M4 7h16v12H4zM9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M4 12h16",
  lock: "M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3",
  check: "M5 13l4 4L19 7",
  sparkles:
    "M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8zM5.5 15.5l.8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8z",
  reset: "M4 12a8 8 0 1 0 2.3-5.6L4 9M4 4v5h5",
  hand: "M18 11V6a1.5 1.5 0 0 0-3 0v4M15 10V5a1.5 1.5 0 0 0-3 0v5M12 10V6a1.5 1.5 0 0 0-3 0v6l-1.5-1.5a1.5 1.5 0 0 0-2.1 2.1l4.4 4.9A5 5 0 0 0 13.5 21H15a5 5 0 0 0 5-5v-5a1.5 1.5 0 0 0-2 0",
  gamepad:
    "M6 9h12a4 4 0 0 1 3.9 4.8l-.8 3.6A2.5 2.5 0 0 1 18.6 19c-.8 0-1.5-.4-2-1l-1.3-1.6H8.7L7.4 18c-.5.6-1.2 1-2 1a2.5 2.5 0 0 1-2.5-1.6l-.8-3.6A4 4 0 0 1 6 9zM8 12v3M6.5 13.5h3M15.5 12.5h.01M17.5 14.5h.01",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20a7 7 0 0 1 14 0",
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
