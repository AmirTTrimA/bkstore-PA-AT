from django.core.exceptions import ValidationError


class InsufficientBalanceError(ValidationError):
    """
    Raised when a wallet does not contain enough funds.
    """

    pass