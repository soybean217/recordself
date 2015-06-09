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
  } catch (Exception e) {
    //out.println("An exception occurred: " + e.getMessage());
    LOG.error("An exception occurred: " + e.getMessage());
    out.println("{\"status\":\"error\",\"msg\":\""+e.getMessage()+"\"}");
  }
%>