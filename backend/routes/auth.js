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

"use strict";

let express = require("express");
let router = express.Router({mergeParams: true});
let responseCodes = require("../response_codes.js");
let C = require("../constants");
let middlewares = require("../middlewares/middlewares");
let config = require("../config");
//var systemLogger    = require("../logger.js").systemLogger;
let utils = require("../utils");
let User = require("../models/user");
let addressMeta = require("../models/addressMeta");
let Mailer = require("../mailer/mailer");
let httpsPost = require("../libs/httpsReq").post;

let multer = require("multer");


router.post("/login", login);
router.post("/logout", logout);

router.get("/login", checkLogin);

router.get("/version", printVersion);

router.post("/contact", contact);

router.get("/:account.json", middlewares.loggedIn, listInfo);

router.get("/:account/avatar", middlewares.isAccountAdmin, getAvatar);
router.get("/:account/avatar", middlewares.isAccountAdmin, getAvatar);
router.post("/:account/avatar", middlewares.isAccountAdmin, uploadAvatar);

router.post("/:account", signUp);

router.post("/:account/verify", verify);
router.post("/:account/forgot-password", forgotPassword);
router.put("/:account", middlewares.isAccountAdmin, updateUser);
router.put("/:account/password", resetPassword);

function createSession(place, req, res, next, user){

	req.session.regenerate(function(err) {
		req[C.REQ_REPO].logger.logInfo("Creating session for " + " " + user.username);
		if(err) {
			responseCodes.respond(place, responseCodes.EXTERNAL_ERROR(err), res, {username: user.username});
		} else {
			req[C.REQ_REPO].logger.logDebug("Authenticated user and signed token.");

			req.session[C.REPO_SESSION_USER] = user;
			req.session.cookie.domain        = config.cookie_domain;

			if (config.cookie.maxAge) {
				req.session.cookie.maxAge = config.cookie.maxAge;
			}

			responseCodes.respond(place, req, res, next, responseCodes.OK, {username: user.username, roles: user.roles, flags: user.flags});
		}
	});
}

function login(req, res, next){
	let responsePlace = utils.APIInfo(req);

	req[C.REQ_REPO].logger.logInfo("Authenticating user", { username: req.body.username});

	if(req.session.user){
		return responseCodes.respond(responsePlace, req, res, next, responseCodes.ALREADY_LOGGED_IN, responseCodes.ALREADY_LOGGED_IN);
	}

	User.authenticate(req[C.REQ_REPO].logger, req.body.username, req.body.password).then(user => {

		let responseData = { username: user.user };

		req[C.REQ_REPO].logger.logInfo("User is logged in", responseData);

		responseData.roles = user.roles;
		responseData.flags = {};

		responseData.flags.termsPrompt = !user.hasReadLatestTerms();

		user.customData.lastLoginAt = new Date();

		user.save().then(() => {
			createSession(responsePlace, req, res, next, responseData);
		});
	}).catch(err => {
		responseCodes.respond(responsePlace, req, res, next, err.resCode ? err.resCode: err, err.resCode ? err.resCode: err);
	});
}

function checkLogin(req, res, next){
	if (!req.session || !req.session.user) {
		responseCodes.respond(utils.APIInfo(req), req, res, next, responseCodes.NOT_LOGGED_IN, {});
	} else {
		responseCodes.respond(utils.APIInfo(req), req, res, next, responseCodes.OK, {username: req.session.user.username});
	}
}

function logout(req, res, next){
	if(!req.session || !req.session.user){
		return responseCodes.respond(utils.APIInfo(req), req, res, next, responseCodes.NOT_LOGGED_IN, {});
	}

	let username = req.session.user.username;

	req.session.destroy(function() {
		req[C.REQ_REPO].logger.logDebug("User has logged out.");
		res.clearCookie("connect.sid", { domain: config.cookie_domain, path: "/" });
		responseCodes.respond("Logout POST", req, res, next, responseCodes.OK, {username: username});
	});
}

function updateUser(req, res, next){
	let responsePlace = utils.APIInfo(req);

	if(req.body.oldPassword){

		// Update password
		User.updatePassword(req[C.REQ_REPO].logger, req.params[C.REPO_REST_API_ACCOUNT], req.body.oldPassword, null, req.body.newPassword).then(() => {
			responseCodes.respond(responsePlace, req, res, next, responseCodes.OK, { account: req.params[C.REPO_REST_API_ACCOUNT] });
		}).catch(err => {
			responseCodes.respond(responsePlace, req, res, next, err.resCode ? err.resCode: err, err.resCode ? err.resCode: err);
		});

	} else {

		// Update user info
		User.findByUserName(req.params[C.REPO_REST_API_ACCOUNT]).then(user => {
			return user.updateInfo(req.body);
		}).then(() => {
			responseCodes.respond(responsePlace, req, res, next, responseCodes.OK, { account: req.params[C.REPO_REST_API_ACCOUNT] });
		}).catch(err => {
			responseCodes.respond(responsePlace, req, res, next, err.resCode || utils.mongoErrorToResCode(err), err.resCode ? {} : err);
		});
	}


}

