import { Router } from 'express'
import passport from 'passport'
import { 
    generateToken, 
    passportCallCurrent, 
    SIGNED_COOKIE_KEY, 
} from '../utils.js'

const router = Router()

router.post(
    '/register',
    passport.authenticate('register', {
        session: false,
        failureRedirect: '/jwt/failRegister',
    }),
    async (req, res) => {
        res.redirect('/jwt/login')
    }
)

router.get('/failRegister', (req, res) => {
    res.render('errors/errorPage', {
        status: 'error',
        error: 'Failed Register!',
    })
})

//Vista para registrar usuarios
router.get('/register', (req, res) => {
    res.render('sessions/register')
})

// API JWT
router.post(
    '/login',
    passport.authenticate('login', {
        session: false,
        failureRedirect: '/jwt/failLogin',
    }),
    (req, res) => {
        // El usuario ha sido autenticado exitosamente
        const user = req.user
        const access_token = generateToken(user)
        
        // En vez de redireccionarlo directamente cuando está logueado, lo que hacemos es crear la cookie en el cliente y grabarle la información de usuario
        res
            .cookie(SIGNED_COOKIE_KEY, access_token, { signed: true })
            .redirect('/products')
    }
)

router.get('/failLogin', (req, res) => {
    res.render('errors/errorPage', {
        status: 'error',
        error: 'Invalid Credentials',
    })
})

// Vista de Login
router.get('/login', (req, res) => {
    res.render('sessions/login')
})

// Rutas para autentificacion por github
router.get(
    '/github',
    passport.authenticate('github', { scope: ['user:email'] }),
    async (req, res) => {}
)

router.get(
    '/githubcallback',
    passport.authenticate('github', { session: false }),
    async (req, res) => {
        const access_token = req.authInfo.token
        res
        .cookie(SIGNED_COOKIE_KEY, access_token, { signed: true })
        .redirect('/products')
    }
)

// Eliminar JWT
router.get('/logout', (req, res) => {
    res
        .clearCookie(SIGNED_COOKIE_KEY)
        .redirect('/jwt/login')
})

router.get('/error', (req, res) => {
    res.render('errors/errorPage')
})

router.get(
    '/current',
    passportCallCurrent('current'), 
    (req, res) => {
        if (!req.user) {
            // Si no hay un usuario autenticado, retornar mensaje de error
            return res
                .status(401)
                .json({ status: 'error', error: 'No user with an active session' })
        }
        // Si hay un usuario autenticado, retornar los datos del usuario en payload
        res.status(200).json({ status: 'success', payload: req.user })
    }
)

export default router