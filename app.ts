import cors from 'cors';
import dotenv from 'dotenv';
import express, { Express, json, Request, Response } from 'express';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import passportAzureAd from 'passport-azure-ad';
import authConfig from './authConfig';
import { changePassword, login, logout, register } from './controllers/auth.controller';
import {
    assignToCareGroup,
    createCareGroup,
    getAllCareGroups,
    getUsersCareGroups,
    getUsersInCareGroup,
    unassignFromCareGroup,
} from './controllers/careGroup.controller';
import { getAllPatientData, getPatientData, receivePatientData } from './controllers/data.controller';
import {
    authenticateDevice,
    clearNonce,
    deprovisionDevice,
    generateNonce,
    getDevice,
    getLastLogin,
    getLastTransmission,
    provisionDevice,
} from './controllers/device.controller';
import {
    createAlert,
    createClinicalNotes,
    deleteClinicalNotes,
    editClinicalNotes,
    editSettings,
    getAlertLevel,
    getAlerts,
    getAllClinicianAlerts,
    getAllClinicianNotes,
    getClinicalNotes,
    getDefaultSettings,
    getSettings,
    resolveAlert,
    setAlertLevel,
    getPatientThresholds,
    editPatientThreshold
} from './controllers/treatment.controller';
import {
    deactivateUser,
    editUser,
    getAllUsers,
    getPatient,
    getPatientSelf,
    getStaff,
} from './controllers/user.controller';
import { initDb } from './helpers/database';
import { checkAuthorised, checkDeviceJWT, checkJWT, errorHandler } from './helpers/middleware';
import { addObsvType, deleteObsvType, listObsvTypes } from './controllers/obsvDesc.controller';
import { addDataEnum, listDataEnums } from './controllers/dataEnum.controller';


const app = express();
const router = express.Router();

initDb();

/**
 * If your app is behind a proxy, reverse proxy or a load balancer, consider
 * letting express know that you are behind that proxy. To do so, uncomment
 * the line below.
 */

// app.set('trust proxy',  /* numberOfProxies */);

/**
 * HTTP request handlers should not perform expensive operations such as accessing the file system,
 * executing an operating system command or interacting with a database without limiting the rate at
 * which requests are accepted. Otherwise, the application becomes vulnerable to denial-of-service attacks
 * where an attacker can cause the application to crash or become unresponsive by issuing a large number of
 * requests at the same time. For more information, visit: https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html
 */
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply the rate limiting middleware to all requests
app.use(limiter);

// app.use(cors());
app.use(cors({ origin: ['http://localhost:3000', 'https://optosleep-dev.ihealthe.org/'] }));

app.use(express.json())
app.use(express.urlencoded({ extended: false}));
app.use(morgan('dev'));

const options = {
    identityMetadata: `https://${authConfig.metadata.b2cDomain}/${authConfig.credentials.tenantName}/${authConfig.policies.policyName}/${authConfig.metadata.version}/${authConfig.metadata.discovery}` as string,
    clientID: authConfig.credentials.clientID as string,
    audience: authConfig.credentials.clientID as string,
    policyName: authConfig.policies.policyName as string,
    isB2C: authConfig.settings.isB2C as boolean,
    validateIssuer: authConfig.settings.validateIssuer as boolean,
    loggingLevel: authConfig.settings.loggingLevel as "info" | "warn" | "error" | undefined,
    passReqToCallback: authConfig.settings.passReqToCallback as boolean,
    loggingNoPII: authConfig.settings.loggingNoPII as boolean, // set this to true in the authConfig.js if you want to enable logging and debugging
};

const bearerStrategy = new passportAzureAd.BearerStrategy(options, (req, token, done) => {
    /**
     * Below you can do extended token validation and check for additional claims, such as:
     * - check if the delegated permissions in the 'scp' are the same as the ones declared in the application registration.
     *
     * Bear in mind that you can do any of the above checks within the individual routes and/or controllers as well.
     * For more information, visit: https://learn.microsoft.com/en-us/azure/active-directory-b2c/tokens-overview
     */

    /**
     * Lines below verifies if the caller's client ID is in the list of allowed clients.
     * This ensures only the applications with the right client ID can access this API.
     * To do so, we use "azp" claim in the access token. Uncomment the lines below to enable this check.
     */
    // if (!myAllowedClientsList.includes(token.azp)) {
    //     return done(new Error('Unauthorized'), {}, "Client not allowed");
    // }

    // const myAllowedClientsList = [
    //     /* add here the client IDs of the applications that are allowed to call this API */
    // ]

    /**
     * Access tokens that have no 'scp' (for delegated permissions).
     */
    if (!token.hasOwnProperty('scp')) {
        return done(new Error('Unauthorized'), null, 'No delegated permissions found');
    }

    done(null, {}, token);
});


