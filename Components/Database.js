import mongoose from "mongoose";

const MongoSwitch = async (flag) => {
  flag
    ? await mongoose.connect(process.env.MONGO_URL)
    : await mongoose.disconnect();
};

//Custumer Start

const CustumerSchema = new mongoose.Schema({
  _id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },

  mobile: {
    type: Number,
    required: true,
    unique: true,
  },
  email: {
    type: String,
  },
  address: {
    type: String,
    required: true,
  },
  district: {
    type: String,
    required: true,
  },
  pinCode: {
    type: Number,
    required: true,
  },
  panNo: {
    type: String,
  },
  aadharNo: {
    type: String,
  },
  bankName: {
    type: String,
  },
  accountNo: {
    type: Number,
  },
  bankIfsc: {
    type: String,
  },
  singleLoanStack: {
    type: [Number],
  },
  emiLoanStack: {
    type: [Number],
  },
  panUrl: {
    type: String,
  },
  aadharUrl: {
    type: String,
  },
  bankUrl: {
    type: String,
  },
  photoUrl: {
    type: String,
  },
  otherUrl: {
    type: String,
  },
});

const Custumer = mongoose.model("Custumer", CustumerSchema);

export const CreateCustumer = async (data) => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    const newCustumer = new Custumer({ ...data, _id: data.mobile });
    const response = await newCustumer.save();
    return response._id;
  } catch (err) {
    console.log(err);
    throw new error(err.errorResponse.errmsg);
  }

  mongoose.disconnect();
};

export const UpdateCustumer = async (id, data) => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    const result = await Custumer.findOneAndUpdate({ _id: id }, data);
    return result;
  } catch (err) {
    throw new error("Error at Database!");
  }
};

export const DeleteCustumer = async (id) => {
  await MongoSwitch(true);
  try {
    const data = await Custumer.findOne({ _id: id });
    if (data.singleLoanStack.length === 0 && data.emiLoanStack.length === 0) {
      const response = await Custumer.deleteOne({ _id: id });
      await MongoSwitch(false);

      return true;
    }

    throw new Error("Custumer Having Loans");
  } catch (err) {
    await MongoSwitch(false);

    throw new Error("Unable to Delete");
  }
};

export const FindCustumer = async (id) => {
  await mongoose.connect(process.env.MONGO_URL);
  const response = await Custumer.findOne({ _id: id });
  mongoose.disconnect();

  return response;
};

export const CustumerExist = async (req, res, next) => {
  MongoSwitch(true);

  const result = await Custumer.findOne({ mobile: req.body.mobile });

  if (result) {
    return res.status(400).json({ message: "User already Exits!" });
  } else {
    next();
  }
};

export const CustumerNoExist = async (req, res, next) => {
  MongoSwitch(true);

  const result = await Custumer.findOne({ mobile: req.body.mobile });

  if (!result) {
    return res.status(400).json({ message: "User Not Exits!" });
  } else {
    next();
  }
};

export const CustumerList = async () => {
  await MongoSwitch(true);

  try {
    const list = await Custumer.find({}, "_id name");
    return list;
  } catch (err) {
    throw err;
  }
};

// export const Analytics=async ()=>{
//   const {
//     noOfCustumer,
//     activeCustumer,
//     inactiveCustumer,

//     emiLoanAmount
//     emiDueAmount,

//     singleLoanAmount,
//     singleDueAmount

//     todayDuePerson

//   }

// try{
//   const response=await Custumer.find();
// }

// }

//Custumer End

//Loan Comman Actions Start

const PassbookEntry = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    desc: {
      type: String,
      required: true,
    },
    credit: {
      type: Number,
      required: true,
    },
    debit: {
      type: Number,
      required: true,
    },
    balance: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

async function LoanNumberGenerator() {
  let LoanNumber;
  let unique = false;

  MongoSwitch(true);

  while (!unique) {
    LoanNumber = Math.floor(10000 + Math.random() * 90000);

    const result1 = await SingleLoan.findOne({ _id: LoanNumber });

    const result2 = await EmiLoan.findOne({ _id: LoanNumber });

    if (!result1 && !result2) {
      unique = true;
    }
  }

  MongoSwitch(false);

  return LoanNumber;
}

export async function GenerateLoanList() {
  MongoSwitch(true);

  try {
    const singleLoans = await SingleLoan.find();
    const emiLoans = await EmiLoan.find();
    const customerList = await Custumer.find({}, "_id name");
    console.log(customerList);
    const newCustomerList = Object.fromEntries(
      customerList.map((item) => [item._id, item.name])
    );

    const SinglLoanTypeList = singleLoans.map((loan) => ({
      ...loan.toObject(),
      name: newCustomerList[loan.toObject().cusId],
      loanType: "single",
    }));

    const EmiLoanTypeList = emiLoans.map((loan) => ({
      ...loan.toObject(),
      name: newCustomerList[loan.toObject().cusId],
      loanType: "emi",
    }));

    const loanList = [...SinglLoanTypeList, ...EmiLoanTypeList];

    return loanList;
  } catch (err) {
    console.log(err);

    throw new error(err.msg);
  }
}

