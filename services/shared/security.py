import jwt
from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

security = HTTPBearer()

class KeycloakUser(BaseModel):
    user_id: str
    username: str
    email: Optional[str] = None
    roles: List[str] = []

KEYCLOAK_REALM = "kadam-realm"
KEYCLOAK_CLIENT_ID = "kadam-app"

def verify_jwt_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> KeycloakUser:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id = payload.get("sub", "")
        username = payload.get("preferred_username", payload.get("sub", "unknown_user"))
        email = payload.get("email")
        
        realm_access = payload.get("realm_access", {})
        roles = realm_access.get("roles", [])
        
        return KeycloakUser(
            user_id=user_id,
            username=username,
            email=email,
            roles=roles
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Keycloak JWT Token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: KeycloakUser = Depends(verify_jwt_token)) -> KeycloakUser:
        has_role = any(role in user.roles for role in self.allowed_roles)
        if not has_role and "ROLE_ADMIN" not in user.roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User '{user.username}' lacks required roles"
            )
        return user

require_supervisor = RoleChecker(["ROLE_SUPERVISOR", "ROLE_FIELD_ENGINEER"])
require_planner = RoleChecker(["ROLE_PLANNER", "ROLE_SCHEDULER"])
require_executive = RoleChecker(["ROLE_EXECUTIVE", "ROLE_PROJECT_MANAGER"])
