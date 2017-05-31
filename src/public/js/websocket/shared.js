"use strict";

function removeChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

function displayPhotosphere (msg) {
    console.log("new photosphere served", msg);

    var assets = document.getElementById("assets");
    removeChildren(assets);

    if(msg.photosphere) {
        var img = document.createElement("img");
        img.setAttribute("id", "pimg");
        img.setAttribute("crossorigin", "use-credentials");
        img.setAttribute("src", msg.photosphere);
        assets.appendChild(img);

        document.getElementById("psky").removeAttribute("src");
        document.getElementById("psky").setAttribute("src", "#pimg");
    }

    if(msg.lidar) {
        var lidar = document.createElement("img");
        lidar.setAttribute("id", "plidar");
        lidar.setAttribute("crossorigin", "use-credentials");
        lidar.setAttribute("src", msg.lidar);
        assets.appendChild(lidar);
    }

}
