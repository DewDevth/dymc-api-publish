const { connectToDatabase } = require("../../database/db"); // เรียกใช้โมดูล connectToDatabase จากไฟล์ db.js
const fs = require("fs");
const path = require("path");

const getRolesByRoleId = async (req, res) => {
  try {
    const { role_id } = req.body;
    if (!role_id) res.status(400).json("error role_id not found!");

    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();

    // // หาที่อยู่ของไฟล์ .sql
    // const sqlFilePath = path.join(__dirname, sqlTab);
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/sqltab/select/getRolesByRoleId.sql"
    );
    // // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    const result = await connection.execute(sql, {
      S_ROLE_NO: role_id,
    });

    // console.log("new result", result)

    // ปิดการเชื่อมต่อ
    await connection.close();

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });

      return rowData;
    });

    const formattedData = {
      head: [],
      data: rows,
    };

    // // Extracting keys from the first object in the rows array
    if (rows.length > 0) {
      formattedData.head = Object.keys(rows[0]);
    }
    res.status(200).json(formattedData);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error fetching data");
  }
};

const getRoleList = async (req, res) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/sqltab/select/getRoles.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql);

    // ปิดการเชื่อมต่อ
    await connection.close();

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });

      return rowData;
    });

    res.status(200).json(formattedDataRoles(rows));
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error fetching data");
  }
};

const getSqlTabAll = async (req, res) => {
  try {
    const { type } = req.body;
    if (!type) res.status(400).json("error type not found!");

    // selectDB DataDB

    let SqlTabSoaFrom = "";
    let SqlTabSoaTo = "";
    if (type === "selectDB") {
      SqlTabSoaFrom = "700790001";
      SqlTabSoaTo = "700791000";
    } else if (type === "DataDB") {
      SqlTabSoaFrom = "700791001";
      SqlTabSoaTo = "700792000";
    } else if (type === "Approval") {
      SqlTabSoaFrom = "700792001";
      SqlTabSoaTo = "700793000";
    }

    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/sqltab/select/getSqlTab.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_FROM: SqlTabSoaFrom,
      S_TO: SqlTabSoaTo,
    });

    // ปิดการเชื่อมต่อ
    await connection.close();

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });

      return rowData;
    });

    res.status(200).json(formattedDataSqlTab(rows));
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error fetching data");
  }
};

const getDataBySqlTab = async (req, res) => {
  try {
    const { sqlTab } = req.body;
    if (!sqlTab) res.status(400).json("error sqlTab not found!");

    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();

    // // หาที่อยู่ของไฟล์ .sql
    // const sqlFilePath = path.join(__dirname, sqlTab);
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/sqltab/select/getDataBySqlTab.sql"
    );
    // // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    const result = await connection.execute(sql, {
      S_SQL_NO: sqlTab,
    });

    // console.log("new result", result)

    // ปิดการเชื่อมต่อ
    await connection.close();

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });

      return rowData;
    });

    const newSqlData = rows[0].SQL_STMT;
    if (!newSqlData) res.status(400).json("data not found!");
    const newData = await GetDataUsingSQL(newSqlData);

    // Format the data
    const formattedData = {
      head: [],
      data: newData.map((item) => {
        // Reorder the keys so that 'ID' is the first key
        const reorderedItem = {
          ID: item.ID,
          ...item,
        };

        return reorderedItem;
      }),
    };

    // const formattedData = {
    //   head: [],
    //   data: newData,
    // };

    // console.log(Object.keys(newData[0]));

    // // Extracting keys from the first object in the rows array
    if (rows.length > 0) {
      formattedData.head = Object.keys(newData[0]);

      const idIndex = formattedData.head.indexOf("ID");
      if (idIndex !== -1) {
        formattedData.head.splice(idIndex, 1); // Remove 'ID' from its current position
        formattedData.head.unshift("ID"); // Add 'ID' to the beginning of the array
      }

      // console.log(formattedData.head);
    }
    // console.log(formattedData);

    res.status(200).json(formattedData);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error fetching data");
  }
};

const getDataBySqlTabApproval = async (req, res) => {
  try {
    const { sqlTab, role_id } = req.body;
    if (!sqlTab) res.status(400).json("error sqlTab not found!");

    // console.log(sqlTab);
    // console.log(role_id);

    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();

    // // หาที่อยู่ของไฟล์ .sql
    // const sqlFilePath = path.join(__dirname, sqlTab);
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/sqltab/select/getDataBySqlTab.sql"
    );
    // // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    const result = await connection.execute(sql, {
      S_SQL_NO: sqlTab,
    });

    // console.log("new result", result)

    // ปิดการเชื่อมต่อ
    await connection.close();

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });

      return rowData;
    });

    // console.log(rows);
    const newSqlData = rows[0].SQL_STMT;
    if (!newSqlData) res.status(400).json("data not found!");
    const newData = await GetDataBySqlTabAndRoleId(newSqlData, role_id);
    // console.log("newdata", newData);
    
    if (!newData || newData.length === 0) {
      // Handle case where newData is empty or undefined
      res.status(200).json({ head: [], data: [] });
    } else {
      const formattedData = {
        head: Object.keys(newData[0]),
        data: newData,
      };
      res.status(200).json(formattedData);
    }

   
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error fetching data");
  }
};

const GetDataBySqlTabAndRoleId = async (sql, roleId) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_ROLE_NO: roleId,
    });

    // ปิดการเชื่อมต่อ
    await connection.close();

    const rows = result.rows.map((row, index) => {
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

//get Topic
const GetDataUsingSQL = async (sql) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql);

    // ปิดการเชื่อมต่อ
    await connection.close();

    const rows = result.rows.map((row, index) => {
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

const formattedDataSqlTab = (data) => {
  return data.map((item) => {
    return {
      SQL_NO: String(item.SQL_NO), // Using toString() method
      SQL_DESC: item.SQL_DESC,
      SQL_STMT: item.SQL_STMT,
      SQL_LONG: item.SQL_LONG,
    };
  });
};
const formattedDataRoles = (data) => {
  return data.map((item) => {
    return {
      ROLE_NO: String(item.ROLE_NO),
      ROLE_DESC: item.ROLE_DESC,
    };
  });
};
module.exports = {
  getSqlTabAll,
  getDataBySqlTab,
  getRoleList,
  getRolesByRoleId,
  getDataBySqlTabApproval,
};
