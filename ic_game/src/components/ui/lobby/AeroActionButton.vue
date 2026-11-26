<script setup>
import { computed } from "vue";
import AppIcon from "../AppIcon.vue";

const props = defineProps({
  variant: {
    type: String,
    default: "primary",
    validator: (value) =>
      ["primary", "secondary", "danger", "danger-soft", "ghost-link"].includes(
        value,
      ),
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md", "lg"].includes(value),
  },
  block: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: String,
    default: "",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: "button",
  },
});

const iconSize = computed(() => {
  if (props.size === "sm") return 15;
  if (props.size === "lg") return 19;
  return 17;
});

const buttonClasses = computed(() => [
  "btn-tactile",
  `btn-tactile--${props.variant}`,
  props.variant !== "ghost-link" ? "btn-tactile--gloss" : "",
  props.size !== "md" ? `btn-tactile--${props.size}` : "",
  props.block ? "btn-tactile--block" : "",
]);
</script>

<template>
  <button :type="type" :class="buttonClasses" :disabled="disabled">
    <AppIcon v-if="icon" :name="icon" :size="iconSize" class="aero-btn-icon" />
    <span class="aero-btn-label"><slot /></span>
  </button>
</template>

<style scoped>
.aero-btn-icon,
.aero-btn-label {
  position: relative;
  z-index: 1;
}

.aero-btn-icon {
  flex-shrink: 0;
}
</style>
