require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';


const getTitleMode = async (req, res) => {
    try {
        // ส่งข้อมูลกลับไปยังผู้ใช้งาน
        res.status(200).json({ isProduction: isProduction });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error fetching mode title data");
    }
}







module.exports = {
    getTitleMode,
};
