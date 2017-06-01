"use strict";

function genServerCode() {
    return Math.floor(100000 + Math.random() * 900000).toString().substring(0, 4);
}

AFRAME.registerComponent('websocket-server', {
    schema: {},
    init: function () {
        var self = this;
        self. code = genServerCode();
        self.socket = io();

        self.socket.emit("register", {type: "server", code: self.code});

        self.socket.on("display", displayPhotosphere);

        document.getElementById("sid").innerHTML = self.code;

        document.getElementById("serve").addEventListener("click", function () {
            var pid = document.getElementById("pid").value;
            console.log("serving %s", pid);
            self.socket.emit("serve", {id: pid});
        });
    },
    tick: function(time) {
        var self = this;
        var target = document.getElementById("target");
        var vec = new THREE.Vector3();
        vec.setFromMatrixPosition(target.object3D.matrixWorld)
        self.socket.emit("sync-server", {
          targetPosition:vec
      });
    }
});
