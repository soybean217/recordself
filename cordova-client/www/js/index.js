function formInitial() {
	$("#formSignUp").validate({
		rules : {
			signUpUserName : {
				required : true,
				minlength : 1,
				maxlength : 31
			},
			signUpPassword : {
				required : true,
				minlength : 1,
				maxlength : 31
			},
			signUpConfirmPassword : {
				required : true,
				minlength : 1,
				maxlength : 31,
				equalTo : "#signUpPassword"
			}
		}
	});
	$("#formSignUp").submit(function(e) {
		e.preventDefault();
		if ($("#formSignUp").valid()) {
			signUpAjax(mServerUrl);
		}
	});
	$("#formSignIn").validate({
		rules : {
			signInUserName : {
				required : true,
				minlength : 1,
				maxlength : 31
			},
			signInPassword : {
				required : true,
				minlength : 1,
				maxlength : 31
			}
		}
	});
	$("#formSignIn").submit(function(e) {
		e.preventDefault();
		if ($("#formSignIn").valid()) {
			signInAjax(mServerUrl);
		}
	});

	$("#formRecord").validate({
		rules : {
			recordEditDetail : {
				required : true
			}
		}
	});
	$("#formRecord").submit(
			function(e) {
				e.preventDefault();
				if ($("#formRecord").valid()) {
					db.transaction(insertOrUpdateRecord($("#selectCatalog")
							.val()), errorCB);
				}
			});
	$("#formCatalog").validate({
		rules : {
			catalogEditContent : {
				required : true,
				minlength : 1,
				maxlength : 1000
			}
		}
	});
	$("#formCatalog").submit(function(e) {
		e.preventDefault();
		if ($("#formCatalog").valid()) {
			catalogInfo = {
				title : $("#catalogEditContent").val(),
				id : $("#catalogEditId").val()
			};
			editCatalogProcess(catalogInfo);
			// signInAjax(mServerUrl);
		}
	});
}

function setupRecordListFromDb() {
	mRecordTable = $('#tableRecord').DataTable({
		"data" : mRecordDataSet,
		"paging" : false,
		"ordering" : false,
		"info" : false,
		"searching" : false,
		"order" : [ [ 0, "desc" ] ],
		"columns" : [ {
			"title" : "Id"
		}, {
			"title" : globalization_detail
		}, {
			"title" : globalization_detail
		}, {
			"title" : globalization_begin_time
		}, {
			"title" : globalization_end_time
		}, {
			"title" : "titleId"
		} ],
		"columnDefs" : [ {
			"targets" : [ 0 ],
			"visible" : false,
			"searchable" : false
		}, {
			"targets" : [ 2 ],
			"visible" : false,
		}, {
			"targets" : [ 4 ],
			"visible" : false,
		}, {
			"targets" : [ 5 ],
			"visible" : false,
		} ]
	});
	$('#tableRecord tbody').on('click', 'tr', function() {
		divRecordFormFill(mRecordTable.row(this).data());
		location.hash = 'divRecord';
	});
	$("#recordEditDelete").click(function() {
		deleteRecordWithId();
	})
}
function setupCatalogListFromDb() {
	mTitleTable = $('#tableCatalog').DataTable({
		"data" : mTitleDataSet,
		"paging" : false,
		"ordering" : false,
		"info" : false,
		"searching" : false,
		"order" : [ [ 2, "desc" ] ],
		"columns" : [ {
			"title" : "Id"
		}, {
			"title" : globalization_catalog
		}, {
			"title" : globalization_last_update
		}, {
			"title" : "serverId"
		} ],
		"columnDefs" : [ {
			"targets" : [ 0 ],
			"visible" : false,
			"searchable" : false
		}, {
			"targets" : [ 3 ],
			"visible" : false,
			"searchable" : false
		} ]
	});
	$('#tableCatalog tbody').on(
			'click',
			'tr',
			function() {
				alert(mTitleTable.row(this).data()[0] + ""
						+ mTitleTable.row(this).data()[3]);
				showViewRecord(mTitleTable.row(this).data())
			});
}

function editCatalogProcess(info) {
	if (info != null) {
		if (info.id > 0) {
			// update
			mLocalDbProcess = "updateCatalog";
		} else {
			// insert
			mLocalDbProcess = "insertCatalog";
			db.transaction(dbInsertCatalog(info), errorCB);
		}
	}
}

