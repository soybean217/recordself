<%@page import="com.recordself.json.protocol.BaseRsp"%>
<%@page import="com.recordself.service.ContentService"%>
<%@page import="com.recordself.json.protocol.ReceivedLocalContents"%>
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
    JsonElement jelement = new JsonParser().parse(info);
    JsonObject jsonAll = jelement.getAsJsonObject();
    JsonObject jsonClientParameters = jsonAll.getAsJsonObject("clientParameters");
    Gson gson = new Gson();
    User user = gson.fromJson(jsonClientParameters, User.class);
    LOG.info(user);
    UserService userService = new UserService();
    if (userService.checkUserCurrent(user)) {
      if (jsonAll.get("tableName").toString().equals("\"local_contents\"")){
        JsonObject jsonData;
        jsonData = jsonAll.getAsJsonObject("data");
        ReceivedLocalContents receivedLocalContents = gson.fromJson(jsonData, ReceivedLocalContents.class);
        LOG.info(receivedLocalContents);
        ContentService contentService = new ContentService();
        contentService.setReceivedLocalRecords(receivedLocalContents);
        contentService.setUser(user);
        BaseRsp baseRsp = new BaseRsp();
        baseRsp.setStatus("success");
        baseRsp.setData(contentService.procReceive());
        String rsp = gson.toJson(baseRsp);
        out.println(rsp);
        LOG.debug(rsp); 
      }else if  (jsonAll.get("tableName").toString().equals("\"local_relations\"")){
        
      }
      //ReceivedControl receivedControl = gson.fromJson(info, classOfT);
      
      /*
      
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