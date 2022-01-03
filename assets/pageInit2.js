//Init for packing mode

$(document).ready(function () {
    console.log("In document ready");
    $scope = angular.element('[ng-controller=myInventory]').scope();
    $scope.init();

    function timeout() {
        setTimeout(function () {
            console.log("Refersh");
            $scope.$apply(function () {
                $scope.syncWebsiteStockCount();
                $scope.meta.lastTimeString = $scope.getTimeAgo();
                $scope.isAdminMode = false;
            });
            timeout();
        }, 5000);
    }
    timeout();
});