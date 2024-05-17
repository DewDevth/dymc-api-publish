const express = require("express");

const formRouter = require("./routes/forms/Form");
const approveRouter = require("./routes/approve/Approve");
const formTodoRouter = require("./routes/form-todo/formtodo");
const sqlTabRouter = require("./routes/sqltab/sqltab");
const protRouter = require("./routes/prot/prot");
const taskRouter = require("./routes/task/task");
const jobonwebRouter = require("./routes/jobonweb/jobonweb");
const rolesRouter = require("./routes/roles/roles");
const duplicateRouter = require("./routes/duplicate/duplicate");

require('dotenv').config();

const os = require("os");

const cors = require("cors");
const app = express();
const port = 5003;

app.use(cors({ origin: "*" }));
app.use(express.json());
const bodyParser = require("body-parser");
app.use(bodyParser.json());



//get form list
app.use("/api/v1/", formRouter);

app.use("/api/v1/", approveRouter);

// route ฟอร์มที่ต้องทำ
app.use("/api/v1/", formTodoRouter);

// route sql tab
app.use("/api/v1/", sqlTabRouter);

// route prot
app.use("/api/v1/", protRouter);

// route tasks
app.use("/api/v1/", taskRouter);


// route job on web
app.use("/api/v1/", jobonwebRouter);


// route role manage
app.use("/api/v1/", rolesRouter);

// route duplicate
app.use("/api/v1/", duplicateRouter);



const networkInterfaces = os.networkInterfaces();

let ipv4Address = "";

// หา IPv4 address จาก networkInterfaces
for (const interfaceName in networkInterfaces) {
  const interfaces = networkInterfaces[interfaceName];
  for (const iface of interfaces) {
    if (iface.family === "IPv4" && !iface.internal) {
      ipv4Address = iface.address;
      break;
    }
  }
  if (ipv4Address) {
    break;
  }
}

app.listen(port, () => {
  console.log(`Server is running on http://${ipv4Address}:${port}`);
});

