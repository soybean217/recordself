package com.recordself.json.protocol;

import java.util.List;

import com.recordself.entity.Content;
import com.recordself.entity.Relation;


public class ReceivedLocalRelations {
  private List<Relation> dataRows;
  private Long lastSyncServerTimeFromClient;

  public List<Relation> getDataRows() {
    return dataRows;
  }

  public void setDataRows(List<Relation> dataRows) {
    this.dataRows = dataRows;
  }

  public Long getLastSyncServerTimeFromClient() {
    return lastSyncServerTimeFromClient;
  }

  public void setLastSyncServerTimeFromClient(Long lastSyncServerTimeFromClient) {
    this.lastSyncServerTimeFromClient = lastSyncServerTimeFromClient;
  }

  @Override
  public String toString() {
    return "ReceivedLocalRecords [dataRows=" + dataRows + ", lastSyncServerTimeFromClient="
        + lastSyncServerTimeFromClient + "]";
  }

}
