package com.recordself.json.protocol;

import java.util.List;

import com.recordself.entity.Record;


public class ReceivedLocalRecords {
  private List<Record> records;
  private Long lastSyncServerTimeFromClient;

  public List<Record> getRecords() {
    return records;
  }

  public void setRecords(List<Record> records) {
    this.records = records;
  }

  public Long getLastSyncServerTimeFromClient() {
    return lastSyncServerTimeFromClient;
  }

  public void setLastSyncServerTimeFromClient(Long lastSyncServerTimeFromClient) {
    this.lastSyncServerTimeFromClient = lastSyncServerTimeFromClient;
  }

}
