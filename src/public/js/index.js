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
render_photosphere_result = doT.template(document.getElementById('photosphere_result').text);
function getId(id) {
    fetch("/id/" + id)
        .then(function (res) {
            return res.json();
        })
        .then(function (json) {
            var result = json.Items[0];
            var container = document.createElement("div");
            container.innerHTML = render_photosphere_result({
              date:new Date(result.dateTime.S).toDateString(),
              tags:result.tags.SS,
              photosphere_url:result.photosphere.S
            });
            document.getElementById("results").appendChild(container)
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
