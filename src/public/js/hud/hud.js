AFRAME.registerComponent('hud', {
    schema: {
        width: {type: 'number', default: 0.8},
        height: {type: 'number', default: 0.6},
        background: {type: 'color', default: "#FFF"},
        visibility: {type: 'number'},
        temperature: {type: 'number'},
        dewPoint: {type: 'number'},
        windDirection: {type: 'number'},
        windSpeed: {type: 'number'},
        lidar: {type: 'string'}
    },


    /**
     * Initial creation and setting of the mesh.
     */
    init: function () {
        var data = this.data;
        var el = this.el;
        var self = this;
        var isVR = false;
        self.views = [null]; // The avaliable HUD views. null = hidden.
        self.currentView = null;


        var createdViews = [];
        createdViews.push(createHUD(data.width * 1000, data.height * 1000,
             data.background, data.visibility, data.temperature, data.dewPoint,
             data.windDirection, data.windSpeed, data.lidar));

        if(data.lidar){
            createdViews.push(createLidar(data.width * 1000, data.height * 1000, data.lidar));
        }

        Promise.all(createdViews).then(function(views) {
            views.forEach(function(canvas){
                self.views.push(self.makeMesh(canvas));
            });
            if(el.getAttribute('visible')){
                self.toggleMode();
            }
        });

        /*
         * toggles HUD on and off
         */
        var scene = document.querySelector("a-scene");
        scene.addEventListener("enter-vr", function(evt) {
            console.log("hud:enter-vr", scene.isMobile);
            if(scene.isMobile) {
                el.setAttribute("visible", true);
            }
            isVR = true;
        });
        scene.addEventListener("exit-vr", function(evt) {
            console.log("hud:exit-vr");
            el.setAttribute("visible", false);
            isVR = false;
        });
        scene.addEventListener('click', function(evt) {
            if(scene.isMobile && isVR) {
                self.toggleMode();
            }
        });

    },

    toggleMode: function(){
        var nextViewIndex = this.views.indexOf(this.currentView) + 1;
        nextViewIndex = (nextViewIndex >= this.views.length)? 0 : nextViewIndex;
        var view = this.views[nextViewIndex];
        if(view === null){
            this.el.setAttribute("visible", false);
        }  else {
            this.el.setObject3D("mesh", view);
            this.el.setAttribute("visible", true);
        }
        this.currentView = view;
    },

    makeMesh: function(canvas){
        var geometry = new THREE.PlaneBufferGeometry(this.data.width, this.data.height);
        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        var material = new THREE.MeshBasicMaterial({map: texture, transparent: true});
        return new THREE.Mesh(geometry, material);
    }

});


// returns the hud canvas dom element
function createHUD(width, height, bg, visibility, temperature, dewPoint, windDirection, windSpeed) {
    console.log("creating HUD");

    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.setAttribute("style", "border:black 1px solid");

    var ctx = canvas.getContext("2d");
    // Shift everything to the down and right.
    ctx.translate(canvas.width * 0.3, 0);

    drawBackground(ctx, bg);
    drawVisibility(ctx, visibility);
    drawTempInstruments(ctx, temperature, dewPoint);

    var asynActions = [drawWindBarb(ctx, windDirection, windSpeed)];

    return Promise.all(asynActions).then(function(){
        return canvas;
    });


}

// returns the lidar image canvas dom element
function createLidar(width, height, img) {
    console.log("creating lidar");

    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    var ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.fillStyle = "red";
    ctx.fill();

    return addLidar(ctx, img).then(function(){
        return canvas;
    });
}

function addLidar(ctx, lidar){
    return new Promise(function(resolve, reject){
        var img = new Image();
        img.addEventListener('load',function () {
            var xOffset = 0;
            var yOffset = 0;

            var ctxW = ctx.canvas.width - 2 * xOffset;
            var ctxH = ctx.canvas.height;
            var ctxAspect = ctxW/ctxH;

            var imgAspect = img.width/img.height
            var scale = (imgAspect > ctxAspect)?  ctxW / img.width : ctxH / img.height;
            var targetW = scale * img.width;
            var targetH = scale * img.height;

            xOffset = (targetW < ctxW) ? (ctxW - targetW) / 2 : xOffset;
            yOffset = (targetH < ctxH) ? (ctxH - targetH) / 2 : yOffset;
            ctx.drawImage(img, xOffset, yOffset, targetW, targetH);
            resolve();
        });
        img.addEventListener('error', reject);
        img.src = lidar;
    });

}

