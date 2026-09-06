from dataclasses import dataclass

from .base import SchedulingContext, SchedulingRule, Violation, RULE_SEVERITY_ERROR


@dataclass
class ValidationResult:
    violations: list[Violation]

    @property
    def allowed(self) -> bool:
        return not any(
            violation.severity == RULE_SEVERITY_ERROR
            for violation in self.violations
        )


class RuleEngine:
    def __init__(self, rules: list[SchedulingRule]):
        self.rules = tuple(rules)

    def check(self, context: SchedulingContext) -> ValidationResult:
        violations: list[Violation] = []

        for rule in self.rules:
            violations.extend(rule.check(context))

        return ValidationResult(violations=violations)
