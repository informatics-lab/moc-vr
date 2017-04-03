AFRAME.registerComponent('hud', {
    schema: {
        width: {type: 'number', default: 0.8},
        height: {type: 'number', default: 0.6},
        background: {type: 'color', default: "#FFF"},
        visibility: {type: 'number'},
        temperature: {type: 'number'},
        dewPoint: {type: 'number'},
        windDirection: {type: 'number'},
        windSpeed: {type: 'number'}
    },


    /**
     * Initial creation and setting of the mesh.
     */
    init: function () {
        var data = this.data;
        var el = this.el;
        var self = this;
        var isVR = false;
        var canvasPromise = createHUD(data.width * 1000, data.height * 1000, data.background, data.visibility, data.temperature, data.dewPoint, data.windDirection, data.windSpeed);

        canvasPromise.then(function (canvas) {
            self.geometry = new THREE.PlaneBufferGeometry(data.width, data.height);
            var texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            self.material = new THREE.MeshBasicMaterial({map: texture, transparent: true});
            self.mesh = new THREE.Mesh(self.geometry, self.material);
            el.setObject3D("mesh", self.mesh);
        });

        /*
         * toggles HUD on and off
         */
        var scene = document.querySelector("a-scene");
        scene.addEventListener("enter-vr", function(evt) {
            startTimeEvent("VR", "VR", "In VR");
            if(ga){
                ga('send', 'event', "VR", "Enter VR");
            }
            if(true || scene.isMobile) {
                el.setAttribute("visible", true);
                startTimeEvent("HUD", "VR", "Showing HUD");
            } else {
                startTimeEvent("HUD", "VR", "No HUD");
            }
            isVR = true;
        });
        scene.addEventListener("exit-vr", function(evt) {
            stopTimeEvent("VR");
            if(ga){
                ga('send', 'event', "VR", "Exit VR");
            }
            el.setAttribute("visible", false);
            isVR = false;
        });
        scene.addEventListener('click', function(evt) {
            if((true || scene.isMobile) && isVR) {
                stopTimeEvent("HUD");
                if(el.getAttribute("visible")){
                    startTimeEvent("HUD", "VR", "No HUD");
                    el.setAttribute("visible", false);
                } else {
                    startTimeEvent("HUD", "VR", "Showing HUD");
                    el.setAttribute("visible", true);
                }
            }
        });

    }

});

var analyticsEventTimmers = {};
function stopTimeEvent(id){
    try{
        timer = analyticsEventTimmers[id];
        if(timer){
            var time = (new Date() - timer.date) / 1000;
            delete analyticsEventTimmers[id];
            ga('send', 'timing', timer['cat'], timer['label'], time);
        } else {
            console.error('No timer found for: ', stop);
        }
    } catch (e){ // Let's be fault tolorant in our analytics.
        console.error('Error in stopTimeEvent', e);
    }
}

function startTimeEvent(id, cat, label){
    try{
        analyticsEventTimmers[id] = {
            date:new Date(),
            cat:cat,
            label:label
        };
    } catch (e){ // Let's be fault tolorant in our analytics.
        console.error('Error in stopTimeEvent', e);
    }
}

// returns the hud canvas dom element
function createHUD(width, height, bg, visibility, temperature, dewPoint, windDirection, windSpeed) {
    console.log("creating HUD");

    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    // canvas.setAttribute("style", "border:black 1px solid");

    var ctx = canvas.getContext("2d");
    drawBackground(ctx, bg);
    drawVisibility(ctx, visibility);
    drawTempInstruments(ctx, temperature, dewPoint);
    return drawWindBarb(ctx, windDirection, windSpeed).then(function(){
        return canvas;
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