function drawBackground(ctx, bg) {
    ctx.fillStyle = bg;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(30, 0, 170, 800);
    ctx.globalAlpha = 1.0;
}

function drawTempInstruments(ctx, t, dp) {
    ctx.fillStyle = "#B9DC0C";          //mo green
    ctx.strokeStyle = "#B9DC0C";
    ctx.lineWidth = 4;
    ctx.font = "bold 12px Arial";

    ctx.beginPath();
    ctx.moveTo(106, 189);    //centre
    ctx.lineTo(106, 179);
    ctx.lineTo(128, 179);
    ctx.lineTo(128, 189);

    ctx.moveTo(128, 561);
    ctx.lineTo(128, 571);
    ctx.lineTo(106, 571);
    ctx.lineTo(106, 561);
    ctx.stroke();

    var tr = getTempRange(179, 571, t, dp);

    var trMinX = 78;
    if (tr.min < 0) {
        trMinX = trMinX - 4;
    }
    ctx.fillText(pad(tr.min), trMinX, 571);
    ctx.fillText(pad(tr.max), 78, 188);

    drawTemp(ctx, tr.t);
    drawDewPoint(ctx, tr.dp);

}

function drawTemp(ctx, t) {
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#000000";
    ctx.font = "bold 12px Arial";
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(113, 569);
    ctx.lineTo(113, t.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(113, t.y, 3, 0, 2 * Math.PI, false);
    ctx.fill();

    var xText = 85;
    if (t.value < 0) {
        xText = xText - 3;
    }
    ctx.fillText(pad(t.value), xText, t.y);

    ctx.fillText("T", 108, 588);
}

function drawDewPoint(ctx, dp) {
    ctx.strokeStyle = "#FF0000";
    ctx.fillStyle = "#FF0000";
    ctx.font = "bold 12px Arial";
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(121, 569);
    ctx.lineTo(121, dp.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(121, dp.y, 3, 0, 2 * Math.PI, false);
    ctx.fill();

    ctx.fillText(pad(dp.value), 126, dp.y);

    ctx.fillText("Td", 118, 588);
}

function drawVisibility(ctx, v) {
    ctx.strokeStyle = "#B9DC0C";
    ctx.fillStyle = "#B9DC0C";
    ctx.font = "bold 19px Arial";
    ctx.lineWidth = 4;

    if (v < 6000) {
        ctx.fillText(v + " M", 90, 168);
    } else {
        v = Math.floor(v / 1000);
        ctx.fillText(v + " KM", 98, 168);
    }
}

function drawWindBarb(ctx, wd, ws) {
    return new Promise(function (resolve, reject) {

        if (ws === 0) {
            drawCalmWindBarb(ctx);
            resolve();
        } else {
            var svgdiv = document.createElement('div');
            svgdiv.className = 'wind-barb';
            WindBarbArrowHandler.WindArrow(ws, wd, svgdiv, 70);
            var oSerializer = new XMLSerializer();
            var sXML = oSerializer.serializeToString(svgdiv.getElementsByTagName("svg")[0]);
            var DOMURL = window.URL || window.webkitURL || window;
            var img = new Image();
            var svg = new Blob([sXML], {type: 'image/svg+xml'});
            var url = DOMURL.createObjectURL(svg);
            img.onload = function () {
                ctx.drawImage(img, 45, 5);
                DOMURL.revokeObjectURL(url);
                resolve();
            };
            img.src = url;
        }
    });

}

function drawCalmWindBarb(ctx) {
    ctx.strokeStyle = "#B9DC0C";
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.arc(117, 90, 30, 0, 2 * Math.PI, false);
    ctx.stroke();
}

function getTempRange(top, bottom, t, dp) {
    var min, max, bottomValue, topValue;
    max = Math.max(t, dp);
    min = Math.min(t, dp);
    topValue = Math.ceil((Math.ceil(max) + 2) / 10) * 10;
    bottomValue = Math.floor((Math.floor(min) - 2) / 10) * 10;

    function map_range(value, low1, high1, low2, high2) {
        return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
    }

    return {
        t: {
            value: t,
            y: map_range(t, topValue, bottomValue, top, bottom)
        },
        dp: {
            value: dp,
            y: map_range(dp, topValue, bottomValue, top, bottom)
        },
        min: bottomValue,
        max: topValue
    }

}

function pad(n) {
    var r;
    if (n >= 0) {
        r = n > 9 ? "" + n : "0" + n;

    } else {
        r = n < -9 ? "" + n : "-0" + Math.abs(n);
    }
    if (!r.includes(".")) {
        r = r + ".0";
    }
    return r;
}
