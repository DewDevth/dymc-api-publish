const { connectToDatabase } = require("../../database/db"); // เรียกใช้โมดูล connectToDatabase จากไฟล์ db.js
const fs = require("fs");
const path = require("path");

const getUrl = async (req, res) => {
    try {
        // เชื่อมต่อกับฐานข้อมูล
        const connection = await connectToDatabase();
        // หาที่อยู่ของไฟล์ .sql
        const sqlFilePath = path.join(__dirname, "../../sql/url/getUrl.sql");
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

            // สร้าง ID ด้วยการเพิ่มเลขลำดับของแถว
            rowData.ID = index + 1; // หรือคุณสามารถใช้วิธีการสร้าง ID อื่น ๆ ตามที่คุณต้องการ

            return rowData;
        });




        // ส่งข้อมูลกลับไปยังผู้ใช้งาน
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error fetching orders data");
    }
}







module.exports = {
    getUrl,
};
