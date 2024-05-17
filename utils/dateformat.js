function formatDateTime(inputDate) {
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true, // เพื่อให้แสดง AM/PM
  };

  const formattedDate = inputDate.toLocaleString("en-US", options);

  // แยกวัน เดือน ปี และเวลา
  const parts = formattedDate.split(", ");
  const [datePart, timePart] = parts;

  // สลับตำแหน่งของวัน เดือน ปี
  const [month, day, year] = datePart.split("/");
  const reorderedDate = `${day}/${month}/${year}`;

  // รวมกลับเป็นรูปแบบใหม่
  return `${reorderedDate} ${timePart}`;
}

module.exports = {
  formatDateTime,
};
