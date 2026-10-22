<template>
  <div class="tab-content">
    <RestPanel :summary="summary" @continue="handleContinue" />
  </div>
</template>

<script setup>
import RestPanel from "../ui/RestPanel.vue";
import { useRestSummary } from "../../composables/useRestSummary.js";

const { summary } = useRestSummary();

const emit = defineEmits(["start-story"]);

function handleContinue() {
  emit("start-story");
}
</script>

<style scoped>
.tab-content {
  padding: 20px;
  padding-bottom: 90px;
  max-width: 600px;
  margin: 0 auto;
}
</style>
