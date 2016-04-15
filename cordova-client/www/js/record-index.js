//MetadataRecordContent,MetadataRecordBeginTime,MetadataRecordEndTime,SchemaCatalog,SchemaRecord
var metadataType = {
	MetadataRecordContent : "string",
	MetadataRecordBeginTime : "intTime",
	MetadataRecordEndTime : "intTime"
};

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
	$("#formRecord").submit(function(e) {
		e.preventDefault();
		if ($("#formRecord").valid()) {
			procInsertOrUpdateRecord();
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
		}
	});
	$("#recordEditDelete").click(function() {
		if (confirm(globalization_confirm_delete)) {
			deleteRecordWithId();
		}
	})
	$("#recordEditRepeat")
			.click(
					function() {
						divRecordFormNew(mCurrentRecord['SchemaCatalog'][0].contentClientId);
						$("#recordEditDetail")
								.val(
										mCurrentRecord['MetadataRecordContent'][0].content);
						$("#recordEditBeginTime").val("");
					})
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
			"title" : globalization_last_update
		}, {
			"title" : globalization_end_time
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
		} ]
	});
	$('#tableRecord tbody').on('click', 'tr', function() {
		divRecordFormFill(mRecordTable.row(this).data()[0]);
		document.getElementById('divRecord').scrollIntoView()
	});
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
	$('#tableCatalog tbody').on('click', 'tr', function() {
		showViewRecord(mTitleTable.row(this).data()[0],false)
	});
}

function editCatalogProcess(info) {
	if (info != null) {
		if (info.id > 0) {
			// update
			mLocalDbProcess = "updateCatalog";
			db.transaction(dbUpdateCatalog(info), errorCB);
		} else {
			// insert
			mLocalDbProcess = "insertCatalog";
			db.transaction(dbInsertCatalog(info), errorCB);
		}
	}
}

function procInsertOrUpdateRecord() {
	editRecord = {
		detail : $("#recordEditDetail").val(),
		metadataRecordContentClientId : $("#metadataRecordContentClientId")
				.val(),
		beginTimeInputString : $("#recordEditBeginTime").val(),
		metadataRecordBeginTimeClientId : $("#metadataRecordBeginTimeClientId")
				.val(),
		endTimeInputString : $("#recordEditEndTime").val(),
		metadataRecordEndTimeClientId : $("#metadataRecordEndTimeClientId")
				.val(),
		clientId : $("#recordEditId").val(),
		catalogClientId : $("#selectCatalog").val()
	};
	console.log(editRecord);
	editRecordProcess(editRecord);
}

