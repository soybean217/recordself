package com.recordself.entity;

public class Content {
  // private Long serverId;
  private String serverId; // to compatible JS
  private String content;
  private String contentType;
  private Long serverUpdateTime;
  private Integer state;

  @Override
  public String toString() {
    return "Content [serverId=" + serverId + ", content=" + content + ", contentType=" + contentType
        + ", serverUpdateTime=" + serverUpdateTime + ", state=" + state + "]";
  }

  public String getContentType() {
    return contentType;
  }

  public void setContentType(String contentType) {
    this.contentType = contentType;
  }

  public Integer getState() {
    return state;
  }

  public void setState(Integer state) {
    this.state = state;
  }

  public String getServerId() {
    return serverId;
  }

  public void setServerId(String serverId) {
    this.serverId = serverId;
  }

  public String getContent() {
    return content;
  }

  public void setContent(String title) {
    this.content = title;
  }

  public Long getServerUpdateTime() {
    return serverUpdateTime;
  }

  public void setServerUpdateTime(Long serverUpdateTime) {
    this.serverUpdateTime = serverUpdateTime;
  }

}
