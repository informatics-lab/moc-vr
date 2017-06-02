"use strict";
function displayTarget(targetActive, targetPosition) {
    var camera = document.getElementById("camera");
    var target = document.getElementById("target");
    var visible = target.getAttribute("visible");

    if (targetActive) {
        if (!camera.getAttribute("target-indicator")) {
            camera.setAttribute("target-indicator", "target: #target;");
        }
        if(!visible) {
            target.setAttribute("visible", "true");
        }

        var posString = targetPosition.x + " " + targetPosition.y + " " + targetPosition.z;

        target.setAttribute("position", posString);
        target.object3D.lookAt(camera.object3D.position);

    } else {
        if (camera.getAttribute("target-indicator")) {
            camera.removeAttribute("target-indicator")
        }
        if(visible) {
            target.setAttribute("visible", "false");
        }
    }
}

AFRAME.registerComponent("websocket-client", {
    schema: {},
    init: function () {
        var self = this;
        var code;

        if (!code) {
            code = prompt("Enter session code:");
            if (!code) { // If still no code then we can't go on.
                return;
            }
        }

        var socket = io();
        socket.emit("register", {type: "client", code: code});

        socket.on("sync-client", function (msg) {
            displayPhotosphere(msg.photosphere);
            displayTarget(msg.targetActive, msg.targetPosition);
        });

    }
});
