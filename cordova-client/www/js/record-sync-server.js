var SERVER_ID_LENGTH = 13;
var sqlQuerySpecialForRelation = " and length(idFrom) = " + SERVER_ID_LENGTH
		+ " and length(idTo) = " + SERVER_ID_LENGTH + " ";

// todo need move into function
var needSyncCount = 0;
var currentServerId = "";
// end above

var syncServer = function() {
	console.log("mSyncStatus:" + mSyncStatus + " "
			+ ((new Date()).valueOf() - mLastSyncTime));
	if (mSyncStatus == 'stop'
			|| ((new Date()).valueOf() - mLastSyncTime > mSyncTimeout)) {
		console.log("begin sync");
		mSyncStatus = 'work';
		mLastSyncTime = (new Date()).valueOf();
		procServerIdFromServer("local_contents");
		// procServerIdFromServer("local_relations");
	}
}
function syncLocalToServer(tableName) {
	mLocalDbProcess = "syncLocalToServer:" + tableName
	db.transaction(dbLastSyncTime(tableName), errorCB);
}

function dbLastSyncTime(tableName) {
	return function(tx) {
		mLocalDbProcess = "dbLastSyncTime";
		tx.executeSql("Select serverUpdateTime from " + tableName
				+ " where userId=? order by serverUpdateTime desc limit 1 ;",
				[ mLocalParameters['userId'] ], handlerLastSyncTime(tableName),
				errorCB);
	}

}
function handlerLastSyncTime(tableName) {
	return function(tx, results) {
		if (results.rows.length > 0) {
			if (results.rows.item(0).serverUpdateTime > 0) {
				withInputGetNeedSyncRows(results.rows.item(0).serverUpdateTime,
						tableName);
			} else {
				withInputGetNeedSyncRows(0, tableName);
			}
		} else {
			withInputGetNeedSyncRows(0, tableName);
		}
	}
}
function withInputGetNeedSyncRows(lastServerTime, tableName) {
	db.transaction(withInputDbGetNeedSyncRecords(lastServerTime, tableName),
			errorCB);
}

function withInputDbGetNeedSyncRecords(lastServerTime, tableName) {
	return function(tx) {
		mLocalDbProcess = "dbGetNeedSyncRecords";
		switch (tableName) {
		case "local_contents":
			tx
					.executeSql(
							"Select serverId,content,contentType,state,"
									+ " serverUpdateTime "
									+ " from local_contents where userId=? "
									+ "and serverId>0 and modifyStatus = 1 order by clientId limit ? ;",
							[ mLocalParameters['userId'],
									LIMIT_UPDATE_BATCH_SIZE ],
							withInputHandlerSyncDataToServer(lastServerTime,
									tableName), errorCB);
			break;
		case "local_relations":
			tx
					.executeSql(
							"Select serverId,idFrom,idTo,state,"
									+ " serverUpdateTime "
									+ " from local_relations where userId=? "
									+ sqlQuerySpecialForRelation
									+ "and serverId>0 and modifyStatus = 1 order by clientId limit ? ;",
							[ mLocalParameters['userId'],
									LIMIT_UPDATE_BATCH_SIZE ],
							withInputHandlerSyncDataToServer(lastServerTime,
									tableName), errorCB);
			break;
		}
	}
}

function withInputHandlerSyncDataToServer(lastServerTime, tableName) {
	return function(tx, results) {
		var data = {
			dataRows : [],
			lastSyncServerTimeFromClient : lastServerTime,
		}
		var syncData = {
			data : data,
			clientParameters : mLocalParameters,
			tableName : tableName
		};
		for (var i = 0; i < results.rows.length; i++) {
			var row = {};
			switch (tableName) {
			case "local_contents":
				row.serverId = results.rows.item(i).serverId;
				row.content = results.rows.item(i).content;
				row.contentType = results.rows.item(i).contentType;
				row.state = results.rows.item(i).state;
				row.serverUpdateTime = results.rows.item(i).serverUpdateTime;
				break;
			case "local_relations":
				row.serverId = results.rows.item(i).serverId;
				row.idFrom = results.rows.item(i).idFrom;
				row.idTo = results.rows.item(i).idTo;
				row.state = results.rows.item(i).state;
				row.serverUpdateTime = results.rows.item(i).serverUpdateTime;
				break;
			}
			data.dataRows.push(row);
		}
		syncRecordAjax(mServerUrl, receiveSyncRecordRspAjax,
				ajaxGetNotSuccessMsg, ajaxNetworkError, syncData, tableName);
	}
}

