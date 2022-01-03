//adminMode
$(document).ready(function () {
    console.log("In document ready");
    $scope = angular.element('[ng-controller=myInventory]').scope();
    $scope.init();

    function timeout() {
        setTimeout(function () {
            $scope.$apply(function () {
                $scope.meta.lastTimeString = $scope.getTimeAgo();
                $scope.isAdminMode = true;
            });
            timeout();
        }, 1000);
    }
    timeout();
});