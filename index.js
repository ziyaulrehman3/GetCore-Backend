// https://elements.envato.com/payonta-banking-business-loan-html5-template-TFVVYGN

import express from "express";
import dotenv from "dotenv";
dotenv.config();

import cron from "node-cron";
import cors from "cors";
import multer from "multer";
import fs from "fs";

import cloudinary from "./Components/cloudinary.js";
import { JWTSign, JWTVerify } from "./Components/JWT.js";
import {
  CreateCustumer,
  DeleteCustumer,
  FindCustumer,
  UpdateCustumer,
  CustumerExist,
  CustumerNoExist,
  CreateSingleLoan,
  DeleteSingleLoan,
  DepositSingleLoan,
  SettleSingleLoan,
  CreateEmiLoan,
  DeleteEmiLoan,
  DepositEmiLoan,
  SettleEmiLoan,
  IntrestApply,
  CustumerList,
  GenerateLoanList,
} from "./Components/Database.js";

const app = express();

app.use(express.json());
app.use(cors());

const upload = multer({ dest: "uploads/" });

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = JWTSign();
    res.status(200).json({ token: token, message: "Access Grant!" });
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

app.post(
  "/createCustumer",
  JWTVerify,
  upload.fields([
    { name: "panUrl", maxCount: 1 },
    { name: "aadharUrl", maxCount: 1 },
    { name: "bankUrl", maxCount: 1 },
    { name: "photoUrl", maxCount: 1 },
    { name: "otherUrl", maxCount: 1 },
  ]),
  CustumerExist,

  async (req, res) => {
    const custumer = { ...req.body };

    try {
      FindCustumer();

      const uploadCloudinary = async (pathURL) => {
        try {
          const result = await cloudinary.uploader.upload(pathURL);
          console.log(result);
          fs.unlinkSync(pathURL);
          return result.secure_url;
        } catch (err) {
          console.log(err);
        }
      };

      const fileKeys = [
        "panUrl",
        "aadharUrl",
        "bankUrl",
        "photoUrl",
        "otherUrl",
      ];

      for (const key of fileKeys) {
        if (req.files[key]) {
          custumer[key] = await uploadCloudinary(req.files[key][0].path);
        }
      }

      const custumerId = await CreateCustumer(custumer);
      res.status(200).json({
        custumerId: custumerId,
        message: "Custumer Created Succesfully",
      });
    } catch (err) {
      console.log(err);
      res.status(400).json({ message: "Unable to Create Custumer" });
    }
  }
);

app.get("/viewCustumer/:id", JWTVerify, async (req, res) => {
  const custumerId = req.params.id;
  const response = await FindCustumer(custumerId);

  if (response) {
    res
      .status(200)
      .json({ message: "Custumer Fund Succesfully", data: response });
  } else {
    res.status(401).json({ message: "Custumer not Found" });
  }
});

app.post(
  "/updateCustumer/:id",
  JWTVerify,
  upload.fields([
    { name: "panUrl", maxCount: 1 },
    { name: "aadharUrl", maxCount: 1 },
    { name: "bankUrl", maxCount: 1 },
    { name: "photoUrl", maxCount: 1 },
    { name: "otherUrl", maxCount: 1 },
  ]),
  async (req, res) => {
    const custumerId = req.params.id;

    const data = req.body;

    try {
      const uploadCloudinary = async (pathUrl) => {
        const result = await cloudinary.uploader.upload(pathUrl);
        fs.unlinkSync(pathUrl);
        return result.secure_url;
      };

      const fileKeys = [
        "panUrl",
        "aadharUrl",
        "bankUrl",
        "photoUrl",
        "otherUrl",
      ];

      for (const key of fileKeys) {
        if (req.files?.[key]) {
          data[key] = await uploadCloudinary(req.files[key][0].path);
        }
      }

      await UpdateCustumer(custumerId, data);

      res.status(200).json({ message: "Custumer Details Update Succesfully" });
    } catch (err) {
      console.log(err);
      res.status(400).json({ message: "Custumer Details not Update" });
    }
  }
);

app.delete("/deleteCustumer/:id", JWTVerify, async (req, res) => {
  try {
    await DeleteCustumer(req.params.id);

    res.status(200).json({ message: "Custumer Deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get("/custumerList", JWTVerify, async (req, res) => {
  try {
    const response = await CustumerList();
    res.status(200).json({ message: "Success", data: response });
  } catch (err) {
    res.status(400).json({ message: "Error at Database" });
  }
});

app.get("/LoanList", JWTVerify, async (req, res) => {
  try {
    const response = await GenerateLoanList();
    res.status(200).json({ message: "Success", data: response });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Error at Database" });
  }
});

// app.get("/analytics", JWTVerify, async (req, res) => {});
//Single Loan Start
app.post("/createSingleLoan/:id", JWTVerify, async (req, res) => {
  const custumerId = req.params.id;
  const data = {
    cusId: custumerId,
    ...req.body,
  };

  try {
    await CreateSingleLoan(data);
    res.status(200).json({ message: "Loan Created Succesfully" });
  } catch (err) {
    console.log(err);
    res.status(401).json({ message: "Unable to create Loan!" });
  }
});

app.delete("/deleteSingleLoan/:id", JWTVerify, async (req, res) => {
  try {
    await DeleteSingleLoan(req.params.id);
    res.status(200).json({ message: "Loan Delete Succesfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post("/depositSingleLoan/:id", JWTVerify, async (req, res) => {
  try {
    await DepositSingleLoan(req.params.id, req.body);

    res.status(200).json({ message: "Amount Deposit Succesfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get("/settleSingleLoan/:id", JWTVerify, async (req, res) => {
  try {
    await SettleSingleLoan(req.params.id);
    res.status(200).json({ message: "Loan Sattle Succesfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//Single Loan End

//EMI Loan Start

app.post("/createEmiLoan/:id", JWTVerify, async (req, res) => {
  try {
    console.log(req.body);
    await CreateEmiLoan(req.params.id, req.body);
    res.status(200).json({ message: "Loan Created Succesfully" });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
});

app.delete("/deleteEmiLoan/:id", JWTVerify, async (req, res) => {
  try {
    await DeleteEmiLoan(req.params.id);
    res.status(200).json({ message: "Loan Delete Succesfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post("/depositEmiLoan/:id", JWTVerify, async (req, res) => {
  try {
    await DepositEmiLoan(req.params.id, req.body);
    res.status(200).json({ message: "Amount Deposit Succesfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get("/settleEmiLoan/:id", JWTVerify, async (req, res) => {
  try {
    await SettleEmiLoan(req.params.id);
    res.status(200).json({ message: "Loan Sattle Succesfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

cron.schedule("0 * * * * *", () => {
  // console.log("hii");
  IntrestApply();
});

//EMI Loan End

app.listen(3000, () => {
  console.log("Server is running");
});
