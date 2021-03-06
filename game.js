;(function (){
    var Game = function () {
        var screen = document.getElementById('screen').getContext('2d');
        this.size = {x:screen.canvas.width, y:screen.canvas.height};
        screen.lineWidth = '6';
        screen.rect(0,0,this.size.x, this.size.y);
        screen.stroke();
        screen.font = '20px Georgia';

        this.bodies = [new Player(this)];
        this.origin = new Origin(this);
        this.fruit = [];

        this.isOver = false;
        this.endTicker =0;

        
        var self = this;

        var tick = function(){  
            
            if (self.isOver === true){
                self.endSequence();
                self.endTicker +=1;
                if (self.bodies.length === 0){ 
                    self.printGameOver(screen);
                    storeHighScore(self.score);
                    return true;
                }                     
            } else {
                self.update();
            }
            self.draw(screen);
            requestAnimationFrame(tick);
        };
        tick();
    };

    Game.prototype = {
        update: function(){
            this.score = this.bodies.length - 1;
            this.origin.update();
            for (var i = 0; i< this.bodies.length; i++){
                this.bodies[i].update();
            }
            if (Math.random() > 0.99570 && this.fruit.length<10){
                this.addFruit();
            }
        },
        draw: function(screen){
            screen.clearRect(3, 3, this.size.x-6, this.size.y-6);
            screen.fillText(this.score, 30,40);
            this.origin.draw(screen);
            for (var i = 0; i< this.bodies.length; i++){
                this.bodies[i].draw(screen);        
            }
            for (var i = 0; i< this.fruit.length; i++){
                this.fruit[i].draw(screen);                
            }
        },
        addBody: function(body){
            this.bodies.unshift(body);
        },
        addFruit: function(){
            var fruitCentre = {x: 10+ Math.random()*(this.size.x-20), y: 10+ Math.random()*(this.size.y-20)};
            var points = Math.floor( Math.random()*4 ) + 1 ;
            var colour = randomColours[Math.floor(Math.random()*randomColours.length)];
            this.fruit.push( new Fruit(this, points, fruitCentre, colour, 0));
        },
        endSequence: function(){
            if (this.bodies.length>0) { 
                if (this.endTicker%7==0) 
                    this.bodies.pop();
            }
        },
        printGameOver: function(screen){
            screen.font = '40px Georgia';
            this.draw(screen);
            screen.fillText("GAME OVER", this.size.x/2, this.size.y/2);                    
        }

        
                
            //self.draw(screen);
            //requestAnimationFrame(endSequence);

    };


    var Player = function(game) {
        this.game = game;

        this.size = { x: 10, y: 10};
        this.polars = {r: 100, theta: 0};
        this.centre = { x: this.game.size.x/2 + this.polars.r , y: this.game.size.y/2};
        this.colour = '#000000';
        
        this.velocity = {r: 0, theta: 0.0125};
        this.keyboarder = new Keyboarder();

        this.next = null;
        this.prev = null;

        this.tracks = {x: [], y: []};
    };

    Player.prototype = {
        update: function(){
            if (this.keyboarder.isDown(this.keyboarder.KEYS.UP)
              || this.keyboarder.isDown(this.keyboarder.KEYS.K)){
                if (this.velocity.r ==0){
                    if (this.polars.r >=0){
                        this.velocity.r = 1.5;
                    } else
                        this.velocity.r = -1.5;
                    this.velocity.theta = 0;
                }             
            } else if (this.keyboarder.isDown(this.keyboarder.KEYS.DOWN)
               || this.keyboarder.isDown(this.keyboarder.KEYS.J)){
                if (this.velocity.r ==0){
                    if (this.polars.r>=0){
                        this.velocity.r = -1.5;
                    } else 
                        this.velocity.r = 1.5;
                    this.velocity.theta = 0;
                }
            } else if (this.keyboarder.isDown(this.keyboarder.KEYS.LEFT)
               || this.keyboarder.isDown(this.keyboarder.KEYS.H)){
                if (this.polars.r > 5 || this.polars.r<-5){
                    if (this.velocity.theta == 0){
                        this.velocity.r = 0;
                        this.velocity.theta = -0.0125;
                    }
                }
            } else if (this.keyboarder.isDown(this.keyboarder.KEYS.RIGHT)
               || this.keyboarder.isDown(this.keyboarder.KEYS.L)){
                if (this.polars.r > 5 || this.polars.r<-5){
                    if (this.velocity.theta == 0){
                        this.velocity.r = 0;
                        this.velocity.theta = 0.0125;
                    }
                }
            } 

            if (this.keyboarder.isDown(this.keyboarder.KEYS.SPACE)){
                if (this.velocity.r == 1.5){
                    this.velocity.r = 3
                } else if (this.velocity.r == -1.5){
                    this.velocity.r = -3
                } else if (this.velocity.theta == 0.0125){
                    this.velocity.theta = 0.025
                } else if (this.velocity.theta == -0.0125){
                    this.velocity.theta = -0.025
                }
            } else {
                if (this.velocity.r == 3){
                    this.velocity.r = 1.5
                } else if (this.velocity.r == -3){
                    this.velocity.r = -1.5
                } else if (this.velocity.theta == 0.025){
                    this.velocity.theta = 0.0125
                } else if (this.velocity.theta == -0.025){
                    this.velocity.theta = -0.0125
                }
            }
                            
             

            this.storeInTracks();

            this.polars.r += this.velocity.r;
            this.polars.theta += this.velocity.theta;
        
            this.toCartesian(this.polars.r, this.polars.theta);

            this.checkCollision();
            this.checkSelfCollision();
            this.checkOutOfBounds();

        },
        draw: function(screen) {
            drawRect(screen, this, this.colour);
        },
        toCartesian: function(){
            this.centre.x = this.polars.r*Math.cos(this.polars.theta) + this.game.origin.centre.x;
            this.centre.y  = this.polars.r*Math.sin(this.polars.theta) + this.game.origin.centre.y;
        },
        storeInTracks: function(){
            storeThisPosition(this);
        },
        addTail: function(){
            var segment = this;
            while (true){
                if (segment.next === null){ 
                    segment.next = new BodyPart(segment.game, segment);
                    segment.game.addBody(segment.next);
                    break;
                }
                segment = segment.next;
                }
        },
        checkCollision: function(){
            for (var i=0; i<this.game.fruit.length; i++ ){
                if (isCollision(this, this.game.fruit[i])){
                    for (var j= 0; j< this.game.fruit[i].points; j++){
                        this.addTail();
                    }
                    this.game.fruit.splice(i,1);
                }
            }
        },
        checkSelfCollision: function(){
            for (var i=0; i<this.game.bodies.length-1; i++){
                if(collidedWithTracks(this.centre, this.game.bodies[i].tracks)){
                    this.game.isOver= true;
                    console.log(this.game.isOver)

                };
            }

        },
        checkOutOfBounds: function(){
            if (this.centre.x < 0 || this.centre.x > this.game.size.x ||
                this.centre.y < 0 || this.centre.y > this.game.size.y){
                this.game.isOver = true;
            }
        }
    }

    


    var BodyPart = function(game, previous){       
        this.game = game;
        this.size = {x:10, y:10};
        this.centre = {x:previous.tracks.x[0], y:previous.tracks.y[0]};

        this.prev = previous;
        this.next = null;

        this.tracks = {x:[], y:[]};
    }

    BodyPart.prototype = {
        update: function(){
        this.storeInTracks();
        this.centre.x = this.prev.tracks.x[0];
        this.centre.y = this.prev.tracks.y[0];
        },        
        draw: function(screen){
            drawRect(screen, this);
        },
        storeInTracks: function(){
            storeThisPosition(this);
        }
    }

    var Fruit = function (game, points, centre, colour, velocity){
        this.game = game; 
        this.points = points;
        this.colour = colour;
        
        this.size = {x:9-this.points, y:9-this.points};
        this.centre = centre;
        this.velocity = velocity;
    }

    Fruit.prototype = {
       draw: function(screen){
            drawRect(screen, this, this.colour)
       }
    }



   var Origin = function(game){ //why?? function of game?
       this.game = game;
       this.size = {x:3, y:3};
       this.centre = { x: this.game.size.x/2, y: this.game.size.y / 2}; 
       this.noTurnCircle = {x:this.centre.x, y:this.centre.y, r:20}

       this.keyboarder = new Keyboarder()
       this.colour = '#ffffff';  
       this.turnColour = '#ffffff';

    }

    Origin.prototype = {
        update: function(){
            if (this.keyboarder.isDown(this.keyboarder.KEYS.SPACE)){
                this.noTurnCircle.r = 10;
            } else {
                this.noTurnCircle.r = 20;
            }

            if (this.keyboarder.isDown(this.keyboarder.KEYS.T)){
                this.colour = '#000000';
                this.turnColour = '#ff0000';
            } else {
                this.colour ='#ffffff';
                this.turnColour = '#ffffff';
            }


            

            //'Only move this if you want insane mode'
        },
        draw: function(screen){
            drawRect(screen, this, this.colour);
            drawCircle(screen, this.noTurnCircle, this.turnColour);
        }
    }


    var Keyboarder = function() {
        var keyState = {};
        window.addEventListener('keydown', function(e){
            keyState[e.keyCode] = true;
        });

        window.addEventListener('keyup', function(e){
            keyState[e.keyCode] = false;
        })

        this.isDown = function(keyCode){
            return keyState[keyCode]===true;
        };
        this.KEYS = {LEFT: 37, RIGHT:39, UP:38, DOWN:40, SPACE:32, T:84,
                     H:72, J:74, K:75, L:76};
        }

    var storeThisPosition = function(segment){
        var memory = 8;
        segment.tracks.x.push(segment.centre.x);
        segment.tracks.y.push(segment.centre.y);
        if (segment.tracks.x.length>memory || segment.tracks.y.length>memory){
            segment.tracks.x.shift();
            segment.tracks.y.shift();
        }
    }


    var drawRect = function(screen, body, colour){
        var drawColour = colour;
        if (colour === undefined){
            drawColour = '#000000';
        } 

        screen.fillStyle= drawColour;
        screen.fillRect(body.centre.x - body.size.x/2,
                    body.centre.y - body.size.y/2,
                    body.size.x,
                    body.size.y);
        screen.fillStyle= '#000000';
    }
 
    var drawCircle = function(screen, body, colour){
        var drawColour = colour;
        if (colour ===undefined){
            drawColour = '#000000'
        }

        screen.strokeStyle = drawColour;
        screen.lineWidth = 0.5;
        screen.beginPath();
        screen.arc(body.x,body.y, body.r, 0, 2*Math.PI);
        screen.stroke();
        

    }

    var isCollision = function(bodyA, bodyB){
        if ((bodyB.centre.x-bodyB.size.x/2 < bodyA.centre.x+bodyA.size.x/2) &&
            (bodyB.centre.x+bodyB.size.x/2 > bodyA.centre.x-bodyA.size.x/2) &&
            (bodyB.centre.y-bodyB.size.y/2 < bodyA.centre.y+bodyA.size.y/2) &&
            (bodyB.centre.y+bodyB.size.y/2 > bodyA.centre.y-bodyA.size.y/2) ){
            console.log(bodyA.centre.x, bodyB.centre.x);
            return true;
        }
        else
            return false;
    }

    var collidedWithTracks = function(head, tracks){
        var bucket = 2;
        for (var i=0; i<tracks.x.length; i++){
            if (Math.floor(head.x/bucket)==Math.floor(tracks.x[i]/bucket) &&
                Math.floor(head.y/bucket)==Math.floor(tracks.y[i]/bucket) ){
                return true;
            }
        }
        return false;

        
    }

    var randomColours = ['#5ABA47'];  //'Hacker School' Green

    function storeHighScore(aScore){
        if (typeof(Storage) !== "undefined") {
            
            if (localStorage.getItem(aScore) ==null){
                localStorage.setItem(aScore, userName)
            }
            console.log(aScore, userName)
        } else{
             console.log('Sorry! No Web Storage support...')
        }

    }

    window.addEventListener('load', function(){
        new Game();
    });
})();


