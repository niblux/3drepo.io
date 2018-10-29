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
module.exports.createApp = function (server, serverConfig) {

	// let app = require('express');
	// var server = require('http').Server(app);

	const config = require("../config");
	const session = require("./session").session(config);

	const logger = require("../logger.js");
	const middlewares = require("../middlewares/middlewares");
	const systemLogger = logger.systemLogger;

	// console.log(serverConfig);
	const io = require("socket.io")(server, { path: "/" + serverConfig.subdirectory });
	const sharedSession = require("express-socket.io-session");
	const _ = require("lodash");

	io.use((socket, next) => {
		if(socket.handshake.query["connect.sid"] && !socket.handshake.headers.cookie) {
			socket.handshake.headers.cookie = "connect.sid=" + socket.handshake.query["connect.sid"] + "; ";
		}
		// console.log(socket.handshake.headers.cookie);

		next();
	});

	io.use(sharedSession(session, { autoSave: true }));

	io.use((socket, next) => {
		// init the singleton db connection
		const DB = require("../handler/db");
		DB.getDB("admin").then(() => {
			// set db to singleton modelFactory class
			require("../models/factory/modelFactory").setDB(DB);
			next();
		}).catch(err => {
			systemLogger.logError("Chat server - DB init error - " + err.message);
		});
	});

	if(!config.cn_queue) {
		return;
	}

	middlewares.createQueueInstance().then(queue => {

		initiateSocket(queue);

	}).catch(err => {
		systemLogger.logError("Chat server - Queue init error - " + err.message);
	});

	const userToSocket = {};
	const credentialErrorEventName = "credentialError";
	const joinedEventName = "joined";

	function initiateSocket(queue) {

		// consume event queue and fire msg to clients if they have subscribed related event
		queue.consumeEventMessage(msg => {

			if(msg.event && msg.account) {
				// it is to avoid emitter getting its own message
				const emitter = userToSocket[msg.emitter] && userToSocket[msg.emitter].broadcast || io;

				const modelNameSpace = msg.model ?  `::${msg.model}` : "";
				let extraPrefix = "";

				if(Array.isArray(msg.extraKeys) && msg.extraKeys.length > 0) {
					msg.extraKeys.forEach(key => {
						extraPrefix += `::${key}`;
					});
				}

				const eventName = `${msg.account}${modelNameSpace}${extraPrefix}::${msg.event}`;
				emitter.to(`${msg.account}${modelNameSpace}`).emit(eventName, msg.data);
			}
		});

		// on client connect
		io.on("connection", socket => {
			// socket error handler, frontend will attempt to reconnect
			socket.on("error", err => {
				systemLogger.logError("Chat server - socket error - " + err.message);
				systemLogger.logError(err.stack);
			});

			if(!_.get(socket, "handshake.session.user")) {

				systemLogger.logError("socket connection without credential");
				socket.emit(credentialErrorEventName, { message: "Connection without credential"});
				// console.log(socket.handshake);

				return;
			}

			const username = socket.handshake.session.user.username;
			const sessionId =  socket.handshake.session.id;
			// console.log('socket id', socket.client.id);
			userToSocket[socket.client.id] = socket;

			systemLogger.logInfo(`${username} - ${sessionId} - ${socket.client.id} is in chat`, { username });

			socket.on("join", data => {
				// check permission if the user have permission to join room
				const auth = data.model ? middlewares.hasReadAccessToModelHelper : middlewares.isAccountAdminHelper;

				auth(username, data.account, data.model).then(hasAccess => {

					const modelNameSpace = data.model ?  `::${data.model}` : "";

					if(hasAccess) {

						socket.join(`${data.account}${modelNameSpace}`);
						socket.emit(joinedEventName, { account: data.account, model: data.model});

						// systemLogger.logInfo(`${username} - ${sessionId} - ${socket.client.id} has joined room ${data.account}${modelNameSpace}`, {
						// 	username,
						// 	account: data.account,
						// 	model: data.model
						// });

					} else {
						socket.emit(credentialErrorEventName, { message: `You have no access to join room ${data.account}${modelNameSpace}`});
						systemLogger.logError(`${username} - ${sessionId} - ${socket.client.id} has no access to join room ${data.account}${modelNameSpace}`, {
							username,
							account: data.account,
							model: data.model
						});
					}
				});

			});

			socket.on("leave", data => {

				const modelNameSpace = data.model ?  `::${data.model}` : "";

				socket.leave(`${data.account}${modelNameSpace}`);
				systemLogger.logInfo(`${username} - ${sessionId} - ${socket.client.id} has left room ${data.account}${modelNameSpace}`, {
					username,
					account: data.account,
					model: data.model
				});
			});

		});

	}

	// return app;
};
