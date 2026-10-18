import "dotenv/config";
import jose from "node-jose"
import { PUBLIC_KEY } from "../utils/cert";
import { ApiError } from "../utils/api.error";

const oidcConfig = async () => {
  const domain = (
    process.env.DOMAIN || `http://localhost:${process.env.PORT || 8080}`
  ).replace(/\/$/, "");

  return {
    issuer: domain,
    authorization_endpoint: `${domain}/api/auth/sign-in`,
    token_endpoint: `${domain}/api/auth/refresh`,
    userinfo_endpoint: `${domain}/api/auth/me`,
    end_session_endpoint: `${domain}/api/auth/logout`,
    revocation_endpoint: `${domain}/api/auth/logout`,
    registration_endpoint: `${domain}/api/auth/sign-up`,
    jwks_uri: `${domain}/.well-known/jwks.json`,
    response_types_supported: ["code", "token", "id_token"],
    response_modes_supported: ["query", "fragment"],
    grant_types_supported: ["authorization_code", "refresh_token", "password"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["HS256"],
    scopes_supported: ["openid", "profile", "email", "phone", "offline_access"],
    token_endpoint_auth_methods_supported: [
      "client_secret_basic",
      "client_secret_post",
      "none",
    ],
    claims_supported: [
      "sub",
      "id",
      "email",
      "firstName",
      "lastName",
      "phoneNo",
      "isEmailverified",
    ],
    code_challenge_methods_supported: ["S256", "plain"],
  };
};

const jwks= async()=>{
  const key = await jose.JWK.asKey(PUBLIC_KEY,"pem")
  if(!key) throw ApiError.serverFailure("Failed to generate Public key")
  return key
}
export {oidcConfig, jwks};
