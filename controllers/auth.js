const authRouter = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
authRouter.post('/login', async (req, res) => {
  const cookies = req.cookies;

  const { email, password } = req.body;

  if (!email || !password)
    return res
      .status(400)
      .json({ message: 'Email and password are required.' });

  const foundUser = await User.findOne({ email }); // removed .exec();
  if (!foundUser) return res.sendStatus(401); //Unauthorized
  const match = await bcrypt.compare(password, foundUser.passwordHash);
  if (!match) return res.status(401).json({ message: 'Unauthorized' });
  const accessToken = jwt.sign(
    {
      id: foundUser._id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '1h' }
  );
  const newRefreshToken = jwt.sign(
    {
      id: foundUser._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '1d' }
  );

  let newRefreshTokenArray = !cookies?.jwt
    ? foundUser.refreshToken
    : foundUser.refreshToken.filter((rt) => rt !== cookies.jwt);

  if (cookies?.jwt) {
    /* 
    Scenario added here: 
        1) User logs in but never uses RT and does not logout 
        2) RT is stolen
        3) If 1 & 2, reuse detection is needed to clear all RTs when user logs in
    */
    const refreshToken = cookies.jwt;
    const foundToken = await User.findOne({ refreshToken }).exec();
    // Detected refresh token reuse!
    if (!foundToken) {
      // clear out ALL previous refresh tokens
      newRefreshTokenArray = [];
    }

    // clear out current session cookie
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
  }

  foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
  await foundUser.save();

  // Creates Secure Cookie with refresh token
  res.cookie('jwt', newRefreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    maxAge: 1 * 60 * 60 * 1000, // 1 day
  });
  console.log('newRefreshToken on auth', newRefreshToken.slice(-9));

  res.status(200).json({
    success: true,
    message: 'Successfully logged in',
    user: foundUser.email,
    token: accessToken,
  });
});

module.exports = authRouter;
