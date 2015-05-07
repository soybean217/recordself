<%@page import="com.recordself.entity.User"%>
<%@page import="org.apache.log4j.Logger"%>
<%@ page language="java" pageEncoding="utf-8"%>
<%@page import="com.google.gson.Gson"%>
<%@page import="java.io.InputStream"%>
<%
  String info = null;
  int len = 0;
  int temp = 0;
  InputStream is = request.getInputStream();
  byte[] b = new byte[10000];
  while ((temp = is.read()) != -1) {
    b[len] = (byte) temp;
    len++;
  }
  is.close();
  info = new String(b, 0, len, "utf-8");
  System.out.println("####notice:\n" + info);
  System.out.println("####end:");
  Logger LOG = Logger.getLogger(this.getClass());
  try {
    Gson gson = new Gson();
    User user = gson.fromJson(info, User.class);
    user.setUserName(null);
    user.validate();
    int i = 1;
    i = i / 0;
    out.println("The answer is " + i);
  } catch (Exception e) {
    //out.println("An exception occurred: " + e.getMessage());
    LOG.debug("An exception occurred: " + e.getMessage());
    out.println("{\"status\":\"error\"}");
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