/**
 * DAMAN-PRO-SYSTEM Authorization Flow
 * Using OAuth2 for Apps Script
 */

/**
 * Logs the redirect URI to register in the Google Developers Console.
 */
function logRedirectUri() {
  var service = getService();
  Logger.log(service.getRedirectUri());
}

/**
 * Includes the given project HTML file in the current HTML project file.
 * Also used to include JavaScript.
 * @param {String} filename Project file name.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}

/**
 * Configures the service.
 */
function getService() {
  return OAuth2.createService('GoogleDrive')
      // Set the endpoint URLs.
      .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
      .setTokenUrl('https://accounts.google.com/o/oauth2/token')

      // Set the client ID and secret. (These should be set in Script Properties)
      .setClientId(PropertiesService.getScriptProperties().getProperty('CLIENT_ID'))
      .setClientSecret(PropertiesService.getScriptProperties().getProperty('CLIENT_SECRET'))

      // Set the name of the callback function that should be invoked to
      // complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set the scope of the liberty to be used.
      .setScope('https://www.googleapis.com/auth/drive.file')

      // Set the parameters for the authorization URL.
      .setParam('access_type', 'offline')
      .setParam('prompt', 'consent')
      .setParam('login_hint', Session.getActiveUser().getEmail());
}

/**
 * Callback handler that is executed after an authorization attempt.
 * @param {Object} request The results of API auth request.
 */
function authCallback(request) {
  var service = getService();
  var authorized = service.handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput('Success! You can close this tab.');
  } else {
    return HtmlService.createHtmlOutput('Denied. You can close this tab.');
  }
}

/**
 * Direct endpoint for authorization.
 * Can be called via ?action=authorize
 */
function getAuthorizationUrl() {
  var service = getService();
  if (!service.hasAccess()) {
    var authorizationUrl = service.getAuthorizationUrl();
    return authorizationUrl;
  }
  return null;
}

/**
 * Logs out the user.
 */
function logout() {
  getService().reset();
}
