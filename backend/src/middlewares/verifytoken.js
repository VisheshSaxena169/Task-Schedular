const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // 1. Extract the token from the Authorization header (Format: "Bearer <token>")
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1];

  // 2. If no token exists, deny access
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // 3. Verify the token using your secret key
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    // 4. Attach the decoded payload (usually contains user ID) to req
    req.user = decoded; 
    next(); // Move to the actual route handler
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

module.exports=verifyToken;   