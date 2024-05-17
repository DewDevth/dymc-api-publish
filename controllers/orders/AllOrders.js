const { connectToDatabase } = require("../../database/db"); // เรียกใช้โมดูล connectToDatabase จากไฟล์ db.js
const fs = require("fs");
const path = require("path");





const getOrders = async (req, res) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();
    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(__dirname, "../../sql/orders/getOrders.sql");
    // อ่านไฟล์ SQL แยก
    const sql = fs.readFileSync(sqlFilePath, "utf-8");
    // ดำเนินการกับฐานข้อมูล (ตัวอย่าง: ส่งคำสั่ง SQL)
    const result = await connection.execute(sql);
    // ปิดการเชื่อมต่อ
    await connection.close();
    const ChildenData = await getOrderitems();

    const rows = result.rows.map((row, index) => {
      const rowData = {};
      result.metaData.forEach((meta, index) => {
        rowData[meta.name] = row[index];
      });

      // สร้าง ID ด้วยการเพิ่มเลขลำดับของแถว
      rowData.key = index + 1; // หรือคุณสามารถใช้วิธีการสร้าง ID อื่น ๆ ตามที่คุณต้องการ

      return rowData;
    });
    // Create a mapping of DOC_ID to ChildenData
    const childenDataMap = {};
    if (ChildenData.length > 0) {
      ChildenData.forEach((child) => {
        const docId = child.DOC_ID;
        if (!childenDataMap[docId]) {
          childenDataMap[docId] = [];
        }
        // if (child.RECEIVE_DATE !== "") {
        //   childenDataMap[docId] = [];
        // }
        childenDataMap[docId].push(child);

      });
    }


    // Transform the data
    const formattedData = formatDataHead(rows)
    // console.log("rows", rows[11111])
    // console.log("formattedData", formattedData[11111])



    // stageTypePPOD data
    const stageTypePPOD = [
      {
        ST_NO: 1,
        ST_DESC: "เปิดใบสั่งอาร์ตเวิร์ค"
      },
      {
        ST_NO: 2,
        ST_DESC: "ตรวจสอบและแก้ไข"
      },
      {
        ST_NO: 3,
        ST_DESC: "ดำเนินการใบสั่งอาร์ตเวิร์ค"
      },
      {
        ST_NO: 4,
        ST_DESC: "ตรวจสอบหลังเรียง"
      },
      {
        ST_NO: 5,
        ST_DESC: "ไม่สั่งเรียง(ออกรีวิชั่นใหม่)"
      },
    ]




    //แก้ไขแถวเพื่อรวมรายการย่อยตาม DOC_ID
    const rowsWithChildren = formattedData.map((row) => {
      const docId = row.DOC_ID;
      const children = childenDataMap[docId] || [];

      // ตรวจสอบว่า children ไม่ว่าง
      if (children.length > 0) {
        const parentID = row.key;
        let childrenWithID = children.map((child, index) => {
          // เพิ่ม key ใน children ให้เป็นผลลัพธ์ที่คุณต้องการ
          child.key = `${parentID}.${index + 1}`;
          //new
          child.GenID = index + 1;
          return child;
        });

        // ตรวจสอบว่าทุก child ใน children มี RESULT เป็น "สำเร็จ" หรือไม่
        const allChildrenSuccessful = childrenWithID.every((child) => child.RESULT === "เสร็จ");





        //เช็คประเภทเอกสาร
        // CEOD
        if (row.DOC_TYPE === "CEOD") {
          // ceod
          const stageTypeCNC = [
            {
              ST_NO: 1,
              ST_DESC: "บันทึกใบสั่ง CNC"
            },
            {
              ST_NO: 2,
              ST_DESC: "รับใบสั่ง CNC"
            },
            {
              ST_NO: 4,
              ST_DESC: "ดำเนินการใบสั่ง CNC"
            },
            {
              ST_NO: 3,
              ST_DESC: "ตรวจสอบใบสั่ง CNC"
            },
            {
              ST_NO: 5,
              ST_DESC: "ส่งใบสั่ง CNC"
            },
          ]



          // ตรวจสอบเงื่อนไขในการตั้งค่าค่า RESULT ของตัวหลัก
          if (row.RECEIVE_DATE === null) {
            row.RESULT = "PD";

          } else if (row.RESULT === "เสร็จ") {

            row.RESULT = "เสร็จ";
          } else if (allChildrenSuccessful) {

            row.RESULT = "เสร็จ";
          } else if (row.WORK_DESC === stageTypeCNC[0].ST_DESC) {

            row.RESULT = "PD";
          } else if (row.WORK_DESC === stageTypeCNC[1].ST_DESC) {

            row.RESULT = "รอ";
          } else if (row.WORK_DESC === stageTypeCNC[2].ST_DESC) {

            row.RESULT = "กำลังทำ";
          } else if (row.WORK_DESC === stageTypeCNC[3].ST_DESC) {

            row.RESULT = "เสร็จ";
          } else if (row.WORK_DESC === stageTypeCNC[4].ST_DESC) {

            row.RESULT = "เสร็จ";
          }





        }


        // PFOD
        if (row.DOC_TYPE === "PFOD") {
          const stageTypePFOD = [
            {
              ST_NO: 1,
              ST_DESC: "เปิดใบขอจัดจ้างทำฟิล์ม"
            },
            {
              ST_NO: 2,
              ST_DESC: "รับใบขอจัดจ้างทำฟิล์ม"
            },
            {
              ST_NO: 3,
              ST_DESC: "ดำเนินการใบขอจัดจ้างทำฟิล์ม"
            },
            {
              ST_NO: 4,
              ST_DESC: "ส่งใบขอจัดจ้างทำฟิล์ม"
            },
            {
              ST_NO: 5,
              ST_DESC: "ตรวจสอบใบขอจัดจ้างฟิล์ม"
            },
          ]

          // if (row.DOC_ID === "F6608002") {
          //   console.log("status start", row.RESULT)
          //   console.log("RECEIVE_DATE", row.RECEIVE_DATE)
          // }
          // ตรวจสอบเงื่อนไขในการตั้งค่าค่า RESULT ของตัวหลัก
          if (row.RECEIVE_DATE === null) {
            row.RESULT = "PD";
            // if (row.DOC_ID === "F6608002") {
            //   console.log("1", row.RESULT)
            // }
          } else if (row.RESULT === "เสร็จ") {
            // if (row.DOC_ID === "F6608002") {
            //   console.log("2", row.RESULT)
            // }
            row.RESULT = "เสร็จ";
          } else if (allChildrenSuccessful) {
            // if (row.DOC_ID === "F6608002") {
            //   console.log("3", row.RESULT)
            // }
            row.RESULT = "เสร็จ";
          } else if (row.WORK_DESC === stageTypePFOD[0].ST_DESC) {
            // if (row.DOC_ID === "F6608002") {
            //   console.log("4", row.RESULT)
            // }
            row.RESULT = "PD";
          } else if (row.WORK_DESC === stageTypePFOD[1].ST_DESC) {
            // if (row.DOC_ID === "F6608002") {
            //   console.log("5", row.RESULT)
            // }
            row.RESULT = "รอ";
          } else if (row.WORK_DESC === stageTypePFOD[2].ST_DESC) {
            // if (row.DOC_ID === "F6608002") {
            //   console.log("6", row.RESULT)
            // }
            row.RESULT = "กำลังทำ";
          } else if (row.WORK_DESC === stageTypePFOD[3].ST_DESC) {
            // if (row.DOC_ID === "F6608002") {
            //   console.log("7", row.RESULT)
            // }
            row.RESULT = "เสร็จ";
          } else if (row.WORK_DESC === stageTypePFOD[4].ST_DESC) {
            // if (row.DOC_ID === "F6608002") {
            //   console.log("8", row.RESULT)
            // }
            row.RESULT = "เสร็จ";
          }

          // if (row.DOC_ID === "F6608002") {
          //   console.log("status end", row.RESULT)
          //   console.log("type WORK_DESC", row.WORK_DESC)

          // }

        }

        // BSOD
        if (row.DOC_TYPE === "BSOD") {
          const stageTypeBSOD = [
            {
              ST_NO: 1,
              ST_DESC: "เปิดใบตัดกล่องตัวอย่าง"
            },
            {
              ST_NO: 2,
              ST_DESC: "กำหนดความต้องการ"
            },
            {
              ST_NO: 3,
              ST_DESC: "รับใบสั่งตัดกล่องตัวอย่าง"
            },
            {
              ST_NO: 4,
              ST_DESC: "บันทึกปฏิบัติงาน"
            },
            {
              ST_NO: 5,
              ST_DESC: "สั่งใบตัดกล่องตัวอย่าง"
            },
            {
              ST_NO: 6,
              ST_DESC: "ตรวจสอบใบสั่งตัดกล่องตัวอย่าง"
            },
            {
              ST_NO: 7,
              ST_DESC: "สรุปจบงาน"
            },
          ]

          // ตรวจสอบเงื่อนไขในการตั้งค่าค่า RESULT ของตัวหลัก
          if (row.RECEIVE_DATE === null) {
            row.RESULT = "PD";

          } else if (row.WORK_DESC === stageTypeBSOD[0].ST_DESC) {

            row.RESULT = "PD";
          } else if (row.WORK_DESC === stageTypeBSOD[1].ST_DESC) {

            row.RESULT = "PD";
          } else if (row.WORK_DESC === stageTypeBSOD[2].ST_DESC) {

            row.RESULT = "รอ";
          } else if (row.WORK_DESC === stageTypeBSOD[3].ST_DESC) {


            if (allChildrenSuccessful) {
              row.RESULT = "เสร็จ";

            } else {
              row.RESULT = "กำลังทำ";
            }

          } else if (row.WORK_DESC === stageTypeBSOD[4].ST_DESC) {

            row.RESULT = "เสร็จ";
          } else if (row.WORK_DESC === stageTypeBSOD[5].ST_DESC) {

            row.RESULT = "เสร็จ";
          } else if (row.WORK_DESC === stageTypeBSOD[6].ST_DESC) {

            row.RESULT = "เสร็จ";
          } else if (row.RESULT === "เสร็จ") {

            row.RESULT = "เสร็จ";
          } else if (allChildrenSuccessful) {

            row.RESULT = "เสร็จ";
          }



        }


        //PPOD New
        if (row.DOC_TYPE === "PPOD") {

          if (row.RESULT === "เสร็จ") {
            row.RESULT = "เสร็จ";
          } else if (row.RESULT === "รอ") {
            row.RESULT = "รอ";
          } else if (row.RESULT === "PD") {
            row.RESULT = "PD";
          } else {
            if (row.RESULT === null) {
              if (allChildrenSuccessful) {
                row.RESULT = "เสร็จ";
              } else {
                row.RESULT = "กำลังทำ";
              }
            }
          }

          // หาวันที่น้อยที่สุดจาก childrenWithID เเละใส่ใน head หลัก
          // Extract DISPATCH_DATE values from childrenWithID array
          const dispatchDates = childrenWithID.map(item => item.DISPATCH_DATE);
          // Filter out null or undefined values
          const validDispatchDates = dispatchDates.filter(date => date);
          // Find the minimum date
          const minDispatchDate = new Date(Math.min(...validDispatchDates));
          row.DISPATCH_DATE = minDispatchDate
        }







        // ถ้าเป็น เสร็จ ให้ ใส่เวลา 
        if (row.RESULT === "เสร็จ") {

          // // ดึงค่า FINISHED_DATE จากอาเรย์ childrenWithID
          const finishedDates = childrenWithID.map(item => item.FINISHED_DATE);

          // กรองค่าวันที่ที่ไม่ใช่ null หรือ undefined
          const validFinishedDates = finishedDates.filter(date => date);

          // หาวันที่มากที่สุดหรือใช้วันที่ปัจจุบันหากไม่มีวันที่ที่ถูกต้อง
          const maxFinishedDate = validFinishedDates.length > 0
            ? new Date(Math.max(...validFinishedDates))
            : new Date();

          if (row.FINISHED_DATE < maxFinishedDate) {
            row.FINISHED_DATE = maxFinishedDate;
          }

        }



        // ตรวจสอบว่า RESULT เป็น "PD" หรือไม่ หากใช่ ไม่ต้องรวมรายการลูก
        if (row.RESULT !== "PD") {
          return {
            ...row,
            children: childrenWithID,
          };
        }


        // หาก RESULT เป็น "PD" ไม่ต้องรวมรายการย่อย
        return {
          ...row,
        };
      }





      //PPOD no chlid 
      if (row.DOC_TYPE === "PPOD") {
        if (row.RESULT === "เสร็จ") {
          row.RESULT = "เสร็จ";
        } else if (row.RESULT === "รอ") {
          row.RESULT = "รอ";
        } else if (row.RESULT === "PD") {
          row.RESULT = "PD";
        } else {
          row.RESULT = "รอ";
        }

        // else {
        //   if (row.RESULT === null) {
        //     if (allChildrenSuccessful) {
        //       row.RESULT = "เสร็จ";
        //     } else {
        //       row.RESULT = "กำลังทำ";
        //     }
        //   }
        // }


      }






      if (row.DOC_TYPE !== "PPOD") {
        // ถ้าไม่มี children
        row.RESULT = "รอ";
      }



      return {
        ...row,

      };
    });

    // console.log("count length = ==", rowsWithChildren.length)


    // ส่งข้อมูลกลับไปยังผู้ใช้งาน
    res.status(200).json(rowsWithChildren);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error fetching orders data");
  }
}




