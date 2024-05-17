INSERT INTO KPDBA.DYMCHK_PROT_PROP (
  PROT_ID,
  TOPIC_ID,
  PROP_ID,
  PROP_TYPE,
  PROP_VALUE,
  CR_DATE,
  CR_UID,
  CR_OID,
  CANCEL_FLAG,
  UPDATE_DATE, 
  UPDATE_UID,
  UPDATE_OID
) VALUES (
  :S_PROT_ID,
  :S_TOPIC_ID,
  :S_PROP_ID,
  :S_PROP_TYPE,
  :S_PROP_VALUE,
  :S_CR_DATE,
  :S_CR_UID,
  :S_CR_OID,
  'F',
  :S_UPDATE_DATE, 
  :S_UPDATE_UID,
  :S_UPDATE_OID
)
