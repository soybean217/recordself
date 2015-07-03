<%@page import="com.google.gson.LongSerializationPolicy"%>
<%@page import="com.google.gson.GsonBuilder"%>
<%@page import="com.recordself.json.protocol.BaseRsp"%>
<%@page import="com.recordself.json.protocol.SignUpRsp"%>
<%@page import="com.recordself.service.UserService"%>
<%@page import="com.recordself.entity.User"%>
<%@ page language="java" pageEncoding="utf-8"%>
<%@page import="com.google.gson.Gson"%>
<%@ include file="inc-receive-body.jsp"%>
<%
  try {
    GsonBuilder gsonBuilder = new GsonBuilder();
    gsonBuilder.setLongSerializationPolicy( LongSerializationPolicy.STRING );
    Gson gson = gsonBuilder.create();
    //Gson gson = new Gson();
    User user = gson.fromJson(info, User.class);
    user.validate();
    LOG.debug(user);
    UserService userService = new UserService();
    if (userService.checkUserCurrent(user)) {
      BaseRsp baseRsp = new BaseRsp();
      LOG.debug(user);
      //user.setPassword(null);
      baseRsp.setData(user);
      baseRsp.setStatus("success");
      String rsp = gson.toJson(baseRsp);
      out.println(rsp);
      LOG.debug(rsp);
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