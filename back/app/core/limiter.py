from slowapi import Limiter
from slowapi.util import get_remote_address

# Define The limiter with default_limits
# get_remote_address() : to Track users by their IP addr

limiter = Limiter(
    key_func=get_remote_address,
)
