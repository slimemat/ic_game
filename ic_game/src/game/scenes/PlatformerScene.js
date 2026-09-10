import Phaser from "phaser";
import skyImage from "../../assets/images/sky.png";
import platformImage from "../../assets/images/platform.png";
import starImage from "../../assets/images/star.png";
import bombImage from "../../assets/images/bomb.png";
import dudeImage from "../../assets/images/dude.png";

export default class PlatformerScene extends Phaser.Scene {
  constructor(onScoreUpdate, onGameOver) {
    super("TestGameScene");
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
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
    this.score = 0;
    this.gameOver = false;
    this.add.image(400, 300, "sky");

    this.createWorld();
    this.createPlayer();
    this.createAnimations();
    this.createCollectibles();
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

  collectStar(player, star) {
    star.disableBody(true, true);
    this.score += 10;
    if (this.onScoreUpdate) this.onScoreUpdate(this.score);

    if (this.stars.countActive(true) === 0) {
      this.stars.getChildren().forEach((child) => {
        child.enableBody(true, child.x, 0, true, true);
      });
      const x =
        player.x < 400
          ? Phaser.Math.Between(400, 800)
          : Phaser.Math.Between(0, 400);
      const bomb = this.bombs.create(x, 16, "bomb");
      bomb.setBounce(1);
      bomb.setCollideWorldBounds(true);
      bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
      bomb.allowGravity = false;
    }
  }

  hitBomb(player, bomb) {
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play("turn");
    this.gameOver = true;
    if (this.onGameOver) this.onGameOver();
  }

  update() {
    if (this.gameOver) return;

    if (
      this.cursors.left.isDown ||
      this.wasd.left.isDown ||
      this.touchState.left
    ) {
      this.player.setVelocityX(-160);
      this.player.anims.play("left", true);
    } else if (
      this.cursors.right.isDown ||
      this.wasd.right.isDown ||
      this.touchState.right
    ) {
      this.player.setVelocityX(160);
      this.player.anims.play("right", true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play("turn");
    }

    if (
      (this.cursors.up.isDown || this.wasd.up.isDown || this.touchState.jump) &&
      this.player.body.touching.down
    ) {
      this.player.setVelocityY(-330);
    }
  }
}
