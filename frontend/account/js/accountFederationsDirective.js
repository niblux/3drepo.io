/**
 *	Copyright (C) 2016 3D Repo Ltd
 *
 *	This program is free software: you can redistribute it and/or modify
 *	it under the terms of the GNU Affero General Public License as
 *	published by the Free Software Foundation, either version 3 of the
 *	License, or (at your option) any later version.
 *
 *	This program is distributed in the hope that it will be useful,
 *	but WITHOUT ANY WARRANTY; without even the implied warranty of
 *	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *	GNU Affero General Public License for more details.
 *
 *	You should have received a copy of the GNU Affero General Public License
 *	along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function () {
	"use strict";

	angular.module("3drepo")
		.directive("accountFederations", accountFederations);

	function accountFederations() {
		return {
			restrict: 'EA',
			templateUrl: 'accountFederations.html',
			scope: {
				account: "=",
				accounts: "=",
				onShowPage: "&",
				quota: "=",
				subscriptions: "="
			},
			controller: AccountFederationsCtrl,
			controllerAs: 'vm',
			bindToController: true
		};
	}

	AccountFederationsCtrl.$inject = ["$scope", "$location", "$timeout", "UtilsService", "serverConfig", "Auth", "AnalyticService"];

	function AccountFederationsCtrl ($scope, $location, $timeout, UtilsService, serverConfig, Auth, AnalyticService) {
		var vm = this,
			federationToDeleteIndex,
			userAccount, // For creating federations
			accountsToUse, // For listing federations
			dialogCloseToId;

		vm.projectRegExp = serverConfig.modelNameRegExp;
		
		// Init
		function getFederationOptions(project, account){

			var isUserAccount = account === vm.account;
			return {
				edit: {label: "Edit", icon: "edit", hidden: !Auth.hasPermission(serverConfig.permissions.PERM_EDIT_FEDERATION, project.permissions)},
				team: {label: "Team", icon: "group", hidden: !isUserAccount},
				projectsetting: {label: "Settings", icon: "settings", hidden: !Auth.hasPermission(serverConfig.permissions.PERM_CHANGE_MODEL_SETTINGS, project.permissions)},
				delete: {label: "Delete", icon: "delete", color: "#F44336", hidden: !Auth.hasPermission(serverConfig.permissions.PERM_DELETE_MODEL, project.permissions)}
			};
			
		};

		vm.units = server_config.units;
		vm.dialogCloseTo = "accountFederationsOptionsMenu_" + vm.account;
		dialogCloseToId = "#" + vm.dialogCloseTo;

		vm.showMenu = function(project, account){
		
			var isUserAccount = account === vm.account;
			return Auth.hasPermission(serverConfig.permissions.PERM_EDIT_FEDERATION, project.permissions) ||
				Auth.hasPermission(serverConfig.permissions.PERM_CHANGE_MODEL_SETTINGS, project.permissions) ||
				Auth.hasPermission(serverConfig.permissions.PERM_DELETE_MODEL, project.permissions) ||
				isUserAccount;
		}

		/*
		 * Watch accounts input
		 */
		$scope.$watch("vm.accounts", function () {
			var i, length;

			if (angular.isDefined(vm.accounts)) {
				vm.showInfo = true;
				if (vm.accounts.length > 0) {
					accountsToUse = [];
					for (i = 0, length = vm.accounts.length; i < length; i += 1) {

						if (i === 0) {
							vm.accounts[i].showProjects = true;
							accountsToUse.push(vm.accounts[i]);
							if (vm.accounts[i].fedModels.length > 0) {
								vm.showInfo = false;
							}
							userAccount = vm.accounts[i];
						}
						else if (vm.accounts[i].fedModels.length > 0) {
							vm.accounts[i].showProjects = true;
							accountsToUse.push(vm.accounts[i]);
							vm.showInfo = false;
						}

						if(vm.accounts[i].fedModels){
							vm.accounts[i].fedModels.forEach(function(fedProject){
								fedProject.federationOptions = getFederationOptions(fedProject, vm.accounts[i].account);
							});
						}

					}



					vm.accountsToUse = angular.copy(accountsToUse);
					console.log('accountsToUse', vm.accountsToUse);
				}
			}
		});

		/*
		 * Watch for change in edited federation
		 */
		$scope.$watch("vm.newFederationData", function () {
			if (vm.federationOriginalData === null) {
				vm.newFederationButtonDisabled = (angular.isUndefined(vm.newFederationData.model)) || (vm.newFederationData.model === "" || !vm.newFederationData.unit);
			}
			else {
				vm.newFederationButtonDisabled = angular.equals(vm.newFederationData, vm.federationOriginalData);
			}
		}, true);

		/**
		 * Open the federation dialog
		 *
		 * @param event
		 */
		vm.setupNewFederation = function (event, accountIndex) {

			vm.currentAccountIndex = accountIndex;
			vm.userAccount = angular.copy(vm.accountsToUse[vm.currentAccountIndex]);
			vm.federationOriginalData = null;
			vm.newFederationData = {
				desc: "",
				type: "",
				subModels: []
			};
			vm.errorMessage = '';
			UtilsService.showDialog("federationDialog.html", $scope, event, true, null, false, dialogCloseToId);
		};

		/**
		 * Close the federation dialog
		 *
		 */
		vm.closeDialog = function () {
			UtilsService.closeDialog();
		};

		/**
		 * Toggle showing of projects in an account
		 *
		 * @param index
		 */
		vm.toggleShowProjects = function (index) {
			vm.accountsToUse[index].showProjects = !vm.accountsToUse[index].showProjects;
			vm.accountsToUse[index].showProjectsIcon = vm.accountsToUse[index].showProjects ? "folder_open" : "folder";
		};

		/**
		 * Add a project to a federation
		 *
		 * @param projectIndex
		 */
		vm.addToFederation = function (projectIndex) {
			vm.showRemoveWarning = false;

			vm.newFederationData.subModels.push({
				database: vm.userAccount.account,
				projectIndex: projectIndex,
				model: vm.userAccount.models[projectIndex].model
			});

			vm.userAccount.models[projectIndex].federated = true;
		};

		/**
		 * Remove a project from a federation
		 *
		 * @param index
		 */
		vm.removeFromFederation = function (index) {
			var i, length,
				item;

			// Cannot have existing federation with no sub projects
			if (vm.newFederationData.hasOwnProperty("timestamp") && vm.newFederationData.subModels.length === 1) {
				vm.showRemoveWarning = true;
			}
			else {
				item = vm.newFederationData.subModels.splice(index, 1);
				for (i = 0, length = vm.userAccount.models.length; i < length; i += 1) {
					if (vm.userAccount.models[i].model === item[0].model) {
						vm.userAccount.models[i].federated = false;
						break;
					}
				}
			}
		};

		/**
		 * Save a federation
		 */
		vm.saveFederation = function () {
			var promise;

			if (vm.federationOriginalData === null) {
				promise = UtilsService.doPost(vm.newFederationData, vm.accountsToUse[vm.currentAccountIndex].account + "/" + vm.newFederationData.model);
				promise.then(function (response) {
					
					if(response.status !== 200 && response.status !== 201){
						vm.errorMessage = response.data.message;
					} else {
						vm.errorMessage = '';
						vm.showInfo = false;
						vm.newFederationData.timestamp = (new Date()).toString();
						vm.newFederationData.permissions = response.data.permissions;
						vm.newFederationData.federationOptions = getFederationOptions(vm.newFederationData, vm.accountsToUse[vm.currentAccountIndex].account);
						vm.accountsToUse[vm.currentAccountIndex].fedModels.push(vm.newFederationData);
						vm.closeDialog();

						AnalyticService.sendEvent({
							eventCategory: 'Project',
							eventAction: 'create',
							eventLabel: 'federation'
						});
					}



				});
			}
			else {
				promise = UtilsService.doPut(vm.newFederationData, vm.accountsToUse[vm.currentAccountIndex].account + "/" + vm.newFederationData.model);
				promise.then(function (response) {
					console.log(response);
					vm.federationOriginalData.subModels = vm.newFederationData.subModels;
					vm.closeDialog();
				});
			}

			$timeout(function () {
				$scope.$apply();
			});
		};

		/**
		 * Open the federation in the viewer if it has sub projects otherwise open edit dialog
		 *
		 * @param {Object} event
		 * @param {Object} accountIndex
		 * @param {Number} projectIndex
		 */

		vm.viewFederation = function (event, accountIndex, projectIndex) {
			console.log(vm.accountsToUse[accountIndex]);
			if ((accountIndex === 0) && !vm.accountsToUse[accountIndex].fedModels[projectIndex].hasOwnProperty("subModels")) {
				setupEditFederation(event, accountIndex, projectIndex);
			}
			else {
				$location.path("/" + vm.accountsToUse[accountIndex].account + "/" +  vm.accountsToUse[accountIndex].fedModels[projectIndex].model, "_self").search({});
				AnalyticService.sendEvent({
					eventCategory: 'Project',
					eventAction: 'view',
					eventLabel: 'federation'
				});
			}

		};

		/**
		 * Handle federation option selection
		 *
		 * @param event
		 * @param option
		 * @param federationIndex
		 */
		vm.doFederationOption = function (event, option, accountIndex, federationIndex) {
			switch (option) {
				case "edit":
					setupEditFederation(event, accountIndex, federationIndex);
					break;

				case "team":
					setupEditTeam(event, accountIndex, federationIndex);
					break;

				case "delete":
					setupDelete(event, accountIndex, federationIndex);
					break;

				case "projectsetting":
					setupSetting(event, accountIndex, federationIndex);
			}
		};

		/**
		 * Delete federation
		 */
		vm.delete = function () {
			var promise = UtilsService.doDelete({}, vm.accountsToUse[vm.currentAccountIndex].account + "/" + vm.accountsToUse[vm.currentAccountIndex].fedModels[federationToDeleteIndex].model);
			promise.then(function (response) {
				if (response.status === 200) {
					vm.accountsToUse[vm.currentAccountIndex].fedModels.splice(federationToDeleteIndex, 1);
					vm.showInfo = ((vm.accountsToUse.length === 1) && (vm.accountsToUse[vm.currentAccountIndex].fedModels.length === 0));
					vm.closeDialog();

					AnalyticService.sendEvent({
						eventCategory: 'Project',
						eventAction: 'delete',
						eventLabel: 'federation'
					});
				}
				else {
					vm.deleteError = "Error deleting federation";
				}
			});
		};

		/**
		 * Toggle display of projects for an account
		 *
		 * @param {Number} index
		 */
		vm.toggleProjectsList = function (index) {
			vm.accountsToUse[index].showProjects = !vm.accountsToUse[index].showProjects;
			vm.accountsToUse[index].showProjectsIcon = vm.accountsToUse[index].showProjects ? "folder_open" : "folder";
		};

		/**
		 * Edit a federation
		 *
		 * @param event
		 * @param projectIndex
		 */
		function setupEditFederation (event, accountIndex, projectIndex) {
			var i, j, iLength, jLength;

			vm.showRemoveWarning = false;

			console.log('accountIndex', accountIndex);
			vm.currentAccountIndex = accountIndex;
			vm.userAccount = angular.copy(vm.accountsToUse[vm.currentAccountIndex]);
			vm.federationOriginalData = vm.accountsToUse[vm.currentAccountIndex].fedModels[projectIndex];
			vm.newFederationData = angular.copy(vm.federationOriginalData);
			if (!vm.newFederationData.hasOwnProperty("subModels")) {
				vm.newFederationData.subModels = [];
			}

			// Disable projects in the projects list that are federated
			for (i = 0, iLength = vm.userAccount.models.length; i < iLength; i += 1) {
				vm.userAccount.models[i].federated = false;
				if (vm.federationOriginalData.hasOwnProperty("subModels")) {
					for (j = 0, jLength = vm.federationOriginalData.subModels.length; j < jLength; j += 1) {
						if (vm.federationOriginalData.subModels[j].model === vm.userAccount.models[i].model) {
							vm.userAccount.models[i].federated = true;
						}
					}
				}
			}

			UtilsService.showDialog("federationDialog.html", $scope, event, true, null, false, dialogCloseToId);
		}

		function setupSetting(event, accountIndex, projectIndex){
			$location.search("proj", vm.accountsToUse[accountIndex].fedModels[projectIndex].model);
			$location.search("targetAcct", vm.accountsToUse[accountIndex].account);
			vm.onShowPage({page: "projectsetting", callingPage: "repos", data: {tabIndex: 1}});
		}

		/**
		 * Set up deleting of federation
		 *
		 * @param {Object} event
		 * @param {Object} index
		 */
		 function setupDelete (event, accountIndex, index) {
			federationToDeleteIndex = index ;
			vm.deleteError = null;
			vm.deleteTitle = "Delete Federation";
			vm.deleteWarning = "This federation will be lost permanently and will not be recoverable";
			vm.deleteName = vm.accountsToUse[accountIndex].fedModels[federationToDeleteIndex].model;
			vm.currentAccountIndex = accountIndex;
			UtilsService.showDialog("deleteDialog.html", $scope, event, true, null, false, dialogCloseToId);
		}

		/**
		 * Set up team of federation
		 *
		 * @param {Object} event
		 * @param {Object} index
		 */
		function setupEditTeam (event, accountIndex, index) {
			vm.item = vm.accountsToUse[accountIndex].fedModels[index];
			vm.currentAccountIndex = accountIndex;
			UtilsService.showDialog("teamDialog.html", $scope, event, true, null, false, dialogCloseToId);
		}
	}
}());
