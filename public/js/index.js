(function ($) {
    // https://en.wikipedia.org/wiki/X_%2B_Y_sorting
    const CANVAS = document.getElementById("myCanvas");
    const CTX = CANVAS.getContext("2d");
    const screenWidth = 1200,
        screenHeight = 400;
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
            CTX.fillRect(this.xpos, 0, this.width, screenWidth);
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
            towers.push(
                new Tower(i + i * towerWidth, screenHeight - h, towerWidth, h)
            );
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

    function swapTowers(i1, i2, draw = false) {
        if (draw) {
            towers[i1].erase();
            towers[i2].erase();
        }

        let temp = towers[i1].xpos;
        towers[i1].xpos = towers[i2].xpos;
        towers[i2].xpos = temp;

        if (draw) {
            towers[i1].draw();
            towers[i2].draw();
        }

        temp = towers[i1];
        towers[i1] = towers[i2];
        towers[i2] = temp;
    }

    // Sorting algorithms
    function bubbleSort(i = 0, swapped = false) {
        if (towers[i + 1].height < towers[i].height) {
            swapTowers(i, i + 1);
            animation.record([i, i + 1]);
            swapped = true;
        }

        if (++i == towers.length - 1) {
            if (!swapped) return;
            i = 0;
            swapped = false;
        }
        bubbleSort(i, swapped);
    }
    class Animation {
        constructor(params) {
            this.initialTowers = this.cloneTowers(params.towers);
            this.towers = this.cloneTowers(params.towers);
            this.queue = [];
            this.current = 0;
            this.delay = params.delay ?? 500;
            this.initialized = false;
            this.paused = false;
            this.on = {};
            this.on.complete = params.complete ?? function () { };
            this.on.pause = params.pause ?? function () { };
            this.on.unPause = params.unPause ?? function () { };
            this.on.forward = params.forward ?? function () { };
            this.on.back = params.back ?? function () { };
            this.on.play = params.play ?? function () { };
            this.on.backToStart = params.backToStart ?? function () { };
            this.on.reset = params.reset ?? function () { };
            this.on.stop = params.stop ?? function () { };
        }
        createTowers() {
            towers = this.towers;
            this.initialized = true;
        }
        cloneTowers(towers) {
            return towers.slice().map(function (a) {
                let emptyTower = new Tower();
                return Object.assign(emptyTower, a);
            });
        }
        trigger(eventName) {
            let currentStep = this.queue[this.current];
            switch (eventName) {
                case "complete":
                    this.on["complete"]();
                    break;
                case "pause":
                    this.on["pause"]();
                    break;
                case "unPause":
                    this.on["unPause"]();
                    break;
                case "forward":
                    this.on["forward"](currentStep);
                    break;
                case "back":
                    this.on["back"](currentStep);
                    break;
                case "play":
                    this.on["play"]();
                    break;
                case "backToStart":
                    this.on["backToStart"]();
                    break;
                case "reset":
                    this.on["reset"]();
                    break;
                case "stop":
                    this.on["stop"](this.cloneTowers(this.towers));
                    break;

                default:
                    console.error("event Name " + eventName + " not found");
                    break;
            }
        }
        setTowers(newTowers) {
            this.pause();
            this.initialTowers = this.cloneTowers(newTowers);
            this.reset();
        }
        reset() {
            this.initialized = false;
            this.towers = this.cloneTowers(this.initialTowers);
            this.current = 0;
            this.queue = [];
            this.trigger("reset");
            this.trigger("backToStart");
        }
        stop() {
            this.pause();
            this.towers = this.cloneTowers(this.initialTowers);
            this.current = 0;
            this.trigger("stop");
            this.trigger("backToStart");
        }
        setDelay(delay) {
            this.delay = delay;
        }
        record(step) {
            this.queue.push(step);
        }
        play() {
            if (!this.initialized) this.createTowers();
            this.trigger("play");
            this.unPause();
            this.continue();
        }
        continue() {
            var self = this;
            setTimeout(function () {
                if (self.current < self.queue.length) {
                    if (!self.paused)
                        self.forward(function () {
                            self.continue();
                        });
                } else {
                    self.trigger("complete");
                }
            }, self.delay);
        }
        pause() {
            this.trigger("pause");
            this.paused = true;
        }
        unPause() {
            this.trigger("unPause");
            this.paused = false;
        }
        forward(func = false) {
            if (!this.initialized) this.createTowers();
            this.trigger("forward");
            this.current++;
            if (this.current == this.queue.length) this.trigger("complete");
            if (func !== false) func();
            
        }
        back(func = false) {
            this.current--;
            if (this.current == 0) this.trigger("backToStart");
            this.trigger("back");
            if (func !== false) func();
        }
    }
    createTowers();
    drawTowers();
    let lastSortFunction = bubbleSort;
    let animation = new Animation({
        towers: towers,
        delay: 90,
        complete: function () {
            $("#play").prop("disabled", true);
            $("#pause").prop("disabled", true);
            $("#forward").prop("disabled", true);
            $("#randomize").prop("disabled", false);
        },
        play: function () {
            $("#play").prop("disabled", true);
            $("#pause").prop("disabled", false);
            $("#forward").prop("disabled", true);
            $("#randomize").prop("disabled", true);
            $("#stop").prop("disabled", false);
        },
        pause: function () {
            $("#play").prop("disabled", false);
            $("#pause").prop("disabled", true);
            $("#forward").prop("disabled", false);
            $("#randomize").prop("disabled", false);
            $("#stop").prop("disabled", false);
        },
        backToStart: function () {
            $("#back").prop("disabled", true);
            $("#stop").prop("disabled", true);
        },
        forward: function (step) {
            $("#back").prop("disabled", false);
            $("#stop").prop("disabled", false);
            let leftTower = step[0];
            let rightTower = step[1];
            swapTowers(leftTower, rightTower, true);
        },
        back: function (step) {
            $("#play").prop("disabled", false);
            $("#forward").prop("disabled", false);
            let leftTower = step[0];
            let rightTower = step[1];
            swapTowers(rightTower, leftTower, true);
        },
        stop: function (animationTowers) {
            $("#play").prop("disabled", false);
            $("#forward").prop("disabled", false);
            eraseTowers();
            towers = animationTowers;
            drawTowers();
        },
    });
    lastSortFunction();

    $("#play").on("click", function () {
        animation.play();
    });

    $("#pause").on("click", function () {
        animation.pause();
    });

    $("#forward").on("click", function () {
        animation.forward();
    });
    $("#back").on("click", function () {
        animation.back();
    });
    $("#stop").on("click", function () {
        animation.stop();
    });

    $("#randomize").on("click", function () {
        eraseTowers();
        createTowers();
        drawTowers();
        animation.setTowers(towers);
        lastSortFunction();
    });

    $("#speedSlider").on("change", function () {
        let delayTime = 100 - $("#speedSlider").val();
        animation.setDelay(delayTime);
    });

    $("#nOfTowers").on("change", function () {
        eraseTowers();
        towerWidth = 40 - $("#nOfTowers").val() + 1;
        createTowers();
        drawTowers();
    });
})(jQuery);
