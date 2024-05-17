INSERT INTO
  KPDBA.DYMCHK_FORM_USER (
    FORM_ID,
    SEQ,
    USER_ID,
    CR_DATE,
    CR_UID,
    CR_OID,
    CANCEL_FLAG,
    STATUS
  )
VALUES
  (
    :S_FORM_ID,
    :S_SEQ,
    :S_USER_ID,
    :S_CR_DATE,
    :S_CR_UID,
    :S_CR_OID,
    :S_CANCEL_FLAG,
    :S_STATUS
  )