export async function LoanDetails(id, type) {
  MongoSwitch(true);
  try {
    let Loan;

    if (type === "single") {
      Loan = await SingleLoan.findOne({ _id: id });
    } else {
      Loan = await EmiLoan.findOne({ _id: id });
    }

    // 🔒 Check if loan was found
    if (!Loan) {
      throw new Error(`Loan not found for id=${id} and type=${type}`);
    }

    const customerInfo = await Custumer.findOne(
      { _id: Loan.cusId },
      "_id name"
    );

    if (!customerInfo) {
      throw new Error(`Customer not found for cusId=${Loan.cusId}`);
    }

    const newLoan = { ...Loan.toObject(), name: customerInfo.name };
    return newLoan;
  } catch (err) {
    console.error("LoanDetails error:", err.message);
    throw err;
  }
}

const recentTransaction = new mongoose.Schema({
  loanId: {
    type: Number,
    required: true,
  },
  loanType: {
    type: String,
    required: true,
  },

  transaction: {
    type: PassbookEntry,
    required: true,
  },
});

const RecentTransaction = mongoose.model(
  "RecentTransaction",
  recentTransaction
);

export const RecentTransactionList = async () => {
  MongoSwitch(true);
  try {
    const response = await RecentTransaction.find();
    return response;
  } catch (err) {
    console.error("RecentTransactionList error:", err.message);
    throw new Error(err.message);
  }
};

//Loan Comman Actions End

//Single Loan Start
const SingleLoanSchema = new mongoose.Schema({
  cusId: {
    type: Number,
    required: true,
  },
  _id: {
    type: Number,
    required: true,
  },
  loanDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: true,
  },

  loanStatus: {
    type: Boolean,
    required: true,
    default: true,
  },

  loanAmount: {
    type: Number,
    required: true,
  },
  intrestAmount: {
    type: Number,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
  },
  passbook: {
    type: [PassbookEntry],
    required: true,
  },
});

const SingleLoan = mongoose.model("SingleLoan", SingleLoanSchema);

export const CreateSingleLoan = async (data) => {
  const { cusId, dueDate, loanAmount, intrestAmount } = data;

  try {
    const _id = await LoanNumberGenerator();

    const newTransaction1 = {
      date: Date.now(),
      desc: "Loan Amount Grant",
      credit: 0,
      debit: Number(loanAmount),
      balance: -loanAmount,
    };

    const newTransaction2 = {
      date: Date.now(),
      desc: "Intrest Amount Apply",
      credit: 0,
      debit: Number(intrestAmount),
      balance: newTransaction1.balance - intrestAmount,
    };

    const balance = newTransaction2.balance;

    const passbook = [newTransaction1, newTransaction2];

    const newLoan = new SingleLoan({
      _id,
      cusId,
      dueDate,
      loanAmount: Number(loanAmount),
      intrestAmount: Number(intrestAmount),
      balance,
      passbook,
    });
    await MongoSwitch(true);
    const response = await newLoan.save();

    const resp2 = await Custumer.findOneAndUpdate(
      { _id: cusId },
      { $push: { singleLoanStack: _id } }
    );

    console.log(resp2);
  } catch (err) {
    console.log(err);
    console.log(err);
    throw new Error("Database error");
  }
};

export const DeleteSingleLoan = async (loanId) => {
  try {
    MongoSwitch(true);
    const response = await SingleLoan.findOne({ _id: loanId });

    if (response.passbook.length < 3) {
      await SingleLoan.findOneAndDelete({ _id: loanId });
      await Custumer.findOneAndUpdate(
        { _id: response.cusId },
        {
          $pull: { singleLoanStack: loanId },
        }
      );

      return true;
    }

    throw new Error("Loan is Active!");
  } catch (err) {
    console.log(err);
    throw new Error(err.message);
  }
};

export const SettleSingleLoan = async (loanId) => {
  try {
    MongoSwitch(true);

    await SingleLoan.findOneAndUpdate({ _id: loanId }, { loanStatus: false });
    MongoSwitch(false);
  } catch (err) {
    throw new Error(err.message);
  }
};

