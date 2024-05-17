UPDATE KPDBA.DYMCHK_PROT_PROP
SET
  PROP_VALUE = :S_PROP_VALUE,
  UPDATE_DATE = :S_UPDATE_DATE,
  UPDATE_OID = :S_UPDATE_OID,
  UPDATE_UID = :S_UPDATE_UID
WHERE
  PROT_ID = :S_PROT_ID AND
  TOPIC_ID = :S_TOPIC_ID AND
  PROP_TYPE = :S_PROP_TYPE