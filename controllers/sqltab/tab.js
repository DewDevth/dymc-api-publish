const { connectToDatabase } = require("../../database/db");
const fs = require("fs");
const path = require("path");

const getDataUsingSqlTabNo = async (req, res) => {
    try {
        const { sqlTab, textSearch, defaultValue } = req.body;

        if (!sqlTab) {
            return res.status(400).json({ error: "sqlTab not found!" });
        }

        const connection = await connectToDatabase();

        const sqlFilePath = path.join(__dirname, "../../sql/sqltab/select/getDataBySqlTab.sql");
        const sql = fs.readFileSync(sqlFilePath, "utf-8");

        const result = await connection.execute(sql, { S_SQL_NO: sqlTab });


        const rows = result.rows.map(row => {
            const rowData = {};
            result.metaData.forEach((meta, index) => {
                rowData[meta.name] = row[index];
            });
            return rowData;
        });


        await connection.close();

        const isEmpty = rows.length === 0 || !rows[0].SQL_STMT || rows[0].SQL_STMT.trim() === "";
        // console.log(rows)
        if (rows.length === 0 || isEmpty) {
            return res.status(400).json({ error: "Data not found!" });
        }

        const newSqlData = rows[0].SQL_STMT;
        const newData = await getDataUsingSQL(newSqlData, textSearch, sqlTab, defaultValue);

        const formattedData = {
            head: [],
            data: newData.map(item => {
                const reorderedItem = { ID: item.ID, ...item };
                return reorderedItem;
            }),
        };

        if (newData.length > 0) {
            formattedData.head = Object.keys(newData[0]);
            const idIndex = formattedData.head.indexOf("ID");

            if (idIndex !== -1) {
                formattedData.head.splice(idIndex, 1);
                formattedData.head.unshift("ID");
            }
        }

        res.status(200).json(formattedData);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error fetching data");
    }
};

const getDataUsingSQL = async (sql, textSearch, sqlTabNo, defaultValue) => {
    try {
        const connection = await connectToDatabase();
        let result
        // ค่าที่บอกว่าต้อง filter ค่า ทั้งหมด หรือ ไม่
        let filterCondition

        let textSearchInSql = ""


        // ถ้ามีค่า defaultValue  
        if (defaultValue.trim() !== "") {

            // สินค้า
            if (sqlTabNo === "700790004") {
                // ถ้า textSearch มีค่า
                if (textSearch.trim() !== "") {
                    filterCondition = `
                    AND (
                        INSTR(LOWER(prod_id || '-' || revision), LOWER(:AS_TXT_SEARCH)) > 0
                        OR INSTR(LOWER(prod_id), LOWER(:AS_TXT_SEARCH)) > 0
                        OR INSTR(LOWER(prod_desc), LOWER(:AS_TXT_SEARCH)) > 0
                    )
                    `;

                    textSearchInSql = textSearch
                } else {
                    filterCondition = `
                    AND prod_id || revision = :AS_TXT_SEARCH
                    `;
                    textSearchInSql = defaultValue
                }




                // เครื่องพิมพ์
            } else if (sqlTabNo === "700790003" || sqlTabNo === "700791001") {


                // ถ้า textSearch มีค่า
                if (textSearch.trim() !== "") {
                    filterCondition = `
                    AND (
                        INSTR(LOWER(m.mach_id || ' ' || m.mach_name), LOWER(:AS_TXT_SEARCH)) > 0
                        OR INSTR(LOWER(m.mach_id), LOWER(:AS_TXT_SEARCH)) > 0
                        OR INSTR(LOWER(m.mach_name), LOWER(:AS_TXT_SEARCH)) > 0
                    )
                    `;

                    textSearchInSql = textSearch
                } else {
                    filterCondition = `
                    AND m.mach_id  = :AS_TXT_SEARCH
                     `;
                    textSearchInSql = defaultValue
                }


            }

            //ข้อมูล พนักงาน
            else if (sqlTabNo === "700790001") {

                // ถ้า textSearch มีค่า
                if (textSearch.trim() !== "") {
                    filterCondition = `
                    AND (
                        INSTR(LOWER(USER_ID), LOWER(:AS_TXT_SEARCH)) > 0
                        OR INSTR(LOWER(USER_NAME), LOWER(:AS_TXT_SEARCH)) > 0
                        OR INSTR(LOWER(E_MAIL), LOWER(:AS_TXT_SEARCH)) > 0
                    )
                    `;

                    textSearchInSql = textSearch
                } else {
                    filterCondition = `
                    AND USER_ID  = :AS_TXT_SEARCH
                    `;
                    textSearchInSql = defaultValue
                }

            }
            else {
                filterCondition = ""
            }


            if (textSearch.trim() !== "" || defaultValue.trim() !== "") {

                // Insert the filter condition into the original SQL query
                sql = sql.replace('/*FILTER*/', filterCondition);

                // Include the parameter only when textSearch is not empty
                result = await connection.execute(sql, { AS_TXT_SEARCH: textSearchInSql });
            } else {
                // If textSearch is empty, execute the original SQL query without the parameter
                result = await connection.execute(sql);

            }


        } else {
            // ไม่มีค่า defaultValue 

            // console.log("ไม่มีค่า defaultValue ", defaultValue)


            // If textSearch is not empty, add the condition to the SQL query
            if (textSearch !== '') {

                // สินค้า
                if (sqlTabNo === "700790004") {

                    filterCondition = `
                                    AND (
                                        INSTR(LOWER(prod_id || '-' || revision), LOWER(:AS_TXT_SEARCH)) > 0
                                        OR INSTR(LOWER(prod_id), LOWER(:AS_TXT_SEARCH)) > 0
                                        OR INSTR(LOWER(prod_desc), LOWER(:AS_TXT_SEARCH)) > 0
                                    )
                                    `;

                    // เครื่องพิมพ์
                } else if (sqlTabNo === "700790003" || sqlTabNo === "700791001") {
                    filterCondition = `
                                    AND (
                                        INSTR(LOWER(m.mach_id || ' ' || m.mach_name), LOWER(:AS_TXT_SEARCH)) > 0
                                        OR INSTR(LOWER(m.mach_id), LOWER(:AS_TXT_SEARCH)) > 0
                                        OR INSTR(LOWER(m.mach_name), LOWER(:AS_TXT_SEARCH)) > 0
                                    )
                                    `;
                }

                //ข้อมูล พนักงาน
                else if (sqlTabNo === "700790001") {
                    filterCondition = `
                    AND (
                        INSTR(LOWER(USER_ID), LOWER(:AS_TXT_SEARCH)) > 0
                        OR INSTR(LOWER(USER_NAME), LOWER(:AS_TXT_SEARCH)) > 0
                        OR INSTR(LOWER(E_MAIL), LOWER(:AS_TXT_SEARCH)) > 0
                    )
                    `;
                }
                else {
                    filterCondition = ""
                }

                textSearchInSql = textSearch



                // Insert the filter condition into the original SQL query
                sql = sql.replace('/*FILTER*/', filterCondition);

                // Include the parameter only when textSearch is not empty
                result = await connection.execute(sql, { AS_TXT_SEARCH: textSearchInSql });
            } else {
                // If textSearch is empty, execute the original SQL query without the parameter
                result = await connection.execute(sql);

            }

        }

        await connection.close();

        const rows = result.rows.map(row => {
            const rowData = {};
            result.metaData.forEach((meta, index) => {
                rowData[meta.name] = row[index];
            });
            return rowData;
        });

        return rows;
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
};


module.exports = {
    getDataUsingSqlTabNo,
};



