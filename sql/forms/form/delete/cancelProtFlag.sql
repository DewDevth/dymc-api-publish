UPDATE KPDBA.DYMCHK_PROT
SET
  CANCEL_FLAG = :S_CANCEL_FLAG,
  UPDATE_DATE = :S_UPDATE_DATE,
  UPDATE_OID = :S_UPDATE_OID,
  UPDATE_UID = :S_UPDATE_UID
WHERE
  PROT_ID = :S_PROT_ID


