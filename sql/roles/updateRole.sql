UPDATE
    KPDBA.DYMCHK_ROLES
SET
    ROLE_DESC = :S_ROLE_DESC,
    SQL_STMT = :S_SQL_STMT,
    CANCEL_USER_ID = :S_CANCEL_USER_ID,
    CANCEL_ORG_ID = :S_CANCEL_ORG_ID,
    UP_DATE = :S_UP_DATE,
    UP_USER_ID = :S_UP_USER_ID,
    UP_ORG_ID = :S_UP_ORG_ID
WHERE
    ROLE_NO = :S_ROLE_NO