from .engine import RuleEngine

from .rule_shift_assignment import (
    ShiftAssignmentOverlap,
    ShiftAssignmentQualification,
    ShiftAssignmentMultiplePositions
)

rule_engine = RuleEngine(
    rules=[
        ShiftAssignmentOverlap(),
        ShiftAssignmentQualification(),
        ShiftAssignmentMultiplePositions(),
    ],
)
