/**
 *	Copyright (C) 2019 3D Repo Ltd
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

"use strict";

const moment = require("moment");
const ModelSetting = require("./modelSetting");
const User = require ("./user");
const config = require("../config");
const C = require("../constants");
const Job = require("./job");

const ReportType = {
	ISSUES : "Issues",
	RISKS: "Risks"
};

const riskLevelMapping = ["Very Low", "Low", "Moderate", "High", "Very High"];

const attributes = {};
attributes[ReportType.ISSUES] = [
	{label: "Assigned", field: "assigned_roles"},
	{label: "Priority", field: "priority"},
	{label: "Status", field: "status"},
	{label: "Type", field: "topic_type"},
	{label: "Due Date", field: "due_date", isDate: true}
];
attributes[ReportType.RISKS] = [
	{ label: "Safetibase ID", field: "safetibase_id"},
	{ label: "Associated Activity", field: "associated_activity"},
	{ label: "Category", field: "category"},
	{ label: "Risk Likelihood", field: "likelihood", mapping: riskLevelMapping},
	{ label: "Risk Consequence", field: "consequence", mapping: riskLevelMapping},
	{ label: "Level of Risk", field: "level_of_risk", mapping: riskLevelMapping},
	{ label: "Mitigation Status", field: "mitigation_status", default: "Unmitigated"},
	{ label: "Mitigation", field: "mitigation_desc", default: "None"}
];

const urlQS = {};
urlQS[ReportType.RISKS] = "riskId";
urlQS[ReportType.ISSUES] = "issueId";

const singularLabel = {};
singularLabel[ReportType.RISKS] = "risk";
singularLabel[ReportType.ISSUES] = "issue";

/**
 *
 * @param {Date} dateToFormat
 *
 * Format date by providing a date object
 * @return returns a string date
 */

function formatDate(date, printTime = true) {
	const formatToUse = printTime ? "Do MMM YYYY kk:mm" : "Do MMM YYYY";
	return moment(date).format(formatToUse);
}

class ReportGenerator {
	constructor(type, teamspace, model, rev) {
		this.userFullName = [];
		this.promises = [];
		this.type = type;
		this.typeSingular = singularLabel[type];
		this.teamspace = teamspace;
		this.modelID = model;
		this.rev = rev || this.getRevisionID(teamspace, model);
		this.reportDate = formatDate(new Date(), false);

		this.getModelName();
		this.getUsersToJobs();
	}

	getDBCol() {
		return { account: this.teamspace, model: this.modelID };
	}

	getModelName() {
		this.promises.push(
			ModelSetting.findById(this.getDBCol(), this.modelID).then((setting) => {
				this.modelName = setting.name;
			})
		);
	}

	getRevisionID() {
		this.promises.push(
			require("./history").findLatest(this.getDBCol(), {timestamp: 1, tag: 1}).then((entry) => {
				this.rev = entry.tag ? entry.tag : "uploaded at " + formatDate(entry.timestamp);
			})
		);
	}

	getUsersToJobs() {
		this.promises.push(
			Job.usersWithJob(this.teamspace).then((usersToJob) => {
				this.userToJob = usersToJob;
			})
		);
	}

	getUserJob(user) {
		return this.userToJob.hasOwnProperty(user) ? this.userToJob[user] : "Unknown";
	}

	addEntries(entries) {
		this.entries = this.entries || [];
		const usersToQuery = new Set();
		entries.forEach((entry) => {
			const newEntry = {
				attributes: [],
				comments: []
			};
			entry.owner && usersToQuery.add(entry.owner);
			newEntry.owner = entry.owner || "Unknown";
			newEntry.created = formatDate(entry.created);
			newEntry.createdTS = entry.created;
			newEntry.number = entry.number || "";
			newEntry.screenshot = entry.viewpoint.screenshot;
			newEntry.screenshotURL = `${config.getBaseURL()}/viewer/${this.teamspace}/${this.modelID}?${urlQS[this.type]}=${entry._id}`;
			newEntry.name = entry.name;

			newEntry.desc = entry.desc;

			attributes[this.type].forEach((field) => {
				const attri = { label: field.label };
				if (entry.hasOwnProperty(field.field)) {
					const value = entry[field.field];

					if(value === "" || value === undefined || value === null) {
						attri.value = field.default ? field.default : "Unknown";
					} else {
						if(field.mapping) {
							attri.value = field.mapping[value];
						} else if (field.isDate) {
							attri.value = formatDate(entry[value], false);
						} else {
							attri.value =  Array.isArray(entry[field.field]) ?
								entry[field.field].join(", ") : entry[field.field];
						}

					}
					newEntry.attributes.push(attri);
				} else if (field.default) {
					attri.value = field.default;
					newEntry.attributes.push(attri);
				}
			});

			if (entry.comments) {
				entry.comments.forEach((comment) => {
					comment.owner || usersToQuery.add(comment.owner);
					comment.created = formatDate(comment.created);
					if(comment.action && comment.action.property === "due_date") {
						comment.action.to = formatDate(parseInt(comment.action.to), false);
						comment.action.from = comment.action.from ? formatDate(parseInt(comment.action.from), false) : undefined;
					}
					newEntry.comments.push(comment);
				});
			}
			this.entries.push(newEntry);
		});

		this.addUsersToNameMap(Array.from(usersToQuery));
	}

	addUsersToNameMap(users) {
		users.forEach((user) => {
			if(!this.userFullName[user]) {
				this.promises.push(
					User.findByUserName(user).then(username => {
						if (username) {
							this.userFullName[user] = username.customData.firstName + " " + username.customData.lastName;
						} else {
							this.userFullName[user] = "Unknown";
						}
					})
				);
			}
		});
	}

	generateReport(res) {
		this.entries.sort((a, b) => a.createdTS < b.createdTS ? 1 : -1);
		return Promise.all(this.promises).then(() => {
			res.render("report.pug", {
				baseURL: config.getBaseURL(),
				url: function (path) {
					return config.apiAlgorithm.apiUrl(C.GET_API, path);
				},
				reportData: this
			});
		});
	}
}

module.exports = {
	newIssuesReport :  (teamspace, model, rev) =>  new ReportGenerator(ReportType.ISSUES, teamspace, model, rev),
	newRisksReport :  (teamspace, model, rev) =>  new ReportGenerator(ReportType.RISKS, teamspace, model, rev)
};