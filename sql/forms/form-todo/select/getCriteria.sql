SELECT pd.prot_id,PD.PROP_TYPE,PD.PROP_VALUE,STS.SQL_NO, STS.SQL_DESC
        FROM KPDBA.DYMCHK_PROT_PROP PD
          LEFT JOIN KPDBA.SQL_TAB_SOA STS ON PD.PROP_VALUE = STS.SQL_NO
           WHERE STS.SQL_NO BETWEEN 700790001 AND 700799999 AND PD.PROP_TYPE = 'sqlTabText'  AND
          PD.PROT_ID =:S_PROT_ID