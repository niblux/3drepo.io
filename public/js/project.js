var viewUrl = function ($stateParams)
{
	// Each view is associated with a template
	// However only a few views are possible
	// Check that we have a view that exists otherwise redirects to info
	var possible_views = ["info", "comments", "revisions", "log", "settings"];
	var view = $stateParams.view;

	if( possible_views.indexOf(view) == -1 ){
		view = "info";
	}

	return view + '.html';
}

angular.module('3drepo', ['ui.router', 'ui.bootstrap'])
.run(function($rootScope, $location) {
	$rootScope.apiUrl = '//api.' + $location.host() + ($location.port() ? (':' + $location.port()) : '');
})
.config([
'$stateProvider',
'$urlRouterProvider',
'$locationProvider',
function($stateProvider, $urlRouterProvider, $locationProvider) {
	$stateProvider
		.state('main' ,{
			url: '/:account/:project',
			templateUrl: 'mainpage.html',
			controller: 'MainCtrl',
			resolve: {
				account : function($stateParams){
					return $stateParams.account;
				},
				project: function($stateParams){
					return $stateParams.project;
				},
			}
		}).state('main.view', {
			url: '/:view',
			templateUrl: viewUrl,
			controller: 'ViewCtrl',
			resolve: {
				view: function($stateParams){
					return $stateParams.view;
				},
				initPromise: function(data, $stateParams){
					return data.initPromise($stateParams.account, $stateParams.project, 'master', 'head', $stateParams.view);
				}
			}
		}).state('main.branch', {
			url: '/revision/:branch/head',
			controller: 'RevisionCtrl',
			resolve: {
				branch: function($stateParams) {
					return $stateParams.branch;
				}
			}
		}).state('main.branch.view', {
			url: '/:view',
			views : {
				"footer@main" : {
					templateUrl: viewUrl,
					controller: 'ViewCtrl',
					resolve: {
						view: function($stateParams){
							return $stateParams.view;
						},
						initPromise: function(data, $stateParams){
							return data.initPromise($stateParams.account, $stateParams.project, $stateParams.branch, 'head', $stateParams.view);
						}
					}
				}
			}
		}).state('main.revision', {
			url: '/revision/:rid',
			controller: 'RevisionCtrl',
			resolve: {
				rid: function($stateParams) {
					return $stateParams.rid;
				},
				branch: function($stateParams) {
					return null;
				}
			}
		}).state('main.revision.view', {
			url: '/:view',
			views : {
				"footer@main" : {
					templateUrl: viewUrl,
					controller: 'ViewCtrl',
					resolve: {
						view: function($stateParams){
							return $stateParams.view;
						},
						initPromise: function(data, $stateParams){
							return data.initPromise($stateParams.account, $stateParams.project, $stateParams.branch, $stateParams.rid, $stateParams.view);
						}
					}
				}
			}
		})
		.state('404', {
		  url: '/404',
		  templateUrl: '404.html',
		});

	// Invalid URL redirect to 404 state
	$urlRouterProvider.otherwise('404');

	// Empty view redirects to info view by default
	$urlRouterProvider.when('/{account}/{project}', '/{account}/{project}/info');

	// This will be needed to remove angular's #, but there is an error at the moment
	// -> need to investigate
	$locationProvider.html5Mode(true);
}])
.factory('fake', function(){

	/**
	 * This provider is used to generate random things
	 * as placeholders until real-data fetching is implemented
	 */

	var o = {};

	o.author = function(){
		var authors = ["jozef", "tim", "fred"];
		return o.entry(authors);
	}

	o.text = function(n, space){
		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

		if(space){
			possible = possible + "			   ";
		}

		for( var i=0; i < n; i++ )
			text += possible.charAt(Math.floor(Math.random() * possible.length));

		return text;
	}

	o.entry = function(array){
		return array[Math.floor(Math.random() * array.length)];
	}

	o.branch = function(){
		return "branch_" + o.text(8, false);
	}

	o.comment = function(){
		return o.text(96, true);
	}

	o.number = function(n){
		return Math.floor(Math.random() * n + 1);
	}

	o.day = function(){
		// Only 5 possible days
		return Math.floor(Math.random() * 5 + 1);
	}

	o.month = function(){
		// Only 2 possible months
		var months = ["January", "February"];
		return o.entry(months);
	}

	o.time = function(){
		return "" + Math.floor(Math.random() * 24) + ":" + Math.floor(Math.random() * 60);
	}

	o.date = function(){
		// format: "15 october 2014, 01:00",
		var date = "" + o.day() + " " + o.month() + " 2014, " + o.time();
		return date;
	}

	o.log_type = function(){
		var types = ["visibility", "branch-add", "project-type", "user-add", "creation"];
		return o.entry(types);
	}

	o.log_keyword = function(type){
		if(type == "visibility"){
			return o.entry(["public", "private"]);
		}
		else if(type == "branch-add"){
			return o.branch(8, false);
		}
		else if(type == "project-type"){
			return o.entry(["Architectural", "Aerospatial", "Automotive", "Engineering", "Other"]);
		}
		else if(type == "user-add"){
			return o.author();
		}

		return "";
	}

	o.log = function(){

		var type = o.log_type();

		var log = {
			type: type,
			author: o.author(),
			keyword: o.log_keyword(type),
			date: o.date()
		};

		return log;
	}

	o.comment = function(){
		var c = {
			author: o.author(),
			date: o.date(),
			message: o.text(92, true)
		}

		return c;
	}

	o.revision = function(date){

		var c = {
			name: "rev_" + o.text(8, false),
			author: o.author(),
			date: date,
			message: o.text(92, true),
			n_comments: o.number(24),
		}

		return c;
	}

	return o;

})
.factory('data', function($http, $q, $rootScope, fake){

	/**
	 * This provider is used to store the data about the project
	 */

	// Overview of the data structure
	var o = {
		loading: true,
		info: {
			name: "",
			owner: "",
			readme: "",
			description: "",
			visibility: "",
			type: "",
			federation: [],
			users: [],
			branches: [],
			n_log: 0
		},
		current_branch: {
			name: "",
			n_revision: 0
		},
		current_revision: {
			name: "",
			n_comments: 0,
			author: "",
			date: "",
			message: "",
		},
		current_diff: {
			name: "",
		},
		comments:[
		],
		revisions: [
		],
		revisions_by_day:
		{
		},
		log: [
		]
	};

	/**
	 * Ajax requests
	 */

	// Fetch general info about the project
	o.fetchInfo = function(account, project){

		var deferred = $q.defer();

	o.account = account;
	o.project = project;

		setTimeout(function() {
			var res = {};
			res.name = project;

			$http.get($rootScope.apiUrl + '/' + account + '/' + project + '.json')
			.then(function(data) {
				res.owner = data.owner;
				res.description = data.desc;
				//res.type = data.type;
				res.visibility = data.read_access;

				res.readme = "## We are leading the transformation of the Queen Elizabeth Olympic Park Stadium into an all-round multi-use venue\n\n		  \nWe are using sustainable construction methods like incorporating recycled features of the existing facility into the new Stadium and re-using crushed demolition material. \n\nAt construction peak the project will employ up to 400 people, and we are working to ensure the employment of local people where possible. We have also committed to create apprenticeships which will amount to 7% of the total workforce.\n\nThe new venue will host five matches during the Rugby World Cup 2015 and will be the permanent home of West Ham United Football Club from 2016.\n					   \nBalfour Beatty, the international infrastructure group, today announces that it has been awarded a &pound;154 million contract to carry out the full transformation works to the London 2012 Olympic Stadium for its operator, E20 Stadium LLP, a joint venture between the London Legacy Development Corporation and Newham Council. This new contract encompasses the &pound;41 million Stadium roof contract Balfour Beatty was awarded in the summer.\n					\nBalfour Beatty will lead the transformation of the Stadium into an all-round multi-use venue, delivering a lasting sporting, cultural and commercial legacy in East London.\n					   \nThe new venue will host five matches during the Rugby World Cup 2015 and will be the permanent home of West Ham United Football Club from 2016. The venue will also become the new national competition Stadium for athletics in the UK as well as hosting elite international athletics events and other sporting, cultural and community events. A new community athletics track will also be provided next to the main Stadium.\n\nSustainable construction methods will include features of the existing facility being recycled and incorporated into the new Stadium and the re-use of crushed demolition material, existing balustrades and sanitary ware.\n\n\nAt construction peak the project will employ up to 400 people. Balfour Beatty will work with WorkPlace, Newham Council's employment service, to ensure the employment of local people where possible. Balfour Beatty has also committed to create apprenticeships which will amount to 7% of the total workforce.\n\nOnce reconfigured the Stadium's cable net roof, 84 metres wide at its deepest point, will be the largest cantilevered roof in the world covering every Stadium seat, improving acoustics and spectator experience.\n\nBalfour Beatty Chief Executive, Andrew McNaughton said: \"We are delighted to be continuing our activity at the Queen Elizabeth Olympic Park supporting the legacy commitment made as part of the London 2012 Olympic and Paralympic Games.\n\nDuring construction, our firm commitment to the use of local labour and the creation of apprenticeships will continue to benefit the local community and the wider industry and, upon completion, the Stadium will provide a first-class sporting and cultural facility for many generations to come. Balfour Beatty is proud to be associated with this project.\"\n\nWorks commence on site early in 2014 and are due for completion in the spring of 2016.";

				res.type = "federated";
				res.federation = [
					{
						name: "Helicopter project 1",
						revisions: [
							"HEAD",
							"Rev 1",
							"Rev 2",
						],
						revselected: "HEAD"
					},
					{
						name: "Boat project 1",
						revisions: [
							"HEAD",
							"Rev 3",
							"Rev 4",
						],
						revselected: "Rev 4"
					}
				];
				res.users = [
					{
						name: "Tim Scully",
						role: "Admin"
					},
					{
						name: "Jozef Dobos",
						role: "Admin"
					},
					{
						name: "Frederic Besse",
						role: "Admin"
					}
				];

				return $http.get($rootScope.apiUrl + '/' + account + '/' + project + '/branches.json');

			}).then(function(data) {
				res.branches = data.data.map(function (item) {
					if (item.name == "00000000-0000-0000-0000-000000000000")
						return "master";
					else
						return item.name;
				});

				res.n_log = 19;

				deferred.resolve(res);
			});
		},0);

		return deferred.promise;
	}

	// Fetch info about the current branch given the name of the branch
	o.fetchCurrentBranch = function(name){
		var deferred = $q.defer();

		setTimeout(function() {
			var res = {
				name: name,
				n_revisions: fake.number(24),
			};

			deferred.resolve(res);

		}, 10);

		return deferred.promise;
	};

	// Fetch info about the current revision given the name of the revision
	o.fetchCurrentRevision = function(branch, name){
		var deferred = $q.defer();

		var url = "";

		if (name == 'head')
			url = $rootScope.apiUrl + '/' + o.account + '/' + o.project + '/revision/' + branch + '/' + name + '.json';
		else
			url = $rootScope.apiUrl + '/' + o.account + '/' + o.project + '/revision/' + name + '.json';

		setTimeout(function() {

			$http.get(url).then(function(data) {
				var res     = {};
				res.name    = data.data.name;
				res.author  = data.data.author;
				res.data    = data.data.date;
				res.message = data.data.message;
				res.n_comments = 24;
				deferred.resolve(res);
			});
		}, 10);

		return deferred.promise;
	};

	o.fetchRevisions = function(branch){

		var deferred = $q.defer();

		setTimeout(function() {

			$http.get($rootScope.apiUrl + '/' + o.account + '/' + o.project + '/revisions/' + branch.name + '.json')
			.then(function(data) {
				deferred.resolve(data.data);
			});
		}, 10);

		return deferred.promise;
	};

	// Fetch some of the revisions grouped by day
	o.fetchRevisionsByDay = function(first, last) {

		var fetchFakeRevisions = function(branch, rev, first, last){

			console.log("Fetching revisions [" + first + "," + last + "] for branch " + branch + " and rev " + rev);

			var res = {};
			for(var i=first; i<=last; i++){
				var date = fake.date();
				var day = date.split(",")[0];

				if(!res.hasOwnProperty(day)){
					res[day] = [];
				}

				res[day].push(fake.revision(date));
			}

			return res;

		};

		var deferred = $q.defer();

		setTimeout(function() {
			var res = fetchFakeRevisions(o.current_branch.name, o.current_revision.name, first, last);

			deferred.resolve(res);
		}, 10);

		return deferred.promise;
	};

	// Fetch some of the comments for the current revision
	o.fetchComments = function(first, last){

		var fetchFakeComments = function(branch, rev, first, last){

			console.log("Fetching comments [" + first + "," + last + "] for branch " + branch + " and rev " + rev);

			var res = [];
			for(var i=first; i<=last; i++){
				res.push(fake.comment());
			}

			return res;

		};

		var deferred = $q.defer();

		setTimeout(function() {

			var res = fetchFakeComments(o.current_branch.name, o.current_revision.name, first, last);

			deferred.resolve(res);

		}, 10);

		return deferred.promise;
	};

	// Fetch some of the logs
	o.fetchLog = function(first, last){

		var fetchFakeLog = function(branch, rev, first, last){

			console.log("Fetching log [" + first + "," + last + "] for branch " + branch + " and rev " + rev);

			var res = [];
			for(var i=first; i<=last; i++){
				res.push(fake.log());
			}

			return res;

		};

		var deferred = $q.defer();

		setTimeout(function() {

			var res = fetchFakeLog(o.current_branch.name, o.current_revision.name, first, last);

			deferred.resolve(res);
		}, 10);

		return deferred.promise;
	};

	/**
	 * Setters, copying from the res into the data structure
	 */

	o.setInfo = function(res){
		angular.copy(res, o.info);
	}

	o.setCurrentBranch = function(res){
		angular.copy(res, o.current_branch);
	}

	o.setCurrentRevision = function(res){
		angular.copy(res, o.current_revision);
	}

	o.setCurrentDiff = function(rev_name){
		o.current_diff = {
			name: rev_name,
		};
	};

	o.setRevisions = function(res){
		angular.copy(res, o.revisions);
	}

	o.setRevisionsByDay = function(res){
		angular.copy(res, o.revisions_by_day);
	}

	o.setComments = function(res){
		angular.copy(res, o.comments);
	}

	o.setLog = function(res){
		angular.copy(res, o.log);
	};

	/**
	 * Promises, used in the resolve to fetch data
	 */

	o.initPromise = function(account, project, branch, rid, info){

		// Enable loading animation
		o.loading = true;

		// Chain of promises
		// - fetch the general info
		// - fetch the current branch (selected by default)
		// - fetch the revisions
		// - set the current revision (selected by default)
		// - set the current diff
		return o.fetchInfo(account, project)
			.then(function(res){
				o.setInfo(res);
				return o.fetchCurrentBranch(branch);
			})
			.then(function(res){
				o.setCurrentBranch(res);
				return o.fetchRevisions(o.current_branch);
			})
			.then(function(res){
				o.setRevisions(res);
				return o.fetchCurrentRevision(branch, rid);
			})
			.then(function(res){
				o.setCurrentRevision(res);
				o.setCurrentDiff("None");

				// Disable loading animation
				o.loading = false;
			});
	};

	return o;
})
.directive('markdown', function () {

	/**
	 * This directive allows us to convert markdown syntax into
	 * formatted text
	 */

	var converter = new Showdown.converter();
	return {
	  restrict: 'A',
	  link: function (scope, element, attrs) {
		  function renderMarkdown() {
			  var htmlText = converter.makeHtml(scope.$eval(attrs.markdown)  || '');
			  element.html(htmlText);
		  }
		  scope.$watch(attrs.markdown, renderMarkdown);
		  renderMarkdown();
	  }
  };
})
.factory('pagination', function(data){

	/**
	 * This provider deals with the pagination of the data
	 * So far the paginated data is:
	 * - comments
	 * - log
	 * - revision list
	 */

	var o = {
		totalItems: 0,
		currentPage: 1,
		itemsperpage: 5
	};

	o.init = function(view) {
		if(view == "comments"){
			o.totalItems = data.current_revision.n_comments;
		}
		else if(view == "log"){
			o.totalItems = data.info.n_log;
		}
		else if(view == "revisions"){
			o.totalItems = data.current_branch.n_revisions;
		}
	}

	o.fetch = function(view){

		if(view == "comments"){
			data.loading = true;
			data.fetchComments((o.currentPage-1)*o.itemsperpage, Math.min(o.totalItems-1, (o.currentPage)*o.itemsperpage-1))
			.then(function(res){
				data.setComments(res);
				data.loading = false;
			});
		}
		else if(view == "log"){
			data.loading = true;
			data.fetchLog((o.currentPage-1)*o.itemsperpage, Math.min(o.totalItems-1, (o.currentPage)*o.itemsperpage-1))
			.then(function(res){
				data.setLog(res);
				data.loading = false;
			});
		}
		else if(view == "revisions"){
			data.loading = true;
			data.fetchRevisionsByDay((o.currentPage-1)*o.itemsperpage, Math.min(o.totalItems-1, (o.currentPage)*o.itemsperpage-1))
			.then(function(res){
				data.setRevisionsByDay(res);
				data.loading = false;
			});
		}
	}

	return o;

})
.factory('users', function(data){

	var o = {
		selected: "",
		states : ['Tim Scully (tscully)', 'Jozef Dobos (jdobos)', 'Frederic Besse (fbesse)']
	};

	return o;

})
.controller('ViewCtrl', function($scope, $http, data, view, pagination, users, $state){

	$scope.data = data;
	$scope.view = view;
	$scope.possible_views = ["info", "comments", "revisions", "log", "settings"];

	console.log("ACCOUNT => " + $scope.account);
	console.log("VIEW => " + $scope.view);
	console.log("PROJECT => " + $scope.project);

	$scope.pagination = pagination;
	$scope.users = users;

	$scope.loading = true;

	$scope.pageChanged = function() {
		$scope.pagination.init($scope.view);
		$scope.pagination.fetch($scope.view);
	};

	$scope.isView = function(view){
		return $scope.view == view;
	};

	$scope.go = function(v){
		var o = {view: v};
		$state.go("main.view", o);
	}

	$scope.checkViewIsValid = function(){
		if( $scope.possible_views.indexOf(view) == -1 ){
			$state.go("404");
		}
	}

	$scope.setBranch = function(branch) {
		$scope.branch = branch;
	}

	$scope.setRevision = function(rev) {
		$scope.rid = rev;
		var o = {
			branch: $scope.branch,
			rid:  $scope.rid.name,
			view: $scope.view
		};

		$state.go('main.revision.view', o);
	}

	$scope.checkViewIsValid();

	$scope.pageChanged();

})
.factory('iFrameURL', function() {
	var o = {};

	o.setURL = function(url)
	{
		o.url = url;
	}

	return o;
})
.controller('MainCtrl', function($scope, $http, iFrameURL, account, project, $location, $window, $state, $stateParams, $rootScope) {
	$scope.loggedIn = !!$window.sessionStorage.token;
	$rootScope.apiUrl = $rootScope.apiUrl;

	$scope.iFrameURL = iFrameURL;
	iFrameURL.setURL($rootScope.apiUrl + '/' + account + '/' + project + '/revision/master/head.x3d.src');

	$scope.logOut = function() {
		if ($window.sessionStorage.token)
		{
			delete $window.sessionStorage.username;
			delete $window.sessionStorage.token;
		}
	}

	$scope.login = function() {
		url = $rootScope.apiUrl + '/login';
		console.log('URL: ' + url);

		$http.post(url, $scope.user)
		.success(function (data, status, headers, config) {
			$window.sessionStorage.token = data.token;
			$window.sessionStorage.username = $scope.user.username;
			$scope.loggedIn = true;
		})
		.error(function(data, status, headers, config) {
			logOut();
			console.log('Failed')
		});
	};

	if ($window.sessionStorage.username)
	{
		$scope.user = {username: $window.sessionStorage.username, password: ''};
	} else {
		$scope.user = {username :'', password: ''};
	}

	$scope.x3domreload = function() {
		x3dom.reload();
	};
})
.controller('RevisionCtrl', function($scope, $http, iFrameURL, account, project, branch, rid, $stateParams, $rootScope, $state) {
	$scope.branch = branch;
	$scope.rid = rid;

	if (branch)
		iFrameURL.setURL($rootScope.apiUrl + '/' + account + '/' + project + '/revision/' + branch + '/' + rid + '.x3d.src');
	else
		iFrameURL.setURL($rootScope.apiUrl + '/' + account + '/' + project + '/revision/' + rid + '.x3d.src');

})
.factory('authInterceptor', function($rootScope, $q, $window) {
	return {
		request: function (config) {
			console.log(config)
			config.headers = config.headers || {};
			if ($window.sessionStorage.token) {
				$window.sessionStorage.Authorization = 'Bearer ' + $window.sessionStorage.token;
			}
			return config;
		},
		response: function (res) {
			if (res.status === 401)
			{
				delete $window.sessionStorage.token;
				delete $window.sessionStorage.user;
				return;
			}

			return res || $q.when(res);
		}
	};
})
.config(function ($httpProvider, $sceDelegateProvider) {
	$httpProvider.interceptors.push('authInterceptor');

	$sceDelegateProvider.resourceUrlWhitelist([
		'self',
		'http://api.localhost:8081/**'
	]);

});

jQuery.support.cors = true;
