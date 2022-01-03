//angular
var myApp = angular.module('myShippingFlowApp', []);

myApp.controller('myShippingFlow', ['$scope', function ($scope) {

    var processingOrdersData = [];
    processingOrdersData.push({OrderId : 12331, CustomerName: 'Vikrama Reddy', FlowIcons : 'All the icons will come here to see', Status : 'In transit'});
    processingOrdersData.push({OrderId : 12345, CustomerName: 'Vikrama Reddy', FlowIcons : 'All the icons will come here to see', Status : 'In transit'});

    $scope.processingOrdersData = processingOrdersData;

    $scope.syncRefresh = function() {
        $scope.SyncTitleText = "Sync Inventory to Local DB";
        $("#exampleModalLongSync").modal();
    }

    $scope.listOrderItems = function() {
        $scope.ModalTitleText = "Viewing all items to be shipped in this order";
        //alert("hello");
        $("#exampleModalLongOrderItems").modal();
    }
}]);

$(document).ready(function () {


});