function syncRecordAjax(serverUrl, successAjaxProc, errorRsp, ajaxNetworkError,
		syncData, tableName) {
	$.ajax({
		type : "post",
		url : serverUrl + "sync-record.jsp",
		async : false,
		data : JSON.stringify(syncData),
		dataType : "json",
		success : function(msg) {
			if (msg.status == "success") {
				successAjaxProc(msg, tableName);
			} else {
				errorRsp(msg);
			}
		},
		error : ajaxNetworkError
	});
}

function procServerIdFromServer(tableName) {
	mLocalDbProcess = "procServerIdFromServer:" + tableName;
	db.transaction(dbGetCountNeedServerId(tableName), errorCB);
}

function dbGetCountNeedServerId(tableName) {
	return function(tx) {
		// todo relation only upload with server Id
		var sqlCountNeedServerIdBase = "SELECT count(clientId) as total from "
				+ tableName + " where userId=? and serverId is null  ";
		switch (tableName) {
		case "local_relations":
			console.log("sync relations dbGetCountNeedServerId");
			tx.executeSql(
					sqlCountNeedServerIdBase + sqlQuerySpecialForRelation,
					[ mLocalParameters['userId'] ],
					handlerGetCountNeedServerId(tableName), errorCB);
			break;
		case "local_contents":
			tx.executeSql(sqlCountNeedServerIdBase,
					[ mLocalParameters['userId'] ],
					handlerGetCountNeedServerId(tableName), errorCB);
			break;
		}

	}
}

function handlerGetCountNeedServerId(tableName) {
	return function(tx, results) {
		if (results.rows.length > 0) {
			if (results.rows.item(0).total > 0) {
				if (results.rows.item(0).total > LIMIT_UPDATE_BATCH_SIZE) {
					needSyncCount = LIMIT_UPDATE_BATCH_SIZE;
				} else {
					needSyncCount = results.rows.item(0).total;
				}
				getServerIdAjax(mServerUrl, receiveGetServerIdAjax,
						ajaxGetNotSuccessMsg, ajaxNetworkError, needSyncCount,
						tableName);
			} else {
				// todo no result ;
				console
						.log("handlerGetCountNeedServerId:no record need get serverId ."
								+ tableName);
				syncLocalToServer(tableName);
			}
		} else {
			// todo no result ;
			console.log("error ! handlerGetCountNeedServerId");
		}
	}

}
function receiveSyncRecordRspAjax(msg, tableName) {
	if (msg.data.length > 0) {
		for (var i = 0; i < msg.data.length; i++) {
			if (msg.data[i].serverId != null && msg.data[i].serverId != '') {
				db.transaction(dbProcReceivedRow(msg.data[i], tableName),
						errorCB);
			}
		}
	}
	if (tableName == "local_contents") {
		setTimeout(function() {
			procServerIdFromServer("local_relations");
		}, 5000);
	} else {
		mSyncStatus = 'stop';
	}
}

function dbProcReceivedRow(row, tableName) {
	return function(tx) {
		mLocalDbProcess = "dbProcReceivedRow";
		switch (tableName) {
		case "local_relations":
			tx.executeSql("SELECT 1 from " + tableName
					+ " where serverId=? and userId=? ;", [ row.serverId,
					mLocalParameters['userId'] ],
					updateOrInsertReceivedRelation(row), errorCB);
			break;
		case "local_contents":
			tx.executeSql("SELECT 1 from " + tableName
					+ " where serverId=? and userId=? ;", [ row.serverId,
					mLocalParameters['userId'] ],
					updateOrInsertReceivedContent(row), errorCB);
			break;
		}
	}
}
function updateOrInsertReceivedContent(row) {
	return function(tx, results) {
		if (results.rows.length > 0) {
			tx
					.executeSql(
							"update local_contents set content = ?,contentType=?  ,"
									+ "state=? ,serverUpdateTime=?,modifyStatus=0 where serverId=?; ",
							[ row.content, row.contentType, row.state,
									row.serverUpdateTime, row.serverId ]);
		} else {
			tx
					.executeSql(
							"insert into local_contents (userId,content,contentType,state,"
									+ "serverUpdateTime,modifyStatus,serverId,lastLocalTime) values (?,?,?,?,?,0,?,?); ",
							[ mLocalParameters['userId'], row.content,
									row.contentType, row.state,
									row.serverUpdateTime, row.serverId,
									(new Date()).valueOf() ]);
		}
	}
}

