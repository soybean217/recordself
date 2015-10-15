<%@page import="com.recordself.json.protocol.BaseRsp"%>
<%@page import="com.recordself.service.RecordService"%>
<%@page import="com.recordself.json.protocol.ReceivedLocalRecords"%>
<%@page import="com.recordself.service.UserService"%>
<%@page import="com.google.gson.JsonObject"%>
<%@page import="com.google.gson.JsonParser"%>
<%@page import="com.google.gson.JsonElement"%>
<%@page import="org.common.util.ConfigManager"%>
<%@page import="org.common.util.GenerateIdService"%>
<%@page import="com.recordself.json.protocol.ApplyServerIdRsp"%>
<%@page import="org.json.JSONObject"%>
<%@page import="com.recordself.json.protocol.SignUpRsp"%>
<%@page import="com.recordself.entity.User"%>
<%@ page language="java" pageEncoding="utf-8"%>
<%@page import="com.google.gson.Gson"%>
<%@ include file="inc-receive-body.jsp"%>
<%
  try {
    //JSONObject receiveJson = new JSONObject(info);
    JsonElement jelement = new JsonParser().parse(info);
    JsonObject jsonClientParameters = jelement.getAsJsonObject();
    jsonClientParameters = jsonClientParameters.getAsJsonObject("clientParameters");
    Gson gson = new Gson();
    //JsonElement jsonElement = receiveJson.get("clientParameters");
    User user = gson.fromJson(jsonClientParameters, User.class);
    LOG.info(user);
    UserService userService = new UserService();
    if (userService.checkUserCurrent(user)) {
      
      JsonElement tableNameJelement = new JsonParser().parse(info);
      JsonObject tableName = tableNameJelement.getAsJsonObject();
      //tableName = tableName.getAsJsonObject("tableName");
      if (tableName.get("tableName").toString().equals("\"local_contents\"")){
        System.out.println(tableName.get("tableName"));  
      }else if  (tableName.get("tableName").toString().equals("\"local_relations\"")){
        
      }
      //ReceivedControl receivedControl = gson.fromJson(info, classOfT);
      
      /*
      ReceivedLocalRecords receivedLocalRecords = gson.fromJson(info, ReceivedLocalRecords.class);
      RecordService recordService = new RecordService();
      recordService.setReceivedLocalRecords(receivedLocalRecords);
      recordService.setUser(user);
      BaseRsp baseRsp = new BaseRsp();
      baseRsp.setStatus("success");
      baseRsp.setData(recordService.procReceive());
      String rsp = gson.toJson(baseRsp);
      out.println(rsp);
      LOG.debug(rsp); 
      */
    } else {
      String msg = "check user failure!";
      LOG.info(msg);
      out.println("{\"status\":\"error\",\"msg\":\"" + msg + "\"}");
    }
  } catch (Exception e) {
    //out.println("An exception occurred: " + e.getMessage());
    LOG.error("An exception occurred: " + e.getMessage());
    out.println("{\"status\":\"error\",\"msg\":\"" + e.getMessage() + "\"}");
  }
%>