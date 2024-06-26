SELECT
    COUNT(1)
FROM
    (
        SELECT
            DF.FORM_ID
        FROM
            KPDBA.DYMCHK_FORM DF
            JOIN KPDBA.DYMCHK_FORM_VALUE DV ON DF.FORM_ID = DV.FORM_ID
            JOIN KPDBA.DYMCHK_PROT DP ON DF.PROT_ID = DP.PROT_ID
            JOIN KPDBA.DYMCHK_PROT_PROP PP ON DP.PROT_ID = PP.PROT_ID
            JOIN KPDBA.SQL_TAB_SOA SS ON PP.PROP_VALUE = SS.SQL_NO
        WHERE
            DP.ISO_DOC_CODE = 'FA/044'
            AND NVL(DP.CANCEL_FLAG, 'F') = 'F'
            AND PP.PROP_TYPE = 'sqlTabText'
            AND SS.SQL_NO BETWEEN 700790001
            AND 700799999
            AND SS.SQL_DESC = 'สินค้า'
            AND DV.TOPIC_VALUE = :S_PROD_ID
    ) PD FULL
    OUTER JOIN (
        SELECT
            DF.FORM_ID
        FROM
            KPDBA.DYMCHK_FORM DF
            JOIN KPDBA.DYMCHK_FORM_VALUE DV ON DF.FORM_ID = DV.FORM_ID
            JOIN KPDBA.DYMCHK_PROT DP ON DF.PROT_ID = DP.PROT_ID
            JOIN KPDBA.DYMCHK_PROT_PROP PP ON DP.PROT_ID = PP.PROT_ID
            JOIN KPDBA.SQL_TAB_SOA SS ON PP.PROP_VALUE = SS.SQL_NO
        WHERE
            DP.ISO_DOC_CODE = 'FA/044'
            AND NVL(DP.CANCEL_FLAG, 'F') = 'F'
            AND PP.PROP_TYPE = 'sqlTabText'
            AND SS.SQL_NO BETWEEN 700790001
            AND 700799999
            AND SS.SQL_DESC = 'เครื่องพิมพ์'
            AND DV.TOPIC_VALUE = :S_MACH_ID
    ) MC ON PD.FORM_ID = MC.FORM_ID
WHERE
    PD.FORM_ID = MC.FORM_ID