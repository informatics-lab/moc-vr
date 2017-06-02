"use strict";

function removeElementById(id) {
    var element = document.getElementById(id);
    if (element) {
        element.parentNode.removeChild(element);
    }
}

function removeChildrenOfId(id) {
    var element = document.getElementById(id);
    if (element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }
}

function currentPhotosphere() {
    var id = null;
    var element = document.getElementById("scene");
    if (element) {
        id = element.getAttribute("sphereId");
    }
    return id;
}

function displayPhotosphere(msg) {
    console.log("new photosphere served", msg);

    // Don't update it already looking at the correct photosphere.
    if (currentPhotosphere() === msg.id) {
        return;
    }

    removeChildrenOfId("assets");
    removeElementById("lidar-hud");
    removeElementById("data-hud");

    //update photosphere
    var scene = document.getElementById("scene").setAttribute("sphereId", msg.id);
    if (msg.photosphere) {
        var img = document.createElement("img");
        img.setAttribute("id", "pimg");
        img.setAttribute("crossorigin", "use-credentials");
        img.setAttribute("src", msg.photosphere);
        document.getElementById("assets").appendChild(img);

        document.getElementById("psky").removeAttribute("src");
        document.getElementById("psky").setAttribute("src", "#pimg");
    }

    //add lidar
    if (msg.lidar) {
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
        lidarHud.setAttribute("height", "6.0");
        lidarHud.setAttribute("radius", "7.7");
        lidarHud.setAttribute("theta-start", "135");
        lidarHud.setAttribute("theta-length", "90");
        lidarHud.setAttribute("position", "0 0 0");
        lidarHud.setAttribute("rotation", "0 0 0");
        lidarHud.setAttribute("scale", "2 2 2");
        document.getElementById("scene").appendChild(lidarHud);
    }

    //add hud
    var dataHud = document.createElement("a-entity");
    dataHud.setAttribute("id", "data-hud");
    dataHud.setAttribute("hud-toggler", "name:'Data HUD'; order:1");
    dataHud.setAttribute("data-hud", "width:0.7; height:0.6; background:#FFF; visibility:" + msg.visibility + "; temperature:" + msg.temperature + "; dewPoint:" + msg.dewPoint + "; windDirection:" + msg.windDirection + "; windSpeed:" + msg.windSpeed + ";");
    dataHud.setAttribute("visible", "false");
    dataHud.setAttribute("position", "0.1 0.05 -0.65");
    document.getElementById("camera").appendChild(dataHud);

}
