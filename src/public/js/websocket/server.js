function genServerCode() {
    return Math.floor(100000 + Math.random() * 900000).toString().substring(0, 4);
}

function removeChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

AFRAME.registerComponent('websocket-server', {
    schema: {},
    init: function () {
        var self = this;
        self. code = genServerCode();
        self.socket = io();

        self.socket.emit("register", {type: "server", code: self.code});

        self.socket.on("display", function (msg) {
            console.log("new photosphere served", msg);

            var assets = document.getElementById("assets");
            removeChildren(assets);

            var img = document.createElement("img");
            img.setAttribute("id", "pimg");
            img.setAttribute("crossorigin", "use-credentials");
            img.setAttribute("src", msg.photosphere);
            assets.appendChild(img);

            if(msg.lidar) {
                var lidar = document.createElement("img");
                lidar.setAttribute("id", "plidar");
                lidar.setAttribute("crossorigin", "use-credentials");
                lidar.setAttribute("src", msg.lidar);
                assets.appendChild(lidar);
            }

            document.getElementById("psky").removeAttribute("src");
            document.getElementById("psky").setAttribute("src", "#pimg");
        });

        document.getElementById("sid").innerHTML = self.code;

        document.getElementById("serve").addEventListener("click", function () {
            var pid = document.getElementById("pid").value;
            console.log("serving %s", pid);
            self.socket.emit("serve", {id: pid});
        });
    },
    tick: function(time) {
        var self = this;
        var camera = document.getElementById("camera");
        self.socket.emit("camera", camera.rotation);
    }
});