UPDATE KPDBA.DYMCHK_PROT_OPTION
SET
  OPTION_DES = :S_OPTION_DES,
  OPTION_NO = :S_OPTION_NO,
  UPDATE_DATE = :S_UPDATE_DATE,
  UPDATE_OID = :S_UPDATE_OID,
  UPDATE_UID = :S_UPDATE_UID
WHERE
  PROT_ID = :S_PROT_ID AND
  TOPIC_ID = :S_TOPIC_ID