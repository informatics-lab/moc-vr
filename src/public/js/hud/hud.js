/**
HUD Analytics
**/
var analyticsEventTimmers = {};
function stopTimeEvent(id){
    try{
        timer = analyticsEventTimmers[id];
        if(timer){
            var time = Math.round((new Date() - timer.date) / 1000);
            delete analyticsEventTimmers[id];
            ga('send', 'timing', timer['cat'], timer['label'], time);
        } else {
            console.warn('No timer found for: ', stop);
        }
    } catch (e){ // Let's be fault tolorant in our analytics.
        console.warn('Error in stopTimeEvent', e);
    }
}

function startTimeEvent(id, label){
    try{
        analyticsEventTimmers[id] = {
            date:new Date(),
            cat:"VR",
            label:label
        };
    } catch (e){ // Let's be fault tolorant in our analytics.
        console.warn('Error in startTimeEvent', e);
    }
}




/**
HUD controller
**/


AFRAME.registerComponent('hud-toggler', {
    schema: {
        name: {type: 'string'},
        order: {type: 'number', default:1}
    },

    state: {
        current:0,
        isFirst:true,
        huds:[
            {name: 'No HUD', ele: null}
        ]
    },

    isVR:false,

    init: function () {
        var ele = this.el;
        var name = this.data.name;
        var order = this.data.order;
        this.addHUD(name, ele, order)
        if(this.state.isFirst){
            this.initListeners();
        }
        this.state.isFirst = false;
    },

    initListeners: function(){
        var self = this;
        var scene = document.querySelector("a-scene");
        scene.addEventListener("enter-vr", function(evt) {
            startTimeEvent("IN_VR", "In VR");
            ga('send', 'event', "VR", "Enter VR");
            self.isVR = true;
        });
        scene.addEventListener("exit-vr", function(evt) {
            stopTimeEvent("IN_VR");
            self.turnOffHUD();
            ga('send', 'event', "VR", "Exit VR" );
            self.isVR = false;
        });

        scene.addEventListener('click', function(evt) {
            if(self.isVR && scene.isMobile){
                self.toggleHUD();
            }
        });
    },

    addHUD: function(name, ele, place){
        place = (isNaN(place))? 1 : place;
        place = (place <=0)? 1 : place;
        this.state.huds.splice(place, 0, {name:name, ele:ele});
    },

    turnOffHUD: function(){
        this.toggleHUD(0);
    },

    toggleHUD: function(indexNext){
        var current = this.state.huds[this.state.current];
        if(isNaN(indexNext) || indexNext < 0  || indexNext >= this.state.huds.length){
            indexNext = this.state.current + 1;
            indexNext = (indexNext < this.state.huds.length) ? indexNext : 0;
        }

        var next = this.state.huds[indexNext];

        if(current.ele){
            current.ele.setAttribute("visible", false);
        }
        stopTimeEvent("HUD");


        if(next.ele){
            next.ele.setAttribute("visible", true);
        }
        startTimeEvent('HUD', next.name);
        this.state.current = indexNext;
    },

    currentHUDName: function(){
        return this.state.huds[this.state.current].name;
    }
});



/**
Rotate to camera
**/
AFRAME.registerComponent('lidar-hud', {
    schema: {},

    init: function () {
        var el = this.el;
        // Move to camera on visability change
        el.addEventListener('componentchanged', function(){
            var camera = document.getElementById('camera');
            el.setAttribute('rotation', camera.getAttribute('rotation'));
            el.setAttribute('position', camera.getAttribute('position'));
        });

        // Scale based on image size
        var img = document.querySelector(el.getAttribute('src'));
        var theta = (2 * Math.PI / 360) * el.getAttribute('theta-length');
        var x = theta * el.getAttribute('radius');
        var scale = x / img.width ;
        el.setAttribute('height', img.height * scale);

    }
});




/**
The data HUD showing things like temp, visability, wind dir.
**/
AFRAME.registerComponent('data-hud', {
    schema: {
        width: {type: 'number', default: 0.8},
        height: {type: 'number', default: 0.6},
        background: {type: 'color', default: "#FFF"},
        visibility: {type: 'number'},
        temperature: {type: 'number'},
        dewPoint: {type: 'number'},
        windDirection: {type: 'number'},
        windSpeed: {type: 'number'},
        time: {type: 'string'}
    },


    /**
     * Initial creation and setting of the mesh.
     */
    init: function () {
        var data = this.data;
        var el = this.el;
        var self = this;
        var isVR = false;
        self.viewNames = ['No HUD'];
        self.views = [null]; // The avaliable HUD views. null = hidden.
        self.currentView = null;


        var createdViews = [];
        self.viewNames.push('Data HUD');
        createHUD(data.width * 1000, data.height * 1000,
             data.background, data.visibility, data.temperature, data.dewPoint,
             data.windDirection, data.windSpeed, data.time)
        .then(function(canvas){
            var geometry = new THREE.PlaneBufferGeometry(data.width, data.height);
            var texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            var material = new THREE.MeshBasicMaterial({map: texture, transparent: true});
            el.setObject3D("mesh", new THREE.Mesh(geometry, material));
        });
    }
});


// returns the hud canvas dom element
function createHUD(width, height, bg, visibility, temperature, dewPoint, windDirection, windSpeed, time) {
    console.log("creating HUD");

    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    var ctx = canvas.getContext("2d");
    drawBackground(ctx, bg);
    drawVisibility(ctx, visibility);
    drawTempInstruments(ctx, temperature, dewPoint);
    drawTime(ctx, time);

    return drawWindBarb(ctx, windDirection, windSpeed).then(function(){
        return canvas;
    });
}

function drawTime(ctx, time) {
    ctx.fillStyle = "#000000";
    ctx.font = '22px monospace';
    ctx.fillText(time, 80, 120);
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
