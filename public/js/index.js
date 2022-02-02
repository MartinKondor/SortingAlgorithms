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

    
    class Animation {
        constructor(params) {
            this.current = 0;
            this.queue = [];
            this.initialized = false;
            this.paused = false;
            this.updates = 0;
            this.complete = false;
            this.array=params.array ?? [];
            this.lastRecordedFunc = function(){};

            //determines when to record an update to the array
            this.recordEach = params.recordEach ?? 1;
            this.delay = params.delay ?? 500;
            this.on = {};
            this.on.init = params.init ?? function () { };
            this.on.complete = params.complete ?? function () { };
            this.on.pause = params.pause ?? function () { };
            this.on.unPause = params.unPause ?? function () { };
            this.on.forward = params.forward ?? function () { };
            this.on.back = params.back ?? function () { };
            this.on.play = params.play ?? function () { };
            this.on.backToStart = params.backToStart ?? function () { };
            this.on.reset = params.reset ?? function () { };
            this.on.stop = params.stop ?? function () { };

            this.push(this.array);
            this.init();
        }
        init() {
            this.trigger("init");
            this.initialized = true;
        }
        trigger(eventName) {
            let currentStep = this.queue[this.current];
            switch (eventName) {
                case "init":
                    this.on["init"](currentStep);
                    break;
                case "complete":
                    this.complete = true;
                    this.current = this.queue.length - 1;
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
                    this.on["stop"](currentStep);
                    break;

                default:
                    console.error("event Name " + eventName + " not found");
                    break;
            }
        }
        setArray(newArr) {
            var self=this;
            self.pause();
            self.array = newArr;
            self.reset();
        }
        reset() {
            this.current = 0;
            this.queue = [];
            this.complete = false;
            this.updates = 0;
            this.push(this.array)
            this.init();
            this.trigger("reset");
            this.trigger("backToStart");
        }
        stop() {
            this.pause();
            this.current = 0;
            this.complete = false;
            this.updates = 0;
            this.trigger("stop");
            this.trigger("backToStart");
        }
        setDelay(delay) {
            this.delay = delay;
        }
        play() {
            if (!this.initialized) this.init();
            this.trigger("play");
            this.unPause();
            this.continue();
        }
        continue() {
            var self = this;
            setTimeout(function () {
                if (!self.complete) 
                    if (!self.paused)
                        self.forward(function () {
                            self.continue();
                        });
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
            if (!this.initialized) this.init();
            this.current++;
            if (this.current == this.queue.length) this.trigger("complete");
            this.trigger("forward");
            if (func !== false) func();
            
        }
        back(func = false) {
            this.complete = false;
            this.current--;
            if (this.current == 0) this.trigger("backToStart");
            this.trigger("back");
            if (func !== false) func();
        }
        push(updatedArr){
                this.queue.push(updatedArr.slice())
        }
        last(){
            return this.queue.slice().pop();
        }
        record(func){
            var self = this;
            self.lastRecordedFunc = func;
            var watchableArray = new Proxy(self.array, {
                set: function(target, propertyName, value, receiver) {      
                  target[propertyName] = value;
                  // count this as an update only if it's not a duplicate of the last recorded version of the array
                  if(self.queue.length ==0 || self.last().join() != self.array.join()){
                      self.updates++;
                      // record each X updates
                      if(self.updates % self.recordEach == 0)
                        self.push(self.array)
                  }

                  return true;
                },
                apply: function(target, thisArg, argArray) {
                    console.log("apply");
                  return thisArg[target].apply(this, argArray);
                },
                deleteProperty: function(target, propertyName) {
                  return true;
                },
              });
            func(watchableArray)
        }
    }

    function randomArr(length, min, max) {
        let arr = [];

        for (let i = 0; i < length; i++) {
            let value = Math.random() * (max - min) + min;
            arr.push(value);
        }
        return arr;
    }

    function arrToTowers(arr){
        var towers = [];
        var l = arr.length;
        for (let i = 0; i < l; i++) {
            let h = arr[i];
            towers.push(
                new Tower(i + i * towerWidth, screenHeight - h, towerWidth, h)
            );
        }
        return towers;
    }

    function eraseTowers(towers) {
        CTX.clearRect(0, 0, screenWidth, screenHeight);
    }

    function drawTowers(towers) {
        for (let i = 0; i < towers.length; i++) {
            towers[i].draw();
        }
    }

    function rebuildTowers(arr){
        eraseTowers(towers);
        let newTowers = arrToTowers(arr)
        drawTowers(newTowers);
    }

    function swapArrElements(arr, i1, i2, draw = false) {
        let left = arr[i1];
        let right = arr[i2];
        arr[i1] = right;
        arr[i2] = left;
        return arr;
    }

    // Sorting algorithms
    function bubbleSort(arr, i = 0, swapped = false) {
        if (arr[i + 1] < arr[i]) {
            arr = swapArrElements(arr, i, i + 1);
            swapped = true;
        }

        if (++i == arr.length - 1) {
            if (!swapped) return;
            i = 0;
            swapped = false;
        }
        bubbleSort(arr, i, swapped);
    }
    
    let arrLength = screenWidth / towerWidth - 1;
    let arr = randomArr(arrLength, 10, screenHeight - 1);
    let animation = new Animation({
        array:arr,
        // the array gets updated twice on each swap so each 2 consecutive updates represent a step
        recordEach:2,
        towers: towers,
        delay: 90,
        init:function(step){
            towers = arrToTowers(step);
            eraseTowers(towers);
            drawTowers(towers);
        },
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
            rebuildTowers(step);
        },
        back: function (step) {
            $("#play").prop("disabled", false);
            $("#forward").prop("disabled", false);
            rebuildTowers(step);
        },
        stop: function (step) {
            $("#play").prop("disabled", false);
            $("#forward").prop("disabled", false);
            rebuildTowers(step);
        },
    });

    animation.record(function(arr){
        bubbleSort(arr);
    })

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
        let arr = randomArr(arrLength, 10, screenHeight - 1);
        animation.setArray(arr);
        animation.record(function(arr){
            bubbleSort(arr)
        })
    });

    $("#speedSlider").on("change", function () {
        let delayTime = 100 - $("#speedSlider").val();
        animation.setDelay(delayTime);
    });

    $("#nOfTowers").on("change", function () {
        towerWidth = 40 - $("#nOfTowers").val() + 1;
        let arrLength = screenWidth / towerWidth - 1;
        let arr = randomArr(arrLength, 10, screenHeight - 1);
        animation.setArray(arr);
        animation.record(function(arr){
            bubbleSort(arr)
        })
    });
})(jQuery);
