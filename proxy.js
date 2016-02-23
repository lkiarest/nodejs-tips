var http = require("http");
var url = require("url");
var querystring = require('querystring');
var express = require('express');
var router = express.Router();

var mergeObj = function(obj1, obj2) {
    var ret = {};

    for (var i in obj1) {
        ret[i] = obj1[i];
    }

    for (var i in obj2) {
        ret[i] = obj2[i];
    }

    return ret;
};

/* GET */
/*TODO GET方法待完善 */
router.get('/', function(req, res, next) {
    var target = url.parse(req.headers["target-url"]);
    console.log(target);
    var opts = {
        "method": "GET",
        "host": target.hostname,
        "port": target.port,
        "path": target.path,
        "headers": req.headers
    };

    var result = "";
    var hreq = http.request(opts, function(hres) {
        hres.setEncoding("utf8");
        hres.on("data", function(data) {
            result += data;
        }).on("end", function() {
            res.send(result);
        }).on("error", function(e) {
            res.send("request error ! " + e.message);
        });
    });

    hreq.end();
});

/* POST */
router.post('/', function(req, res, next) {
    var target = url.parse(req.headers["target-url"]);
    var cookies = req.headers["cookies"];
    //var postbody = querystring.stringify(req.body);
    // var postbody = req.body;
    var postbody = req.body;
    console.log(postbody)
    var headers = mergeObj({}, req.headers);

    headers["Accept"] = "application/json";
    headers["Cache-Control"] = "no-cache";
    headers["Connection"] = "Keep-Alive";
    headers["User-Agent"] = "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0; BOIE9;ZHCN)";
    headers["X-Requested-With"] = "XMLHttpRequest";
    headers["Host"] = target.hostname + ":" + target.port;
    headers["Referer"] = req.headers["target-url"];
    if (cookies) {
        headers["cookie"] = cookies;
    }
    if (postbody) {
        // headers["Content-Type"] = "application/json";
        // headers["Content-Length"] = postbody.length;
        // headers["Accept"] = "application/json";

        headers["Content-Type"] = "application/json";
        headers["Content-Length"] = JSON.stringify(postbody).replace(/[^\x00-\xff]/g, '___').length;
    }

    var opts = {
        "method": "POST",
        "host": target.hostname,
        "port": target.port,
        "path": target.path,
        "headers": headers
    };

    console.log("================request =======================");
    console.log(opts);

    var result = "";

    var hreq = http.request(opts, function(hres) {
        hres.setEncoding("utf8");
        var rh = hres.headers;
        console.log("================response header =======================");
        console.log(rh);

        if (rh.sessionstatus === 'timeout' && rh["set-cookie"]) {
            rh["cookies"] = rh["set-cookie"];
            res.writeHead(200, rh);
            res.end();
            return;
        }
        if(hres.statusCode != 200) {
            res.writeHead(hres.statusCode, rh);
            res.end();
            return;
        }
        hres.on("data", function(data) {
            result += data;
        }).on("end", function() {
            console.log("====================== response ========================");
            console.log(result);
            if (rh["set-cookie"]) {
                rh["cookies"] = rh["set-cookie"];
            }
            res.header(rh);
            res.send(result);
        }).on("error", function(e) {
            res.send("request error ! " + e.message);
        });
    });

    if (postbody) {
        console.log("write body:" + JSON.stringify(postbody));
        hreq.write(JSON.stringify(postbody));
    }

    hreq.end();
});

module.exports = router;