export const DepositSingleLoan = async (loanId, data) => {
  try {
    MongoSwitch(true);
    const loanDetails = await SingleLoan.findOne({ _id: loanId });
    const lastTransaction =
      loanDetails.passbook[loanDetails.passbook.length - 1];

    const transaction = {
      desc: data.desc,
      credit: Number(data.credit),
      debit: 0,
      balance: lastTransaction.balance + Number(data.credit),
    };

    if (loanDetails.loanStatus) {
      await SingleLoan.findOneAndUpdate(
        { _id: loanId },
        {
          $push: { passbook: transaction },
          balance: transaction.balance,
        }
      );
    } else {
      throw new Error("Loan is Already Settle");
    }

    if (transaction.balance == 0) {
      SettleSingleLoan(loanId);
    }

    const count = await RecentTransaction.countDocuments();

    if (count > 29) {
      await RecentTransaction.findOneAndDelete({}, { sort: { _id: 1 } });
    }

    const newRecentTransaction = new RecentTransaction({
      loanId,
      loanType: "single",
      transaction,
    });

    newRecentTransaction.save();

    // MongoSwitch(false);
    return true;
  } catch (err) {
    throw new Error(err.message);
  }
};

//Single Loan End

//EMI Loan Start

const EmiLoanSchema = new mongoose.Schema({
  _id: {
    type: Number,
    required: true,
  },
  cusId: {
    type: Number,
    required: true,
  },
  loanDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  numberOfEmis: {
    type: Number,
    required: true,
  },
  numberOfDepositEmis: {
    type: Number,
    required: true,
    default: 0,
  },
  lastIntrestApply: {
    type: Date,
    required: true,
    default: Date.now,
  },
  loanStatus: {
    type: Boolean,
    required: true,
    default: true,
  },
  loanAmount: {
    type: Number,
    required: true,
  },
  intrestRate: {
    type: Number,
    required: true,
  },
  balance: {
    type: Number,
    required: true,
  },
  passbook: {
    type: [PassbookEntry],
    required: true,
  },
});

const EmiLoan = mongoose.model("EmiLoan", EmiLoanSchema);

export const CreateEmiLoan = async (cusId, data) => {
  const { loanAmount, intrestRate, numberOfEmis } = data;
  try {
    const _id = await LoanNumberGenerator();

    const newTransaction1 = {
      date: Date.now(),
      desc: "Loan Amount Grant",
      credit: 0,
      debit: Number(loanAmount),
      balance: -Number(loanAmount),
    };

    const newTransaction2 = {
      date: Date.now(),
      desc: "Intrest Amount Apply",
      credit: 0,
      debit: (Number(loanAmount) / 100) * intrestRate,
      balance:
        newTransaction1.balance - (Number(loanAmount) / 100) * intrestRate,
    };

    const balance = newTransaction2.balance;

    const passbook = [newTransaction1, newTransaction2];

    const newLoan = new EmiLoan({
      _id,
      cusId,
      loanAmount,
      intrestRate,
      numberOfEmis,
      numberOfDepositEmis: 0,
      balance,
      passbook,
    });

    await MongoSwitch(true);
    await newLoan.save();

    await Custumer.findOneAndUpdate(
      { _id: cusId },
      { $push: { emiLoanStack: _id } }
    );
  } catch (err) {
    console.log(err);
    throw new Error(err.message);
  }
};

export const DeleteEmiLoan = async (loanId) => {
  try {
    MongoSwitch(true);
    const response = await EmiLoan.findOne({ _id: loanId });

    if (response.passbook.length < 3) {
      await EmiLoan.findOneAndDelete({ _id: loanId });
      await Custumer.findOneAndUpdate(
        { _id: response.cusId },
        {
          $pull: { emiLoanStack: loanId },
        }
      );

      MongoSwitch(false);

      return true;
    }

    throw new Error("Loan is Active!");
  } catch (err) {
    throw new Error(err.message);
  }
};

export const SettleEmiLoan = async (loanId) => {
  try {
    MongoSwitch(true);

    await EmiLoan.findOneAndUpdate({ _id: loanId }, { loanStatus: false });
    MongoSwitch(false);
  } catch (err) {
    throw new Error(err.message);
  }
};

