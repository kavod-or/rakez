from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Literal, TYPE_CHECKING

if TYPE_CHECKING:
    from staffing.models import Staff
    from scheduling.models import ShiftPosition

RULE_SEVERITY_ERROR = 'error'
RULE_SEVERITY_WARNING = 'warning'
RULE_SEVERITY_INFO = 'info'

Severity = Literal['error', 'warning', 'info']


@dataclass
class Violation:
    code: str
    severity: Severity
    message: str
    context: dict[str, Any] = field(default_factory=dict)
    overridable: bool = False


@dataclass
class SchedulingContext:
    staff: "Staff"
    shift_position: "ShiftPosition"
    assignment_id: int | None = None


class SchedulingRule(ABC):
    @property
    @abstractmethod
    def code(self) -> str:
        ...

    @abstractmethod
    def check(self, context: SchedulingContext) -> list[Violation]:
        ...