function signUp(req, res, next){

	let responsePlace = utils.APIInfo(req);

	if(!config.auth.register){
		responseCodes.respond(responsePlace, req, res, next, responseCodes.REGISTER_DISABLE, responseCodes.REGISTER_DISABLE);
	}

	if(!req.body.password){
		let err = responseCodes.SIGN_UP_PASSWORD_MISSING;
		return responseCodes.respond(responsePlace, req, res, next, err, err);
	}

	//check if captcha is enabled
	let checkCaptcha = config.auth.captcha ? httpsPost(config.captcha.validateUrl, {
		secret: config.captcha.secretKey,
		response: req.body.captcha

	}) : Promise.resolve({
		success: true
	});

	checkCaptcha.then(resBody => {

		if(resBody.success){
			return User.createUser(req[C.REQ_REPO].logger, req.params.account, req.body.password, {

				email: req.body.email,
				firstName: req.body.firstName,
				lastName: req.body.lastName,
				countryCode: req.body.countryCode,
				company: req.body.company,
				mailListOptOut: !req.body.mailListAgreed,

			}, config.tokenExpiry.emailVerify);
		} else {
			//console.log(resBody);
			return Promise.reject({ resCode: responseCodes.INVALID_CAPTCHA_RES});
		}


	}).then( data => {

		let country = addressMeta.countries.find(country => country.code === req.body.countryCode);
		//send to sales
		Mailer.sendNewUser({
			user: req.params.account,
			email: req.body.email,
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			country: country && country.name,
			company: req.body.company,
		}).catch( err => {
			// catch email error instead of returning to client
			req[C.REQ_REPO].logger.logError(`Email error - ${err.message}`);
			return Promise.resolve(err);
		});

		//send verification email
		return Mailer.sendVerifyUserEmail(req.body.email, {
			token : data.token,
			email: req.body.email,
			username: req.params.account,
			pay: req.body.pay

		}).catch( err => {
			// catch email error instead of returning to client
			req[C.REQ_REPO].logger.logError(`Email error - ${err.message}`);
			return Promise.resolve(err);
		});




	}).then(emailRes => {

		req[C.REQ_REPO].logger.logInfo("Email info - " + JSON.stringify(emailRes));
		responseCodes.respond(responsePlace, req, res, next, responseCodes.OK, { account: req.params[C.REPO_REST_API_ACCOUNT] });
	}).catch(err => {
		responseCodes.respond(responsePlace, req, res, next, err.resCode ? err.resCode: err, err.resCode ? err.resCode: err);
	});
}

function verify(req, res, next){

	let responsePlace = utils.APIInfo(req);

	User.verify(req.params[C.REPO_REST_API_ACCOUNT], req.body.token).then(() => {

		responseCodes.respond(responsePlace, req, res, next, responseCodes.OK, {});

	}).catch(err => {
		responseCodes.respond(responsePlace, req, res, next, err.resCode || err , err.resCode ? err.resCode : err);
	});

}

function forgotPassword(req, res, next){
	let responsePlace = utils.APIInfo(req);

	User.getForgotPasswordToken(req.params[C.REPO_REST_API_ACCOUNT], req.body.email, config.tokenExpiry.forgotPassword).then(data => {

		//send forgot password email
		return Mailer.sendResetPasswordEmail(req.body.email, {
			token : data.token,
			email: req.body.email,
			username: req.params[C.REPO_REST_API_ACCOUNT]
		}).catch( err => {
			// catch email error instead of returning to client
			req[C.REQ_REPO].logger.logDebug(`Email error - ${err.message}`);
			return Promise.reject(responseCodes.PROCESS_ERROR("Internal Email Error"));
		});

	}).then(emailRes => {

		req[C.REQ_REPO].logger.logInfo("Email info - " + JSON.stringify(emailRes));
		responseCodes.respond(responsePlace, req, res, next, responseCodes.OK, {});
	}).catch(err => {
		responseCodes.respond(responsePlace, req, res, next, err.resCode || err , err.resCode ? err.resCode : err);
	});
}

