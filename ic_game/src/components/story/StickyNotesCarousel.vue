<script setup>
import { ref } from "vue";
import { useSwipe } from "../../composables/useSwipe";
import AudioManager from "../../game/managers/AudioManager";

/**
 * StickyNotesCarousel: post-its manuscritos navegáveis por swipe (mobile),
 * setas e dots (desktop/acessibilidade).
 *
 * Props:
 *   title – título acima dos post-its (ex.: "Anotações do Rardi")
 *   notes – textos já traduzidos, um por post-it
 */
const props = defineProps({
  title: { type: String, default: "" },
  notes: { type: Array, required: true },
});

const NOTE_COLORS = ["#fef08a", "#fbcfe8", "#bfdbfe", "#bbf7d0"];

const activeIndex = ref(0);

function goTo(index) {
  if (index < 0 || index >= props.notes.length || index === activeIndex.value)
    return;
  activeIndex.value = index;
  AudioManager.play("reply_sfx", { volume: 0.4 });
}

const swipe = useSwipe({
  onSwipeLeft: () => goTo(activeIndex.value + 1),
  onSwipeRight: () => goTo(activeIndex.value - 1),
  threshold: 35,
});

function noteStyle(index) {
  return {
    "--note-color": NOTE_COLORS[index % NOTE_COLORS.length],
    "--note-tilt": index % 2 === 0 ? "-2deg" : "1.5deg",
  };
}
</script>

<template>
  <section
    class="sticky-notes"
    :aria-label="title"
    aria-roledescription="carousel"
    @keydown.left.prevent="goTo(activeIndex - 1)"
    @keydown.right.prevent="goTo(activeIndex + 1)"
  >
    <h3 v-if="title" class="notes-title">📌 {{ title }}</h3>

    <div
      class="notes-viewport"
      @touchstart.passive="swipe.onStart"
      @touchend.passive="swipe.onEnd"
    >
      <div
        class="notes-track"
        :style="{ transform: `translateX(-${activeIndex * 100}%)` }"
      >
        <div
          v-for="(note, index) in notes"
          :key="index"
          class="note-slide"
          :aria-hidden="index !== activeIndex"
          aria-roledescription="slide"
        >
          <article class="sticky-note" :style="noteStyle(index)">
            <span class="note-tape" aria-hidden="true" />
            <p class="note-text">{{ note }}</p>
          </article>
        </div>
      </div>
    </div>

    <nav class="notes-controls">
      <button
        class="notes-arrow"
        :disabled="activeIndex === 0"
        :aria-label="$t('story.chat.notes_prev')"
        @click.stop="goTo(activeIndex - 1)"
      >
        ‹
      </button>

      <div class="notes-dots">
        <button
          v-for="(_, index) in notes"
          :key="index"
          class="notes-dot"
          :class="{ active: index === activeIndex }"
          :aria-label="$t('story.chat.notes_goto', { num: index + 1 })"
          :aria-current="index === activeIndex ? 'true' : null"
          @click.stop="goTo(index)"
        />
      </div>

      <button
        class="notes-arrow"
        :disabled="activeIndex === notes.length - 1"
        :aria-label="$t('story.chat.notes_next')"
        @click.stop="goTo(activeIndex + 1)"
      >
        ›
      </button>
    </nav>

    <span class="notes-counter" aria-live="polite">
      {{
        $t("story.chat.notes_counter", {
          current: activeIndex + 1,
          total: notes.length,
        })
      }}
    </span>
  </section>
</template>

<style scoped>
.sticky-notes {
  align-self: center;
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 0 0.5rem;
  border-radius: 10px;
  background: rgba(120, 85, 50, 0.12);
  border: 1px dashed rgba(90, 60, 30, 0.25);
}

.notes-title {
  margin: 0;
  font-family: var(--font-handwritten);
  font-size: 1.3rem;
  font-weight: 400;
  color: #4a3420;
}

.notes-viewport {
  width: 100%;
  overflow: hidden;
  touch-action: pan-y;
}

.notes-track {
  display: flex;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.note-slide {
  flex: 0 0 100%;
  display: flex;
  justify-content: center;
  padding: 14px 0 10px;
}

.sticky-note {
  position: relative;
  width: 78%;
  aspect-ratio: 1 / 1;
  max-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.6rem 1.2rem 1.2rem;
  background: var(--note-color);
  background-image: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.35) 0%,
    rgba(0, 0, 0, 0.04) 100%
  );
  transform: rotate(var(--note-tilt));
  box-shadow:
    2px 6px 12px rgba(0, 0, 0, 0.18),
    inset 0 -10px 18px rgba(0, 0, 0, 0.04);
  border-bottom-right-radius: 24px 6px;
}

.note-tape {
  position: absolute;
  top: -10px;
  left: 50%;
  width: 84px;
  height: 22px;
  transform: translateX(-50%) rotate(-3deg);
  background: rgba(255, 255, 255, 0.55);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.note-text {
  margin: 0;
  font-family: var(--font-handwritten);
  font-size: 1.4rem;
  line-height: 1.3;
  color: #2d2a26;
  text-align: center;
}

.notes-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.notes-arrow {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  color: #4a3420;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
  transition: transform 0.15s;
}

.notes-arrow:disabled {
  opacity: 0.35;
  cursor: default;
}

.notes-arrow:not(:disabled):active {
  transform: scale(0.9);
}

.notes-dots {
  display: flex;
  gap: 8px;
}

.notes-dot {
  width: 10px;
  height: 10px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(74, 52, 32, 0.25);
  cursor: pointer;
  transition:
    transform 0.2s,
    background 0.2s;
}

.notes-dot.active {
  background: #4a3420;
  transform: scale(1.25);
}

.notes-counter {
  font-size: 0.75rem;
  color: #6b5a48;
}

@media (prefers-reduced-motion: reduce) {
  .notes-track {
    transition: none;
  }
}
</style>
