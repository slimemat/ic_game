<script setup> //
import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import Phaser from "phaser";
import skyImage from "../assets/sky.png";
import platformImage from "../assets/platform.png";
import starImage from "../assets/star.png";
import bombImage from "../assets/bomb.png";
import dudeImage from "../assets/dude.png";

defineEmits(["back"]);

const gameRoot = ref(null);
const game = shallowRef(null);
const gameScene = shallowRef(null);

class TestGameScene extends Phaser.Scene {
  constructor() {
    super("TestGameScene");
    this.score = 0;
    this.gameOver = false;
    this.touchState = { left: false, right: false, jump: false };
  }

  preload() {
    this.load.image("sky", skyImage);
    this.load.image("ground", platformImage);
    this.load.image("star", starImage);
    this.load.image("bomb", bombImage);
    this.load.spritesheet("dude", dudeImage, {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  create() {
    this.add.image(400, 300, "sky");
    this.createWorld();
    this.createPlayer();
    this.createAnimations();
    this.createCollectibles();
    this.createHud();
    this.createCollisions();
  }

  createWorld() {
    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(400, 568, "ground").setScale(2).refreshBody();
    this.platforms.create(600, 400, "ground");
    this.platforms.create(50, 250, "ground");
    this.platforms.create(750, 220, "ground");
  }

  createPlayer() {
    this.player = this.physics.add.sprite(100, 450, "dude");
    this.player.setBounce(0.2).setCollideWorldBounds(true);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
  }

  createAnimations() {
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "turn",
      frames: [{ key: "dude", frame: 4 }],
      frameRate: 20,
    });
    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });
  }

  createCollectibles() {
    this.stars = this.physics.add.group({
      key: "star",
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 },
    });
    this.stars.getChildren().forEach((star) => {
      star.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });
    this.bombs = this.physics.add.group();
  }

  createHud() {
    this.scoreText = this.add.text(16, 16, "Score: 0", {
      fontSize: "32px",
      fill: "#000",
    });
    this.add.text(16, 55, "Collect stars, avoid bombs", {
      fontSize: "16px",
      fill: "#000",
    });
  }

  createCollisions() {
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.stars, this.platforms);
    this.physics.add.collider(this.bombs, this.platforms);
    this.physics.add.overlap(
      this.player,
      this.stars,
      this.collectStar,
      null,
      this,
    );
    this.physics.add.collider(
      this.player,
      this.bombs,
      this.hitBomb,
      null,
      this,
    );
  }

  setTouchState(control, pressed) {
    this.touchState[control] = pressed;
  }

  update() {
    if (this.gameOver) return;

    const movingLeft =
      this.cursors.left.isDown || this.wasd.left.isDown || this.touchState.left;
    const movingRight =
      this.cursors.right.isDown ||
      this.wasd.right.isDown ||
      this.touchState.right;
    const jumping =
      this.cursors.up.isDown || this.wasd.up.isDown || this.touchState.jump;

    if (movingLeft) {
      this.player.setVelocityX(-160).anims.play("left", true);
    } else if (movingRight) {
      this.player.setVelocityX(160).anims.play("right", true);
    } else {
      this.player.setVelocityX(0).anims.play("turn");
    }

    if (jumping && this.player.body.touching.down)
      this.player.setVelocityY(-330);
  }

  collectStar(_player, star) {
    star.disableBody(true, true);
    this.score += 10;
    this.scoreText.setText(`Score: ${this.score}`);

    if (this.stars.countActive(true) !== 0) return;

    this.stars.getChildren().forEach((child) => {
      child.enableBody(true, child.x, 0, true, true);
    });
    const x =
      this.player.x < 400
        ? Phaser.Math.Between(400, 800)
        : Phaser.Math.Between(0, 400);
    const bomb = this.bombs.create(x, 16, "bomb");
    bomb
      .setBounce(1)
      .setCollideWorldBounds(true)
      .setVelocity(Phaser.Math.Between(-200, 200), 20);
    bomb.allowGravity = false;
  }

  hitBomb() {
    this.physics.pause();
    this.player.setTint(0xff0000).anims.play("turn");
    this.gameOver = true;
    this.scoreText.setText(`Game over - score: ${this.score}`);
  }
}

const setTouchState = (control, pressed) => {
  gameScene.value?.setTouchState(control, pressed);
};

onMounted(() => {
  const scene = new TestGameScene();
  gameScene.value = scene;
  game.value = new Phaser.Game({
    type: Phaser.AUTO,
    parent: gameRoot.value,
    width: 800,
    height: 600,
    backgroundColor: "#162033",
    physics: {
      default: "arcade",
      arcade: { gravity: { y: 300 }, debug: false },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 800,
      height: 600,
    },
    scene,
  });
});

onBeforeUnmount(() => {
  game.value?.destroy(true);
  game.value = null;
  gameScene.value = null;
});
</script>

<template>
  <main class="test-game-screen">
    <div ref="gameRoot" class="game-root" aria-label="Platform test game"></div>
    <div class="touch-controls" aria-label="Touch controls">
      <button
        type="button"
        aria-label="Move left"
        @pointerdown="setTouchState('left', true)"
        @pointerup="setTouchState('left', false)"
        @pointerleave="setTouchState('left', false)"
      >
        Left
      </button>
      <button
        type="button"
        aria-label="Jump"
        @pointerdown="setTouchState('jump', true)"
        @pointerup="setTouchState('jump', false)"
        @pointerleave="setTouchState('jump', false)"
      >
        Jump
      </button>
      <button
        type="button"
        aria-label="Move right"
        @pointerdown="setTouchState('right', true)"
        @pointerup="setTouchState('right', false)"
        @pointerleave="setTouchState('right', false)"
      >
        Right
      </button>
    </div>
    <button
      class="text-button back-button"
      type="button"
      @click="$emit('back')"
    >
      Back to menu
    </button>
  </main>
</template>
