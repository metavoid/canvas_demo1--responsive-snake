(function() {

    var cnvs = document.getElementById('canvas');
    var ctx = cnvs.getContext('2d');
    var options = {

        cellSize: 15,
        fps: 15,
        containerSelector: 'canvas-container'

    };



    var snake = [];
    var direction = 1;
    var newDirection = null;
    var seed = {};
    var pause = false;
    var end = false;

    var colorScheme = {
        bgcolor1: getRandomColor() || '#117100',
        bgcolor2: getRandomColor() || '#33BB00',
        wallpaper: getRandomColor() || '#00609F',
        snakeColor: getRandomColor() || '#FB7100',
        cell: getRandomColor() || '#FFDB0F',
        seed: getRandomColor() || '#EC04FF'
    }

    ctx.clrScr = function() {
        this.clearRect(0, 0, cnvs.width, cnvs.height);
    }


    //draw double cube with hardcoded const

    function drawCube(x, y, color) {

        ctx.fillStyle = color;
        var cellSize = options.cellSize;
        ctx.fillRect(x, y, cellSize, cellSize);
        var delta = cellSize / 3.5;
        ctx.fillStyle = colorScheme.cell;
        ctx.fillRect(x + delta, y + delta, cellSize - delta * 2, cellSize - delta * 2);

    }

    // Draw cell and set cell size
    function drawCell(x, y, color) {
        ctx.save();
        if (x > options.width || y > options.height) {
            return false;
        } else {
            var cellSize = options.cellSize;
            drawCube(x * cellSize, y * cellSize, color);
        }
        ctx.restore();

    }

    //start rendering loop with limited framerate

    var limitLoop = function(fn, fps) {

        // Use var then = Date.now(); if you
        // don't care about targetting < IE9
        var then = new Date().getTime();

        // custom fps, otherwise fallback to 60
        fps = fps || 60;
        var interval = 1000 / fps;

        return (function loop(time) {
           if (!end) {
                requestAnimationFrame(loop);
           }

            // again, Date.now() if it's available
            var now = new Date().getTime();
            var delta = now - then;

            if (delta > interval) {
                // Update time
                // now - (delta % interval) is an improvement over just 
                // using then = now, which can end up lowering overall fps
                then = now - (delta % interval);

                // call the fn
                fn();
            }


        }(0));
    };

    //init game
    function init() {

        applyColors(colorScheme);
        end = false;
        pause = false;

        //Get container
        var containerWidth = document.getElementById(options.containerSelector).clientWidth;
        var containerHeight = document.getElementById(options.containerSelector).clientHeight;


        //Create even cell layout (centered with css)
        cnvs.width = containerWidth - (containerWidth % options.cellSize) - options.cellSize;
        cnvs.height = containerHeight - (containerHeight % options.cellSize) - options.cellSize;

        //Set width in cells (not pixels) to create virtual grid
        options.width = (cnvs.width / options.cellSize);
        options.height = (cnvs.height / options.cellSize);


        //create new horizontal snake in center of responsive layout
        snake.push({ x: Math.floor(options.width / 2), y: Math.floor(options.height / 2) });
        snake.push({ x: snake[0].x + 1, y: snake[0].y });
        snake.push({ x: snake[1].x + 1, y: snake[0].y });

        //create new seed for snake to eat
        newSeed();

        //starting render loop
        limitLoop(render, options.fps);


    }

    function applyColors(scheme) {

        //apply color scheme
        cnvs.style.background = 'radial-gradient(' + scheme.bgcolor1 + ', ' + scheme.bgcolor2 + ')';

        document.getElementsByTagName('body')[0].style.background = scheme.wallpaper;

        colorScheme = scheme;
    }


    //Render loop
    function render() {

        if (pause) {

            canvas.classList.add('paused');
            return false;

        } else {
            canvas.classList.remove('paused');
        }

        ctx.clrScr();

        //render seed

        drawCell(seed.x, seed.y, colorScheme.seed);

        //snake makes next step

        move();

        //render snake

        var snakeColor = colorScheme.snakeColor;

        snake.forEach(function(cell) {
            drawCell(cell.x, cell.y, snakeColor);
        });
    }

    function move() {

        //Initial position for next cell
        var nextCell = {
            x: snake[snake.length - 1].x,
            y: snake[snake.length - 1].y
        }

        //If user pressed some arrow key after previous rebder loop
        if (newDirection) {

            //Determine new direction and blocking 180 degree turns
            Math.abs(newDirection) == Math.abs(direction) ? "" : direction = newDirection;
            newDirection = null;
        }

        //Using our pseudo-corrd system find next cell position
        Math.abs(direction) == 2 ? nextCell.y += (direction / 2) : nextCell.x += direction;

        //check collapse - autofagia

        if (ifCollapse(nextCell)) {
            gameOver();
        } else {

            //Check if seed was eaten and add this extra cell
            if (nextCell.x == seed.x && nextCell.y == seed.y) {
                snake.push(nextCell);
                newSeed();
                //Else move snake one step
            } else {
                snake.shift();
                snake.push(nextCell);
            }

        }



    }

    //Recursive search for new random seed coords
    function newSeed() {
        seed = { x: Math.floor(getRandomArbitrary(0, options.width - 1)), y: Math.floor(getRandomArbitrary(0, options.height - 1)) };
        for (i = 0; i < snake.length; i++) {
            if (snake[i].x == seed.x && snake[i].y == seed.y) {
                newSeed();
                break;
            }

        }
    }

    //Check for collapse
    function ifCollapse(nextCell) {

        //Self collapse
        for (i = 0; i < snake.length; i++) {
            if (snake[i].x == nextCell.x && snake[i].y == nextCell.y) {
                return true;
            }

        }

        //Walls collapse
        if (nextCell.x >= options.width || nextCell.y >= options.height || nextCell.x < 0 || nextCell.y < 0) {
            return true;
        }

        return false;
    }

    function gameOver() {
        end = true;
    }

    function shuffleColors() {
        colorScheme = {
            bgcolor1: getRandomColor(),
            bgcolor2: getRandomColor(),
            wallpaper: getRandomColor(),
            snakeColor: getRandomColor(),
            cell: getRandomColor(),
            seed: getRandomColor()
        }

        applyColors(colorScheme);
    }

    function reset() {
        snake = [];
        direction = 1;
        newDirection = null;
        seed = {};

        end = true;

        setTimeout(init, 10);


    }

    init();

    window.game = {
        init: init,
        options: options,
        colorScheme: colorScheme,
        applyColors: applyColors
    };




    //Events

    window.onresize = function(event) {
        reset();
    }

    document.onkeydown = checkKey;

    function checkKey(e) {

        e = e || window.event;
        console.dir(e);
        if (!pause) {

            if (e.keyCode == '38') {
                // up newDirection

                newDirection = -2;
            } else if (e.keyCode == '40') {
                // down newDirection
                newDirection = 2;
            } else if (e.keyCode == '37') {
                // left newDirection
                newDirection = -1;
            } else if (e.keyCode == '39') {
                // right newDirection
                newDirection = 1;
            }

        }

        if (e.keyCode == '32') {
            // Pause

            !!pause ? pause = false : pause = true;

        } else if (e.keyCode == '17') {
            //Shuffle colors

            shuffleColors();
        } else if (e.keyCode == "13") {
            //Full screen on enter
            toggleFullScreen();
        }
    }

    // Utils

    function getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }

    function getRandomColor() {
        for (var a = "0123456789ABCDEF".split(""), b = "#", c = 0; 6 > c; c++)
            b += a[Math.floor(16 * Math.random())];
        return b
    }

    function toggleFullScreen() {
        document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement ? document.cancelFullScreen ? document.cancelFullScreen() : document.mozCancelFullScreen ? document.mozCancelFullScreen() : document.webkitCancelFullScreen && document.webkitCancelFullScreen() : document.documentElement.requestFullscreen ? document.documentElement.requestFullscreen() : document.documentElement.mozRequestFullScreen ? document.documentElement.mozRequestFullScreen() : document.documentElement.webkitRequestFullscreen && document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT)
    }






})();
