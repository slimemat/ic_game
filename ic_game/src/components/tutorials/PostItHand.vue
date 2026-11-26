<script setup>
import { computed } from "vue";
import { DEFAULT_HAND_SKIN_ID, getHandSkin } from "../../game/data/handSkins";

/**
 * PostItHand: Renderiza a mão customizável em 3 seções modulares (SRP):
 * 1) Palma traseira (`z-index: 1`, atrás do papel)
 * 2) Braço/manga extensível até a base da tela (`z-index: 1`, suporta cor sólida ou tile `repeat-y`)
 * 3) Polegar frontal (`z-index: 3`, na frente do papel)
 *
 * Usa fragmento multi-root para que as camadas traseira e frontal participem
 * diretamente do stacking context de `.postit-stage` (entre o papel em `z-index: 2`).
 */
const props = defineProps({
  skinId: {
    type: String,
    default: DEFAULT_HAND_SKIN_ID,
  },
});

const skin = computed(() => getHandSkin(props.skinId));

const armStyle = computed(() => {
  const { tileSrc, fillColor, borderColor } = skin.value.arm;
  return {
    backgroundColor: fillColor,
    backgroundImage: tileSrc ? `url(${tileSrc})` : "none",
    borderLeftColor: borderColor,
    borderRightColor: borderColor,
  };
});
</script>

<template>
  <div class="postit-hand-layer postit-hand-back" aria-hidden="true">
    <img
      :src="skin.palmBackSrc"
      alt=""
      class="postit-hand-sprite"
      draggable="false"
    />
  </div>

  <div class="postit-arm-back" :style="armStyle" aria-hidden="true"></div>

  <div class="postit-hand-layer postit-hand-front" aria-hidden="true">
    <img
      :src="skin.thumbSrc"
      alt=""
      class="postit-hand-sprite"
      draggable="false"
    />
  </div>
</template>

<style scoped>
.postit-hand-layer,
.postit-arm-back {
  transform: rotate(-24deg);
  pointer-events: none;
}

.postit-hand-layer {
  position: absolute;
  right: -46px;
  bottom: -26px;
  width: 96px;
  height: 96px;
  transform-origin: 51px 70px;
}

.postit-hand-back {
  z-index: 1;
}

.postit-hand-front {
  z-index: 3;
}

.postit-hand-sprite {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  image-rendering: pixelated;
}

.postit-arm-back {
  position: absolute;
  right: -34px;
  top: calc(100% + 22px);
  width: 66px;
  height: 100vh;
  background-repeat: repeat-y;
  background-size: 100% auto;
  image-rendering: pixelated;
  border-left: 3px solid;
  border-right: 3px solid;
  transform-origin: 33px -22px;
  z-index: 1;
}
</style>
