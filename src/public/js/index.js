/**
 * Created by tom on 08/02/2017.
 */

document.getElementsByClassName()

window.onload = function () {
    tagCloud();
    var id = getParameterByName("id");
    var tag = getParameterByName("tag");
    if (id) {
        getId(id);
    }
    else if (tag) {
        getByTag(tag);
    }
};

render_tag_cloud = doT.template(document.getElementById("tag_cloud").text);
function tagCloud() {
    fetch("/tags", {
        credentials: 'same-origin'
    })
        .then(function (res) {
            return res.json();
        })
        .then(function (json) {

            var tags = [];
            for (var property in json) {
                if (json.hasOwnProperty(property)) {
                    tags.push(property);
                }
            }
            var container = document.createElement("div");
            container.innerHTML = render_tag_cloud({
                tags: tags
            });
            document.getElementById("search").appendChild(container);

        })
        .catch(function (err) {
            console.error(err);
        })
}


render_subheading = doT.template(document.getElementById("subheading").text);

render_photosphere_result = doT.template(document.getElementById("photosphere_result").text);
function getId(id) {

    return fetch("/id/" + id, {
        credentials: 'same-origin'
    })
        .then(function (res) {
            return res.json();
        })
        .then(function (json) {
            var result = json.Items[0];

            var container1 = document.createElement("div");
            container1.innerHTML = render_subheading({text: "Photosphere Ob"});
            document.getElementById("results").appendChild(container1);

            var img_url = "/img" + result.photosphere.S.split("amazonaws.com")[1];

            var container = document.createElement("div");
            container.innerHTML = render_photosphere_result({
                date: new Date(result.dateTime.S).toDateString(),
                tags: result.tags.SS,
                photosphere_url: img_url,
                id: result.id.S
            });
            document.getElementById("results").appendChild(container);
            return
        })
        .catch(function (err) {
            console.error(err);
        });
}

render_tag_result = doT.template(document.getElementById("tag_result").text);
function getByTag(tag) {
    fetch("/tag/" + tag, {
        credentials: 'same-origin'
    })
        .then(function (res) {
            return res.json();
        })
        .then(function (json) {

            var container1 = document.createElement("div");
            container1.innerHTML = render_subheading({text: "Matching Photosphere Obs"});
            document.getElementById("results").appendChild(container1);

            for (var i = 0; i < json.Items.length; i++) {
                var result = json.Items[i];

                var img_url = "/img" + result.photosphere.S.split("amazonaws.com")[1] + "-small";

                var container = document.createElement("div");
                container.innerHTML = render_tag_result({
                    date: new Date(result.dateTime.S).toDateString(),
                    tags: result.tags.SS,
                    photosphere_avatar_url: img_url,
                    id: result.id.S
                });

                document.getElementById("results").appendChild(container);
            }
            return;
        })
        .catch(function (err) {
            console.error(err);
        })
}


function getParameterByName(name, url) {
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}