const { connectToDatabase } = require("../database/db");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");

// Function to generate a random 1to99999 5-digit number 

const generateRandomNumber3Digit = () => {
  return Math.floor(Math.random() * 99999) + 1;
};
// Function to generate a random 3-digit number
// old generateRandomNumber3Digit
// const generateRandomNumber3Digit = () => {
//   return Math.floor(Math.random() * 900) + 100;
// };


// const generateRandomNumber1to99999 = () => {
//   return Math.floor(Math.random() * 99999) + 1;
// };

// Function to generate random 4-digit number
const generateRandomNumber = () => {
  return Math.floor(1000 + Math.random() * 9000);
};

const generateIdZero = (type) => {
  const currentDate = new Date();
  const buddhistYear = (currentDate.getFullYear() + 543).toString().slice(-2);
  const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");

  // Generate a random 4-digit number for the GEN part
  // const genNumber = generateRandomNumber();
  const genNumber = "0001";
  if (type === "PROT") {
    // Formatting the ID
    const id = `DFD${buddhistYear}${month}${genNumber}`;
    return id;
  } else {
    // Formatting the ID
    const id = `DCS${buddhistYear}${month}${genNumber}`;
    return id;
  }
};

const generateProtId = async () => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(__dirname, "../sql/genId/genIdProt.sql");
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
    // console.log(rows)

    // throw new Error("PROT_ID is empty");
    if (rows.length > 0) {
      return rows[0]?.PROT_ID;
    } else {
      const newId = generateIdZero("PROT");
      return newId;
    }
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const generateFormId = async () => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(__dirname, "../sql/genId/genIdForm.sql");
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

    if (rows.length > 0) {
      return rows[0]?.FORM_ID;
    } else {
      const newId = generateIdZero("FORM");
      return newId;
    }
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const genUid = () => {
  return uuidv4();
};

const genUid15Digit = () => {
  const uuid = uuidv4();
  return uuid.slice(0, 15);
};

const genUid11Digit = () => {
  const uuid = uuidv4();
  return uuid.slice(0, 11);
};



const generateRoleId = async () => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(__dirname, "../sql/roles/genRoleId.sql");
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
  
    const newId = rows[0]?.NEXTVAL;
    // console.log(newId)

    return newId;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};


module.exports = {
  generateRandomNumber3Digit,
  generateProtId,
  generateRandomNumber,
  genUid,
  genUid15Digit,
  genUid11Digit,
  generateFormId,
  generateRoleId,
};
