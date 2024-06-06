const passportConfig = {
    credentials: {
        tenantName: 'schdttgsbmeb2c.onmicrosoft.com',
        clientID: 'ae22e9bc-bcc3-4741-a80a-991ef6acf36c',
    },
    policies: {
        policyName: 'B2C_1_gsbme_sign_in',
    },
    metadata: {
        b2cDomain: 'schdttgsbmeb2c.b2clogin.com',
        authority: 'login.microsoftonline.com',
        discovery: '.well-known/openid-configuration',
        version: 'v2.0',
    },
    settings: {
        isB2C: true,
        validateIssuer: false,
        passReqToCallback: true,
        loggingLevel: 'info',
        loggingNoPII: false,
    },
    protectedRoutes: {
        api: {
            endpoint: '/api',
            delegatedPermissions: {
                read: ['api.read'],
                write: ['api.write'],
            },
        },
    },
};

module.exports = passportConfig;
export default passportConfig;
