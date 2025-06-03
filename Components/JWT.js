import JWT from "jsonwebtoken";

export const JWTSign = () => {
  const payload = {
    username: process.env.ADMIN_USERNAME,
    role: "admin",
  };
  const token = JWT.sign(payload, process.env.JWT_SECRATE, {
    expiresIn: "2h",
  });

  return token;
};

export const JWTVerify = (req, res, next) => {
  const AuthHeader = req.headers["authorization"];
  const token = AuthHeader && AuthHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Token not Provided" });
  }

  JWT.verify(token, process.env.JWT_SECRATE, (err, deCodeDetails) => {
    if (err) {
      res.status(401).json({ message: "Invalid Token" });
    }

    if (deCodeDetails.username === process.env.ADMIN_USERNAME) {
      next();
    } else {
      res.status(403).json({ message: "Access Denied, Wrong User!" });
    }
  });
};
