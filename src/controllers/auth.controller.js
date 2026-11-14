import userModel from "../models/user.model.js"
import crypto from "crypto"
import jwt from "jsonwebtoken"
import config from "../config/config.js"

// POST /api/auth/register
export async function register(req, res) {
    const { username, email, password } = req.body;
    const isAlreadyExist = await userModel.findOne(
        { $or: [{ username }, { email }] }
    );

    if (isAlreadyExist) {
        return res.status(409).json({
            message: "User already exists"
        });
    }

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    const user = await userModel.create({
        username,
        email,
        password: hashedPassword
    });

    const accessToken = jwt.sign({
        id: user._id
    },
        config.JWT_SECRET,
        {
            expiresIn: "15m"
        });

    const refreshToken = jwt.sign({
        id: user._id
    },
        config.JWT_SECRET,
        {
            expiresIn: "7d"
        });

    //JS can't read cookie data
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
        message: "User created successfully",
        user: {
            username: user.username,
            email: user.email
        },
        accessToken,
    });
}

//GET /api/auth/get-me
// 2 logic - which request is coming from which user, and then server will identify the user and send response to the user
// Every user has to send request to the server, and then server will identify the user and send response to the user

export async function getMe(req, res) {
    // bearer token is sent in the header of the request, so we need to extract it from the header. 
    // eg. key - authorization, value - Bearer <token>
    // So we need to split the value of the authorization header by space and get the second part which is the token.
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            message: "token not found"
        });
    }

    // verify the token and get the decoded payload
    const decoded = jwt.verify(token, config.JWT_SECRET);

    const user = await userModel.findById(decoded.id)
    res.status(200).json({
        message: "User fetched successfully",
        user: {
            username: user.username,
            email: user.email
        }
    });

}

export async function refreshToken(req, res) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({
            message: "Refresh token not found"
        });
    }   
    const decoded = jwt.verify(refreshToken, config.JWT_SECRET);
    const accessToken = jwt.sign({
        id: decoded.id
    }, config.JWT_SECRET, {
        expiresIn: "15m"
    });

    // Extra layer of sec-if any hacker gets access to the refresh token, he can generate new access tokens, so we need to generate a new refresh token and send it to the user.
    const newRefreshToken = jwt.sign({
        id: decoded.id
    }, config.JWT_SECRET, {
        expiresIn: "7d"
    });

    res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
        message: "Access token refreshed successfully",
        accessToken
    });

}
