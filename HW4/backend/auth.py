"""Password hashing and signed session tokens (standard library only)."""
import base64
import hashlib
import hmac
import json
import os
import secrets
import time

# Must match the seeded database: PBKDF2-HMAC-SHA256, 120,000 iterations,
# stored as "pbkdf2_sha256$<salt>$<hash>". Sign-up and login share these settings.
ALGORITHM = "pbkdf2_sha256"
ITERATIONS = 120_000
SESSION_SECONDS = 60 * 60 * 24 * 7


def _derive(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), ITERATIONS).hex()


def hash_password(password: str) -> str:
    """Sign-up: make a fresh random salt, return 'pbkdf2_sha256$<salt>$<hash>'."""
    salt = secrets.token_hex(8)
    return f"{ALGORITHM}${salt}${_derive(password, salt)}"


def verify_password(password: str, stored: str) -> bool:
    """Login: read the salt from the stored string, rehash the typed password with
    it, and compare in constant time. The stored hash is never reversed."""
    try:
        algorithm, salt, expected = stored.split("$")
    except ValueError:
        return False
    if algorithm != ALGORITHM:
        return False
    return hmac.compare_digest(_derive(password, salt), expected)


# Hash checked when an email is unknown, so login takes the same time either way.
DUMMY_HASH = hash_password(secrets.token_hex(8))


def _secret() -> bytes:
    secret = os.getenv("AUTH_SECRET")
    if not secret:
        raise RuntimeError("AUTH_SECRET is not set. Add it to your .env file.")
    return secret.encode()


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def _unb64(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def make_session_token(user_id: int) -> str:
    payload = _b64(json.dumps({"uid": user_id, "exp": int(time.time()) + SESSION_SECONDS}).encode())
    signature = _b64(hmac.new(_secret(), payload.encode(), hashlib.sha256).digest())
    return f"{payload}.{signature}"


def read_session_token(token: str | None) -> int | None:
    """Return the user id if the token is genuine and unexpired, otherwise None."""
    if not token or token.count(".") != 1:
        return None
    payload, signature = token.split(".")
    expected = _b64(hmac.new(_secret(), payload.encode(), hashlib.sha256).digest())
    if not hmac.compare_digest(signature, expected):
        return None
    try:
        data = json.loads(_unb64(payload))
    except ValueError:
        return None
    if data.get("exp", 0) < time.time():
        return None
    return data.get("uid")
