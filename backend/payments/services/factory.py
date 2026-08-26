from payments.services.sep import SepGateway


def get_payment_gateway():
    return SepGateway()