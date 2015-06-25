<%@page import="com.google.gson.LongSerializationPolicy"%>
<%@page import="com.google.gson.GsonBuilder"%>
<%@page import="com.recordself.json.protocol.SignUpRsp"%>
<%@page import="com.recordself.service.UserService"%>
<%@page import="com.recordself.entity.User"%>
<%@ page language="java" pageEncoding="utf-8"%>
<%@page import="com.google.gson.Gson"%>
<%@ include file="inc-receive-body.jsp"%>
<%
  try {
    Gson gson = new Gson();
    User user = gson.fromJson(info, User.class);
    user.validate();
    UserService userService = new UserService();
    userService.addUser(user);
    SignUpRsp signUpRsp = new SignUpRsp();
    user.setPassword(null);
    signUpRsp.setData(user);
    signUpRsp.setStatus("success");
    GsonBuilder gsonBuilder = new GsonBuilder();
    gsonBuilder.setLongSerializationPolicy( LongSerializationPolicy.STRING );
    Gson gsonRsp = gsonBuilder.create();
    String rsp = gsonRsp.toJson(signUpRsp);
    out.println(rsp);
    LOG.debug(rsp);
  } catch (Exception e) {
    //out.println("An exception occurred: " + e.getMessage());
    LOG.error("An exception occurred: " + e.getMessage());
    out.println("{\"status\":\"error\",\"msg\":\""+e.getMessage()+"\"}");
  }
  /*
  Demo demo = new Demo();
  demo.setReceivedLocalRecords(d);
  if (demo.procReceive()) {
    Rsp rsp = new Rsp();
    rsp.setReceivedLocalRecords(d);
    rsp.setStatus("OK");
    rsp.setLastSyncServerTime(demo.mCurrent);
    out.println(gson.toJson(rsp));
    LOG.debug(gson.toJson(rsp));
  } else {
    out.println("{\"status\":\"error\"}");
  }
   */
%>