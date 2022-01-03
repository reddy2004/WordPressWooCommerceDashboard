//angular
var myApp = angular.module('myLoginApp', []);

myApp.controller('myLogin', ['$scope', function ($scope) {

    $scope.displayflags = {};
    $scope.displayflags.isLoggedIn = false;

    $scope.setCookie = function(key, value, expiry) {
        var expires = new Date();
        expires.setTime(expires.getTime() + (expiry * 24 * 60 * 60 * 1000));
        document.cookie = key + '=' + value + ';expires=' + expires.toUTCString();
    }

    $scope.getCookie = function(key) {
        var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
        return keyValue ? keyValue[2] : null;
    }

    $scope.eraseCookie = function(key) {
        var keyValue = $scope.getCookie(key);
        $scope.setCookie(key, keyValue, '-1');
    }

    $scope.login = function() {
        var uname = $("#uname").val();
        var upassword = $("#upassword").val();

        $.get("validate?uname=" + uname + "&upassword=" + upassword, function (data) {
            var res = JSON.parse(JSON.stringify(data));
            alert(JSON.stringify(data));
            if(res.result == 'SUCCESS') {
                $scope.setCookie("scart", res.cookie, 1);
                $scope.$apply(function () {
                        $scope.displayflags.isLoggedIn = true;
                });
                window.location.href='/orderflowadmin';
            } else {
                alert("Incorrect credentials!");
            }
        });
    }

    $scope.logout = function() {
            //$scope.$apply(function () {
                    $scope.displayflags.isLoggedIn = false;
            //});        
    }

    $scope.eraseCookie("scart");
}]);

$(document).ready(function () {
    //alert("doc is ready!");
});