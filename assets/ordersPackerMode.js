//orders Packer mode

$(document).ready(function () {
    console.log("In document ready");
    $scope = angular.element('[ng-controller=myOrderFlow]').scope();
    $scope.syncLite(false);

    var counter = 0;
    function timeout() {
        if (counter++ > 60) {
            counter = 0;
            $scope.syncLite(false);
            //alert("Sync lite00;0");
        }
        setTimeout(function () {
            //$scope = angular.element('[ng-controller=myOrderFlow]').scope();
            $scope.$apply(function () {
                $scope.meta.lastTimeString = $scope.getTimeAgo();
                $scope.isAdminDashboard = false;
            });
            timeout();
        }, 1000);
    }
    timeout();
});