export const DepositEmiLoan = async (loanId, data) => {
  try {
    MongoSwitch(true);
    const loanDetails = await EmiLoan.findOne({ _id: loanId });
    console.log(loanDetails);
    const lastTransaction =
      loanDetails.passbook[loanDetails.passbook.length - 1];

    const transaction = {
      desc: data.desc,
      credit: Number(data.credit),
      debit: 0,
      balance: lastTransaction.balance + Number(data.credit),
    };
    const numberOfDepositEmis = loanDetails.numberOfDepositEmis + 1;

    if (loanDetails.loanStatus) {
      await EmiLoan.findOneAndUpdate(
        { _id: loanId },
        {
          $push: { passbook: transaction },
          balance: transaction.balance,
          numberOfDepositEmis,
        }
      );
    } else {
      throw new Error("Loan is Already Settle");
    }

    if (transaction.balance == 0) {
      SettleEmiLoan(loanId);
    }

    const count = await RecentTransaction.countDocuments();

    if (count > 29) {
      await RecentTransaction.findOneAndDelete({}, { sort: { _id: 1 } });
    }

    const newRecentTransaction = new RecentTransaction({
      loanId,
      loanType: "emi",
      transaction,
    });

    newRecentTransaction.save();

    // MongoSwitch(false);
  } catch (err) {
    throw new Error(err.message);
  }
};

export const IntrestApply = async () => {
  // console.log("Intrest Appling Function Call...");

  try {
    await MongoSwitch(true);

    const loanIdList = await EmiLoan.find(
      { loanStatus: true, balance: { $lt: 0 } },
      "_id"
    ).lean();
    // console.log(loanIdList);

    loanIdList.forEach(async (id) => {
      const loanDetail = await EmiLoan.findOne({ _id: id });
      const intrestDate = new Date(loanDetail.lastIntrestApply);
      const todayDate = new Date();

      const difference =
        (todayDate.getFullYear() * 12 + todayDate.getMonth()) * 30 +
        todayDate.getDate() -
        ((intrestDate.getFullYear() * 12 + intrestDate.getMonth()) * 30 +
          intrestDate.getDate());

      const monthlyDifference =
        todayDate.getFullYear() * 100 +
        todayDate.getMonth() -
        (intrestDate.getFullYear() * 100 + intrestDate.getMonth());

      const todayFlag =
        (todayDate.getDate() === intrestDate.getDate() &&
          monthlyDifference > 0) ||
        difference > 31;

      if (todayFlag) {
        const transaction = {
          desc: "Monthly Intrest Apply",
          credit: 0,
          debit: (loanDetail.balance / 100) * loanDetail.intrestRate,
          balance:
            loanDetail.balance +
            (loanDetail.balance / 100) * loanDetail.intrestRate,
        };

        const balance = transaction.balance;
        const lastIntrestApply = Date.now();
        await EmiLoan.findOneAndUpdate(
          { _id: id },
          {
            $push: { passbook: transaction },
            balance,
            lastIntrestApply,
          }
        );
      }
    });
  } catch (err) {
    console.log(err.message);
  }
};
//EMI Loan End

export const Dashboard = async () => {
  MongoSwitch(true);

  try {
    const singleActiveLoan = await SingleLoan.countDocuments({
      loanStatus: true,
    });

    const todayDate = new Date();

    const start = new Date(
      todayDate.getFullYear(),
      todayDate.getMonth(),
      todayDate.getDate()
    );

    const end = new Date(
      todayDate.getFullYear(),
      todayDate.getMonth(),
      todayDate.getDate() + 1
    );

    const singleLoanData = await SingleLoan.find(
      { loanStatus: true, dueDate: { $gte: start, $lt: end } },
      // { loanStatus: true },
      { passbook: 0, loanStatus: 0, __v: 0, loanDate: 0, cusId: 0, dueDate: 0 }
    ).lean();

    const loansDetails = await EmiLoan.find(
      { loanStatus: true },
      {
        passbook: 0,
        loanStatus: 0,
        cusId: 0,
        __v: 0,
        loanDate: 0,
        cusId: 0,
        intrestRate: 0,
      }
    ).lean();

    const emiActiveLoan = loansDetails.length;

    const emiLoanData = loansDetails.filter((loan) => {
      const intrestDate = new Date(loan.lastIntrestApply);

      const difference =
        (todayDate.getFullYear() * 12 + todayDate.getMonth()) * 30 +
        todayDate.getDate() -
        ((intrestDate.getFullYear() * 12 + intrestDate.getMonth()) * 30 +
          intrestDate.getDate());

      const monthlyDifference =
        todayDate.getFullYear() * 100 +
        todayDate.getMonth() -
        (intrestDate.getFullYear() * 100 + intrestDate.getMonth());

      const todayFlag =
        (todayDate.getDate() === intrestDate.getDate() &&
          monthlyDifference > 0) ||
        difference > 31;

      return todayFlag;
      // return true;
    });

    const updatedEmiLoanData = emiLoanData.map(
      ({ lastIntrestApply, ...rest }) => rest
    );

    const data = {
      single: singleLoanData,
      emi: updatedEmiLoanData,
      singleActiveLoan,
      emiActiveLoan,
    };

    return data;
  } catch (err) {
    throw new Error(err);
  }
};