function insertOrUpdateRecord(titleClientId) {
	return function(tx) {
		tx.executeSql('select serverId from local_contents where clientId=?',
				[ titleClientId ], getTitleServerIdByClientIdTxCb);
	}
}

function getTitleServerIdByClientIdTxCb(tx, results) {
	if (results.rows.length > 0) {
		editRecord = {
			detail : $("#recordEditDetail").val(),
			beginTimeInputString : $("#recordEditBeginTime").val(),
			endTimeInputString : $("#recordEditEndTime").val(),
			clientId : $("#recordEditId").val(),
			titleClientId : $("#selectCatalog").val(),
			titleServerId : results.rows.item(0).serverId
		};
		editRecordProcess(editRecord);
	}
}

function dbInsertCatalog(info) {
	return function(tx) {
		tx.executeSql(
				"insert into local_contents (userId,content,lastLocalTime,contentType"
						+ " ) values (?,?,?,'SchemaCatalog')", [
						mLocalParameters['userId'], info.title,
						(new Date()).valueOf() ], queryCatalogAndDisplay());
	}
}

function editRecordProcess(editRecord) {
	if (editRecord != null) {
		if (editRecord.clientId > 0) {
			// update
			mLocalDbProcess = "updateRecord";
			db.transaction(dbUpdateSingleRecord(editRecord), errorCB);
		} else {
			// insert
			mLocalDbProcess = "insertRecord";
			db.transaction(dbInsertSingleRecord(editRecord), errorCB);
		}
	}
}

function initialDB() {
	mLocalDbProcess = "Initial DB";
	db.transaction(populateDB, errorCB, successCB);
}
/**
 * create table
 */
