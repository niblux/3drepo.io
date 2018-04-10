/**
 *  Copyright (C) 2014 3D Repo Ltd
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

class TreeController implements ng.IController {

	public static $inject: string[] = [
		"$scope",
		"$timeout",
		"$element",

		"TreeService",
		"EventService",
		"MultiSelectService",
		"ViewerService",
	];

	public showProgress: boolean; // in pug
	private revision;
	private promise;
	private highlightSelectedViewerObject: boolean;
	private clickedHidden;
	private clickedShown;
	private nodes; // in pug
	private allNodes;
	private nodesToShow; // in pug
	private showTree; // in pug
	private showFilterList; // in pug
	private viewerSelectedObject;
	private progressInfo; // in pug
	private visible;
	private invisible;
	private idToPath;
	private filterItemsFound; // in pug
	private topIndex; // in pug
	private infiniteItemsFilter; // in pug
	private onContentHeightRequest;
	private hideIfc;
	private showNodes;
	private currentSelectedIndex;
	private latestSearch: string;

	constructor(
		private $scope: ng.IScope,
		private $timeout: ng.ITimeoutService,
		private $element: ng.IRootElementService,

		private TreeService,
		private EventService,
		private MultiSelectService,
		private ViewerService,
	) {

		this.promise = null,
		this.highlightSelectedViewerObject = true;
	}

	public $onInit() {
		this.TreeService.reset();
		this.showNodes = true;
		this.nodes = [];
		this.showTree = true;
		this.showFilterList = false;
		this.TreeService.clearCurrentlySelected();
		this.viewerSelectedObject = null;
		this.showProgress = true;
		this.progressInfo = "Loading full tree structure";
		this.onContentHeightRequest({height: 70}); // To show the loading progress
		this.TreeService.resetClickedHidden(); // Nodes that have actually been clicked to hide
		this.TreeService.resetClickedShown(); // Nodes that have actually been clicked to show
		this.hideIfc = true;
		this.allNodes = [];
		this.watchers();
	}

	public $onDestroy() {
		this.TreeService.reset();
	}

	public watchers() {

		this.$scope.$watch(() => this.EventService.currentEvent(), (event: any) => {

			if (event.type === this.EventService.EVENT.VIEWER.OBJECT_SELECTED) {

				if ((event.value.source !== "tree") && this.TreeService.highlightSelectedViewerObject) {
					const objectID = event.value.id;

					if (objectID && this.TreeService.getCachedIdToPath()) {
						const path = this.TreeService.getPath(objectID);
						if (!path) {
							console.error("Couldn't find the object path");
						} else {

							this.TreeService.expandToSelection(path, 0, undefined, this.MultiSelectService.isMultiMode());
							this.TreeService.updateModelVisibility(this.allNodes[0]);
							angular.element((window as any).window).triggerHandler("resize");

						}
					}
				}

			} else if (event.type === this.EventService.EVENT.VIEWER.BACKGROUND_SELECTED) {
				this.TreeService.clearCurrentlySelected();
				this.nodes.forEach((n) => n.selected = false);
			} else if (event.type === this.EventService.EVENT.TREE_READY) {

				this.allNodes = this.TreeService.getAllNodes();
				this.nodes = this.allNodes;
				this.showTree = true;
				this.showProgress = false;
				this.initNodesToShow();
				this.setupInfiniteItemsFilter();
				this.TreeService.expandFirstNode();
				this.setContentHeight(this.fetchNodesToShow());
				this.$timeout(); // Force digest
			}
		});

		this.$scope.$watch("vm.filterText", (newValue) => {

			if (newValue !== undefined) {
				if (newValue.toString() === "") {
					this.showTreeInPane();
				} else {
					this.showTree = false;
					this.showFilterList = false;
					this.showProgress = true;
					this.progressInfo = "Filtering tree for objects";

					// Use rIC if available for smoother interactions
					if (window.requestIdleCallback) {
						window.requestIdleCallback(() => {
							this.performSearch(newValue);
						});
					} else {
						this.performSearch(newValue);
					}

				}
			}
		});

		this.$scope.$watch("vm.selectedMenuOption",
			(selectedOption: any) => {

				if (selectedOption && selectedOption.hasOwnProperty("value")) {

					// Menu option
					switch (selectedOption.value) {
						case "showAll":
							this.TreeService.showAllTreeNodes(true);
							break;
						case "hideIfc":
							this.hideIfc = selectedOption.selected;
							this.TreeService.setHideIfc(this.hideIfc);
							if (this.hideIfc) {
								this.ViewerService.hideHiddenByDefaultObjects();
								this.TreeService.hideTreeNodes(this.TreeService.getHiddenByDefaultNodes());
							} else {
								this.ViewerService.showHiddenByDefaultObjects();
								this.TreeService.showTreeNodes(this.TreeService.getHiddenByDefaultNodes());
							}
							break;
						case "isolate":
							this.TreeService.isolateSelected();
							break;
						default:
							console.error("Tree option menu selection unhandled");
					}
				}

			});

		// TODO - check for better way to sync state between component and service
		this.$scope.$watchCollection(() => this.TreeService.state,
			(state) => {
				if (state) {
					angular.extend(this, state);
				}
			});

		this.$scope.$watch(() => this.TreeService.selectedIndex,
			(selectedIndex) => {
				if (selectedIndex !== undefined) {

					this.setContentHeight(this.fetchNodesToShow());

					this.$timeout(() => {}).then(() => {
						this.topIndex = selectedIndex;
					});

				}
			});

	}

	public showTreeInPane() {
		this.showTree = true;
		this.showFilterList = false;
		this.showProgress = false;
		this.nodes = this.fetchNodesToShow();
		this.setContentHeight(this.nodes);
	}

	/**
	 * Set the content height.
	 * The height of a node is dependent on its name length and its level.
	 * @param {Array} nodesToShow
	 */
	public setContentHeight(nodesToShow) {
		let height = 0;
		let maxStringLengthForLevel = 0;
		const lineHeight = 18;
		const levelOffset = 2;
		const nodeMinHeight = 42;
		const maxStringLength = 35;

		for (let i = 0; i < nodesToShow.length ; i ++) {
			maxStringLengthForLevel = maxStringLength - (nodesToShow[i].level * levelOffset);
			if (nodesToShow[i].hasOwnProperty("name")) {
				height += nodeMinHeight + (lineHeight * Math.floor(nodesToShow[i].name.length / maxStringLengthForLevel));
			} else {
				height += nodeMinHeight + lineHeight;
			}
		}

		if (height === 0) {
			height = 70;
		}
		this.onContentHeightRequest({height});
		angular.element((window as any).window).triggerHandler("resize");

	}

	/**
	 * Initialise the tree nodes to show to the first node
	 */
	public initNodesToShow() {
		if (this.allNodes.length) {
			this.TreeService.initNodesToShow([this.allNodes[0]]);
		}
	}

	/**
	 * Fetch nodesToShow from tree service and update nodesToShow in tree component.
	 * @returns	nodesToShow.
	 */
	public fetchNodesToShow() {
		this.nodesToShow = this.TreeService.getNodesToShow();
		return this.nodesToShow;
	}

	/**
	 * Expand a node to show its children.
	 */
	public toggleNodeExpansion(event, id) {
		this.TreeService.toggleNodeExpansion(event, id);
		this.setContentHeight(this.fetchNodesToShow());
	}

	public toggleTreeNode($event, node) {
		$event.stopPropagation();

		const newState = ("invisible" === node.toggleState) ? "visible" : "invisible";

		// Unhighlight the node in the viewer if we're making it invisible
		if (newState === "invisible" && node.selected) {
			this.TreeService.deselectNodes([node]);
		}

		this.TreeService.setTreeNodeStatus(node, newState);
		this.TreeService.updateModelVisibility(node);

	}

	public selectAndCentreNode(node: any) {

		if (node.toggleState === "invisible") {
			return;
		}

		// Get everything selected and center to it
		this.TreeService.getCurrentMeshHighlights().then((selectionMap) => {

			if (Object.keys(selectionMap).length === 0) {
				return;
			}
			const meshIDArrs = [];
			const keys = Object.keys(selectionMap);
			keys.forEach((key) => {
				meshIDArrs.push({
					model: key.replace("@", "."),
					meshID: selectionMap[key].meshes,
				});
			});

			this.ViewerService.centreToPoint(meshIDArrs);

		});

	}

	public performSearch(filterText) {
		this.latestSearch = filterText;
		this.TreeService.search(filterText, this.revision)
			.then((json) => {
				if (this.latestSearch !== filterText) {
					return;
				}
				const noFilterItemsFoundHeight = 82;

				if (!this.showFilterList) {
					this.showFilterList = true;
					this.showProgress = false;
					this.nodes = json.data;
					if (this.nodes.length > 0) {
						this.filterItemsFound = true;
						for (let i = 0; i < this.nodes.length; i ++) {
							this.nodes[i].index = i;
							this.nodes[i].toggleState = "visible";
							this.nodes[i].level = 0;
						}
						this.setupInfiniteItemsFilter();
						this.setContentHeight(this.nodes);
					} else {
						this.filterItemsFound = false;
						this.onContentHeightRequest({height: noFilterItemsFoundHeight});
					}
				}

			})
			.catch((error) => {
				this.showTreeInPane();
			});
	}

	/**
	 * Check if we should ignore trying to select a node
	 */
	public ignoreSelection($event: any, node: any): boolean {
		const doubleClick = $event.detail > 1;
		if (doubleClick || node.toggleState === "invisible") {
			return true;
		}
		return false;
	}

	/**
	 * Selected a node in the tree
	 *
	 * @param node
	 */
	public selectNode($event: any, node: any) {

		if (this.ignoreSelection($event, node)) {
			return;
		}

		console.log("selectNode");
		return this.TreeService.selectNodes(
			[node],
			this.MultiSelectService.isMultiMode(),
			undefined,
			false,
		);
	}

	public filterNodeSelected($event: any, node: any) {

		if (this.ignoreSelection($event, node)) {
			return;
		}

		const multi = this.MultiSelectService.isMultiMode();

		if (!multi) {
			this.nodes.forEach((n) => n.selected = false);
			this.nodes[node.index].selected = true;
		} else {
			this.nodes[node.index].selected = !this.nodes[node.index].selected;
		}

		const selectedComponentNode = this.nodes[node.index];

		if (selectedComponentNode) {
			const serviceNode = this.TreeService.getNodeById(selectedComponentNode._id);
			this.TreeService.selectNodes([serviceNode], multi, undefined, false);
		}

	}

	public setupInfiniteItemsFilter() {
		this.infiniteItemsFilter = {
			numLoaded_: 0,
			toLoad_: 0,
			getItemAtIndex(index) {
				if (index > this.numLoaded_) {
					this.fetchMoreItems_(index);
					return null;
				}

				if (index < this.nodes.length) {
					return this.nodes[index];
				} else {
					return null;
				}
			},
			getLength() {
				return this.numLoaded_ + 5;
			},
			fetchMoreItems_(index) {
				if (this.toLoad_ < index) {
					this.toLoad_ += 20;
					this.$timeout(() => {}, 0).then(() => {
						this.numLoaded_ = this.toLoad_;
					});
				}
			},
		};
	}

}

export const TreeComponent: ng.IComponentOptions = {
	bindings: {
		account:  "=",
		branch:   "=",
		filterText: "=",
		model:  "=",
		onContentHeightRequest: "&",
		revision: "=",
		selectedMenuOption: "=",
	},
	controller: TreeController,
	controllerAs: "vm",
	templateUrl: "templates/tree.html",
};

export const TreeComponentModule = angular
	.module("3drepo")
	.component("tree", TreeComponent);
