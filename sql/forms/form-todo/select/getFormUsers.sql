WITH FORMCOUNTS AS (
    SELECT
        FU.FORM_ID,
        FU.SEQ,
        COUNT(
            CASE
                WHEN FV.TOPIC_VALUE IS NOT NULL THEN 1
            END
        ) AS FORMITEMVALUECOUNT,
        COUNT(*) AS FORMITEMCOUNT,
         MAX(FU.UPDATE_DATE) AS UPDATE_DATE
    FROM
        KPDBA.DYMCHK_FORM_USER FU
        LEFT JOIN KPDBA.DYMCHK_FORM_VALUE FV ON FU.FORM_ID = FV.FORM_ID
        AND FU.SEQ = FV.SEQ
    GROUP BY
        FU.FORM_ID,
        FU.SEQ
)
SELECT 
    FU.FORM_ID,
    FU.SEQ,
    DF.URL,
    FU.USER_ID,
    DP.PROT_ID,
    FU.CANCEL_FLAG,
    FU.CANCEL_DATE,
    FU.CANCEL_UID,
    FU.CANCEL_OID,
    MAX(FC.UPDATE_DATE) AS UPDATE_DATE,
    CASE
       WHEN FU.CANCEL_FLAG = 'T' THEN 'ยกเลิก'
        WHEN MAX(DF.END_DATE) >= CURRENT_DATE AND MAX(FC.FORMITEMVALUECOUNT) = 0 THEN 'รอ'
        WHEN MAX(DF.END_DATE) >= CURRENT_DATE AND MAX(FC.FORMITEMVALUECOUNT) = MAX(FC.FORMITEMCOUNT) THEN 'เสร็จ'
        WHEN MAX(DF.END_DATE) >= CURRENT_DATE AND MAX(FC.FORMITEMVALUECOUNT) > 0 THEN 'กำลังทำ'
        WHEN (
            (
                MAX(DF.END_DATE) <= CURRENT_DATE
                AND MAX(FC.FORMITEMVALUECOUNT) = MAX(FC.FORMITEMCOUNT)
            )
            OR (
                MAX(DF.END_DATE) <= CURRENT_DATE
                AND MAX(FC.FORMITEMVALUECOUNT) > 0
            )
            OR (
                MAX(DF.END_DATE) >= CURRENT_DATE
                AND MAX(FC.FORMITEMVALUECOUNT) = MAX(FC.FORMITEMCOUNT)
            )
        ) THEN 'เสร็จ'
        WHEN MAX(DF.END_DATE) <= CURRENT_DATE THEN 'หมดเวลา'
          ELSE 'หมดเวลา'
    END AS STATUS   
FROM 
    KPDBA.DYMCHK_FORM_USER FU
LEFT JOIN 
    KPDBA.DYMCHK_FORM DF ON FU.FORM_ID = DF.FORM_ID
LEFT JOIN 
    KPDBA.DYMCHK_PROT DP ON DF.PROT_ID = DP.PROT_ID
LEFT JOIN
    FORMCOUNTS FC ON FU.FORM_ID = FC.FORM_ID AND FC.SEQ = FU.SEQ
WHERE  
    FU.FORM_ID = :S_FORM_ID
AND FU.CANCEL_FLAG <> 'P'
GROUP BY 
    FU.FORM_ID,
    FU.SEQ,
    DF.URL,
    FU.USER_ID,
    DP.PROT_ID,
    FU.CANCEL_FLAG,
    FU.CANCEL_DATE,
    FU.CANCEL_UID,
    FU.CANCEL_OID