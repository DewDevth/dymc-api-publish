INSERT INTO
    KPDBA.DYMCHK_ROLES (
        ROLE_NO,
        ROLE_DESC,
        SQL_STMT,
        CR_DATE,
        CR_USER_ID,
        CR_ORG_ID
    )
VALUES
    (
        :S_ROLE_NO,
        :S_ROLE_DESC,
        :S_SQL_STMT,
        :S_CR_DATE,
        :S_CR_USER_ID,
        :S_CR_ORG_ID
    )