function checkRecordModify(editRecord) {
	var checkContentType = new Array();
	if (mCurrentRecord['SchemaCatalog'] != null) {
		if (editRecord.catalogClientId != mCurrentRecord['SchemaCatalog'][0].contentClientId) {
			checkContentType.push("SchemaCatalog");
		}
	}
	if (mCurrentRecord['MetadataRecordContent'] != null) {
		if (editRecord.detail != mCurrentRecord['MetadataRecordContent'][0].content) {
			checkContentType.push("MetadataRecordContent");
		}
	}
	if (mCurrentRecord['MetadataRecordBeginTime'] != null) {
		if (editRecord.beginTimeInputString != new Date(
				parseInt(mCurrentRecord['MetadataRecordBeginTime'][0].content))
				.Format("yyyy-MM-dd hh:mm")) {
			checkContentType.push("MetadataRecordBeginTime");
		}
	}
	if (mCurrentRecord['MetadataRecordEndTime'] != null) {
		if (editRecord.endTimeInputString != new Date(
				parseInt(mCurrentRecord['MetadataRecordEndTime'][0].content))
				.Format("yyyy-MM-dd hh:mm")) {
			checkContentType.push("MetadataRecordEndTime");
		}
	} else if (editRecord.endTimeInputString != null
			&& editRecord.endTimeInputString != '') {
		checkContentType.push("MetadataRecordEndTime");
	}
	return checkContentType;
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

function dbUpdateCatalog(info) {
	return function(tx) {
		tx
				.executeSql(
						"update local_contents set modifyStatus = 1 , content = ? , lastLocalTime = ? where clientId = ? and userId = ?",
						[ info.title, (new Date()).valueOf(), info.id,
								mLocalParameters['userId'] ],
						queryCatalogAndDisplay());
	}
}

function editRecordProcess(editRecord) {
	if (editRecord != null) {
		if (editRecord.clientId > 0) {
			// compare content
			var updateArray = checkRecordModify(editRecord);
			if (updateArray.length > 0) {

				// update
				mLocalDbProcess = "updateRecord";
				db.transaction(dbUpdateSingleRecord(editRecord, updateArray),
						errorCB);
				// update content last use .
			}
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
	// tx.executeSql('CREATE TABLE IF NOT EXISTS local_records ('
	// + 'clientId integer primary key,' + 'userId text,'
	// + 'serverId text UNIQUE,' + 'title text not null,detail text,'
	// + 'beginTime integer default 0,' + 'endTime integer default 0,'
	// + 'state integer default 0,'
	// + 'serverUpdateTime integer default 0,'
	// + 'modifyStatus integer default 1 ,' + 'titleClientId integer ,'
	// + 'titleServerId text )');
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
	if (results.rows.length == 0) {
		// enter register or local use
		divControl("#divSignUp");
	} else {
		for (var i = 0; i < results.rows.length; i++) { // loop as many times as
			// there are row
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
function divRecordFormNew(catalogId) {
	$("#recordEditButtonGroup").hide();
	$("#recordEditBeginTimePicker").hide();
	$("#recordEditEndTimePicker").hide();
	$("#recordEditAddNew").show();
	$("#recordEditId").val(null);
	$("#recordEditDetail").val(null);
	if (catalogId != null && catalogId > 0) {
		$("#selectCatalog").val(catalogId);
	}
}
function queryRecordAndDisplay(catalogId) {
	divControl("#divMenu", "#divRecord", "#divDisplayRecordList",
			"#divCatalogForm", "#divMenuAfterSignIn");
	$("#catalogEditSubmit").text(globalization_modify_catalog);
	if (mCurrentCatalogMap[catalogId] != null
			&& mCurrentCatalogMap[catalogId][1] != null) {
		$("#catalogEditContent").val(mCurrentCatalogMap[catalogId][1]);
		$("#catalogEditId").val(catalogId);
	}
	mLocalDbProcess = "queryRecordAndDisplay";
	db.transaction(dbQueryRecord(catalogId), errorCB);
}
function queryCatalogAndDisplay() {
	divControl("#divMenu", "#divCatalogForm", "#divCatalogList",
			"#divMenuAfterSignIn");
	$("#catalogEditSubmit").text(globalization_add_catalog);
	mLocalDbProcess = "queryCatalogAndDisplay";
	db.transaction(dbQueryCatalog, errorCB);
	$("#catalogEditContent").val("");
	$("#catalogEditId").val("");
}
function dbQueryRecord(catalogId) {
	return function(tx) {
		if (catalogId != null && catalogId > 0) {
			tx
					.executeSql(
							"SELECT c.clientId AS clientId,c.serverId AS serverId,c.content AS title,'detail' AS detail,"
									+ " c.serverUpdateTime AS serverUpdateTime,c.modifyStatus AS modifyStatus,"
									+ " c.lastLocalTime as lastLocalTime,1 as endTime,1 as titleClientId,r.idFrom,r.idTo "
									+ " FROM `local_contents` as c , `local_relations` as r "
									+ " WHERE (r.idTo = c.clientId or r.idTo = c.serverId) and r.idFrom IN (SELECT serverId FROM local_contents "
									+ " WHERE state<>-1 and contentType='SchemaRecord' and userId= ? "
									+ "  and (clientId IN (SELECT idTo FROM `local_relations` WHERE idFrom = ? ) "
									+ "   OR serverId IN (SELECT idTo FROM `local_relations` WHERE idFrom = ? )  "
									+ "   OR clientId IN (SELECT idTo FROM `local_relations` "
									+ "    WHERE idFrom = (select serverId from local_contents where clientId=?) ) "
									+ "   OR serverId IN (SELECT idTo FROM `local_relations` "
									+ "    WHERE idFrom = (select serverId from local_contents where clientId=?) )) "
									+ " AND c.contentType='MetadataRecordContent'"
									+ "  union SELECT clientId FROM local_contents "
									+ " WHERE state<>-1 and contentType='SchemaRecord' and userId= ? "
									+ "  and (clientId IN (SELECT idTo FROM `local_relations` WHERE idFrom = ? ) "
									+ "   OR serverId IN (SELECT idTo FROM `local_relations` WHERE idFrom = ? )  "
									+ "   OR clientId IN (SELECT idTo FROM `local_relations` "
									+ "    WHERE idFrom = (select serverId from local_contents where clientId=?) ) "
									+ "   OR serverId IN (SELECT idTo FROM `local_relations` "
									+ "    WHERE idFrom = (select serverId from local_contents where clientId=?) )) "
									+ " AND c.contentType='MetadataRecordContent') "
									+ " ORDER BY c.lastLocalTime DESC"
									+ " limit 0,?;", [
									mLocalParameters['userId'], catalogId,
									catalogId, catalogId, catalogId,
									mLocalParameters['userId'], catalogId,
									catalogId, catalogId, catalogId,
									mRecordLimit ], refreshRecordListView,
							errorCB);

		} else {
			tx
					.executeSql(
							"SELECT c.clientId AS clientId,c.serverId AS serverId,c.content AS title,'detail' AS detail,"
									+ " c.serverUpdateTime AS serverUpdateTime,c.modifyStatus AS modifyStatus,"
									+ " c.lastLocalTime as lastLocalTime,1 as endTime,1 as titleClientId,r.idFrom,r.idTo "
									+ " FROM `local_contents` as c , `local_relations` as r "
									+ " WHERE r.idFrom IN (SELECT clientId FROM local_contents "
									+ " WHERE state<>-1 and contentType='SchemaRecord' and userId= ? "
									+ "union SELECT serverId FROM local_contents "
									+ " WHERE state<>-1 and contentType='SchemaRecord' and userId= ? ) "
									+ " AND (r.idTo = c.clientId or r.idTo = c.serverId) AND c.contentType='MetadataRecordContent' "
									+ " ORDER BY c.lastLocalTime DESC"
									+ " limit 0,?;", [
									mLocalParameters['userId'],
									mLocalParameters['userId'], mRecordLimit ],
							refreshRecordListView, errorCB);
		}
	}
}
// Display the results
function refreshRecordListView(tx, results) {
	var mRow = [];
	mRecordDataSet = [];
	var len = results.rows.length;
	for (var i = 0; i < len; i++) {
		var mRow = [
				results.rows.item(i).idFrom,
				results.rows.item(i).title,
				results.rows.item(i).detail,
				new Date(results.rows.item(i).lastLocalTime)
						.Format("yyyy-MM-dd hh:mm"),
				results.rows.item(i).endTime == 0 ? "" : (new Date(results.rows
						.item(i).endTime).Format("yyyy-MM-dd hh:mm")) ];
		mRecordDataSet[i] = mRow;
	}

	mRecordTable.clear();
	mRecordTable.rows.add(mRecordDataSet);
	mRecordTable.draw();
}
function dbQueryCatalog(tx) {
	tx
			.executeSql(
					"SELECT clientId,serverId,content,lastLocalTime "
							+ " from local_contents where userId=? and contentType='SchemaCatalog' "
							+ " order by lastLocalTime desc ;",
					[ mLocalParameters['userId'] ], txRefreshTitleListView,
					errorCB);
}
// Display the catalog
function txRefreshTitleListView(tx, results) {
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
		mCurrentCatalogMap[results.rows.item(i).clientId] = mRow;
		$("#selectCatalog").append(
				"<option value='" + results.rows.item(i).clientId + "'>"
						+ results.rows.item(i).content + "</option>");
	}
	mTitleTable.clear();
	mTitleTable.rows.add(mTitleDataSet);
	mTitleTable.draw();

	var syncThread = new syncServer();
}
function convertDateStringToLong(inputString) {
	if (isNaN((new Date(inputString)).valueOf())) {
		return (parseInt(new Date().valueOf()));
	} else {
		return (parseInt(new Date(inputString).valueOf()));
	}
}

function showViewRecord(catalogId,syncTag) {
	queryRecordAndDisplay(catalogId);
	if (catalogId != null && catalogId > 0) {
		divRecordFormNew(catalogId);
	} else {
		divRecordFormNew();
	}
	if (syncTag){
		var syncThread = new syncServer();
	}
}
/**
 * insert record to local
 */
function dbInsertSingleRecord(editRecord) {
	return function(tx) {
		tx.executeSql(
				"insert into local_contents (userId,content,lastLocalTime,contentType"
						+ " ) values (?,?,?,'SchemaRecord')", [
						mLocalParameters['userId'], editRecord.detail,
						(new Date()).valueOf() ],
				processRecordMetadata(editRecord));
	}
}

function processRecordMetadata(editRecord) {
	return function(tx, results) {
		insertRecordMetadataTransaction(results.insertId,
				'MetadataRecordContent', editRecord.detail);
		insertRecordMetadataTransaction(results.insertId,
				'MetadataRecordBeginTime', editRecord.beginTimeInputString);
		// sync get catalogServerId
		getContentServerIdByClientId(editRecord.catalogClientId,
				results.insertId);
		db
				.transaction(
						dbUpdateConentLastLocalTimeByClientId(editRecord.catalogClientId),
						errorCB);
	}
}

function getContentServerIdByClientId(clientId, lastInsertId) {
	var result = 0;
	db.transaction(dbGetContentServerIdByClientId(clientId), errorCB);

	function dbGetContentServerIdByClientId(clientId) {
		return function(tx) {
			tx
					.executeSql(
							"select serverId from local_contents where clientId = ? and userId=?",
							[ clientId, mLocalParameters['userId'] ],
							txGetContentServerIdByClientId);
		}
	}
	function txGetContentServerIdByClientId(tx, results) {
		if (results.rows.length > 0 && results.rows.item(0).serverId != null
				&& results.rows.item(0).serverId.length == LENGTH_FIX) {
			result = results.rows.item(0).serverId;
			db.transaction(insertRelationFreshCatalog(result, lastInsertId,
					clientId), errorCB);
		} else {
			db.transaction(insertRelationFreshCatalog(
					editRecord.catalogClientId, lastInsertId, clientId),
					errorCB);
		}
	}
	return result;
}

function getClientIdByServerId(serverId, onSuccessCallback) {
	var result = 0;
	db.transaction(dbGetClientIdByServerId(serverId), errorCB)

	function dbGetClientIdByServerId(serverId) {
		return function(tx) {
			tx
					.executeSql(
							"select clientId from local_contents where serverId = ? and userId=?",
							[ serverId, mLocalParameters['userId'] ],
							txGetClientIdByServerId);
		}
	}
	function txGetClientIdByServerId(tx, results) {
		if (results.rows.length > 0) {
			result = results.rows.item(0).clientId;
			onSuccessCallback(result);
		} else {
			console.log("error invalid serverId:" + serverId);
		}
	}
	return result;
}

function insertRecordMetadataTransaction(idFrom, metadataContentType,
		metaContent) {
	db.transaction(insertRecordMetadata(idFrom, metadataContentType,
			metaContent), errorCB);
}

function insertRecordMetadata(idFrom, metadataContentType, metaContent) {
	return function(tx) {
		switch (metadataType[metadataContentType]) {
		case "intTime":
			var timeLong = convertDateStringToLong(metaContent);
			tx.executeSql(
					"insert into local_contents (userId,content,lastLocalTime,contentType"
							+ " ) values (?,cast(? as int),?,?)", [
							mLocalParameters['userId'], timeLong,
							(new Date()).valueOf(), metadataContentType ],
					getLastIdForMetadata(idFrom));
			break;
		default:
			tx.executeSql(
					"insert into local_contents (userId,content,lastLocalTime,contentType"
							+ " ) values (?,?,?,?)", [
							mLocalParameters['userId'], metaContent,
							(new Date()).valueOf(), metadataContentType ],
					getLastIdForMetadata(idFrom));
			break;
		}

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
				idTo ]);
	}
}
function insertRelationFreshCatalog(idFrom, idTo, catalogClientId) {
	return function(tx) {
		tx.executeSql("insert into local_relations (userId,idFrom,idTo"
				+ " ) values (?,?,?)", [ mLocalParameters['userId'], idFrom,
				idTo ], showViewRecord(catalogClientId,true));
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
					"update local_contents set state = -1 ,modifyStatus=1 where clientId = ?; ",
					[ $("#recordEditId").val() ]);
	tx
			.executeSql(
					"update local_contents set state = -1 ,modifyStatus=1"
							+ " where clientId in (select idTo from local_relations where idFrom = ?);",
					[ $("#recordEditId").val() ]);
	tx.executeSql("update local_relations set state = -1 ,modifyStatus=1"
			+ " where  idFrom = ?;", [ $("#recordEditId").val() ]);
	showViewRecord($("#selectCatalog").val(),true);
}

function divRecordFormFill(recordId) {
	if (recordId != null && recordId != "") {
		db.transaction(getRecordInfo(recordId), errorCB);
	}

	function getRecordInfo(recordClientId) {
		return function(tx) {
			tx
					.executeSql(
							"SELECT c.clientId AS contentClientId,c.contentType as contentType,"
									+ " c.serverId AS serverId,c.content AS content,"
									+ " c.serverUpdateTime AS serverUpdateTime,c.modifyStatus AS modifyStatus,"
									+ " c.lastLocalTime as lastLocalTime,  r.idFrom,r.idTo,r.clientId as relationClientId"
									+ "  FROM `local_contents` as c ,  `local_relations` as r"
									+ " WHERE (r.idTo = c.clientId or r.idTo = c.serverId) and r.idFrom = ? "
									+ "union "
									+ "SELECT c.clientId AS contentClientId,c.contentType as contentType,"
									+ " c.serverId AS serverId,c.content AS content,"
									+ " c.serverUpdateTime AS serverUpdateTime,c.modifyStatus AS modifyStatus,"
									+ " c.lastLocalTime as lastLocalTime,  r.idFrom,r.idTo,r.clientId as relationClientId"
									+ "  FROM `local_contents` as c , `local_relations` as r"
									+ "  WHERE (r.idFrom = c.clientId or r.idFrom = c.serverId) and  r.idTo=?",
							[ recordId, recordId ],
							procResultByRecordClientId(recordClientId));
		}
	}
	function displayRecord(resultObject) {
		if (resultObject['RecordClientId'] != null
				&& resultObject['RecordClientId'] != "") {
			mCurrentRecord = resultObject;
			$("#recordEditId").val(resultObject['RecordClientId']);
			if (resultObject['MetadataRecordContent'] != null) {
				$("#recordEditDetail").val(
						resultObject['MetadataRecordContent'][0].content);
				$("#metadataRecordContentClientId")
						.val(
								resultObject['MetadataRecordContent'][0].contentClientId);
			}
			if (resultObject['SchemaCatalog'] != null) {
				$("#selectCatalog").val(
						resultObject['SchemaCatalog'][0].contentClientId);
			}
			if (resultObject['MetadataRecordBeginTime'] != null) {
				$("#recordEditBeginTime")
						.val(
								new Date(
										parseInt(resultObject['MetadataRecordBeginTime'][0].content))
										.Format("yyyy-MM-dd hh:mm"));
				$("#metadataRecordBeginTimeClientId")
						.val(
								resultObject['MetadataRecordBeginTime'][0].contentClientId);
			}
			if (resultObject['MetadataRecordEndTime'] != null) {
				$("#recordEditEndTime")
						.val(
								new Date(
										parseInt(resultObject['MetadataRecordEndTime'][0].content))
										.Format("yyyy-MM-dd hh:mm"));
				$("#metadataRecordEndTimeClientId")
						.val(
								resultObject['MetadataRecordEndTime'][0].contentClientId);
			} else {
				$("#recordEditEndTime").val(
						new Date().Format("yyyy-MM-dd hh:mm"));
				$("#metadataRecordEndTimeClientId").val(0);
			}
			$("#recordEditBeginTime").show();
			$("#recordEditEndTime").show();
			$("#recordEditBeginTimePicker").show();
			$("#recordEditEndTimePicker").show();
			$("#recordEditButtonGroup").show();
			$("#recordEditAddNew").hide();
		}

		// $("#selectCatalog").val(row[5]);
		// 

	}
	function procResultByRecordClientId(recordId) {
		var resultObject = {};
		return function(tx, results) {
			if (results.rows.length > 0) {
				for (i = 0; i < results.rows.length; i++) {
					if (resultObject[results.rows.item(i).contentType] == null) {
						resultObject[results.rows.item(i).contentType] = new Array();

					}
					resultObject[results.rows.item(i).contentType]
							.push(results.rows.item(i));
				}
				resultObject['RecordClientId'] = recordId;
			}
			if (recordId.length == LENGTH_FIX) {
				getClientIdByServerId(recordId,
						displayRecordWithServerId(resultObject));
			} else {
				displayRecord(resultObject);
			}
		}
	}
	function displayRecordWithServerId(resultObject) {
		return function(serverId) {
			resultObject['RecordClientId'] = serverId;
			displayRecord(resultObject);
		}
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
		queryCatalogAndDisplay()
	}
}

function dbUpdateConentLastLocalTimeByClientId(contentClientId) {
	return function(tx) {
		tx.executeSql("update local_contents set lastLocalTime=?"
				+ " where clientId=? and userId=?", [ (new Date()).valueOf(),
				contentClientId, mLocalParameters['userId'] ]);
	}
}

// update record to local
function dbUpdateSingleRecord(editRecord, updateArray) {
	return function(tx) {
		updateArray.forEach(procMetadataForUpdateRecord(editRecord));
		db.transaction(
				dbUpdateConentLastLocalTimeByClientId(editRecord.clientId),
				errorCB);
		db
				.transaction(
						dbUpdateConentLastLocalTimeByClientId(editRecord.catalogClientId),
						errorCB);
		showViewRecord(editRecord.catalogClientId,true);
	}
	function procMetadataForUpdateRecord(editRecord) {
		return function(element, index, array) {
			switch (element) {
			case "SchemaCatalog":
				updateSingleRelationIdFrom(
						mCurrentRecord["SchemaCatalog"][0].relationClientId,
						editRecord.catalogClientId);
				break;
			case "MetadataRecordContent":
				dbUpdateMetadata(editRecord.detail,
						editRecord.metadataRecordContentClientId,
						metadataType["MetadataRecordContent"]);
				break;
			case "MetadataRecordBeginTime":
				dbUpdateMetadata(editRecord.beginTimeInputString,
						editRecord.metadataRecordBeginTimeClientId,
						metadataType["MetadataRecordBeginTime"]);
				break;
			case "MetadataRecordEndTime":
				if (editRecord.metadataRecordEndTimeClientId > 0) {
					dbUpdateMetadata(editRecord.endTimeInputString,
							editRecord.metadataRecordEndTimeClientId,
							metadataType["MetadataRecordEndTime"]);
				} else {
					insertRecordMetadataTransaction(editRecord.clientId,
							'MetadataRecordEndTime',
							editRecord.endTimeInputString);
				}
				break;
			}
		}
	}
	function dbUpdateMetadata(content, contentId, type) {
		db.transaction(txUpdateMetadata(content, contentId, type), errorCB);
	}
	function txUpdateMetadata(content, contentId, type) {
		return function(tx) {
			switch (type) {
			case "string":
				tx.executeSql(
						"update local_contents set content=?,modifyStatus=1"
								+ " where clientId=? and userId=?", [ content,
								contentId, mLocalParameters['userId'] ]);
				break;
			case "intTime":
				var timeLong = convertDateStringToLong(content);
				tx.executeSql(
						"update local_contents set content=cast(? as int),modifyStatus=1"
								+ " where clientId=? and userId=?", [ timeLong,
								contentId, mLocalParameters['userId'] ]);
				break;
			}
		}
	}
	function updateSingleRelationIdFrom(relationClientId, idFrom) {
		console.log("relationClientId, idFrom"+relationClientId+","+idFrom);
		db.transaction(dbUpdateSingleRelationIdFrom(relationClientId, idFrom),
				errorCB);
	}
	function dbUpdateSingleRelationIdFrom(relationClientId, idFrom) {
		return function(tx) {
			tx
					.executeSql(
							"update local_relations set idFrom=?,modifyStatus=1 where clientId=?",
							[ idFrom, relationClientId ]);
		}
	}

}