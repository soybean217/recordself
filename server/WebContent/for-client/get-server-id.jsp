<%@page import="org.common.util.ConfigManager"%>
<%@page import="org.common.util.GenerateIdService"%>
<%@page import="org.common.util.HexChange"%>
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
    long resultLong = GenerateIdService.getInstance().generateNew(Integer.parseInt(ConfigManager.getConfigData("server.id")), receive.getString("keyTitle"), receive.getInt("amount"));
    LOG.debug(HexChange.convertToOtherHex(resultLong));
    applyServerIdRsp.setData(HexChange.convertToOtherHex(resultLong));
    applyServerIdRsp.setStatus("success");
    Gson gson = new Gson();
    String rsp = gson.toJson(applyServerIdRsp);
    out.println(rsp);
    LOG.debug(rsp);
  } catch (Exception e) {
    //out.println("An exception occurred: " + e.getMessage());
    LOG.error("An exception occurred: " + e.getMessage());
    out.println("{\"status\":\"error\",\"msg\":\""+e.getMessage()+"\"}");
  }
%>