const getOrderitems = async (req, res) => {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    const connection = await connectToDatabase();

    // หาที่อยู่ของไฟล์ .sql
    const sqlFilePath = path.join(__dirname, "../../sql/orders/getChildOrders.sql");
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
      rowData.key = index + 1; // หรือคุณสามารถใช้วิธีการสร้าง ID อื่น ๆ ตามที่คุณต้องการ



      return rowData;
    });


    // Transform the data
    const formattedData = formatData(rows);
    // ส่งข้อมูลกลับไปยังผู้ใช้งาน
    return formattedData
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error fetching orders child data");
  }

}

const formatData = (data) => {
  return data.map((item) => {
    return {
      DOC_TYPE: item.DOC_TYPE,
      RECEIVE_DATE: "",
      PRODUCT: "",
      DOC_ID: item.DOC_ID,
      CUST_NAME: item.CUST_NAME,
      PROD_DESC: item.WORK_DESC,  // Change the key name here
      SALE_NAME: item.SALE_NAME,
      USER_NAME: item.USER_NAME,
      WORK_ORDER: item.WORK_ORDER,
      WORK_DESC: item.TOPIC_GRP_DESC, // Change the key name here
      OPERATE_BY: item.OPERATE_BY,
      DISPATCH_DATE: item.DISPATCH_DATE,
      FINISHED_DATE: item.FINISHED_DATE,
      RESULT: item.RESULT,
      IS_ITEM: true,



    };
  });
};


const formatDataHead = (data) => {
  // console.log(data)
  return data.map((item) => {
    return {
      DOC_TYPE: item.DOC_TYPE,
      STAT: item.STAT,
      DEL_STAT: item.DEL_STAT,
      RECEIVE_DATE: item.RECEIVE_DATE,
      PRODUCT: item.PRODUCT,
      DOC_ID: item.DOC_ID,
      CUST_NAME: item.CUST_NAME,
      PROD_DESC: item.PROD_DESC,  // Change the key name here
      SALE_NAME: item.SALE_NAME,
      USER_NAME: item.USER_NAME,
      WORK_ORDER: item.WORK_ORDER,
      WORK_DESC: item.CURR_ST_DESC, // Change the key name here
      OPERATE_BY: item.OPERATER,
      DISPATCH_DATE: item.DISPATCH_DATE,
      FINISHED_DATE: item.FINISHED_DATE,
      RESULT: item.RESULT,
      key: item.key



    };
  });
};

module.exports = {
  getOrders,
};