function getAvatar(req, res, next){
	let responsePlace = utils.APIInfo(req);

	// Update user info
	User.findByUserName(req.params[C.REPO_REST_API_ACCOUNT]).then(user => {


		if(!user.getAvatar()){
			return Promise.reject({resCode: responseCodes.USER_DOES_NOT_HAVE_AVATAR });
		}

		return Promise.resolve(user.getAvatar());

	}).then(avatar => {

		res.write(avatar.data.buffer);
		res.end();

	}).catch(() => {

		responseCodes.respond(responsePlace, req, res, next, err.resCode || utils.mongoErrorToResCode(err), err.resCode ? {} : err);
	});
}

function uploadAvatar(req, res, next){
	let responsePlace = utils.APIInfo(req);



	//check space and format
	function fileFilter(req, file, cb){

		let acceptedFormat = ["png", "jpg", "gif"];

		let format = file.originalname.split(".");
		format = format.length <= 1 ? "" : format.splice(-1)[0];

		let size = parseInt(req.headers["content-length"]);

		if(acceptedFormat.indexOf(format.toLowerCase()) === -1){
			return cb({resCode: responseCodes.FILE_FORMAT_NOT_SUPPORTED });
		}

		if(size > config.avatarSizeLimit){
			return cb({ resCode: responseCodes.AVATAR_SIZE_LIMIT });
		}

		return cb(null, true);
	}

	let upload = multer({
		storage: multer.memoryStorage(),
		fileFilter: fileFilter
	});

	upload.single("file")(req, res, function (err) {
		if (err) {
			return responseCodes.respond(responsePlace, req, res, next, err.resCode ? err.resCode : err , err.resCode ?  err.resCode : err);
		} else {
			User.findByUserName(req.params[C.REPO_REST_API_ACCOUNT]).then(user => {
				user.customData.avatar = { data: req.file.buffer};
				return user.save();
			}).then(() => {
				responseCodes.respond(responsePlace, req, res, next, responseCodes.OK, { status: "success" });
			}).catch(err => {
				responseCodes.respond(responsePlace, req, res, next, err.resCode ? err.resCode: err, err.resCode ? err.resCode: err);
			});
		}
	});
}

function resetPassword(req, res, next){
	let responsePlace = utils.APIInfo(req);

	User.updatePassword(req[C.REQ_REPO].logger, req.params[C.REPO_REST_API_ACCOUNT], null, req.body.token, req.body.newPassword).then(() => {
		responseCodes.respond(responsePlace, req, res, next, responseCodes.OK, { account: req.params[C.REPO_REST_API_ACCOUNT] });
	}).catch(err => {
		responseCodes.respond(responsePlace, req, res, next, err.resCode ? err.resCode: err, err.resCode ? err.resCode: err);
	});
}

function listUserInfo(req, res, next){

	let responsePlace = utils.APIInfo(req);
	let user;

	User.findByUserName(req.params.account).then(_user => {

		if(!_user){
			return Promise.reject({resCode: responseCodes.USER_NOT_FOUND});
		}

		user = _user;
		return user.listAccounts();

	}).then(databases => {

		let customData = user.customData.toObject();

		responseCodes.respond(responsePlace, req, res, next, responseCodes.OK, {
			accounts: databases,
			firstName: customData.firstName,
			lastName: customData.lastName,
			email: customData.email,
			billingInfo: customData.billing.billingInfo,
			hasAvatar: customData.avatar ? true : false,
		});

	}).catch(err => {
		responseCodes.respond(responsePlace, req, res, next, err.resCode || err, err.resCode ? {} : err);
	});
}

function listInfo(req, res, next){

	let responsePlace = utils.APIInfo(req);

	if(req.session.user.username !== req.params.account){

		let getType;

		if(C.REPO_BLACKLIST_USERNAME.indexOf(req.params.account) !== -1){
			getType = Promise.resolve("blacklisted");
		} else {
			getType = User.findByUserName(req.params.account).then(_user => {
				if(!_user){
					return "";
				} else if(!_user.customData.email){
					return "database";
				} else {
					return "user";
				}
			});
		}


		getType.then(type => {
			responseCodes.respond(responsePlace, req, res, next, responseCodes.OK, {type});
		});

	} else {
		listUserInfo(req, res, next);
	}
}

function contact(req, res, next){

	let responsePlace = utils.APIInfo(req);

	Mailer.sendContactEmail({
		email: req.body.email,
		name: req.body.name,
		information: req.body.information
	}).then(() => {
		responseCodes.respond(responsePlace, req, res, next, responseCodes.OK, { status: "success"});
	}).catch(err => {
		responseCodes.respond(responsePlace, req, res, next, err.resCode || err, err.resCode ? {} : err);
	});

}

function printVersion(req, res, next){
	let responsePlace = utils.APIInfo(req);
	const versionInfo = require("../VERSION");
	responseCodes.respond(responsePlace, req, res, next, responseCodes.OK, versionInfo);
}

module.exports = router;
