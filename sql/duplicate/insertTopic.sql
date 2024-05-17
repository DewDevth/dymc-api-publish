INSERT INTO
    KPDBA.DYMCHK_PROT_TOPIC (
        PROT_ID,
        TOPIC_ID,
        TOPIC_TYPE,
        TOPIC_NO,
        CR_DATE,
        CR_OID,
        CR_UID,
        CANCEL_FLAG
    )
VALUES
    (
        :S_PROT_ID,
        :S_TOPIC_ID,
        :S_TOPIC_TYPE,
        :S_TOPIC_NO,
        :S_CR_DATE,
        :S_CR_OID,
        :S_CR_UID,
        'F'
    )