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
    JSONObject receive = new JSONObject(info);
   
    ApplyServerIdRsp applyServerIdRsp = new ApplyServerIdRsp();
    applyServerIdRsp.setData(Long.toString(GenerateIdService.getInstance().generateNew(Integer.parseInt(ConfigManager.getConfigData("server.id")), receive.getString("keyTitle"), receive.getInt("amount"))));
    applyServerIdRsp.setStatus("success");
    Gson gson = new Gson();
    out.println(gson.toJson(applyServerIdRsp));
    LOG.debug(gson.toJson(applyServerIdRsp));
  } catch (Exception e) {
    //out.println("An exception occurred: " + e.getMessage());
    LOG.error("An exception occurred: " + e.getMessage());
    out.println("{\"status\":\"error\",\"msg\":\""+e.getMessage()+"\"}");
  }
%>