function populateDB(tx) {
	// tx.executeSql('DROP TABLE IF EXISTS local_system_parameters');
	tx
			.executeSql('CREATE TABLE IF NOT EXISTS local_system_parameters (title text primary key, detail text)');
	tx.executeSql('DROP TABLE IF EXISTS local_records');
	tx.executeSql('CREATE TABLE IF NOT EXISTS local_records ('
			+ 'clientId integer primary key,' + 'userId text,'
			+ 'serverId text UNIQUE,' + 'title text not null,detail text,'
			+ 'beginTime integer default 0,' + 'endTime integer default 0,'
			+ 'state integer default 0,'
			+ 'serverUpdateTime integer default 0,'
			+ 'modifyStatus integer default 1 ,' + 'titleClientId integer ,'
			+ 'titleServerId text )');
	// tx.executeSql('DROP TABLE IF EXISTS local_contents');
	tx.executeSql('CREATE TABLE IF NOT EXISTS local_contents ('
			+ 'clientId integer primary key,' + 'userId text,'
			+ 'serverId text UNIQUE,' + 'content text not null,'
			+ 'contentType text not null,' + 'lastLocalTime integer default 0,'
			+ 'state integer default 0,'
			+ 'serverUpdateTime integer default 0,'
			+ 'modifyStatus integer default 1 )');
	// tx.executeSql('DROP TABLE IF EXISTS local_relations');
	tx.executeSql('CREATE TABLE IF NOT EXISTS local_relations ('
			+ 'clientId integer primary key,' + 'userId text,'
			+ 'serverId text UNIQUE,' + 'idFrom text not null,'
			+ 'idTo text not null,' + 'state integer default 0,'
			+ 'serverUpdateTime integer default 0,'
			+ 'modifyStatus integer default 1 )');
	checkParametersForInitial(tx);
}
function checkParametersForInitial(tx) {
	mLocalDbProcess = "Get initial parameter";
	tx.executeSql("SELECT title,detail from local_system_parameters ;", [],
			callbackInitialParameters, errorCB);
}
// Display the results
function callbackInitialParameters(tx, results) {
	var len = results.rows.length;
	if (len == 0) {
		// enter register or local use
		divControl("#divSignUp");
	} else {
		for (var i = 0; i < len; i++) { // loop as many times as there are row
			// results
			mLocalParameters[results.rows.item(i).title] = results.rows.item(i).detail;
		}
		// list record
		databaseStatus = "exist";
		// divRecordFormNew();
		// queryRecordAndDisplay();
		queryCatalogAndDisplay();
	}
}
function divControl() {
	var i = 0, numargs = arguments.length;
	// close all div
	var argArray = arguments;
	divArray.forEach(function(elem, index, arr) {
		elem.hide();
		// you can optimize here from last index, if arguments is sorted .
		for (i = 0; i < numargs; i++) {
			// if (elem.selector == arguments[i].selector) {
			if (elem.selector == argArray[i]) {
				elem.show();
				break;
			}
		}
	});
}
function divRecordFormNew() {
	$("#recordEditButtonGroup").hide();
	$("#recordEditTimePicker").hide();
	$("#recordEditAddNew").show();
	$("#recordEditId").val(null);
	$("#recordEditDetail").val(null);
	$(".form_datetime").datetimepicker({
		format : 'yyyy-mm-dd hh:ii',
		autoclose : 1,
		initialDate : new Date()
	});
}
function queryRecordAndDisplay(catalogInfoArray) {
	divControl("#divMenu", "#divRecord", "#divDisplayRecordList",
			"#divMenuAfterSignIn");
	mLocalDbProcess = "queryRecordAndDisplay";
	db.transaction(dbQueryRecord(catalogInfoArray), errorCB);
}
function queryCatalogAndDisplay() {
	divControl("#divMenu", "#divCatalogForm", "#divCatalogList",
			"#divMenuAfterSignIn");
	mLocalDbProcess = "queryCatalogAndDisplay";
	db.transaction(dbQueryCatalog, errorCB);
}
function dbQueryRecord(catalogInfoArray) {
	return function(tx) {
		if (catalogInfoArray != null && catalogInfoArray[0] > 0) {
			console.log("3:" + catalogInfoArray[0] + " " + catalogInfoArray[3]);
			if (catalogInfoArray[3] > 0) {
				console.log("31:" + catalogInfoArray[0] + " "
						+ catalogInfoArray[3]);
				tx
						.executeSql(
								"SELECT r.idFrom AS clientId,c.serverId AS serverId,c.content AS title,'detail' AS detail,"
										+ " c.serverUpdateTime AS serverUpdateTime,c.modifyStatus AS modifyStatus,"
										+ " c.lastLocalTime as lastLocalTime,1 as endTime,1 as titleClientId,r.idFrom,r.idTo "
										+ " FROM `local_contents` as c , `local_relations` as r "
										+ " WHERE r.idFrom IN (SELECT clientId FROM local_contents "
										+ " WHERE state<>-1 and contentType='SchemaRecord' and userId= ? "
										+ "  ) "
										+ " AND r.idTo = c.clientId AND c.contentType='MetadataRecordContent'"
										+ " and (r.idFrom IN (SELECT idTo FROM `local_relations` WHERE idFrom = ?) "
										+ "  OR r.idFrom IN (SELECT idTo FROM `local_relations` WHERE idFrom = ?) ) "
										+ " ORDER BY c.serverUpdateTime IS NULL DESC,c.serverUpdateTime DESC,c.clientId DESC"
										+ " limit 0,20;", [
										mLocalParameters['userId'],
										catalogInfoArray[0],
										catalogInfoArray[3] ],
								refreshRecordListView, errorCB);
			} else {
				console.log("32:" + catalogInfoArray[0] + " "
						+ catalogInfoArray[3] + ":"
						+ mLocalParameters['userId']);
				tx
						.executeSql(
								"SELECT r.idFrom AS clientId,c.serverId AS serverId,c.content AS title,'detail' AS detail,"
										+ " c.serverUpdateTime AS serverUpdateTime,c.modifyStatus AS modifyStatus,"
										+ " c.lastLocalTime as lastLocalTime,1 as endTime,1 as titleClientId,r.idFrom,r.idTo "
										+ " FROM `local_contents` as c , `local_relations` as r "
										+ " WHERE r.idFrom IN (SELECT clientId FROM local_contents "
										+ " WHERE state<>-1 and contentType='SchemaRecord' and userId= ? "
										+ "  ) "
										+ " AND r.idTo = c.clientId AND c.contentType='MetadataRecordContent' "
										+ " and ( r.idFrom IN (SELECT idTo FROM `local_relations` WHERE idFrom = ?) "
										+ "   ) "
										+ " ORDER BY c.serverUpdateTime IS NULL DESC,c.serverUpdateTime DESC,c.clientId DESC"
										+ " limit 0,20;", [
										mLocalParameters['userId'],
										catalogInfoArray[0] ],
								refreshRecordListView, errorCB);
			}
		} else {
			console.log("2:" + mLocalParameters['userId']);
			// tx.executeSql("SELECT * " + " FROM `local_contents` as c ", [],
			// refreshRecordListView, errorCB);
			tx
					.executeSql(
							"SELECT r.idFrom AS clientId,c.serverId AS serverId,c.content AS title,'detail' AS detail,"
									+ " c.serverUpdateTime AS serverUpdateTime,c.modifyStatus AS modifyStatus,"
									+ " c.lastLocalTime as lastLocalTime,1 as endTime,1 as titleClientId,r.idFrom,r.idTo "
									+ " FROM `local_contents` as c , `local_relations` as r "
									+ " WHERE r.idFrom IN (SELECT clientId FROM local_contents "
									+ " WHERE state<>-1 and contentType='SchemaRecord' and userId= ? ) "
									+ " AND r.idTo = c.clientId AND c.contentType='MetadataRecordContent' "
									+ " ORDER BY c.serverUpdateTime IS NULL DESC,c.serverUpdateTime DESC,c.clientId DESC"
									+ " limit 0,20;",
							[ mLocalParameters['userId'] ],
							refreshRecordListView, errorCB);
		}
	}
}
// Display the results
function refreshRecordListView(tx, results) {
	var mRow = [];
	mRecordDataSet = [];
	var len = results.rows.length;
	console.log("results.rows.length: " + results.rows.length);
	console.log("tx: " + tx);
	for (var i = 0; i < len; i++) { // loop as many times as there are row
		console.log(results.rows.item(i));
		var mRow = [
				results.rows.item(i).clientId,
				results.rows.item(i).title,
				results.rows.item(i).detail,
				new Date(results.rows.item(i).lastLocalTime)
						.Format("yyyy-MM-dd hh:mm"),
				results.rows.item(i).endTime == 0 ? "" : (new Date(results.rows
						.item(i).endTime).Format("yyyy-MM-dd hh:mm")),
				results.rows.item(i).titleClientId ];
		mRecordDataSet[i] = mRow;
	}

	mRecordTable.clear();
	mRecordTable.rows.add(mRecordDataSet);
	mRecordTable.draw();

	// var syncThread = new syncServer();
}
function dbQueryCatalog(tx) {
	tx
			.executeSql(
					"SELECT clientId,serverId,content,lastLocalTime "
							+ " from local_contents where userId=? and contentType='SchemaCatalog' "
							+ " order by lastLocalTime desc ;",
					[ mLocalParameters['userId'] ], refreshTitleListView,
					errorCB);
}
// Display the title
function refreshTitleListView(tx, results) {
	var mRow = [];
	mTitleDataSet = [];
	var len = results.rows.length;
	$('#selectCatalog').find('option').remove()
	// alert("results.rows.length: " + results.rows.length);
	for (var i = 0; i < len; i++) { // loop as many times as there are row
		var mRow = [
				results.rows.item(i).clientId,
				results.rows.item(i).content,
				new Date(results.rows.item(i).lastLocalTime)
						.Format("yyyy-MM-dd hh:mm"),
				results.rows.item(i).serverId ];
		mTitleDataSet[i] = mRow;
		$("#selectCatalog").append(
				"<option value='" + results.rows.item(i).clientId + "'>"
						+ results.rows.item(i).content + "</option>");
	}

	mTitleTable.clear();
	mTitleTable.rows.add(mTitleDataSet);
	mTitleTable.draw();

	// var syncThread = new syncServer();
	// var syncThread = new syncRecordServer();
}
function convertDateStringToLong(inputString) {
	if (isNaN((new Date(inputString)).valueOf())) {
		return (new Date()).valueOf();
	} else {
		return (new Date(inputString).valueOf());
	}
}

