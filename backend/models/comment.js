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

const responseCodes = require("../response_codes.js");
const utils = require("../utils");

const fieldTypes = {
	"action": "[object Object]",
	"comment": "[object String]",
	"consequence": "[object Number]",
	"created": "[object Number]",
	"guid": "[object Object]",
	"from": "[object String]",
	"likelihood": "[object Number]",
	"mitigation": "[object String]",
	"owner": "[object String]",
	"pinPosition": "[object Array]",
	"rev_id": "[object Object]",
	"sealed": "[object Boolean]",
	"to": "[object String]",
	"viewpoint": "[object Object]"
};

class CommentGenerator {
	constructor(owner, revId = undefined) {
		this.guid = utils.generateUUID();
		this.created = (new Date()).getTime();
		this.owner = owner;

		if (revId) {
			if ("[object String]" === Object.prototype.toString.call(revId)) {
				revId = utils.stringToUUID(revId);
			}

			this.rev_id = revId;
		}
	}
}

class TextCommentGenerator extends CommentGenerator {
	constructor(owner, revId, commentText, viewpointGUID) {
		super(owner, revId);
		if (fieldTypes.comment === Object.prototype.toString.call(commentText) && commentText.length > 0) {
			this.comment = commentText;

			if (viewpointGUID) {
				this.viewpoint = viewpointGUID;
			}
		} else {
			throw responseCodes.ISSUE_COMMENT_NO_TEXT;
		}
	}
}

class SystemCommentGenerator extends CommentGenerator {
	constructor(owner, property, from, to) {
		super(owner);

		if (undefined !== from && fieldTypes.from !== Object.prototype.toString.call(from)) {
			from = from.toString();
		}

		if (undefined !== to && fieldTypes.to !== Object.prototype.toString.call(to)) {
			to = to.toString();
		}

		this.action = {
			property,
			from,
			to
		};
	}
}

class RiskMitigationCommentGenerator extends CommentGenerator {
	constructor(owner, revId, likelihood, consequence, mitigation, pinPosition) {
		super(owner, revId);

		likelihood = parseInt(likelihood);
		consequence = parseInt(consequence);

		if ((isNaN(likelihood) || fieldTypes.likelihood === Object.prototype.toString.call(likelihood)) &&
			(isNaN(consequence) || fieldTypes.consequence === Object.prototype.toString.call(consequence)) &&
			(undefined === mitigation || fieldTypes.mitigation === Object.prototype.toString.call(mitigation)) &&
			(undefined === pinPosition || fieldTypes.pinPosition === Object.prototype.toString.call(pinPosition))) {
			this.likelihood = (isNaN(likelihood)) ? undefined : likelihood;
			this.consequence = (isNaN(consequence)) ? undefined : consequence;
			this.mitigation = mitigation;
			this.pinPosition = pinPosition;
		} else {
			throw responseCodes.INVALID_ARGUMENTS;
		}
	}
}

module.exports = {
	newTextComment : (owner, revId, commentText, viewpointGUID) => new TextCommentGenerator(owner, revId, commentText, viewpointGUID),
	newSystemComment : (owner, property, from, to) => new SystemCommentGenerator(owner, property, from, to),
	newRiskMitigationComment : (owner, revId, likelihood, consequence, mitigation, pinPosition) => new RiskMitigationCommentGenerator(owner, revId, likelihood, consequence, mitigation, pinPosition)
};