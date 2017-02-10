/**
 * Created by tom on 08/02/2017.
 */

window.onload = function () {
    var id = getParameterByName("id");
    if (id) {
        getId(id);
    }
};


// function get3Latest() {
//
//     var search = "http://search-moc-vr-rlgduidkxakbtiill2boumjn5a.eu-west-1.cloudsearch.amazonaws.com/2013-01-01/search?";
//     var qlatest = encodeURIComponent("q=uploaded:{,'"+new Date().toISOString+"']");
//     var qparser = "q.parser=structured";
//     var qreturn = "return=all";
//     var qlimit = "cursor=initial&size=3";
//     var qsort = "sort=uploaded ";
//
//     fetch()
//         .then(function(resp){
//             console.log(resp);
//         })
//
// }

function getId(id) {
    fetch("/id/" + id)
        .then(function (res) {
            return res.json();
        })
        .then(function (json) {
            var p = json.Items[0];
            var resultsDom = document.getElementById("results");

            var header = document.createElement("h1");
            header.setAttribute("class", "content-subhead");
            header.innerText = "Latest Photosphere Ob";
            resultsDom.appendChild(header);

            var container = document.createElement("div");
            container.setAttribute("class", "post");
            resultsDom.appendChild(container);

            var meta = document.createElement("p");
            meta.setAttribute("class", "post-meta");
            var metaHtml = "Observed "+ new Date(p.dateTime.S).toDateString()+ " tagged as: ";
            p.tags.SS.forEach(function(tag){
                metaHtml = metaHtml + "<a class=\"post-category\" href=\"#\">" + tag + "</a> ";
            });
            meta.innerHTML = metaHtml;
            container.appendChild(meta);

            var br = document.createElement("br");
            container.appendChild(br);

            var photosphere = document.createElement("img");
            photosphere.setAttribute("src", p.photosphere.S);
            photosphere.setAttribute("class", "pure-u-1");
            container.appendChild(photosphere);



            console.log(p);

            return;
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
