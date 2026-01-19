const {
    generateAccessToken,
    generateRefreshToken,
    verifyToken
} = require("../utils/tokenUtils");
const bcrypt = require("bcryptjs");
const { db, mode } = require("../config/db");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");

/**
 * Finds a user in the database by a specific field.
 * @param {string} field - The database field to search by (e.g., 'id', 'email').
 * @param {*} value - The value to match.
 * @returns {Promise<Object|null>} A promise that resolves to the user object or null if not found.
 */
const findUser = async (field, value) => {
    if (mode === "pg") {
        return db.oneOrNone(`SELECT * FROM users WHERE ${field}=$1`, [value]);
    } else {
        const { data, error } = await db.from("users").select("*").eq(field, value).single();
        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    }
};

/**
 * Creates a new user in the database.
 * @param {Object} userData - The user data.
 * @param {string} userData.name - The user's name.
 * @param {string} userData.email - The user's email.
 * @param {string} [userData.password_hash] - The user's hashed password.
 * @param {string} [userData.role='user'] - The user's role.
 * @returns {Promise<Object>} A promise that resolves to the newly created user object.
 */
const createUser = async ({
    name,
    email,
    password_hash,
    role = "user"
}) => {
    if (mode === "pg") {
        return db.one(
            "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
            [name, email, password_hash, role]
        );
    } else {
        const { data, error } = await db.from("users").insert([
            { name, email, password_hash, role }
        ]).select().single();
        if (error) throw error;
        return data;
    }
};

/**
 * Disables Two-Factor Authentication (2FA) for the authenticated user.
 */
exports.disable2FA = async (req, res, next) => {
    try {
        const { uid } = req.user;
        if (mode === "pg") {
            await db.none(
                "UPDATE users SET two_factor_enabled = FALSE, two_factor_secret = NULL WHERE id = $1",
                [uid]
            );
        } else {
            const { error } = await db
                .from("users")
                .update({
                    two_factor_enabled: false,
                    two_factor_secret: null
                })
                .eq("id", uid);
            if (error) throw error;
        }
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
};

/**
 * Verifies a 2FA token for the authenticated user.
 */
exports.verify2FA = async (req, res, next) => {
    try {
        const { uid } = req.user;
        const { token } = req.body;

        const user = await findUser("id", uid);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const verified = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: "base32",
            token
        });

        if (verified) {
            if (mode === "pg") {
                await db.none(
                    "UPDATE users SET two_factor_enabled = TRUE WHERE id = $1",
                    [uid]
                );
            } else {
                const { error } = await db
                    .from("users")
                    .update({ two_factor_enabled: true })
                    .eq("id", uid);
                if (error) throw error;
            }
            res.json({ success: true });
        } else {
            res.status(400).json({ error: "Invalid token" });
        }
    } catch (err) {
        next(err);
    }
};

/**
 * Sets up 2FA for the authenticated user.
 */
exports.setup2FA = async (req, res, next) => {
    try {
        const { uid } = req.user;
        const secret = speakeasy.generateSecret({
            name: `Bazar Universal (${uid})`
        });

        if (mode === "pg") {
            await db.none(
                "UPDATE users SET two_factor_secret = $1 WHERE id = $2",
                [secret.base32, uid]
            );
        } else {
            const { error } = await db
                .from("users")
                .update({ two_factor_secret: secret.base32 })
                .eq("id", uid);
            if (error) throw error;
        }

        qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) {
                return next(err);
            }
            res.json({
                secret: secret.base32,
                qrCodeUrl: data_url
            });
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Registers a new user with email and password.
 */
exports.register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password)
            return res
                .status(400)
                .json({ error: "Name, email, and password are required" });

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const user = await createUser({ name, email, password_hash });

        const payload = { uid: user.id, email: user.email };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        res.status(201).json({
            accessToken,
            refreshToken,
            uid: user.id,
            name: user.name
        });
    } catch (error) {
        if (error.code === "23505" || error.code === "P2002")
            return res
                .status(409)
                .json({ error: "User with this email already exists." });
        next(error);
    }
};

/**
 * Logs in a user with email and password.
 */
exports.login = async (req, res, next) => {
    try {
        const { email, password, token } = req.body;
        if (!email || !password)
            return res
                .status(400)
                .json({ error: "Email and password are required" });

        const user = await findUser("email", email);
        if (!user)
            return res.status(401).json({ error: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch)
            return res.status(401).json({ error: "Invalid credentials" });

        if (user.two_factor_enabled) {
            if (!token) {
                return res.status(401).json({
                    error: "2FA token is required",
                    twoFactorRequired: true
                });
            }

            const verified = speakeasy.totp.verify({
                secret: user.two_factor_secret,
                encoding: "base32",
                token
            });

            if (!verified) {
                return res.status(401).json({ error: "Invalid 2FA token" });
            }
        }

        const payload = { uid: user.id, email: user.email };
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        res.json({ accessToken, refreshToken, uid: user.id, name: user.name });
    } catch (error) {
        next(error);
    }
};

/**
 * Refreshes an access token using a refresh token.
 */
exports.refreshToken = (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken)
            return res.status(400).json({ error: "Refresh token is required" });

        const decoded = verifyToken(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        );
        if (!decoded)
            return res.status(401).json({ error: "Invalid refresh token" });

        const newAccessToken = generateAccessToken({
            uid: decoded.uid,
            email: decoded.email
        });
        res.json({ accessToken: newAccessToken });
    } catch (err) {
        next(err);
    }
};
