import passport from 'passport'
import local from 'passport-local'
import GithubStrategy from 'passport-github2'
import jwt from 'passport-jwt'
import bcrypt from 'bcrypt'
import userModel from '../dao/models/users.model.js'
import cartModel from '../dao/models/carts.model.js'
import {
    JWT_CLIENT_ID,
    JWT_CLIENT_SECRET,
    PRIVATE_KEY,
    SIGNED_COOKIE_KEY,
    createHash,
    generateToken,
    isValidPassword,
} from '../utils.js'

const LocalStrategy = local.Strategy

const JWTStrategy = jwt.Strategy
const ExtractJWT = jwt.ExtractJwt

let token = null
const cookieExtractor = req => {
    token = req && req.signedCookies ? req.signedCookies[SIGNED_COOKIE_KEY] : null
    return token
}

const initializePassport = () => {

    passport.use(
        'register', 
        new LocalStrategy(
            {
                passReqToCallback: true,
                usernameField: 'email',
            }, 
            async (req, username, password, done) => {

                const { first_name, last_name, email, age } = req.body
                try {
                    const user = await userModel.findOne({ email: username })
                    if (user) {
                        console.log('User already exists')
                        return done(null, false)
                    }

                    const cartNewUser = await cartModel.create({})
                    const newUser = {
                        first_name,
                        last_name,
                        email,
                        age,
                        password: createHash(password),
                        cart: cartNewUser._id
                        // role: (email === 'adminCoder@coder.com') ? 'admin' : 'user'
                    }
                    if (
                        newUser.email === 'adminCoder@coder.com' && bcrypt.compareSync('adminCod3r123', newUser.password)
                    ) {
                        newUser.role = 'Admin'
                    }
                    const result = await userModel.create(newUser)
                    return done(null, result)
                } catch (error) {
                    console.log(error)
                    return done('[LOCAL] Error creating user: ' + error.message)
                }
            }
        )
    )

    passport.use(
        'login',
        new LocalStrategy(
            {
                usernameField: 'email',
            },
            async (username, password, done) => {

                try {
                    const user = await userModel.findOne({ email: username })
                    if (!user || !isValidPassword(user, password)) {
                        console.log('User do not exist')
                        return done(null, false)
                    }

                    // generamos el token cuano nos logueamos
                    /* const token = generateToken(user)
                    user.token = token */

                    return done(null, user)
                } catch (error) {
                    console.log(error)
                    return done('Error getting user: ' + error.message)
                }
            }
        )
    )

    passport.use(
        'github',
        new GithubStrategy(
            {
                clientID: JWT_CLIENT_ID,
                clientSecret: JWT_CLIENT_SECRET,
                callbackURL: 'http://localhost:8080/jwt/githubcallback',
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const userName = profile.displayName || profile.username
                    const userEmail = profile._json.email

                    const existingUser = await userModel.findOne({ email: userEmail })
                    if (existingUser) {
                        const token = generateToken(existingUser)
                        return done(null, existingUser, { token })
                    }
                    const cartNewUser = await cartModel.create({})
                    const newUser = {
                        first_name: userName,
                        last_name: ' ',
                        email: userEmail,
                        password: ' ',
                        cart: cartNewUser._id,
                    }
                    const result = await userModel.create(newUser)
                    const token = generateToken(result)
                    return done(null, result, { token })                
                } catch (error) {
                    console.log(error)
                    return done('Error getting user: ' + error.message)
                }
            }
        )
    )

    passport.use(
        'jwt',
        new JWTStrategy(
            {
                jwtFromRequest: ExtractJWT.fromExtractors([cookieExtractor]),
                secretOrKey: PRIVATE_KEY,
            },
            async (jwt_payload, done) => {
                try {
                    return done(null, jwt_payload)
                } catch (error) {
                    return done(error)
                }
            }
        )
    )

    passport.use(
        'current',
        new JWTStrategy(
            {
                jwtFromRequest: ExtractJWT.fromExtractors([cookieExtractor]),
                secretOrKey: PRIVATE_KEY,
            },
            async (jwt_payload, done) => {
                try {
                    const user = jwt_payload.user
                    if (!user) {
                        return done(null, false, { message: 'No token provided' })
                    }
                    const existingUser = await userModel.findById(user._id)
                    if (!existingUser) {
                        return done(null, false, { message: 'There is no user with an active session' })
                    }
                    return done(null, existingUser)
                } catch (error) {
                    return done(error)
                }
            }
        )
    )
}

passport.serializeUser((user, done) => {
    done(null, user._id)
})

passport.deserializeUser(async (id, done) => {
    const user = await userModel.findById(id)
    done(null, user)
})

export default initializePassport