// update record to local
function dbUpdateSingleRecord(editRecord) {
	return function(tx) {
		var recordBeginTimeLong = convertDateStringToLong(editRecord.beginTimeInputString);
		var recordEndTimeLong = convertDateStringToLong(editRecord.endTimeInputString);
		tx
				.executeSql(
						"update local_records set title = ? ,detail = ? ,beginTime = ? ,endTime=?"
								+ " ,modifyStatus=1,titleClientId=?,titleServerId=? where clientId=?; ",
						[ editRecord.title, editRecord.detail,
								recordBeginTimeLong, recordEndTimeLong,
								editRecord.titleClientId,
								editRecord.titleServerId, editRecord.clientId ]);
		console.log("need modify dbUpdateSingleRecord");
		showViewRecord();
	}
}
function showViewRecord(catalogInfoArray) {
	queryRecordAndDisplay(catalogInfoArray);
	$("#selectCatalog").val(catalogInfoArray[0]);
	divRecordFormNew();
}
/**
 * insert record to local
 */
function dbInsertSingleRecord(editRecord) {
	return function(tx) {
		var recordBeginTimeLong = convertDateStringToLong(editRecord.beginTimeInputString);
		// tx
		// .executeSql(
		// "insert into local_records
		// (userId,title,detail,beginTime,titleClientId,titleServerId) values
		// (?,?,?,?,?,?); ",
		// [ mLocalParameters['userId'], editRecord.title,
		// editRecord.detail, recordBeginTimeLong,
		// editRecord.titleClientId,
		// editRecord.titleServerId ]);
		tx.executeSql(
				"insert into local_contents (userId,content,lastLocalTime,contentType"
						+ " ) values (?,?,?,'SchemaRecord')", [
						mLocalParameters['userId'], editRecord.detail,
						(new Date()).valueOf() ],
				processRecordMetadata(editRecord));
		// showViewRecord(editRecord.titleClientId);
	}
}

