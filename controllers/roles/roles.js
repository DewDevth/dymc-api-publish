const { connectToDatabase } = require("../../database/db"); // เรียกใช้โมดูล connectToDatabase จากไฟล์ db.js
const fs = require("fs");
const path = require("path");
const { generateRoleId, genUid } = require("../../utils/genId");
// position
const getPositions = async (req, res) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(__dirname, "../../sql/roles/getPositions.sql");
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

      // rowData.genId = genUid();
      return rowData;
    });

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error fetching position list data");
  }
};

// user permission
const deleteUserRoleById = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ message: "id are required" });
    }
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/roles/user/deleteUsersRole.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");
    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_USER_ID: id,
    });

    await connection.commit();
    res.status(200).json({ message: "ลบข้อมูลสำเร็จ" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error fetching delete role data");
  }
};

const createRoleUsers = async (req, res) => {
  try {
    const { users } = req.body;
    if (!users || users.length === 0) {
      return res.status(400).json({ message: "users are required" });
    }
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/roles/user/insertUserRole.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // Fetch duplicate users
    const usersDuplicate = await getUsersCheck();

    // Iterate through the array of users
    for (const user of users) {
      // Check if the user is a duplicate
      const isDuplicate = usersDuplicate.some(
        (duplicate) => duplicate.USER_ID === user.EMP_ID
      );

      // Execute SQL query based on whether the user is a duplicate or not
      if (isDuplicate) {
        await updateRoleUsers(connection, user);
      } else {
        // Insert a new record
        await connection.execute(sql, {
          S_ORG_ID: user.ORG_ID,
          S_USER_ID: user.EMP_ID,
          S_ROLE_NO: user.ROLE_ID,
        });
      }
    }

    await connection.commit();
    res.status(200).json({ message: "บันทึกข้อมูลสำเร็จ" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error fetching form approve list data");
  }
};

const updateRoleUsers = async (connection, user) => {
  try {
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/roles/user/updateUserRole.sql"
    );

    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // Insert a new record
    await connection.execute(sql, {
      S_USER_ID: user.EMP_ID,
      S_ROLE_NO: user.ROLE_ID,
    });

    await connection.commit();
    return;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const getUsersCheck = async () => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/roles/user/getUserRoleCheck.sql"
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

    return rows;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const getSqlStmtByRoleId = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ message: "id are required" });
    }
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    // GET users role
    const usersRoles = await getUersRoleId(id);
    // console.log(usersRoles);

    const stmt = await getStmtByRoleId(id);
    // console.log(stmt);
    if (stmt === "") {
      //   return res.status(400).json({ message: "stmt is empty!" });

      return res.status(200).json({
        users: [],
        usersSelected: usersRoles.length === 0 ? [] : usersRoles,
      });
    }

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(stmt);

    // ปิดการเชื่อมต่อ
    await connection.close();
    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });

      rowData.ROLE_ID = id;
      rowData.genId = genUid();
      return rowData;
    });

    const filteredRows = rows.filter(
      (user) =>
        !usersRoles.some((selectedUser) => selectedUser.EMP_ID === user.EMP_ID)
    );

    const newData = {
      users: filteredRows.length === 0 ? [] : filteredRows,
      usersSelected: usersRoles.length === 0 ? [] : usersRoles,
    };

    res.status(200).json(newData);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error fetching form approve list data");
  }
};

const getUersRoleId = async (id) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/roles/user/getUserByRoleId.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");

    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_ROLE_NO: id,
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

    const newUser = rows.map((item) => {
      return {
        EMP_ID: item.USER_ID,
        USERNAME: item.USERNAME,
        POS_DESC: item.POS_DESC,
        UNIT_ID: "",
        ORG_ID: item.ORG_ID,
        ROLE_ID: item.ROLE_NO,
        genId: genUid(),
      };
    });

    return newUser;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const getStmtByRoleId = async (id) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(
      __dirname,
      "../../sql/roles/user/getRoleStmt.sql"
    );
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");
    console.log(id)
    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_ROLE_NO: id,
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
    const stmtTxt = rows[0]?.SQL_STMT;
    return stmtTxt ? stmtTxt : "";
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

// role crud
const getRoles = async (req, res) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(__dirname, "../../sql/roles/getRolesAll.sql");
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

      rowData.genId = genUid();
      return rowData;
    });

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error fetching form approve list data");
  }
};

const createRole = async (req, res) => {
  try {
    const { userId, org, roleDesc, stmt } = req.body;
    // Check if id, userId, and org are provided
    if (!userId || !org || !roleDesc
      // || !stmt

    ) {
      return res
        .status(400)
        .json({ message: "userId, roleDesc, stmt are required" });
    }
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(__dirname, "../../sql/roles/insertRole.sql");
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");
    const date = new Date();

    const genIdRole = await generateRoleId();
    if (!genIdRole) {
      return res.status(400).json({ message: "genIdRole not found!" });
    }
    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    await connection.execute(sql, {
      S_ROLE_NO: genIdRole,
      S_ROLE_DESC: roleDesc,
      S_SQL_STMT: stmt,
      S_CR_DATE: date,
      S_CR_USER_ID: userId,
      S_CR_ORG_ID: org,
    });

    await connection.commit();
    res.status(200).json({ message: "บันทึกข้อมูลสำเร็จ" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error fetching form approve list data");
  }
};

const updateCancelRoleById = async (req, res) => {
  try {
    const { id, userId, org, flag } = req.body;
    // Check if id, userId, and org are provided
    if (!id || !userId || !org || !flag) {
      return res
        .status(400)
        .json({ message: "id, userId, and org are required" });
    }
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(__dirname, "../../sql/roles/cancelRole.sql");
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");
    const date = new Date();
    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_CANCEL_FLAG: flag === "F" ? "T" : "F",
      S_CANCEL_USER_ID: userId,
      S_CANCEL_ORG_ID: org,
      S_UP_DATE: date,
      S_UP_USER_ID: userId,
      S_UP_ORG_ID: org,
      S_ROLE_NO: id,
    });

    await connection.commit();
    res.status(200).json({ message: "อัพเดทข้อมูลสำเร็จ" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error fetching form approve list data");
  }
};

const updateRoleById = async (req, res) => {
  try {
    const { id, userId, org, roleDesc, stmt } = req.body;
    // Check if id, userId, and org are provided
    if (!id || !userId || !org || !roleDesc
      // || !stmt
    ) {
      return res
        .status(400)
        .json({ message: "id, userId, and org are required" });
    }
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(__dirname, "../../sql/roles/updateRole.sql");
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");
    const date = new Date();
    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_ROLE_DESC: roleDesc,
      S_SQL_STMT: stmt,
      S_CANCEL_USER_ID: userId,
      S_CANCEL_ORG_ID: org,
      S_UP_DATE: date,
      S_UP_USER_ID: userId,
      S_UP_ORG_ID: org,
      S_ROLE_NO: id,
    });

    await connection.commit();
    res.status(200).json({ message: "อัพเดทข้อมูลสำเร็จ" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error fetching form approve list data");
  }
};

const deleteRoleById = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ message: "id are required" });
    }
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(__dirname, "../../sql/roles/deleteRole.sql");
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");
    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql, {
      S_ROLE_NO: id,
    });

    await connection.commit();
    res.status(200).json({ message: "ลบข้อมูลสำเร็จ" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error fetching delete role data");
  }
};

module.exports = {
  getRoles,
  updateCancelRoleById,
  createRole,
  updateRoleById,
  deleteRoleById,
  getSqlStmtByRoleId,
  createRoleUsers,
  deleteUserRoleById,
  getPositions,
};
