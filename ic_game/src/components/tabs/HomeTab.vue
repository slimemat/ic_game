<script setup>
import RestPanel from "../ui/RestPanel.vue";
import { useRestSummary } from "../../composables/useRestSummary";

defineEmits(["start-story"]);

const { summary } = useRestSummary();
</script>

<template>
  <div class="tab-content">
    <RestPanel :summary="summary" @continue="$emit('start-story')" />
  </div>
</template>
