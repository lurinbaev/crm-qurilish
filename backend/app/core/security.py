from datetime import timedelta
from uuid import uuid4

import jwt
from fastapi import HTTPException
from pwdlib import PasswordHash

from app.core.config import settings
from app.core.time import now

passwords = PasswordHash.recommended()
dummy_hash = passwords.hash("not-a-user-password")

def issue(user, *, expires=None):
    return jwt.encode({
        "sub": str(user.id), "ver": user.credential_version,
        "iss": "construction-crm", "aud": "crm-api",
        "jti": uuid4().hex, "iat": now(),
        "exp": expires or now() + timedelta(minutes=settings().access_minutes),
    }, settings().jwt_secret.get_secret_value(), algorithm="HS256")

def unauthorized():
    return HTTPException(401, "Kirish ma’lumoti yaroqsiz", headers={"WWW-Authenticate": "Bearer"})
