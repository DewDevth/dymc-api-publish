const { connectToDatabase } = require("../../database/db"); // เรียกใช้โมดูล connectToDatabase จากไฟล์ db.js
const fs = require("fs");
const path = require("path");


const getTopicsTypes = async (req, res) => {
    try {

        const connection = await connectToDatabase();



        const sqlFilePath = path.join(__dirname, "../../sql/topics/getTopicType.sql");
        const sql = fs.readFileSync(sqlFilePath, "utf-8");

        const result = await connection.execute(sql);

        await connection.close();

        const rows = result.rows.map((row, index) => {
            const rowData = {};
            result.metaData.forEach((meta, index) => {
                rowData[meta.name] = row[index];
            });

            rowData.ID = index + 1;

         
            return rowData;
        });


        res.status(200).json(rows);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error fetching topics data");
    }

}


module.exports = {
    getTopicsTypes,
};
