# All shared enums used across models — add new values here, not in the models
import enum


class Role(str, enum.Enum):
    """User roles — controls what each person can see and do."""
    EMPLOYEE = "EMPLOYEE"
    ADMIN = "ADMIN"


class BillStatus(str, enum.Enum):
    """Lifecycle of a bill from creation to completion."""
    DRAFT = "DRAFT"           # Just created, not yet confirmed
    CONFIRMED = "CONFIRMED"   # Approved and finalised
    CANCELLED = "CANCELLED"   # Voided — cannot be changed again


class ItemCategory(str, enum.Enum):
    """Categories for classifying inventory items."""
    RAW_MATERIAL = "RAW_MATERIAL"
    FINISHED_GOOD = "FINISHED_GOOD"
    CONSUMABLE = "CONSUMABLE"
    EQUIPMENT = "EQUIPMENT"
    OTHER = "OTHER"
