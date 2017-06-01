"use strict";

function removeElementById(id) {
    var element = document.getElementById(id);
    if(element) {
        element.parentNode.removeChild(element);
    }
}

function removeChildrenOfId(id) {
    var element = document.getElementById(id);
    if(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }
}

function displayPhotosphere (msg) {
    console.log("new photosphere served", msg);

    removeChildrenOfId("assets");
    removeElementById("lidar-hud");
    removeElementById("data-hud");

    //update photosphere
    if(msg.photosphere) {
        var img = document.createElement("img");
        img.setAttribute("id", "pimg");
        img.setAttribute("crossorigin", "use-credentials");
        img.setAttribute("src", msg.photosphere);
        document.getElementById("assets").appendChild(img);

        document.getElementById("psky").removeAttribute("src");
        document.getElementById("psky").setAttribute("src", "#pimg");
    }

    //add lidar
    if(msg.lidar) {
        var lidar = document.createElement("img");
        lidar.setAttribute("id", "plidar");
        lidar.setAttribute("crossorigin", "use-credentials");
        lidar.setAttribute("src", msg.lidar);
        document.getElementById("assets").appendChild(lidar);

        var lidarHud = document.createElement("a-curvedimage");
        lidarHud.setAttribute("id", "lidar-hud");
        lidarHud.setAttribute("lidar-hud");
        lidarHud.setAttribute("hud-toggler", "name:'Lidar HUD'; order:2");
        lidarHud.setAttribute("visible", "false");
        lidarHud.setAttribute("src", "#plidar");
        lidarHud.setAttribute("height","6.0");
        lidarHud.setAttribute("radius","7.7");
        lidarHud.setAttribute("theta-start","135");
        lidarHud.setAttribute("theta-length","90");
        lidarHud.setAttribute("position","0 0 0");
        lidarHud.setAttribute("rotation", "0 0 0");
        lidarHud.setAttribute("scale", "2 2 2");
        document.getElementById("scene").appendChild(lidarHud);
    }

    //add hud
    var dataHud = document.createElement("a-entity");
    dataHud.setAttribute("id", "data-hud");
    dataHud.setAttribute("hud-toggler", "name:'Data HUD'; order:1");
    dataHud.setAttribute("data-hud", "width:0.7; height:0.6; background:#FFF; visibility:"+msg.visibility+"; temperature:"+msg.temperature+"; dewPoint:"+msg.dewPoint+"; windDirection:"+msg.windDirection+"; windSpeed:"+msg.windSpeed+";");
    dataHud.setAttribute("visible", "false");
    dataHud.setAttribute("position", "0.1 0.05 -0.65");
    document.getElementById("camera").appendChild(dataHud);

}

AFRAME.registerComponent('target', {
    schema: {
        width: {type: 'number', default: 0.2},
        height: {type: 'number', default: 0.2},
        radius: {type: 'number', default: 0.05}
    },

    init: function () {
        var self = this;

        createTarget(self.data.width * 1000, self.data.height * 1000, self.data.radius * 1000)
            .then(function(canvas){
                var geometry = new THREE.PlaneBufferGeometry(self.data.width, self.data.height);
                var texture = new THREE.Texture(canvas);
                texture.needsUpdate = true;
                var material = new THREE.MeshBasicMaterial({map: texture, transparent: true});
                self.el.setObject3D("mesh", new THREE.Mesh(geometry, material));
            });

    }
});

function createTarget(width, height, radius) {
    console.log("creating target");

    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    var ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.arc(width/2, height/2, radius, 0, 2 * Math.PI, false);
    ctx.fill();

    return canvas;
}