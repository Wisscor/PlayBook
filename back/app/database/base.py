from sqlalchemy.orm import DeclarativeBase


# * Base — every model must inherits from this
# * SQLAlchemy uses Base.metadata to know
#   what tables exist across your whole app
class Base(DeclarativeBase):
    pass