function processRecordMetadata(editRecord) {
	return function(tx, results) {
		var recordBeginTimeLong = convertDateStringToLong(editRecord.beginTimeInputString);
		insertRecordMetadataTransaction(results.insertId,
				'MetadataRecordContent', editRecord.detail);
		insertRecordMetadataTransaction(results.insertId,
				'MetadataRecordBeginTime', recordBeginTimeLong);
		if (editRecord.titleServerId > 0) {
			db.transaction(insertRelation(editRecord.titleServerId,
					results.insertId), errorCB);
		} else {
			db.transaction(insertRelation(editRecord.titleClientId,
					results.insertId), errorCB);
		}
	}
}

function insertRecordMetadataTransaction(idFrom, metadataContentType,
		metaContent) {
	db.transaction(insertRecordMetadata(idFrom, metadataContentType,
			metaContent), errorCB);
}

function insertRecordMetadata(idFrom, metadataContentType, metaContent) {
	return function(tx) {
		tx.executeSql(
				"insert into local_contents (userId,content,lastLocalTime,contentType"
						+ " ) values (?,?,?,?)", [ mLocalParameters['userId'],
						metaContent, (new Date()).valueOf(),
						metadataContentType ], getLastIdForMetadata(idFrom));
	}
}

function getLastIdForMetadata(idFrom) {
	return function(tx, results) {
		db.transaction(insertRelation(idFrom, results.insertId), errorCB);
	}
}
function insertRelation(idFrom, idTo) {
	return function(tx) {
		tx.executeSql("insert into local_relations (userId,idFrom,idTo"
				+ " ) values (?,?,?)", [ mLocalParameters['userId'], idFrom,
				idTo ], alert(idTo + " " + idFrom));
	}
}

function clearLocalDataForSignOut() {
	db.transaction(dbClearLocalDataForSignOut, errorCB);
	databaseStatus = "empty";
	divControl("#divSignUp");
}

function dbClearLocalDataForSignOut(tx) {
	tx.executeSql('delete from local_system_parameters;');
}

// Transaction error callback
function errorCB(err) {
	alert("errorCB:" + err.code + " as:" + mLocalDbProcess);
	console.log("Error processing SQL: " + err.code + " : " + err.message
			+ " : " + mLocalDbProcess);
}
// Success callback
function successCB() {
}

function ajaxGetNotSuccessMsg(msg) {
	console.log("ajaxGetNotSuccessMsg:" + msg.status + "-" + msg.msg);
	alert("ajaxGetNotSuccessMsg:" + msg.status + "-" + msg.msg);
}

function ajaxNetworkError(XMLHttpRequest, textStatus, errorThrown) {
	// alert("ajaxNetworkError:" + XMLHttpRequest.status + "-" +
	// XMLHttpRequest.readyState + "-" + textStatus);
	console.log("ajaxNetworkError:" + XMLHttpRequest.status + "-"
			+ XMLHttpRequest.readyState + "-" + textStatus);
}
function deleteRecordWithId() {
	mLocalDbProcess = "deleteRecord";
	db.transaction(dbDeleteSingleRecord, errorCB);
}
function dbDeleteSingleRecord(tx) {
	tx
			.executeSql(
					"update local_records set state = -1 ,modifyStatus=1 where clientId = ?; ",
					[ $("#recordEditId").val() ]);
	showViewRecord();
}

