//angular
var myApp = angular.module('myLoginApp', []);

myApp.controller('myLogin', ['$scope', function ($scope) {

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
    
    $scope.BootStrap = function() {

        $.get("updateProductData", function (data) {
            var res = JSON.parse(JSON.stringify(data));
            alert(JSON.stringify(data));
            if(res.result == 'SUCCESS') {
                window.location.href='/login';
            }
            window.location.href='/login';
        });
    }

    $scope.DeleteTempFolders = function() {
        $.get("deleteTempFolders", function (data) {
            var res = JSON.parse(JSON.stringify(data));
            alert(JSON.stringify(data));
            if(res.result == 'SUCCESS') {
                window.location.href='/login';
            }
        });
    }

    $scope.logout = function() {
        $scope.eraseCookie("scart"); //pathetic but easy
    }

}]);

$(document).ready(function () {
    //alert("doc is ready!");
});