const config = {
  type: Phaser.AUTO,
  width: 512,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 800 }, debug: false }
  },
  scene: { preload, create, update }
};

new Phaser.Game(config);

let player, cursors, platforms, ladders, barrels, kong, princess;
let isClimbing = false;
let score = 0;
let scoreText;

function preload() {
  // Grafik-länkar (Klassisk stil)
  this.load.image('mario', 'assets/din_mario_sprite.png');
  this.load.image('pauline', 'assets/din_pauline_sprite.png');
  this.load.image('kong', 'assets/din_kong_sprite.png');
//  this.load.image('barrel', 'assets/din_tunna.png');
//  this.load.image('ladder', 'assets/din_stege.png');
//  this.load.image('platform', 'assets/din_plattform.png');

//  this.load.image('mario', 'https://labs.phaser.io/assets/sprites/mario.png');
//  this.load.image('kong', 'https://labs.phaser.io/assets/sprites/fuji.png'); // Placeholder för DK
//  this.load.image('pauline', 'https://labs.phaser.io/assets/sprites/apple_item.png'); // Placeholder för Pauline
  this.load.image('platform', 'https://labs.phaser.io/assets/sprites/platform.png');
  this.load.image('barrel', 'https://labs.phaser.io/assets/sprites/red_ball.png');
  this.load.image('ladder', 'https://labs.phaser.io/assets/sprites/asuna_block.png');
}

function create() {
  platforms = this.physics.add.staticGroup();
  ladders = this.physics.add.staticGroup();

  // --- ARENA (Zick-Zack) ---
  platforms.create(256, 580, 'platform').setScale(2, 0.5).refreshBody();
  platforms.create(360, 470, 'platform').setScale(0.8, 0.4).refreshBody();
  platforms.create(152, 360, 'platform').setScale(0.8, 0.4).refreshBody();
  platforms.create(360, 250, 'platform').setScale(0.8, 0.4).refreshBody();
  platforms.create(160, 140, 'platform').setScale(0.8, 0.4).refreshBody();

  // --- STEGAR ---
  ladders.create(360, 510, 'ladder').setScale(0.12, 3.5).refreshBody();
  ladders.create(152, 400, 'ladder').setScale(0.12, 3.5).refreshBody();
  ladders.create(360, 290, 'ladder').setScale(0.12, 3.5).refreshBody();
  ladders.create(160, 180, 'ladder').setScale(0.12, 3.5).refreshBody();

  // --- FIGURER ---
  kong = this.physics.add.staticSprite(100, 95, 'kong').setScale(0.6);
  princess = this.physics.add.staticSprite(220, 100, 'pauline');

  player = this.physics.add.sprite(50, 530, 'mario');
  player.setCollideWorldBounds(true);

  // --- POÄNG ---
  scoreText = this.add.text(16, 16, 'SCORE: 0', { fontSize: '24px', fill: '#fb00ff', fontFamily: '"Courier New", Courier, monospace' });

  // --- KOLLISIONER & LOGIK ---
  this.physics.add.collider(player, platforms, null, () => { return !isClimbing; }, this);
  this.physics.add.overlap(player, ladders, (p, l) => {
    if (cursors.up.isDown && !isClimbing) isClimbing = true;
  }, null, this);
  this.physics.add.overlap(player, princess, winGame, null, this);

  barrels = this.physics.add.group();
  this.physics.add.collider(barrels, platforms);
  this.physics.add.overlap(player, barrels, hitByBarrel, null, this);

  this.time.addEvent({
    delay: 3000,
    callback: spawnBarrel,
    callbackScope: this,
    loop: true
  });

  cursors = this.input.keyboard.createCursorKeys();
}

function update() {
  if (isClimbing) {
    player.body.allowGravity = false;
    player.setVelocityY(cursors.up.isDown ? -160 : (cursors.down.isDown ? 160 : 0));
    if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
        player.setVelocityY(-280);
        isClimbing = false;
    }
  } else {
    player.body.allowGravity = true;
    player.setVelocityX(cursors.left.isDown ? -160 : (cursors.right.isDown ? 160 : 0));
    if (cursors.up.isDown && player.body.touching.down) {
      player.setVelocityY(-280);
    }
  }

  // Poäng-logik (Hoppa över tunna)
  barrels.children.iterate((barrel) => {
    if (barrel && !barrel.scored) {
      if (player.y < barrel.y && Math.abs(player.x - barrel.x) < 20 && !player.body.touching.down) {
        score += 100;
        barrel.scored = true;
        scoreText.setText('SCORE: ' + score);
      }
    }
  });

  if (isClimbing && !this.physics.overlap(player, ladders)) isClimbing = false;
}

function spawnBarrel() {
  const barrel = barrels.create(160, 100, 'barrel');
  barrel.setBounce(0.4);
  barrel.setCollideWorldBounds(true);
  barrel.setVelocityX(140);
  barrel.scored = false;
}

function hitByBarrel(player, barrel) {
  this.physics.pause();
  player.setTint(0xff0000);
  this.time.delayedCall(1000, () => this.scene.restart());
}

function winGame(player, princess) {
  this.physics.pause();
  const winText = this.add.text(256, 300, 'YOU SAVED PAULINE!', { fontSize: '32px', fill: '#fff', backgroundColor: '#fb00ff' }).setOrigin(0.5);
  this.time.delayedCall(3000, () => {
    score = 0;
    this.scene.restart();
  });
}