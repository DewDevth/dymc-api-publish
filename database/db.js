const oracledb = require("oracledb");
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// DEV
const oracleClientDev = 'C:\\oracle\\instantclient_11_2'
// PRODUCTION
const oracleClientPROD = 'C:\\oracle\\instantclient_11_2'


const oracleClientConfig = isProduction ? oracleClientPROD : oracleClientDev;
oracledb.initOracleClient({ libDir: oracleClientConfig });

// กำหนดข้อมูลการเชื่อมต่อกับ Oracle Database
const dbConfigProduction = {
  user: process.env.DB_USER_PROD,
  password: process.env.DB_PASSWORD_PROD,
  connectString: process.env.DB_CONNECT_STRING_PROD,
};
const dbConfigDevelopment = {
  user: process.env.DB_USER_DEV,
  password: process.env.DB_PASSWORD_DEV,
  connectString: process.env.DB_CONNECT_STRING_DEV,
};
const dbConfig = isProduction ? dbConfigProduction : dbConfigDevelopment;

// ฟังก์ชันสำหรับเชื่อมต่อกับ Oracle Database
async function connectToDatabase() {
  try {
    const connection = await oracledb.getConnection(dbConfig); // ใช้ dbConfig ตามสภาพแวดล้อมที่ถูกเลือก
    return connection;
  } catch (error) {
    throw new Error("ไม่สามารถเชื่อมต่อกับ Oracle Database ได้");
  }
}

module.exports = {
  connectToDatabase,
};