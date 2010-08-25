var SillyHtmlGame = {
    canvas : null,
    context : null,
    balls : [],
    offsetPosition : { x : 0, y : 0 },
    mousePosition : { x : 0, y : 0 },
    rotation : 0,
    radius : 50,
    lives : 0,
    score : 0,
    ballSpeed : 1,
    gapWidth : 1,
    timersSet : false,
    paused : true,
    init : function(canvasId)
    {
        this.canvas = document.getElementById(canvasId);
        if (this.canvas.getContext)
        {
            this.context = this.canvas.getContext('2d');
            this.offsetPosition = getElementPosition(canvasId);
        }
        else
        {
            alert('Canvas not supported!');
            return;
        }
        
        this.score = 0;
        this.lives = 5;

        this.canvas.onmousemove = function(event) { SillyHtmlGame.mousePosition.x = event.clientX - SillyHtmlGame.offsetPosition.x + document.documentElement.scrollLeft; SillyHtmlGame.mousePosition.y = event.clientY - SillyHtmlGame.offsetPosition.y + document.documentElement.scrollTop; }
        this.canvas.onmouseup = function(event) { SillyHtmlGame.paused = !SillyHtmlGame.paused; }
        
        if (!this.timersSet)
        {
            setInterval(function() { SillyHtmlGame.update(); }, 40);
            setInterval(function() { SillyHtmlGame.fire(); }, 4000);
            this.timersSet = true;
        }
    },
    update : function()
    {
        if (!this.paused)
        {
            var screenCentre = { x : this.canvas.width / 2, y : this.canvas.height / 2 }
            
            this.rotation = normaliseAngle(Math.atan2(this.mousePosition.y - screenCentre.y, this.mousePosition.x - screenCentre.x));
            this.radius = Math.sqrt(Math.pow(this.mousePosition.x - screenCentre.y, 2) + Math.pow(this.mousePosition.y - screenCentre.y, 2));
            this.radius = Math.max(Math.abs(this.radius), 20);
            this.radius = Math.min(this.radius, 180);
        
            // Update and draw balls
            for (var i = 0; i < this.balls.length; i ++)
                this.balls[i].distance += this.ballSpeed;
            
            // Collisions and game logic
            for (var i = 0; i < this.balls.length; i ++)
            {
                // If a ball reaches the edge delete it and increment the score
                if (this.balls[i].distance > 200)
                {
                    this.score ++;
                    this.balls.splice(i, 1); // remove from list
                    i --;
                    continue;
                }
                
                // Check for collisions against the rings
                var hitRingOne = this.balls[i].distance >= this.radius - 8 - 5
                    && this.balls[i].distance <= this.radius + 7
                    && !(this.balls[i].direction > this.rotation - this.gapWidth
                    && this.balls[i].direction < this.rotation);
                
                var radius2 = 200 - this.radius;
                var rotation2 = normaliseAngle(this.rotation - Math.PI);
                var hitRingTwo = this.balls[i].distance >= radius2 - 8 - 5
                    && this.balls[i].distance <= radius2 + 7
                    && !(this.balls[i].direction > rotation2 - this.gapWidth
                    && this.balls[i].direction < rotation2);

                // And handle accordingly
                if (hitRingOne || hitRingTwo)
                {
                    this.lives --;
                    this.balls.splice(i, 1);    // remove the ball that was hit
                    i --;                       // and tweak the iterator    
                    continue;
                }
            }
        }
        
        this.draw();
    },
    draw : function()
    {
        var screenCentre = { x : this.canvas.width / 2, y : this.canvas.height / 2 }

        this.context.fillStyle = '#f0f0f0';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);        

        for (var i = 0; i < this.balls.length; i ++)
        {
            var x = Math.cos(this.balls[i].direction) * this.balls[i].distance + screenCentre.x;
            var y = Math.sin(this.balls[i].direction) * this.balls[i].distance + screenCentre.y;            

            this.context.fillStyle = this.balls[i].colour;
            this.context.beginPath();
            this.context.arc(x, y, 5, 0, Math.PI * 2, false);
            this.context.closePath();
            this.context.fill();
        }

        // Draw rings
        this.context.lineWidth = 15;

        this.context.strokeStyle = '#ff8000';
        this.context.beginPath();
        this.context.arc(screenCentre.x, screenCentre.y, this.radius, this.rotation, this.rotation + (Math.PI * 2 - this.gapWidth), false);
        this.context.stroke();
        
        this.context.strokeStyle = '#707070';
        this.context.beginPath();
        this.context.arc(screenCentre.x, screenCentre.y, 200 - this.radius, this.rotation - Math.PI, this.rotation - Math.PI + (Math.PI * 2 - this.gapWidth), false);
        this.context.stroke();
        
        // Draw UI
        this.context.fillStyle = '#707070';
        this.context.textAlign = 'center';
        this.context.font = '30px Arial bold';
        this.context.fillText(this.lives.toString(), 30, this.canvas.height - 20);
        this.context.fillText(this.score.toString(), this.canvas.width - 30, this.canvas.height - 20);
        
        // Prompt
        if (this.paused)
        {
            this.context.fillStyle = 'rgba(240, 240, 240, 0.8)';
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);        
            this.context.fillStyle = '#707070';
            this.context.fillText("Click to start", this.canvas.width / 2, this.canvas.height / 2);
        }
        
        if (this.lives <= 0)
        {
            this.balls.splice(0, this.balls.length);
            alert("You dead, foo'!");
            this.init(this.canvas.id); // Hacky - need an init without canvas ID
            this.paused = true;
        }
    },
    fire : function()
    {
        if (!this.paused)
        {
            var ball = new Object();
            ball.distance = 0;
            ball.direction = Math.random() * Math.PI * 2;
            ball.colour = '#000';
            this.balls.push(ball);
        }
    }
}

function getElementPosition(elementId)
{
    var result = { x: 0, y: 0 }
    var element = document.getElementById(elementId)
    while (element != null)
    {
        result.x += element.offsetLeft;
        result.y += element.offsetTop;
        element = element.offsetParent;
    }
    return result;
}

function normaliseAngle(radians)
{
    // TODO: Handle Math.PI * 6, etc.
    if (radians >= Math.PI * 2)
        radians -= Math.PI * 2;
    else if (radians < 0)
        radians += Math.PI * 2;
    return radians;
}