function updateOrInsertReceivedRelation(row) {
	return function(tx, results) {
		if (results.rows.length > 0) {
			tx
					.executeSql(
							"update local_relations set idFrom = ?,idTo=?  ,"
									+ "state=? ,serverUpdateTime=?,modifyStatus=0 where serverId=?; ",
							[ row.idFrom, row.idTo, row.state,
									row.serverUpdateTime, row.serverId ]);
		} else {
			tx
					.executeSql(
							"insert into local_relations (userId,idFrom,idTo,state,"
									+ "serverUpdateTime,modifyStatus,serverId) values (?,?,?,?,?,0,?); ",
							[ mLocalParameters['userId'], row.idFrom, row.idTo,
									row.state, row.serverUpdateTime,
									row.serverId ]);

		}
	}
}

function receiveGetServerIdAjax(msg, count, tableName) {
	// currentServerId = bigInt(msg.data);
	currentServerId = msg.data;
	needSyncCount = count;
	if (currentServerId.length == SERVER_ID_LENGTH) {
		db.transaction(dbProcRowNeedServerId(tableName), errorCB);
	}
}

function dbProcRowNeedServerId(tableName) {
	return function(tx) {
		switch (tableName) {
		case "local_contents":
			tx
					.executeSql(
							"SELECT clientId from "
									+ tableName
									+ " where userId=? and serverId is null order by clientId limit ? ;",
							[ mLocalParameters['userId'], needSyncCount ],
							handlerUpdateClientServerId(tableName), errorCB);
			break;
		case "local_relations":
			tx.executeSql("SELECT clientId from " + tableName
					+ " where userId=? and serverId is null "
					+ " order by clientId limit ? ;", [
					mLocalParameters['userId'], needSyncCount ],
					handlerUpdateClientServerId(tableName), errorCB);
			break;
		}

	}
}
function handlerUpdateClientServerId(tableName) {
	return function(tx, results) {
		if (results.rows.length > 0) {
			db.transaction(updateLocalServerId(results, currentServerId,
					tableName), errorCB)
		} else {
			// todo no result ;
			console.log("handlerUpdateClientServerId: no rows .");
		}
	}
}
function updateLocalServerId(resultOfClientID, serverId, tableName) {
	return function(tx) {
		for (var i = 0; i < resultOfClientID.rows.length; i++) {
			if (tableName == "local_contents") {
				tx.executeSql("update " + tableName
						+ " set serverId=? where clientId = ?; ", [ serverId,
						resultOfClientID.rows.item(i).clientId ],
						dbGetLastUpdateRelationServerId(serverId.toString(),
								resultOfClientID.rows.item(i).clientId));
			} else {
				tx.executeSql("update " + tableName
						+ " set serverId=? where clientId = ?; ", [
						serverId.toString(),
						resultOfClientID.rows.item(i).clientId ]);
			}
			// serverId = serverId.add(1);
			serverId = hexAddOne(serverId);
		}
		syncLocalToServer(tableName);
	}
}

// todo : need change to relation
function dbGetLastUpdateRelationServerId(serverId, clientId) {
	return function(tx, results) {
		tx
				.executeSql(
						'update local_relations set idFrom=?,modifyStatus=1 where idFrom=?',
						[ serverId, clientId ]);
		tx
				.executeSql(
						'update local_relations set idTo=?,modifyStatus=1 where idTo=?',
						[ serverId, clientId ]);
	}
}

function getServerIdAjax(serverUrl, successGetServerIdAjaxProc, errorRsp,
		ajaxNetworkError, needCount, tableName) {
	var oriData = {
		amount : needCount,
		keyTitle : tableName
	};
	$.ajax({
		type : "post",
		url : serverUrl + "get-server-id.jsp",
		async : false,
		data : JSON.stringify(oriData),
		dataType : "json",
		success : function(msg) {
			if (msg.status == "success") {
				successGetServerIdAjaxProc(msg, needCount, tableName);
			} else {
				errorRsp(msg);
			}
		},
		error : ajaxNetworkError
	});
}
