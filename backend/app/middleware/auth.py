"""Middleware Auth — Tailscale IP-based user resolution."""
import ipaddress
from fastapi import Request, HTTPException, status
from app.services.user_service import users

from app.config import settings

# Tailscale CGNAT range
TAILSCALE_NET = ipaddress.ip_network("100.64.0.0/10")
LOCALHOST_IPS = {"127.0.0.1", "::1", "localhost"}


def get_client_ip(request: Request) -> str:
    """Extract real client IP, handling proxies and Tailscale."""
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()

    real_ip = request.headers.get("X-Real-IP", "")
    if real_ip:
        return real_ip.strip()

    client = request.client
    if client:
        ip = client.host
        if ip in LOCALHOST_IPS or ip.startswith("127."):
            return settings.default_ip
        return ip

    return settings.default_ip


def is_tailscale_ip(ip: str) -> bool:
    """Check if an IP is in the Tailscale range."""
    try:
        return ipaddress.ip_address(ip) in TAILSCALE_NET
    except ValueError:
        return False


async def get_user_context(request: Request) -> dict:
    """FastAPI dependency: resolve user from request IP.

    Returns a context dict with user, channel, and channels list.
    Raises 403 if user cannot be resolved.
    """
    ip = get_client_ip(request)
    user = await users.resolve_user(ip)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not resolve user",
        )

    # Determine active channel
    channel_id = (
        request.query_params.get("channel")
        or request.headers.get("X-Hermes-Channel")
    )

    channel = None
    if channel_id:
        channel = await users.get_channel(channel_id)

    if not channel:
        channel_id = f"private-{user['id'].replace('.', '-')}"
        channel = await users.get_channel(channel_id)
        if not channel:
            channel = await users.create_channel(
                name=user["name"],
                channel_type="private",
                owner_id=user["id"],
            )

    channels = await users.get_channels_for_user(user["id"])

    return {
        "user": user,
        "channel": channel,
        "channels": channels,
    }