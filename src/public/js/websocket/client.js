"use strict";

AFRAME.registerComponent('websocket-client', {
    schema: {},
    init: function () {
        var self = this;
        var code;

        if (!code) {
            code = prompt("Enter session code:");
            console.log('Room code is', code);
            if(!code){ // If still no code then we can't go on.
                return;
            }
        }

        var socket = io();
        socket.emit("register", {type: "client", code: code});

        socket.on("sync-client", function (msg) {
            displayPhotosphere(msg.photosphere);

            var pos3DVec = msg.targetPosition;
            var posString = pos3DVec.x + " " + pos3DVec.y + " " + pos3DVec.z;

            var target = document.getElementById("target");
            var camera = document.getElementById("camera");

            target.setAttribute("position", posString);
            target.object3D.lookAt(camera.object3D.position);
        });

    }
});
