   SELECT
        FU.FORM_ID,
        FU.SEQ,
        MAX(DF.END_DATE) AS END_DATE,
        COUNT(
            CASE
                WHEN FV.TOPIC_VALUE IS NOT NULL THEN 1
            END
        ) AS FORMITEMVALUECOUNT,
        COUNT(*) AS FORMITEMCOUNT,
        CASE
            WHEN MAX(DF.END_DATE) >= CURRENT_DATE AND COUNT(
                CASE
                    WHEN FV.TOPIC_VALUE IS NOT NULL THEN 1
                END
            ) = 0 THEN 'รอ'
            WHEN MAX(DF.END_DATE) >= CURRENT_DATE AND COUNT(
                CASE
                    WHEN FV.TOPIC_VALUE IS NOT NULL THEN 1
                END
            ) = COUNT(*) THEN 'เสร็จ'
            WHEN MAX(DF.END_DATE) >= CURRENT_DATE AND COUNT(
                CASE
                    WHEN FV.TOPIC_VALUE IS NOT NULL THEN 1
                END
            ) > 0 THEN 'กำลังทำ'
            WHEN (
                (MAX(DF.END_DATE) <= CURRENT_DATE AND COUNT(
                    CASE
                        WHEN FV.TOPIC_VALUE IS NOT NULL THEN 1
                    END
                ) = COUNT(*))
                OR (MAX(DF.END_DATE) <= CURRENT_DATE AND COUNT(
                    CASE
                        WHEN FV.TOPIC_VALUE IS NOT NULL THEN 1
                    END
                ) > 0)
                OR (MAX(DF.END_DATE) >= CURRENT_DATE AND COUNT(
                    CASE
                        WHEN FV.TOPIC_VALUE IS NOT NULL THEN 1
                    END
                ) = COUNT(*))
            ) THEN 'เสร็จ'
            WHEN MAX(DF.END_DATE) <= CURRENT_DATE THEN 'หมดเวลา'
            ELSE 'หมดเวลา'
        END AS STATUS
    FROM
        KPDBA.DYMCHK_FORM_USER FU
    LEFT JOIN
        KPDBA.DYMCHK_FORM DF ON FU.FORM_ID = DF.FORM_ID
    LEFT JOIN
        KPDBA.DYMCHK_FORM_VALUE FV ON FU.FORM_ID = FV.FORM_ID AND FU.SEQ = FV.SEQ    
    GROUP BY
        FU.FORM_ID,
        FU.SEQ