app.use(passport.initialize());

passport.use(bearerStrategy);

app.use(
    '/api',
    (req: any, res: any, next: any) => {
        passport.authenticate(
            'oauth-bearer',
            {
                session: false,
            },
            (err: any, user: any, info: any) => {
                if (err) {
                    /**
                     * An error occurred during authorization. Either pass the error to the next function
                     * for Express error handler to handle, or send a response with the appropriate status code.
                     */
                    return res.status(401).json({ error: err.message });
                }

                if (!user) {
                    // If no user object found, send a 401 response.
                    return res.status(401).json({ error: 'Unauthorized' });
                }

                if (info) {
                    // access token payload will be available in req.authInfo downstream
                    req.authInfo = info;
                    return next();
                }
            }
        )(req, res, next);
    },
    router, // the router with all the routes
    (err: any, req: any, res: any, next: any) => {
        /**
         * Add your custom error handling logic here. For more information, see:
         * http://expressjs.com/en/guide/error-handling.html
         */

        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // send error response
        res.status(err.status || 500).send(err);
    }
);

// app.use(
//     checkJWT.unless({
//         path: [
//             '/',
//             '/login',
//             { url: '/data', methods: ['POST'] },
//             '/device/login',
//             '/device/lastLogin',
//             '/device/lastTransmission',
//         ],
//     })
// );
// app.use(
//     checkAuthorised().unless({
//         path: [
//             '/',
//             '/login',
//             '/logout',
//             '/changepw',
//             /^\/user\/patient\/me\/.*/,
//             { url: '/user', methods: ['PUT'] },
//             { url: '/data', methods: ['POST'] },
//             '/device/login',
//             '/device/lastLogin',
//             '/device/lastTransmission',
//         ],
//     })
// );

app.get('/', async (req: Request, res: Response) => {
    res.send('Hello World!');
});

app.post('/register', register)
app.post('/login', login);
app.get('/logout', logout);
app.post('/changepw', changePassword);

app.get('/alert/:patientID', getAlertLevel);
app.put('/alert', setAlertLevel);

app.get('/alerts/:patientID', getAlerts);
app.post('/alerts', createAlert);
app.put('/alerts', resolveAlert);
app.get('/clinicianAlerts',getAllClinicianAlerts);

app.get('/caregroup/user/:userID', getUsersCareGroups);
app.get('/caregroup/:careGroupID', getUsersInCareGroup);
app.get('/caregroup', getAllCareGroups);
app.post('/caregroup', createCareGroup);
app.put('/caregroup', assignToCareGroup);
app.delete('/caregroup', unassignFromCareGroup);

app.get('/data/:patientID', getPatientData);
app.get('/data', getAllPatientData);
app.post('/data', checkDeviceJWT, receivePatientData);

app.get('/device/lastLogin', checkDeviceJWT, getLastLogin);
app.get('/device/lastTransmission', checkDeviceJWT, getLastTransmission);
app.get('/device/:patientID', getDevice);
app.post('/device/login', authenticateDevice);
app.post('/device/nonce', generateNonce);
app.post('/device', provisionDevice);
app.delete('/device/nonce', clearNonce);
app.delete('/device/:patientID', deprovisionDevice);

app.get('/notes/:patientID', getClinicalNotes);
app.post('/notes', createClinicalNotes);
app.put('/notes', editClinicalNotes);
app.delete('/notes/:noteID', deleteClinicalNotes);
app.get('/clinicianNotes', getAllClinicianNotes)

app.get('/settings/:patientID', getSettings);
app.get('/settings', getDefaultSettings);
app.put('/settings', editSettings);

app.get('/user/patient/me/:userID', getPatientSelf);
app.get('/user/patient/:userID', getPatient);
app.get('/user/staff/:userID', getStaff);
app.get('/user', getAllUsers);
app.put('/user', editUser);
app.delete('/user/:userID', deactivateUser);

app.get('/threshold/:userID', getPatientThresholds);
app.put('/threshold', editPatientThreshold);

app.post('/v1/observationTypes', addObsvType);
app.get('/v1/observationTypes', listObsvTypes);
app.delete('/v1/observationTypes/:obsvName', deleteObsvType);

app.post('/v1/dataEnum', addDataEnum);
app.get('/v1/dataEnum', listDataEnums);


app.use(errorHandler);


const port = process.env.PORT || 5001;

app.listen(port, () => {
    console.log('Listening on port ' + port);
});

module.exports = app;
