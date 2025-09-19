window.addEventListener('load', function() {
    const canvas = this.document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 1280;
    canvas.height = 720;

    ctx.fillStyle = 'white';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'black';
    ctx.font = '40px Lilita One';
    ctx.textAlign = 'center';

    class Player {
        constructor(game) {
            this.game = game;
            this.collisionX = this.game.width * 0.5;
            this.collisionY = this.game.height * 0.5;
            this.collisionRadius = 30;
            this.speedX = 0;
            this.speedY = 0;
            this.distanceX = 0;   // Horizontal distance
            this.distanceY = 0;   // Vertical distance
            this.speedModifier = 3;
            this.spriteWidth = 255;
            this.spriteHeight = 256;
            this.width = this.spriteWidth;
            this.height = this.spriteHeight;
            this.spriteX;
            this.spriteY;
            this.frameX = 0;
            this.frameY = 0;
            this.image = document.getElementById('bull');
        }

        draw(context) {
            context.drawImage(this.image, this.frameX* this.spriteWidth, this.frameY * this.spriteHeight, this.spriteWidth, this.spriteHeight, this.spriteX, this.spriteY, this.width, this.height);

            if(this.game.debug) {
                context.beginPath();
                context.arc(this.collisionX, this.collisionY, this.collisionRadius, 0, Math.PI * 2);

            /* To limit certain canvas settings only to specific draw calls, we can wrap that drawing
            code between save() and restore() built-in canvas methods without affecting the rest of our canvas drawings
            save() method creates a snapshot of the current canvas state, including fillStyle, 
            lineWidth, opacity(globalAlpha) as well as transformations and scaling*/
                context.save();
                context.globalAlpha = 0.5;
                context.fill();
                context.restore();
                context.stroke();

                context.beginPath();
                context.moveTo(this.collisionX, this.collisionY);    // Will define starting 'x' and 'y' coordinates of the line
                context.lineTo(this.game.mouse.x, this.game.mouse.y); // Will define the ending 'x' and 'y' coordinates of the line
                context.stroke();
            }
        }

        update() {
            // Using the mouse first and the Player second when calculating the difference between positions of these 2 points
            this.distanceX = this.game.mouse.x - this.collisionX;
            this.distanceY = this.game.mouse.y - this.collisionY;

            // sprite animation
            // Math.atan2() returns an angle in radians between the positive x axis and a line, projected from (0,0) towards a specific point
            const angle = Math.atan2(this.distanceY, this.distanceX);
            // Make the Player always face the mouse
            /* Adjust angle ranges and frameY to the combination that gives the wanted result.
            The first point of reference was taken from the console, 
            and the other 7 directions are derived from it */
            if (angle < -2.74 || angle > 2.74) this.frameY = 6;
            else if (angle < -1.96) this.frameY = 7;
            else if (angle < -1.17) this.frameY = 0;
            else if (angle < -0.39) this.frameY = 1;
            else if (angle < 0.39) this.frameY = 2;
            else if (angle < 1.17) this.frameY = 3;
            else if (angle < 1.96) this.frameY = 4;
            else if (angle < 2.74) this.frameY = 5;
            
            const distance = Math.hypot(this.distanceY, this.distanceX);   // Hypotenuse of distanceX and distanceY
            if(distance > this.speedModifier) {
                this.speedX = this.distanceX/distance || 0;
                this.speedY = this.distanceY/distance || 0; 
            } else {
                this.speedX = 0;
                this.speedY = 0;
            }

            this.collisionX += this.speedX * this.speedModifier;
            this.collisionY += this.speedY * this.speedModifier;
            this.spriteX = this.collisionX - this.width * 0.5;
            this.spriteY = this.collisionY - this.height * 0.5 - 100;

            // Player movement boundaries
            // Horizontal boundaries
            if (this.collisionX < 0 + this.collisionRadius)
                this.collisionX = this.collisionRadius;
            else if (this.collisionX > this.game.width - this.collisionRadius)
                this.collisionX = this.game.width - this.collisionRadius;
            // Vertical boundaries
            if (this.collisionY < this.game.topMargin + this.collisionRadius)
                this.collisionY = this.game.topMargin + this.collisionRadius;
            else if (this.collisionY > this.game.height - this.collisionRadius)
                this.collisionY = this.game.height - this.collisionRadius;

            // Collisions with obstacles
            this.game.obstacles.forEach(obstacle => {
                // [(distance < sumOfRadii), distance, sumOfRadii, distanceX, distanceY]
                let [collision, distance, sumOfRadii, distanceX, distanceY] = this.game.checkCollision(this, obstacle);
                if (collision) {
                    const unit_x = distanceX/distance;
                    const unit_y = distanceY/distance;
                    //console.log(unit_x, unit_y);

                    // Push the player 1 pixel outside the collision radius of the obstacle
                    this.collisionX = obstacle.collisionX + (sumOfRadii + 1) * unit_x;
                    this.collisionY = obstacle.collisionY + (sumOfRadii + 1) * unit_y;
                }
            })
        }

        restart() {
            // Initial position of Player
            this.collisionX = this.game.width * 0.5;
            this.collisionY = this.game.height * 0.5;
            this.spriteX = this.collisionX - this.width * 0.5;
            this.spriteY = this.collisionY - this.height * 0.5 - 100;
        }
    }

    class Obstacle {
        constructor(game) {
            this.game = game;
            this.collisionX = Math.random() * this.game.width;
            this.collisionY = Math.random() * this.game.height;
            this.collisionRadius = 40;
            this.image = document.getElementById('obstacles');
            this.spriteWidth = 250;     // Width of the srpitesheet/number of columns
            this.spriteHeight = 250;    // Height of the spritesheet/number of rows
            this.width = this.spriteWidth;
            this.height = this.spriteHeight;
            this.spriteX = this.collisionX - this.width * 0.5;
            this.spriteY = this.collisionY - this.height * 0.5 - 70;
            this.frameX = Math.floor(Math.random() * 4);
            this.frameY = Math.floor(Math.random() * 3);
        }

        draw(context) {
            context.drawImage(this.image, this.frameX * this.spriteWidth, this.frameY * this.spriteHeight, this.spriteWidth, this.spriteHeight, this.spriteX, this.spriteY, this.width, this.height);
            if (this.game.debug) {
                context.beginPath();
                context.arc(this.collisionX, this.collisionY, this.collisionRadius, 0, Math.PI * 2);
                context.save();
                context.globalAlpha = 0.5;
                context.fill();
                context.restore();
                context.stroke();
            }
        }

        update() {
            // To do
        }
    }

    class Egg {
        constructor(game) {
            this.game = game;
            this.collisionRadius = 40;
            this.margin = this.collisionRadius * 2;
            this.collisionX = this.margin + (Math.random() * (this.game.width - this.margin * 2));
            this.collisionY = this.game.topMargin + (Math.random() * (this.game.height - this.game.topMargin - this.margin));
            this.collisionRadius = 40;
            this.image = document.getElementById('egg');
            this.spriteWidth = 110;
            this.spriteHeight = 135;
            this.width = this.spriteWidth;
            this.height = this.spriteHeight;
            this.spriteX;
            this.spriteY;
            this.hatchTimer = 0;
            this.hatchInterval = 10000;
            this.markedForDeletion = false;
        }

        draw(context) {
            context.drawImage(this.image, this.spriteX, this.spriteY);
            if (this.game.debug) {
                context.beginPath();
                context.arc(this.collisionX, this.collisionY, this.collisionRadius, 0, Math.PI * 2);
                context.save();
                context.globalAlpha = 0.5;
                context.fill();
                context.restore();
                context.stroke();
                const displayTimer = (this.hatchTimer * 0.001).toFixed(0);
                context.fillText(displayTimer, this.collisionX, this.collisionY - this.collisionRadius * 2.8);
            }
        }

        update(deltaTime) {
            this.spriteX = this.collisionX - this.width * 0.5;
            this.spriteY = this.collisionY - this.height * 0.5 - 30;
            // the spread operator (...) allows to expand elements in an array into another array
            // Collisions 
            let collisionObjects = [this.game.player, ...this.game.obstacles, ...this.game.enemies]; 
            collisionObjects.forEach(object => {
                let [collision, distance, sumOfRadii, distanceX, distanceY] = this.game.checkCollision(this, object);
            if (collision) {
                const unit_x = distanceX/distance;
                const unit_y = distanceY/distance;
                this.collisionX = object.collisionX + (sumOfRadii + 1) * unit_x;
                this.collisionY = object.collisionY + (sumOfRadii + 1) * unit_y; 
            }
            });
            // Hatching
            if (this.hatchTimer > this.hatchInterval || this.collisionY < this.game.topMargin) {
                this.game.hatchlings.push(new Larva(this.game, this.collisionX, this.collisionY));
                this.markedForDeletion = true;
                this.game.removeGameObjects();
                // console.log(this.game.eggs);
            } else {
                this.hatchTimer += deltaTime;
            }
        }
    }

    class Larva {
        /* Make larva appear at the same position as the egg it hatched from */
        constructor(game, x, y) {
            this.game = game;
            this.collisionX = x;
            this.collisionY = y;
            this.collisionRadius = 30;
            this.image = document.getElementById('larva');
            this.spriteWidth = 150;
            this.spriteHeight = 150;
            this.width = this.spriteWidth;
            this.height = this.spriteHeight;
            this.spriteX;
            this.spriteY;
            this.speedY = 1 + Math.random();
            this.frameX = 0;
            this.frameY = Math.floor(Math.random() * 2);
        }
        
        draw(context) {
            context.drawImage(this.image, this.frameX * this.spriteWidth, this.frameY * this.spriteHeight, this.spriteWidth, this.spriteHeight, this.spriteX, this.spriteY, this.width, this.height);
            if (this.game.debug) {
                context.beginPath();
                context.arc(this.collisionX, this.collisionY, this.collisionRadius, 0, Math.PI * 2);
                context.save();
                context.globalAlpha = 0.5;
                context.fill();
                context.restore();
                context.stroke();
            }
        }

        update() {
            this.collisionY -= this.speedY;
            this.spriteX = this.collisionX - this.width * 0.5;
            this.spriteY = this.collisionY - this.height * 0.5 - 40;

            // Move larva to safety
            if (this.collisionY < this.game.topMargin) {
                this.markedForDeletion = true;
                this.game.removeGameObjects();
                if (!this.game.gameOver) 
                    this.game.score++;
                for (let i = 0; i < 3; i++) {
                    this.game.particles.push(new Firefly(this.game, this.collisionX, this.collisionY, 'yellow'));
                }
            }

            // Collision with objects
            let collisionObjects = [this.game.player, ...this.game.obstacles, ...this.game.eggs]; 
            collisionObjects.forEach(object => {
                let [collision, distance, sumOfRadii, distanceX, distanceY] = this.game.checkCollision(this, object);
            if (collision) {
                const unit_x = distanceX/distance;
                const unit_y = distanceY/distance;
                this.collisionX = object.collisionX + (sumOfRadii + 1) * unit_x;
                this.collisionY = object.collisionY + (sumOfRadii + 1) * unit_y; 
            }
            });

            // Collision with enemies
            this.game.enemies.forEach(enemy => {
                if (this.game.checkCollision(this, enemy)[0] && !this.game.gameOver) { // deconstruct let [collision, distance, sumOfRadii, distanceX, distanceY]
                    this.markedForDeletion = true;
                    this.game.removeGameObjects();
                    this.game.lostHatchlings++;
                    for (let i = 0; i < 5; i++) {
                        this.game.particles.push(new Spark(this.game, this.collisionX, this.collisionY, 'blue'));
                    }
                }
            });
        }
    }

    class Enemy {
        /* The constructor takes game as an argument and we convert that reference to a class property
        to get access to all properties set on the Game class*/
        constructor(game) {
            this.game = game;
            this.collisionRadius = 30;
            this.speedX = Math.random() * 3 + 0.5;
            this.image = document.getElementById('toads');
            this.spriteWidth = 140;
            this.spriteHeight = 260;
            this.width = this.spriteWidth;
            this.height = this.spriteHeight;
            this.collisionX = this.game.width + this.width + Math.random() * this.game.width * 0.5;
            this.collisionY = this.game.topMargin + (Math.random() * (this.game.height - this.game.topMargin));
            this.spriteX;
            this.spriteY;
            this.frameX = 0;
            this.frameY = Math.floor(Math.random() * 4);
        }

        draw(context) {
            context.drawImage(this.image, this.frameX * this.spriteWidth, this.frameY * this.spriteHeight, this.spriteWidth, this.spriteHeight, this.spriteX, this.spriteY, this.width, this.height);
            if (this.game.debug) {
                context.beginPath();
                context.arc(this.collisionX, this.collisionY, this.collisionRadius, 0, Math.PI * 2);
                context.save();
                context.globalAlpha = 0.5;
                context.fill();
                context.restore();
                context.stroke();
            }
        }

        update() {
            this.spriteX = this.collisionX - this.width * 0.5;
            this.spriteY = this.collisionY - this.height + 40; 
            this.collisionX -= this.speedX;
            if (this.spriteX + this.width < 0 && !this.game.gameOver) {
                this.collisionX = this.game.width + this.width + Math.random() * this.game.width * 0.5;
                this.collisionY = this.game.topMargin + (Math.random() * (this.game.height - this.game.topMargin));
                this.frameY = Math.floor(Math.random() * 4);
            }
            let collisionObjects = [this.game.player, ...this.game.obstacles]; 
            collisionObjects.forEach(object => {
                let [collision, distance, sumOfRadii, distanceX, distanceY] = this.game.checkCollision(this, object);
            if (collision) {
                const unit_x = distanceX/distance;
                const unit_y = distanceY/distance;
                this.collisionX = object.collisionX + (sumOfRadii + 1) * unit_x;
                this.collisionY = object.collisionY + (sumOfRadii + 1) * unit_y; 
            }
            });
        }
    }

    class Particle {
        constructor(game, x, y, color) {
            this.game = game;
            this.collisionX = x;
            this.collisionY = y;
            this.color = color;
            this.radius = Math.floor(Math.random() * 10 + 5);
            this.speedX = Math.random() * 6 - 3;
            this.speedY = Math.random() * 2 + 0.5;
            this.angle = 0;
            this.angleVelocity = Math.random() * 0.1 + 0.01;
            this.markedForDeletion = false;
        }

        draw(context) {
            context.save();
            context.fillStyle = this.color;
            context.beginPath();
            context.arc(this.collisionX, this.collisionY, this.radius, 0, Math.PI * 2);
            context.fill();
            context.stroke();
            context.restore();
        }
    }

    class Firefly extends Particle {
        update() {
            this.angle += this.angleVelocity;
            this.collisionX += Math.cos(this.angle) * this.speedX;
            this.collisionY -= this.speedY;
            if (this.collisionY < 0 - this.radius) {
                this.markedForDeletion = true;
                this.game.removeGameObjects();
            }
        }
    }

    class Spark extends Particle {
        update() {
            this.angle += this.angleVelocity * 0.5;
            this.collisionX -= Math.cos(this.angle) * this.speedX;
            this.collisionY -= Math.sin(this.angle) * this.speedY;
            if (this.radius > 0.1)
                this.radius -= 0.5;
            if (this.radius < 0.2) {
                this.markedForDeletion = true;
                this.game.removeGameObjects();
            }
        }
    }

    class Game {
        constructor(canvas) {
            this.canvas = canvas;
            this.width = this.canvas.width;
            this.height = this.canvas.height;
            this.topMargin = 260;
            this.debug = true;
            // this.isPaused = false;     //----------------------------------------
            this.player = new Player(this);
            this.fps = 70;
            this.timer = 0;
            this.interval = 1000/this.fps;
            this.eggTimer = 0;
            this.eggInterval = 1000;
            this.numberOfObstacles = 10;
            this.maxEggs = 5;
            this.obstacles = [];
            this.eggs = [];
            this.hatchlings = [];
            this.enemies = [];
            this.particles = [];
            this.gameObjects = [];
            this.score = 0;
            this.gameOver = false;
            this.winningScore = 30;
            this.lostHatchlings = 0;
            this.mouse = {
                x: this.width * 0.5,
                y: this.height * 0.5,
                pressed: false
            }

            // Access properties of the mouse event
            // Arrow functions automatically inherit the reference to 'this' keyword from the parent scope    
            canvas.addEventListener('mousedown', event => {
                // console.log(event);
                this.mouse.x = event.offsetX;
                this.mouse.y = event.offsetY;
                this.mouse.pressed = true;
                // offsetX will give us the horizontal coordinate of the click on the target node (canvas element)
                // console.log(event.offsetX, event.offsetY);
                // console.log(this.mouse.x, this.mouse.y);
            });

            canvas.addEventListener('mouseup', event => {
                this.mouse.x = event.offsetX;
                this.mouse.y = event.offsetY;
                this.mouse.pressed = false;
            });

            canvas.addEventListener('mousemove', event => {
                if(this.mouse.pressed) {
                    this.mouse.x = event.offsetX;
                    this.mouse.y = event.offsetY;
                }
            });

            window.addEventListener('keydown', event => {
                if(event.key == 'd') this.debug = !this.debug;
                if(event.key == 'r') this.restart();
                // if(event.key == 'p') this.isPaused = !this.isPaused;
            });
        }

        render(context, deltaTime) {
            if (this.timer > this.interval) {
                context.clearRect(0, 0, this.width, this.height);
                this.gameObjects = [this.player, ...this.eggs, ...this.obstacles, ...this.enemies, ...this.hatchlings, ...this.particles]; // order in which the images are drawn

                // Sort objects by vertical position
                this.gameObjects.sort((a, b) => {
                    return a.collisionY - b.collisionY;
                });
                this.gameObjects.forEach(object => {
                    object.draw(context);
                    object.update(deltaTime);
                });
                this.timer = 0;
            }
            this.timer += deltaTime;

            // Adds eggs periodically
            if (this.eggTimer > this.eggInterval && this.eggs.length < this.maxEggs && !this.gameOver) {
                this.addEgg();
                this.eggTimer = 0;
                // console.log(this.eggs);
            } else {
                this.eggTimer += deltaTime;
            }

            // Draw status
            context.save();
            context.textAlign = 'left';
            context.fillText('Score: ' + this.score, 25, 50);
            if(this.debug) {
                context.fillText('Lost: ' + this.lostHatchlings, 25, 100);
            }
            context.restore();

            // Win/Lose message
            if (this.score >= this.winningScore) {
                this.gameOver = true;

                context.save();
                context.fillStyle = 'rgba(0,0,0,0.5)';
                context.fillRect(0, 0, this.width, this.height);
                context.fillStyle = 'white';
                context.textAlign = 'center';
                context.shadowOffsetX = 4;
                context.shadowOffsetY = 4;
                context.shadowColor = 'black';
                let message1;
                let message2;
                if (this.lostHatchlings <= 5) { // Win
                    message1 = 'Bullseye!!!';
                    message2 = 'You saved the hatchlings!';
                } else {    // Lose
                    message1 = 'Bullocks!';
                    message2 = `You lost ${this.lostHatchlings} hatchlings`; 
                }
                context.font = '130px Lilita One';
                context.fillText(message1, this.width * 0.5, this.height * 0.5 - 20);
                context.font = '40px Lilita One';
                context.fillText(message2, this.width * 0.5, this.height * 0.5 + 35);
                context.fillText(`Final score: ${this.score}. Press 'R' to restart the game`, this.width * 0.5, this.height * 0.5 + 80);
                context.restore();
            }
        }

        checkCollision(a, b) {
            const distanceX = a.collisionX - b.collisionX;
            const distanceY = a.collisionY - b.collisionY;
            const distance = Math.hypot(distanceY, distanceX);
            const sumOfRadii = a.collisionRadius + b.collisionRadius;
            return [(distance < sumOfRadii), distance, sumOfRadii, distanceX, distanceY];
        }

        addEgg() {
            this.eggs.push(new Egg(this));
        }

        addEnemy() {
            this.enemies.push(new Enemy(this));
        }

        removeGameObjects() {
            this.eggs = this.eggs.filter(object => !object.markedForDeletion);
            this.hatchlings = this.hatchlings.filter(object => !object.markedForDeletion);
            this.particles = this.particles.filter(object => !object.markedForDeletion);
            // console.log(this.gameObjects);
        }

        restart() {
            this.player.restart();
            this.obstacles = [];
            this.eggs = [];
            this.hatchlings = [];
            this.enemies = [];
            this.particles = [];
            this.mouse = {
                x: this.width * 0.5,
                y: this.height * 0.5,
                pressed: false
            };
            this.score = 0;
            this.lostHatchlings = 0;
            this.gameOver = false;
            this.init();
        }

        init() {
            for(let i = 0; i < 5; i++) {
                this.addEnemy();
                //console.log(this.enemies);
            }
            // Non-overlapping obstacles
            // Circle packing algorithm
            let attempts = 0;
            while(this.obstacles.length < this.numberOfObstacles && attempts < 500) {
                let testObstacle = new Obstacle(this);
                let overlap = false;
                this.obstacles.forEach(obstacle => {
                    // Circle collision detection, calculates the distance between the centerpoints of two circles
                    const distanceX = testObstacle.collisionX - obstacle.collisionX;
                    const distanceY = testObstacle.collisionY - obstacle.collisionY;
                    const distance = Math.hypot(distanceY, distanceX);
                    const distanceBuffer = 150; // Control obstacle spacing
                    const sumOfRadii = testObstacle.collisionRadius + obstacle.collisionRadius + distanceBuffer;
                    if(distance < sumOfRadii) {
                        overlap = true;
                    }
                });
                const margin = testObstacle.collisionRadius * 3;
                // Make sure that the obstacles are within the game area
                if(!overlap && testObstacle.spriteX > 0 && 
                    testObstacle.spriteX < this.width - testObstacle.width && 
                    testObstacle.collisionY > this.topMargin + margin && 
                    testObstacle.collisionY < this.height - margin) {
                    this.obstacles.push(testObstacle);
                }
                attempts++;
            }
        } 
    }

    const game = new Game(canvas);
    game.init();
    console.log(game);  // Access properties of the 'game' object

    let lastTime = 0;
    function animate(timeStamp) {
        // console.log(timeStamp);
        
        /* Delta time is the amount of milliseconds that passed between each call of requestAnimationFrame()
        Delta time is the difference between timestamp from this animation loop 
        and the timestamp from the previous animation loop */
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        // console.log(deltaTime);

        game.render(ctx, deltaTime);

        /* requestAnimationFrame() will automatically try to adjust itself to the screen refresh rate,
        in most cases 60 fps. It will also automatically generate a timestamp */
        window.requestAnimationFrame(animate);

        // CHECK!!! // --------------------------------------
        //Freeze game
        /*if (!game.isPaused) 
            window.requestAnimationFrame(animate);*/
        
    }
    animate(0);
});