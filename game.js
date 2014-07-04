!function () {
	var canvas = null;
	var context = null;
	var raf = null;
	var player = null;
	var pipes = [];
	var pipeSpacing = 300;
	var gapWidth = 130;
	var score = 0;
	var scoreImages = [];
	var pipeUp = new Image();
	var pipeDown = new Image();
	var startImage = new Image();
	var gameOverImage = new Image();
	var land = null;
	var sky = null;

	var canJump = false;
	var jump = false;
	var playing = false;
	var gameOver = false;

	function Background (src, w, h, speed) {
		this.img = new Image();
		this.img.src = src;
		this.x = 0;
		this.y = 0;
		this.w = w;
		this.h = h;
		this.speed = speed;
	}

	function Player () {
		this.img = new Image();
		this.img.src = '/assets/player.png';
		this.width = 34;
		this.height = 24;
		this.x = (canvas.width / 2) - (this.width / 2);
		this.y = (canvas.height / 2) - (this.height / 2);
		this.x2 = (this.x + this.width);
		this.y2 = (this.y + this.height);
		this.velocityX = 0;
		this.velocityY = 0;
		this.speed = 1;
		this.jumpTo = 6;
		this.jumpHeight = 0;
		this.jumpSpeed = 1.6;
		this.fallSpeed = 0;
		this.friction = 0.80;
		this.isJumping = false;
		this.isFalling = false;

		this.draw = function () {
			this.velocityX *= this.friction;
			this.velocityY *= this.friction;
			this.x += this.velocityX;
			this.y += this.velocityY;
			this.x2 = (this.x + this.width);
			this.y2 = (this.y + this.height);
			context.drawImage(this.img, this.x, this.y);
		};

		this.update = function () {
			if (jump && this.y > 0) {
				this.isJumping = true;
				this.isFalling = false;
				this.jumpHeight = this.jumpTo;
				this.fallSpeed = 0;
			}

			if (this.isJumping) {
				this.velocityY -= this.jumpSpeed;
				this.jumpHeight -= 0.5;

				if (this.jumpHeight === 0) {
					this.isJumping = false;
					this.isFalling = true;
					this.fallSpeed = 0;
				}
			}

			if (this.isFalling) {
				this.y += this.fallSpeed;
				this.fallSpeed += 0.5;

				if (this.y > canvas.height) {
					this.isJumping = false;
					this.isFalling = false;
					gameOver = true;
					canJump = false;
				}
			}

			this.draw();
		};
	}

	function Pipe() {
		this.pipeUp = new Image();
		this.pipeDown = new Image();

		this.generateGap = function () {
			var min = 120;
			var max = canvas.height - min - gapWidth;
			this.gapStart = Math.floor(Math.random() * (max - min + 1)) + min;
		};

		this.generateGap();
		this.pipeNumber = pipes.length + 1;
		this.width = 52;
		this.height = 500;
		this.x = canvas.width + (this.pipeNumber - 1) * pipeSpacing;
		this.y = -this.height + this.gapStart;
		this.x2 = (this.x + this.width);
		this.speed = 1.8;
		this.passed = false;

		this.update = function () {
			this.x -= this.speed;
			this.x2 = (this.x + this.width);

			context.drawImage(pipeDown, this.x, this.y);
			context.drawImage(pipeUp, this.x, this.y + (this.height + gapWidth));

			if (this.x < -(this.width)) {
				var maxX = 0;

				pipes.forEach(function (pipe) {
					if (pipe.x > maxX) maxX = pipe.x;
				});

				this.x = maxX + pipeSpacing;
				this.passed = false;
				this.generateGap();
			}
		};
	}

	function updateBackground() {
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.fillStyle = '#4EC0CA';
		context.fillRect(0, 0, canvas.width, canvas.height);

		context.drawImage(sky.img, sky.x, sky.y);
		context.drawImage(sky.img, (sky.x + sky.w), sky.y);
		context.drawImage(land.img, land.x, land.y);
		context.drawImage(land.img, (land.x + land.w), land.y);

		sky.x -= sky.speed;
		land.x -= land.speed;

		if (sky.x < -(sky.w)) sky.x = 0;
		if (land.x < -(land.w)) land.x = 0;
	}

	function updatePipes() {
		pipes.forEach(function (pipe) {
			pipe.update();
		});
	}

	function updateScore(y) {
		var firstX = canvas.width / 2 - scoreImages[0].width;
		var scoreString = ('' + score);

		if (scoreString.length === 1) {
			context.drawImage(scoreImages[0], firstX, y);
			context.drawImage(scoreImages[scoreString[0]], (firstX + scoreImages[0].width), y);
		} else {
			context.drawImage(scoreImages[scoreString[0]], firstX, y);
			context.drawImage(scoreImages[scoreString[1]], (firstX + scoreImages[0].width), y);
		}
	}

	function checkCollision() {
		pipes.forEach(function (pipe) {
		  if (player.x2 > pipe.x && player.x < pipe.x2) {
		    if (player.y < (pipe.y + pipe.height) || player.y2 > (pipe.y + pipe.height + gapWidth)) {
		      canJump = false;
		      player.isJumping = false;
		      player.isFalling = true;
		    }
		  }
		  
		  if (!gameOver && !pipe.passed && pipe.x2 > 0 && pipe.x2 < (player.x - 30)) {
		    pipe.passed = true;
		    score++;
		  }
		});
	}

	function showStart() {
		context.drawImage(startImage, (canvas.width / 2 - startImage.width / 2), 60);
	}

	function showScore () {
		window.cancelAnimationFrame(raf);
		context.drawImage(gameOverImage, (canvas.width / 2) - gameOverImage.width / 2, (canvas.height / 2) - (gameOverImage.height / 2));
		updateScore(canvas.height / 2 + 20);
	}

	function reset() {
		score = 0;
		pipes = [];
		player = new Player();
		canJump = false;
		playing = false;
		gameOver = false;
		keydown({ keyCode: 32 });
		update();
	}

	function update () {
		raf = window.requestAnimationFrame(update);
		updateBackground();
		player.update();

		if (!canJump && !playing && !gameOver) {
			showStart();
		} else {
			updatePipes();

			if (canJump && playing && !gameOver) checkCollision();
			if (playing && !gameOver) updateScore(50);
			if (gameOver) showScore();
		}

		jump = false;
	}

	function init () {
		canvas = document.querySelector('#canvas');
		context = canvas.getContext('2d');

		sky = new Background('/assets/sky.png', 500, 109, 1);
		land = new Background('/assets/land.png', 500, 112, 0.6);
		pipeUp.src = '/assets/pipe-up.png';
		pipeDown.src = '/assets/pipe-down.png';
		startImage.src = '/assets/start.png';
		gameOverImage.src = '/assets/game-over.png';
		player = new Player();

		land.y = canvas.height - land.h;
		sky.y = land.y - sky.h;

		[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(function (n) {
			var img = new Image();
			img.src = '/assets/score' + n + '.png';
			scoreImages.push(img);
		});

		update();
	}

	function keydown (e) {
		if (e.keyCode === 32) {
			if (!canJump && !playing && !gameOver) {
				[0, 1, 2].forEach(function () { pipes.push(new Pipe()); });
				pipes.forEach(function (pipe) { pipe.x += 100; });

				canJump = true;
				playing = true;
			}

			if (playing && canJump && !gameOver) {
				jump = true;
			}

			if (!canJump && playing && gameOver) {
				reset();
			}
		}
	}

	document.body.addEventListener('keydown', keydown);
	document.addEventListener('DOMContentLoaded', init);
}();