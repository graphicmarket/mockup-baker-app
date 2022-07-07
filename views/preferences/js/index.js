'use strict';

(function () {
    function init() {
        const router = new Router([
            new Route('general', 'home.html', true),
            new Route('update', 'update.html'),
            new Route('info', 'info.html')
        ]);
    }
    init();
}());

var header = document.getElementById("menuList");
var btns = header.getElementsByClassName("btn");
for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener("click", function () {
        var current = document.getElementsByClassName("active");
        current[0].className = current[0].className.replace(" active", "");
        this.className += " active";
    });
}