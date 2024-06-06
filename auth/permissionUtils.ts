// interface AccessTokenPayload {
//     scp?: string | string[];
// }

// /**
//  * Ensures that the access token has the specified delegated permissions.
//  * @param {Object} accessTokenPayload: Parsed access token payload
//  * @param {Array} requiredPermission: list of required permissions
//  * @returns {boolean}
//  */
// const hasRequiredDelegatedPermissions = (
//     accessTokenPayload: AccessTokenPayload, 
//     requiredPermission: Array<string>
// ): boolean => {
//     const normalizedRequiredPermissions = requiredPermission.map((permission) => permission.toUpperCase());
    
//     if (accessTokenPayload.scp && accessTokenPayload.scp.split(' ')
//         .some(claim => normalizedRequiredPermissions.includes(claim.toUpperCase()))) {
//         return true;
//     }
//     return false;
    
// };

// module.exports = {
//     hasRequiredDelegatedPermissions
// }; 
// export default hasRequiredDelegatedPermissions;



/**
 * Ensures that the access token has the specified delegated permissions.
 * @param accessTokenPayload: Parsed access token payload
 * @param requiredPermission: list of required permissions
 * @returns boolean
 */
const hasRequiredDelegatedPermissions = (accessTokenPayload: {[key: string]: any}, requiredPermission: string[]): boolean => {
    const normalizedRequiredPermissions: string[] = requiredPermission.map((permission) => permission.toUpperCase());
    
    if (accessTokenPayload.hasOwnProperty('scp') && accessTokenPayload.scp.split(' ')
        .some((claim: string) => normalizedRequiredPermissions.includes(claim.toUpperCase()))) {
        return true;
    }
    return false;
};

export {
    hasRequiredDelegatedPermissions
};