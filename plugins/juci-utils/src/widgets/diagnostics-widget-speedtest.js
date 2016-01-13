//! Author: Reidar Cederqvist <reidar.cederqvist@gmail.com>

JUCI.app
.directive("diagnosticsWidget90Speedtest", function($compile, $parse){
	return {
		scope: true,
		replace: true,
		templateUrl: "/widgets/diagnostics-widget-speedtest.html",
		controller: "diagnosticsWidget90Speedtest", 
	 };  
})
.controller("diagnosticsWidget90Speedtest", function($scope, $rpc, $events, $uci, utilsAddTestserverPicker){
	$scope.data = {
		packagesize: 50000,
		test_type: "up_down",
		result: "",
		state: ""
	}; 
	$scope.min = 10000; 
	$scope.max = 100000; 
	$scope.$watch('data.packagesize', function(new_value){
		if(new_value < $scope.min)$scope.data.packagesize = $scope.min;
		if(new_value > $scope.max)$scope.data.packagesize = $scope.max;
	});

	function getServers(){
		$scope.allTestServers = $scope.testServers.map(function(x){
			return {
				label: x.server.value + "/" + x.port.value, 
				value: x.server.value
			}
		});
		if($scope.allTestServers.length)
			$scope.data.server = $scope.allTestServers[0].value; 
	}

	$scope.testType = [
		{value:"up_down", label: "up and down"}, 
		{value:"up", label: "up"}, 
		{value:"down", label:"down"} 
	];

	$uci.$sync("speedtest").done(function(){
		$scope.testServers = $uci.speedtest["@testserver"];
		getServers();
		$scope.$apply();
	});

	$scope.runTest = function(){
		if(!$scope.testServers.length){
			window.alert("Server and port is mandatory");
			return;
		}
		if($scope.data.state == "running"){
			window.alert("Only one test can be run at a time");
			return;
		}
		var server = $scope.testServers.find(function(x){ return $scope.data.server == x.server.value;});
		var port = server.port.value;
		var address = server.server.value;
		$scope.data.state="running";
		$rpc.juci.utils.speedtest.run({
			"testmode": $scope.data.test_type,
			"port": port,
			"packagesize": $scope.data.packagesize,
			"address": address
		}).done(function(response){
			if(response && response.message=="success"){
				$scope.data.state="running";
			}else{
				$scope.data.state="";
			}
			$scope.$apply();
		});
	};
	
	$scope.onRemoveAddress = function(){
		var server = $scope.testServers.find(function(x){
			return $scope.data.server == x.server.value
		});
		if(!server){
			alert("error deleting server");
			return;
		}
		server.$delete().done(function(){
			getServers();
			$scope.$apply();
		});
	};

	$scope.onAddAddress = function(){
		utilsAddTestserverPicker.show().done(function(data){
			if(!data)return;
			$uci.speedtest.$create({
				".type": "testserver",
				"server": data.address,
				"port": data.port
			}).done(function(){
				getServers();
				$scope.$apply();
			});
		});
	}
	$events.subscribe("juci.utils.speedtest", function(res){
		console.log(res);
		switch(res.data.status) {
		case 0:
			$scope.data.result="Upstream: " + res.data.upstream + "\nDownstream: " + res.data.downstream;
			$scope.data.state="result";
			break;
		case -1:
			$scope.data.result="Wrong TP-test address and/or port";
			$scope.data.state="error";
			break;
		case -2:
			$scope.data.result="Wrong TP-test port but correct address";
			$scope.data.state="error";
			break;
		}
		$scope.$apply();
	});
}); 
