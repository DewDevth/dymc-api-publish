SELECT dfv.form_id,dfv.seq,dfv.topic_id,dfv.row_id,dfv.col_id,dfv.topic_value,dpp.PROP_LIST
FROM KPDBA.DYMCHK_FORM_VALUE dfv
JOIN  KPDBA.DYMCHK_PROT_PROP dpp ON dfv.col_id = dpp.prop_id
Where dpp.prop_list = 'Radio' AND DFV.TOPIC_VALUE = 'T'
AND dfv.form_id = :S_FORM_ID AND DFV.SEQ = :S_SEQ AND DFV.TOPIC_ID = :S_TOPIC_ID