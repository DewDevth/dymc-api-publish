SELECT prod_id || revision AS "ID", p.*
FROM kpdba.product p
WHERE prod_id || revision = :S_PROD_ID
AND ROWNUM = 1