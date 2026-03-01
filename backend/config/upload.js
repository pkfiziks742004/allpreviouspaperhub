const multer = require("multer");
const path = require("path");

// Storage
const storage = multer.diskStorage({

  destination: (req,file,cb)=>{
    cb(null,"uploads/");
  },

  filename: (req,file,cb)=>{
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }

});


// File Filter (Only PDF)
const fileFilter = (req,file,cb)=>{

  if(file.mimetype === "application/pdf"){
    cb(null,true);
  }else{
    cb("Only PDF files allowed", false);
  }

};

const upload = multer({
  storage,
  fileFilter
});

module.exports = upload;