function divRecordFormFill(row) {
	if (row == null) {
	} else {
		$("#recordEditDetail").val(row[2]);
		$("#recordEditId").val(row[0]);
		$("#recordEditBeginTime").val(row[3]);
		if (row[4] == "") {
			$("#recordEditEndTime").val(new Date().Format("yyyy-MM-dd hh:mm"));
		} else {
			$("#recordEditEndTime").val(row[4]);
		}
		$("#selectCatalog").val(row[5]);
		$("#recordEditBeginTime").show();
		$("#recordEditEndTime").show();
		$("#recordEditButtonGroup").show();
		$("#recordEditTimePicker").show();
		$("#recordEditAddNew").hide();
	}
}

function signInAjax(serverUrl) {
	var oriData = {
		userName : $("#signInUserName").val(),
		password : $("#signInPassword").val()
	};
	$.ajax({
		type : "post",
		url : serverUrl + "sign-in.jsp",
		async : false,
		data : JSON.stringify(oriData),
		dataType : "json",
		success : function(msg) {
			if (msg.status == "success") {
				if (databaseStatus == "empty") {
					signInOrUpSuccess(msg, $("#signInUserName").val());
				} else {
					//
				}
			} else {
				ajaxGetNotSuccessMsg(msg);
			}
		},
		error : ajaxNetworkError
	});
}
function signUpAjax(serverUrl) {
	var oriData = {
		userName : $("#signUpUserName").val(),
		password : $("#signUpPassword").val()
	};
	$.ajax({
		type : "post",
		url : serverUrl + "sign-up.jsp",
		async : false,
		data : JSON.stringify(oriData),
		dataType : "json",
		success : function(msg) {
			if (msg.status == "success") {
				if (databaseStatus == "empty") {
					signInOrUpSuccess(msg, $("#signUpUserName").val());
				} else {
					//
				}
			} else {
				ajaxGetNotSuccessMsg(msg);
			}
		},
		error : ajaxNetworkError
	});
}

function signInOrUpSuccess(msg, password) {
	mJsonMsg = msg;
	mLocalParameters['userId'] = msg.data.userId;
	// insert account to local database
	mLocalDbProcess = "insertLocalUserAccout";
	db.transaction(dbInsertAccountInfo(msg.data.userName, password), errorCB);
}

function initialButton() {
	$("#signUpJumpToSignIn").click(function() {
		// check form data
		divControl("#divSignIn");
	})
}

// insert account info to local
function dbInsertAccountInfo(userName, password) {
	return function(tx) {
		// ,$("#signUpUserName").val()
		tx
				.executeSql(
						'insert into local_system_parameters (title,detail) values (?,?)',
						[ "userName", userName ]);
		tx
				.executeSql(
						'insert into local_system_parameters (title,detail) values (?,?)',
						[ "userId", mJsonMsg.data.userId ]);
		tx
				.executeSql(
						'insert into local_system_parameters (title,detail) values (?,?)',
						[ "passwordEncrypted", MD5(password) ]);
		mLocalParameters['userName'] = userName;
		mLocalParameters['passwordEncrypted'] = MD5(password);
		queryRecordAndDisplay();
	}
}

