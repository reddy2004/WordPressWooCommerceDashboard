
$(document).ready(function () {
    console.log("In document ready");
    $scope = angular.element('[ng-controller=myOrderFlow]').scope();
    $scope.syncLite(true);

    function timeout() {
        setTimeout(function () {
            //$scope = angular.element('[ng-controller=myOrderFlow]').scope();
            $scope.$apply(function () {
                $scope.meta.lastTimeString = $scope.getTimeAgo();
                $scope.isAdminDashboard = true;
            });
            timeout();
        }, 1000);
    }
    timeout();
});