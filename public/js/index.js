(function ($) {
    // https://en.wikipedia.org/wiki/X_%2B_Y_sorting
    const CANVAS = document.getElementById("myCanvas");
    const CTX = CANVAS.getContext("2d");
    const screenWidth = 1200, screenHeight = 400;
    let towerWidth = 40;
    let towers = [];

    CTX.lineWidth = 1;


    class Tower {
        constructor(xpos, ypos, width, height) {
            this.xpos = xpos;
            this.ypos = ypos;
            this.width = width;
            this.height = height;
        }
        
        draw() {
            CTX.fillStyle = "#000000";
            CTX.beginPath();
            CTX.fillRect(this.xpos, this.ypos, this.width, this.height);
            CTX.stroke();   
        }
        
        erase() {
            CTX.fillStyle = "#FAFAFA";
            CTX.beginPath();
            CTX.fillRect(this.xpos, this.ypos, this.width, screenHeight);
            CTX.stroke();  
        }
            
        setHeight(h) {
            this.erase();
            this.height = h;
            this.draw();
        }
        
        update(xpos, ypos) {

            // Remove the previous tower
            CTX.fillStyle = "#FAFAFA";
            CTX.beginPath();
            CTX.fillRect(this.xpos, this.ypos, this.width, 400);
            CTX.stroke();
            
            // Draw the new one
            this.xpos = xpos;
            this.ypos = ypos;
            
            CTX.fillStyle = "#000000";
            CTX.beginPath();
            CTX.fillRect(this.xpos, this.ypos, this.width, this.height);
            CTX.stroke();     
        }
    }

    function createTowers() {
        towers = [];
        let N = screenWidth / towerWidth - 1;
        
        for (let i = 0; i < N; i++) {
            let h = Math.floor(Math.random() * (screenHeight - 1)) + 1;
            // let h = i * (screenHeight - 10) / N + 10;
            towers.push(new Tower(i + i*towerWidth, screenHeight - h, towerWidth, h));
        }
    }

    function eraseTowers() {
        for (let i = 0; i < towers.length; i++) {
            towers[i].erase();
        }
    }

    function drawTowers() {
        for (let i = 0; i < towers.length; i++) {
            towers[i].draw();
        } 
    }

    function swapTowers(i1, i2) {
        towers[i1].erase();
        towers[i2].erase();

        let temp = towers[i1].xpos;
        towers[i1].xpos = towers[i2].xpos;
        towers[i2].xpos = temp;

        towers[i1].draw();
        towers[i2].draw();

        temp = towers[i1];
        towers[i1] = towers[i2];
        towers[i2] = temp;
    }

    // Sorting algorithms
    function bubbleSort(delay, i = 0, swapped = false) {

        setTimeout(function () {
            if (towers[i + 1].height < towers[i].height) {
                swapTowers(i, i + 1);
                swapped = true;
            }

            if (++i == towers.length - 1) {
                if (!swapped) {
                    $('#randomize').prop('disabled', false);
                    $('#play').prop('disabled', false);
                    unPauseSorting();
                    return;
                }

                i = 0;
                swapped = false;
            }   
            if(!paused)
                bubbleSort(delay, i, swapped)        
        }, delay);
    }
    function unPauseSorting(){
        $(".play-pause-toggle").toggle();
        paused = false;
    }
    function pauseSorting(){
        $(".play-pause-toggle").toggle()
        paused = true;
    }
    createTowers();
    drawTowers();
    
    let lastSortFunction = bubbleSort;
    let delayTime = 99;
    let position = 0;
    let paused = false;
    $('#speedSlider').val(delayTime);

    $('#play').on('click', function () {
        $('#randomize').prop('disabled', true);
        $('#play').prop('disabled', true);
        // Get speed data if not changed
        delayTime = 100 - $('#speedSlider').val();
        unPauseSorting();
        lastSortFunction(delayTime, position);
    });

    $('#pause').on('click', function () {
        $('#play').prop('disabled', false);
        pauseSorting();
    });

    $('#randomize').on('click', function () {
        eraseTowers();
        createTowers();
        drawTowers();
    });

    $('#speedSlider').on('change', function () {
        delayTime = 100 - $('#speedSlider').val();
    });

    $('#nOfTowers').on('change', function () {
        eraseTowers();
        towerWidth = 40 - $('#nOfTowers').val() + 1;
        createTowers();
        drawTowers();
    });

})(jQuery);