var syncServer = function() {
	console.log("mSyncStatus:" + mSyncStatus + " "
			+ ((new Date()).valueOf() - mLastSyncTime));
	if (mSyncStatus == 'stop'
			|| ((new Date()).valueOf() - mLastSyncTime > mSyncTimeout)) {
		console.log("begin sync");
		mSyncStatus = 'work';
		mLastSyncTime = (new Date()).valueOf();
		var needSyncCount = 0;
		var currentServerId = bigInt(0);

		procServerIdFromServer("local_contents");
	}
	function syncLocalToServer(tableName) {
		mLocalDbProcess = "syncLocalToServer:" + tableName
		db.transaction(dbLastSyncTime(tableName), errorCB);
	}

	function dbLastSyncTime(tableName) {
		return function(tx) {
			mLocalDbProcess = "dbLastSyncTime";
			tx
					.executeSql(
							"Select serverUpdateTime from "
									+ tableName
									+ " where userId=? order by serverUpdateTime desc limit 1 ;",
							[ mLocalParameters['userId'] ],
							handlerLastSyncTime(tableName), errorCB);
		}

	}
	function handlerLastSyncTime(tableName) {
		return function(tx, results) {
			if (results.rows.length > 0) {
				if (results.rows.item(0).serverUpdateTime > 0) {
					withInputGetNeedSyncRows(
							results.rows.item(0).serverUpdateTime, tableName);
				} else {
					withInputGetNeedSyncRows(0, tableName);
				}
			} else {
				withInputGetNeedSyncRows(0, tableName);
			}
		}
	}
	function withInputGetNeedSyncRows(lastServerTime, tableName) {
		db.transaction(
				withInputDbGetNeedSyncRecords(lastServerTime, tableName),
				errorCB);
	}

	function withInputDbGetNeedSyncRecords(lastServerTime, tableName) {
		return function(tx) {
			mLocalDbProcess = "dbGetNeedSyncRecords";
			switch (tableName) {
			case "local_records":
				tx
						.executeSql(
								"Select serverId,title,detail,beginTime,endTime,state,"
										+ " serverUpdateTime,titleServerId "
										+ " from local_records where userId=? "
										+ "and serverId>0 and modifyStatus = 1 order by clientId limit ? ;",
								[ mLocalParameters['userId'],
										LIMIT_UPDATE_BATCH_SIZE ],
								withInputHandlerSyncDataToServer(
										lastServerTime, tableName), errorCB);
				break;
			case "local_contents":
				tx
						.executeSql(
								"Select serverId,content,state,"
										+ " serverUpdateTime "
										+ " from local_contents where userId=? "
										+ "and serverId>0 and modifyStatus = 1 order by clientId limit ? ;",
								[ mLocalParameters['userId'],
										LIMIT_UPDATE_BATCH_SIZE ],
								withInputHandlerSyncDataToServer(
										lastServerTime, tableName), errorCB);
				break;
			}

		}
	}

	function withInputHandlerSyncDataToServer(lastServerTime, tableName) {
		return function(tx, results) {
			var syncData = {
				dataRows : [],
				lastSyncServerTimeFromClient : lastServerTime,
				clientParameters : mLocalParameters,
				tableName : tableName
			};
			for (var i = 0; i < results.rows.length; i++) {
				var row = {};
				switch (tableName) {
				case "local_records":
					row.serverId = results.rows.item(i).serverId;
					row.title = results.rows.item(i).title;
					row.detail = results.rows.item(i).detail;
					row.beginTime = results.rows.item(i).beginTime;
					row.endTime = results.rows.item(i).endTime;
					row.state = results.rows.item(i).state;
					row.serverUpdateTime = results.rows.item(i).serverUpdateTime;
					row.titleServerId = results.rows.item(i).titleServerId;
					break;
				case "local_contents":
					row.serverId = results.rows.item(i).serverId;
					row.content = results.rows.item(i).content;
					row.state = results.rows.item(i).state;
					row.serverUpdateTime = results.rows.item(i).serverUpdateTime;
					break;
				}
				syncData.dataRows.push(row);
			}
			syncRecordAjax(mServerUrl, receiveSyncRecordRspAjax,
					ajaxGetNotSuccessMsg, ajaxNetworkError, syncData, tableName);
		}
	}

	function syncRecordAjax(serverUrl, successAjaxProc, errorRsp,
			ajaxNetworkError, syncData, tableName) {
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
		mLocalDbProcess = "procServerIdFromServer";
		db.transaction(dbGetCountNeedServerId(tableName), errorCB);
	}

	function dbGetCountNeedServerId(tableName) {
		return function(tx) {
			tx.executeSql("SELECT count(clientId) as total from " + tableName
					+ " where userId=? and serverId is null ;",
					[ mLocalParameters['userId'] ],
					handlerGetCountNeedServerId(tableName), errorCB);
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
							ajaxGetNotSuccessMsg, ajaxNetworkError,
							needSyncCount, tableName);
				} else {
					// todo no result ;
					console
							.log("handlerGetCountNeedServerId:no record need get serverId .");
					syncLocalToServer(tableName);
				}
			} else {
				// todo no result ;
				console.log("error ! handlerGetCountNeedServerId");
			}
		}

	}
	function receiveSyncRecordRspAjax(msg, tableName) {
		for (var i = 0; i < msg.data.length; i++) {
			if (msg.data[i].serverId != null && msg.data[i].serverId != '') {
				db.transaction(dbProcReceivedRow(msg.data[i], tableName),
						errorCB);
			}
		}
		mSyncStatus = 'stop';
	}
	function dbProcReceivedRow(row, tableName) {
		return function(tx) {
			switch (tableName) {
			case "local_records":
				tx
						.executeSql(
								"SELECT 1 from local_records where serverId=? and userId=? ;",
								[ row.serverId, mLocalParameters['userId'] ],
								updateOrInsertReceivedRecord(row), errorCB);
				break;
			case "local_contents":
				tx
						.executeSql(
								"SELECT 1 from local_contents where serverId=? and userId=? ;",
								[ row.serverId, mLocalParameters['userId'] ],
								updateOrInsertReceivedTitle(row), errorCB);
				break;
			}

		}
	}
	function updateOrInsertReceivedTitle(row) {
		return function(tx, results) {
			if (results.rows.length > 0) {
				tx
						.executeSql(
								"update local_contents set content = ?  ,"
										+ "state=? ,serverUpdateTime=?,modifyStatus=0 where serverId=?; ",
								[ row.content, row.state, row.serverUpdateTime,
										row.serverId ]);
			} else {
				tx
						.executeSql(
								"insert into local_contents (userId,content,state,"
										+ "serverUpdateTime,modifyStatus,serverId) values (?,?,?,?,0,?); ",
								[ mLocalParameters['userId'], row.content,
										row.state, row.serverUpdateTime,
										row.serverId ],
								updateRecordTitleClientId(row.serverId));
			}
		}
	}
	// modify insertId . Perhaps no use .
	function updateRecordTitleClientId(titleServerId) {
		return function(tx, results) {
			tx.executeSql('select last_insert_rowid() as id', [],
					dbGetLastUpdateTitleClientIdToUpdateRecord(titleServerId));
		}
	}
	function dbGetLastUpdateTitleClientIdToUpdateRecord(titleServerId) {
		return function(tx, results) {
			tx
					.executeSql(
							'update local_records set titleClientId=?,modifyStatus=1 where titleServerId=?',
							[ results.rows.item(0).id, titleServerId ]);
		}
	}
	function updateOrInsertReceivedRecord(row) {
		return function(tx, results) {
			if (results.rows.length > 0) {
				tx
						.executeSql(
								"update local_records set title = ? ,detail = ? ,beginTime = ? ,endTime=?,"
										+ "state=? ,serverUpdateTime=?,modifyStatus=0,"
										+ "titleClientId=?,titleServerId=? where serverId=?; ",
								[ row.title, row.detail, row.beginTime,
										row.endTime, row.state,
										row.serverUpdateTime,
										row.titleClientId, row.titleServerId,
										row.serverId ]);
			} else {
				tx
						.executeSql(
								"insert into local_records (userId,title,detail,beginTime,endTime,state,"
										+ "serverUpdateTime,modifyStatus,serverId,titleClientId,"
										+ "titleServerId) values (?,?,?,?,?,?,?,0,?,?,?); ",
								[ mLocalParameters['userId'], row.title,
										row.detail, row.beginTime, row.endTime,
										row.state, row.serverUpdateTime,
										row.serverId, row.titleClientId,
										row.titleServerId ]);
			}
		}
	}

	function receiveGetServerIdAjax(msg, count, tableName) {
		currentServerId = bigInt(msg.data);
		needSyncCount = count;
		if (currentServerId > 0) {
			db.transaction(dbProcRowNeedServerId(tableName), errorCB);
		}
	}

	function dbProcRowNeedServerId(tableName) {
		return function(tx) {
			tx
					.executeSql(
							"SELECT clientId from "
									+ tableName
									+ " where userId=? and serverId is null order by clientId limit ? ;",
							[ mLocalParameters['userId'], needSyncCount ],
							handlerUpdateClientServerId(tableName), errorCB);
		}
	}
	function handlerUpdateClientServerId(tableName) {
		return function(tx, results) {
			if (results.rows.length > 0) {
				// getTransaction(updateLocalServerId, results,
				// currentServerId);
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
							+ " set serverId=? where clientId = ?; ", [
							serverId.toString(),
							resultOfClientID.rows.item(i).clientId ],
							dbGetLastUpdateTitleServerId(serverId.toString(),
									resultOfClientID.rows.item(i).clientId));
				} else {
					tx.executeSql("update " + tableName
							+ " set serverId=? where clientId = ?; ", [
							serverId.toString(),
							resultOfClientID.rows.item(i).clientId ]);
				}
				serverId = serverId.add(1);
			}
			syncLocalToServer(tableName);
		}
	}

	function dbGetLastUpdateTitleServerId(titleServerId, titleClientId) {
		return function(tx, results) {
			tx
					.executeSql(
							'update local_records set titleServerId=?,modifyStatus=1 where titleClientId=?',
							[ titleServerId, titleClientId ]);
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
}
